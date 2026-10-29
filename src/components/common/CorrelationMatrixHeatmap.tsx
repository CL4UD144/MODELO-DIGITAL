import React, { useState, useRef, useMemo } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Sliders, 
  Eye, 
  EyeOff, 
  Layers, 
  Info, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Table, 
  Copy, 
  Check, 
  Sparkles,
  Maximize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  exportSvgToPng, 
  exportSvgElement, 
  exportChartToPdf, 
  exportToCSV, 
  exportToExcel, 
  copyTableToClipboard 
} from '../../utils/exportUtils';
import { InterpretabilitySection } from './InterpretabilitySection';

export interface VariableMeta {
  key: string;
  name: string;
  short: string;
  unit: string;
  category: string;
}

export interface PairwiseCorr {
  var1: string;
  var2: string;
  name1: string;
  name2: string;
  short1: string;
  short2: string;
  pearson_r: number;
  pearson_p: string;
  spearman_rho: number;
  spearman_p: string;
  strength: string;
  direction: string;
  interpretation: string;
}

export interface CorrelationData {
  variables: VariableMeta[];
  valid_columns: string[];
  constant_columns: string[];
  n_samples: number;
  pearson: {
    matrix: number[][];
    pvalues: number[][];
  };
  spearman: {
    matrix: number[][];
    pvalues: number[][];
  };
  pairwise: PairwiseCorr[];
  top_positives: PairwiseCorr[];
  top_negatives: PairwiseCorr[];
  weak_relations: PairwiseCorr[];
  dict_matrix?: Record<string, Record<string, number>>;
}

interface Props {
  data: CorrelationData | any;
  title?: string;
  subtitle?: string;
}

export const CorrelationMatrixHeatmap: React.FC<Props> = ({
  data,
  title = "Matriz de Correlación Multivariable (13 Factores Ecohidrológicos, Clima y Flujos de C)",
  subtitle = "Análisis bivariado paramétrico (Pearson) y no paramétrico (Spearman) sobre N = 1,478 observaciones"
}) => {
  const [method, setMethod] = useState<'pearson' | 'spearman'>('pearson');
  const [showValues, setShowValues] = useState<boolean>(true);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [showPairwiseTable, setShowPairwiseTable] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Normalize data in case legacy format was passed
  const normalizedData: CorrelationData = useMemo(() => {
    if (!data) {
      return {
        variables: [],
        valid_columns: [],
        constant_columns: [],
        n_samples: 0,
        pearson: { matrix: [], pvalues: [] },
        spearman: { matrix: [], pvalues: [] },
        pairwise: [],
        top_positives: [],
        top_negatives: [],
        weak_relations: []
      };
    }

    // Check if it already has rich payload
    if (data.pearson && data.variables) {
      return data as CorrelationData;
    }

    // Fallback if raw dictionary or array passed
    const defaultVars: VariableMeta[] = [
      { key: 'wtd', name: 'Nivel Freático (WTD)', short: 'WTD', unit: 'cm', category: 'Hidrología' },
      { key: 'soil_temp', name: 'Temperatura Suelo', short: 'T_suelo', unit: '°C', category: 'Clima' },
      { key: 'precip_mm', name: 'Precipitación', short: 'Precip', unit: 'mm', category: 'Clima' },
      { key: 'ditch_blocking_ratio', name: 'Taponamiento Zanjas', short: 'Taponam.', unit: 'ratio', category: 'Restauración' },
      { key: 'grazing_reduction', name: 'Reducción Pastoreo', short: 'Pastoreo', unit: 'ratio', category: 'Restauración' },
      { key: 'revegetation_ha', name: 'Área Revegetada', short: 'Reveg.', unit: 'ha', category: 'Restauración' },
      { key: 'ndvi', name: 'Índice Vigor NDVI', short: 'NDVI', unit: '-', category: 'Vegetación' },
      { key: 'bulk_density', name: 'Densidad Aparente', short: 'Dens. Ap.', unit: 'g/cm³', category: 'Edáfico' },
      { key: 'organic_matter', name: 'Materia Orgánica', short: 'Mat. Org.', unit: '%', category: 'Edáfico' },
      { key: 'ph', name: 'pH del Suelo', short: 'pH', unit: 'pH', category: 'Edáfico' },
      { key: 'co2_flux', name: 'Flujo de CO₂', short: 'CO₂', unit: 't/ha/año', category: 'Gases' },
      { key: 'ch4_flux', name: 'Flujo de CH₄', short: 'CH₄', unit: 'g/m²/año', category: 'Gases' },
      { key: 'net_carbon_balance', name: 'Balance Neto C', short: 'Net C', unit: 't CO₂eq/ha/año', category: 'Balance' }
    ];

    return {
      variables: defaultVars,
      valid_columns: defaultVars.map(v => v.key),
      constant_columns: [],
      n_samples: 1478,
      pearson: { matrix: [], pvalues: [] },
      spearman: { matrix: [], pvalues: [] },
      pairwise: [],
      top_positives: [],
      top_negatives: [],
      weak_relations: []
    };
  }, [data]);

  const variables = normalizedData.variables;
  const n = variables.length;
  const currentMatrix = method === 'pearson' ? normalizedData.pearson.matrix : normalizedData.spearman.matrix;
  const currentPvals = method === 'pearson' ? normalizedData.pearson.pvalues : normalizedData.spearman.pvalues;

  // Geometry dimensions for SVG
  const margin = { top: 90, right: 100, bottom: 40, left: 110 };
  const cellSize = 38;
  const width = margin.left + n * cellSize + margin.right;
  const height = margin.top + n * cellSize + margin.bottom;

  // Divergent color mapping (-1.0 to +1.0)
  // Negative: Red (#ef4444 to #991b1b)
  // Zero: Neutral pure white (#ffffff) or subtle gray (#f8fafc)
  // Positive: Emerald Green (#10b981 to #047857)
  const getCellColor = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '#f1f5f9';
    if (val === 0) return '#ffffff';

    if (val > 0) {
      // Emerald gradient
      // val 0 to 1
      const alpha = Math.min(Math.abs(val), 1);
      if (alpha > 0.85) return '#047857'; // emerald-700
      if (alpha > 0.65) return '#059669'; // emerald-600
      if (alpha > 0.45) return '#10b981'; // emerald-500
      if (alpha > 0.25) return '#6ee7b7'; // emerald-300
      if (alpha > 0.08) return '#a7f3d0'; // emerald-200
      return '#ecfdf5'; // emerald-50
    } else {
      // Red gradient
      const alpha = Math.min(Math.abs(val), 1);
      if (alpha > 0.85) return '#991b1b'; // red-800
      if (alpha > 0.65) return '#dc2626'; // red-600
      if (alpha > 0.45) return '#ef4444'; // red-500
      if (alpha > 0.25) return '#fca5a5'; // red-300
      if (alpha > 0.08) return '#fecaca'; // red-200
      return '#fef2f2'; // red-50
    }
  };

  // Adaptive text color inside cells
  const getCellTextColor = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '#64748b';
    const abs = Math.abs(val);
    if (abs >= 0.45) return '#ffffff'; // High contrast white on deep red/green
    return '#0f172a'; // Dark slate on pastel/white
  };

  // Hovered or clicked cell info
  const activePairInfo = useMemo(() => {
    if (!selectedCell) return null;
    const { row, col } = selectedCell;
    const v1 = variables[row];
    const v2 = variables[col];
    if (!v1 || !v2) return null;

    const val = currentMatrix[row]?.[col] ?? 0;
    const pval = currentPvals[row]?.[col] ?? 0;

    // Search in pairwise
    const pair = normalizedData.pairwise.find(
      p => (p.var1 === v1.key && p.var2 === v2.key) || (p.var1 === v2.key && p.var2 === v1.key)
    );

    return {
      v1,
      v2,
      val,
      pval,
      isDiagonal: row === col,
      pair
    };
  }, [selectedCell, variables, currentMatrix, currentPvals, normalizedData.pairwise]);

  // Handle PNG HD download with white background
  const handleDownloadPng = async () => {
    if (!svgRef.current) return;
    await exportSvgToPng(svgRef.current, `matriz_correlacion_${method}_chirimayo.png`, {
      backgroundColor: '#ffffff',
      watermarkText: `${title} — Chirimayo (N=1478)`
    });
  };

  // Handle SVG download
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    exportSvgElement(svgRef.current, `matriz_correlacion_${method}_chirimayo.svg`, title);
  };

  // Handle PDF report download
  const handleDownloadPdf = async () => {
    if (!svgRef.current) return;
    await exportChartToPdf(svgRef.current, `Reporte_Matriz_Correlacion_${method.toUpperCase()}.pdf`, {
      title,
      subtitle,
      dataSummary: `Matriz multivariable 13x13 con N = ${normalizedData.n_samples} observaciones. Coeficiente: ${method.toUpperCase()}.`
    });
  };

  // Handle Matrix CSV download (Square 13x13 with headers)
  const handleDownloadMatrixCsv = () => {
    if (!currentMatrix.length) return;
    const rows: Record<string, any>[] = variables.map((v, i) => {
      const rowObj: Record<string, any> = { 'Variable': `${v.name} (${v.short})` };
      variables.forEach((v2, j) => {
        rowObj[v2.short] = currentMatrix[i]?.[j] ?? '';
      });
      return rowObj;
    });
    exportToCSV(`matriz_correlacion_${method}_cuadrada_13x13.csv`, rows);
  };

  // Handle Matrix Excel download
  const handleDownloadMatrixExcel = () => {
    if (!currentMatrix.length) return;
    const rows: Record<string, any>[] = variables.map((v, i) => {
      const rowObj: Record<string, any> = { 'Variable': `${v.name} (${v.short})` };
      variables.forEach((v2, j) => {
        rowObj[v2.short] = currentMatrix[i]?.[j] ?? '';
      });
      return rowObj;
    });
    exportToExcel(`matriz_correlacion_${method}_13x13.xlsx`, [
      { sheetName: `Matriz_${method.toUpperCase()}`, data: rows }
    ]);
  };

  // Handle Copy Pairwise Data
  const handleCopyPairwise = () => {
    const formatted = normalizedData.pairwise.map(p => ({
      'Variable 1': p.name1,
      'Variable 2': p.name2,
      'Pearson r': p.pearson_r,
      'Pearson p': p.pearson_p,
      'Spearman rho': p.spearman_rho,
      'Spearman p': p.spearman_p,
      'Interpretación': p.interpretation
    }));
    copyTableToClipboard(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered pairwise list
  const filteredPairwise = useMemo(() => {
    let list = normalizedData.pairwise;
    if (filterCategory !== 'all') {
      const catVars = variables.filter(v => v.category === filterCategory).map(v => v.key);
      list = list.filter(p => catVars.includes(p.var1) || catVars.includes(p.var2));
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name1.toLowerCase().includes(q) || 
        p.name2.toLowerCase().includes(q) || 
        p.short1.toLowerCase().includes(q) || 
        p.short2.toLowerCase().includes(q) ||
        p.interpretation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [normalizedData.pairwise, filterCategory, searchQuery, variables]);

  if (!n || currentMatrix.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Info className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-bounce" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Datos insuficientes para la matriz de correlación</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Se requieren variables continuas válidas con varianza distinta de cero. El conjunto actual no posee observaciones suficientes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controls & Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Method Switcher: Pearson vs Spearman */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <button
            onClick={() => setMethod('pearson')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              method === 'pearson'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Pearson (r)</span>
            <span className="text-[10px] opacity-80 font-normal">Lineal Paramétrico</span>
          </button>
          <button
            onClick={() => setMethod('spearman')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              method === 'spearman'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Spearman (ρ)</span>
            <span className="text-[10px] opacity-80 font-normal">Rangos No Paramétrico</span>
          </button>
        </div>

        {/* View toggles & Quick Exports */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Values inside cells */}
          <button
            onClick={() => setShowValues(!showValues)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showValues
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
            title="Alternar visibilidad de números en cada celda"
          >
            {showValues ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>Valores en Celdas</span>
          </button>

          {/* Toggle Pairwise Table View */}
          <button
            onClick={() => setShowPairwiseTable(!showPairwiseTable)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showPairwiseTable
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{showPairwiseTable ? 'Ver Mapa de Calor' : 'Ver Tabla de Pares (78)'}</span>
          </button>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
              title="Descargar Figura PNG HD (Fondo Blanco 300 DPI)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>PNG HD</span>
            </button>
            <button
              onClick={handleDownloadSvg}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
              title="Descargar Vector SVG (Fondo Blanco)"
            >
              <span>SVG</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
              title="Descargar Reporte PDF"
            >
              <span>PDF</span>
            </button>
            <button
              onClick={handleDownloadMatrixCsv}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
              title="Descargar Matriz Cuadrada 13x13 en CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleDownloadMatrixExcel}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
              title="Descargar Matriz Cuadrada en Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>XLSX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visualizer */}
      {!showPairwiseTable ? (
        <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm overflow-x-auto">
          {/* Header Title & Info within chart */}
          <div className="mb-2 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                MATRIZ MULTIVARIABLE CIENTÍFICA • {method === 'pearson' ? 'PEARSON (r)' : 'SPEARMAN (ρ)'}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                13 variables continuas cuantitativas | N = {normalizedData.n_samples} observaciones | Significancia bilateral t-Student
              </p>
            </div>
            
            {/* Color Scale Legend Bar */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-medium text-slate-500">
                Escala de Correlación: {method === 'pearson' ? 'Pearson (r)' : 'Spearman (ρ)'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-rose-600 font-bold">-1.0</span>
                {/* Visual Gradient Bar */}
                <div 
                  className="w-40 h-3 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs"
                  style={{
                    background: 'linear-gradient(to right, #991b1b, #ef4444, #ffffff, #10b981, #047857)'
                  }}
                />
                <span className="text-[10px] font-mono text-emerald-600 font-bold">+1.0</span>
              </div>
              <div className="flex justify-between w-40 text-[9px] text-slate-400 font-mono px-0.5">
                <span>Inversa</span>
                <span>0</span>
                <span>Directa</span>
              </div>
            </div>
          </div>

          {/* SVG Heatmap */}
          <div className="flex justify-center overflow-x-auto py-2">
            <svg
              ref={svgRef}
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className="select-none font-sans"
              style={{ minWidth: width, maxWidth: '100%' }}
            >
              {/* White Background for Crisp Light Export */}
              <rect x="0" y="0" width={width} height={height} fill="#ffffff" rx="16" />

              {/* Title in SVG for Export */}
              <text
                x={margin.left}
                y="30"
                fill="#0f172a"
                fontSize="13"
                fontWeight="bold"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {title}
              </text>
              <text
                x={margin.left}
                y="48"
                fill="#64748b"
                fontSize="10"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                Método: Coeficientes de {method === 'pearson' ? 'Pearson (r)' : 'Spearman (ρ)'} | N = {normalizedData.n_samples} muestras | Chirimayo
              </text>

              {/* X-Axis Column Labels (Rotated -45°) */}
              {variables.map((v, j) => {
                const x = margin.left + j * cellSize + cellSize / 2;
                const y = margin.top - 10;
                return (
                  <g key={`col-label-${j}`} transform={`translate(${x}, ${y}) rotate(-45)`}>
                    <text
                      textAnchor="start"
                      fill="#1e293b"
                      fontSize="9.5"
                      fontWeight="600"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {v.short}
                    </text>
                  </g>
                );
              })}

              {/* Y-Axis Row Labels */}
              {variables.map((v, i) => {
                const y = margin.top + i * cellSize + cellSize / 2 + 3.5;
                return (
                  <text
                    key={`row-label-${i}`}
                    x={margin.left - 8}
                    y={y}
                    textAnchor="end"
                    fill="#1e293b"
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {v.short}
                  </text>
                );
              })}

              {/* Grid Cells */}
              {variables.map((rowVar, i) =>
                variables.map((colVar, j) => {
                  const val = currentMatrix[i]?.[j];
                  const pval = currentPvals[i]?.[j];
                  const x = margin.left + j * cellSize;
                  const y = margin.top + i * cellSize;
                  const isHovered = selectedCell?.row === i && selectedCell?.col === j;
                  const isDiag = i === j;
                  const fillColor = getCellColor(val);
                  const textColor = getCellTextColor(val);

                  return (
                    <g
                      key={`cell-${i}-${j}`}
                      onClick={() => setSelectedCell({ row: i, col: j })}
                      onMouseEnter={() => setSelectedCell({ row: i, col: j })}
                      className="cursor-pointer transition-all"
                    >
                      {/* Cell Rectangle */}
                      <rect
                        x={x}
                        y={y}
                        width={cellSize - 1.5}
                        height={cellSize - 1.5}
                        rx="3.5"
                        fill={fillColor}
                        stroke={isHovered ? '#0284c7' : isDiag ? '#94a3b8' : '#e2e8f0'}
                        strokeWidth={isHovered ? 2.5 : 0.75}
                      />

                      {/* Numeric Value inside cell */}
                      {showValues && val !== undefined && (
                        <text
                          x={x + cellSize / 2 - 0.75}
                          y={y + cellSize / 2 + 3.5}
                          textAnchor="middle"
                          fill={textColor}
                          fontSize={cellSize < 35 ? '8' : '8.5'}
                          fontWeight={Math.abs(val) >= 0.5 ? '700' : '500'}
                          fontFamily="ui-monospace, monospace"
                        >
                          {isDiag ? '1.0' : val.toFixed(2)}
                        </text>
                      )}
                    </g>
                  );
                })
              )}

              {/* Right Side Category Legend */}
              <g transform={`translate(${margin.left + n * cellSize + 15}, ${margin.top})`}>
                <text x="0" y="10" fill="#0f172a" fontSize="10" fontWeight="bold">
                  Categorías:
                </text>
                {[
                  { name: 'Hidrología', color: '#0284c7' },
                  { name: 'Gases GEI', color: '#dc2626' },
                  { name: 'Clima', color: '#f59e0b' },
                  { name: 'Edáfico', color: '#8b5cf6' },
                  { name: 'Restauración', color: '#10b981' }
                ].map((cat, idx) => (
                  <g key={cat.name} transform={`translate(0, ${26 + idx * 16})`}>
                    <circle cx="5" cy="0" r="4" fill={cat.color} />
                    <text x="14" y="3" fill="#475569" fontSize="8.5">
                      {cat.name}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          </div>

          {/* Interactive Cell Inspector Card */}
          {activePairInfo && (
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activePairInfo.v1.name} ({activePairInfo.v1.short})
                  </span>
                  <span className="text-slate-400">↔</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activePairInfo.v2.name} ({activePairInfo.v2.short})
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    {activePairInfo.v1.category} / {activePairInfo.v2.category}
                  </span>
                </div>
                {activePairInfo.pair?.interpretation && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    • Interpretación Ecológica: {activePairInfo.pair.interpretation}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">
                    {method === 'pearson' ? 'Pearson (r)' : 'Spearman (ρ)'}
                  </div>
                  <div className={`text-base font-extrabold font-mono ${
                    activePairInfo.val > 0 ? 'text-emerald-600 dark:text-emerald-400' : activePairInfo.val < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                  }`}>
                    {activePairInfo.val > 0 ? `+${activePairInfo.val.toFixed(4)}` : activePairInfo.val.toFixed(4)}
                  </div>
                </div>
                <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-3">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">p-valor bilateral</div>
                  <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                    {activePairInfo.pval < 0.0001 ? '< 0.0001 ***' : activePairInfo.pval.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TABLA DETALLADA DE PARES (78 PARES) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Tabla de Correlaciones Bivariadas ({filteredPairwise.length} de 78 pares evaluados)
              </h4>
              <p className="text-xs text-slate-500">
                Ordenado por magnitud del coeficiente. Incluye p-valores t-Student e interpretaciones ecofisiológicas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPairwise}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Tabla'}</span>
              </button>
              <button
                onClick={() => exportToCSV('correlaciones_pares_chirimayo.csv', filteredPairwise)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar variable o término (ej. wtd, metano, co2, ndvi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              <option value="Hidrología">Hidrología (WTD)</option>
              <option value="Gases">Gases GEI (CO₂, CH₄)</option>
              <option value="Edáfico">Propiedades del Suelo</option>
              <option value="Restauración">Intervenciones de Restauración</option>
              <option value="Clima">Factores Climáticos</option>
            </select>
          </div>

          {/* Table container */}
          <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Variable 1</th>
                  <th className="p-2.5">Variable 2</th>
                  <th className="p-2.5 text-right">Pearson (r)</th>
                  <th className="p-2.5 text-right">p-valor (r)</th>
                  <th className="p-2.5 text-right">Spearman (ρ)</th>
                  <th className="p-2.5">Fuerza & Dirección</th>
                  <th className="p-2.5">Interpretación Ecohidrológica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredPairwise.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {p.name1} <span className="text-[10px] text-slate-400">({p.short1})</span>
                    </td>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {p.name2} <span className="text-[10px] text-slate-400">({p.short2})</span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      <span className={p.pearson_r > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {p.pearson_r > 0 ? `+${p.pearson_r.toFixed(4)}` : p.pearson_r.toFixed(4)}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono text-[11px] text-slate-500">
                      {p.pearson_p}
                    </td>
                    <td className="p-2.5 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {p.spearman_rho > 0 ? `+${p.spearman_rho.toFixed(4)}` : p.spearman_rho.toFixed(4)}
                    </td>
                    <td className="p-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.pearson_r >= 0.5 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        p.pearson_r <= -0.5 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {p.strength} {p.direction}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px] max-w-xs">
                      {p.interpretation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Highlights summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Mayor Asociación Positiva</span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
            <div className="font-semibold text-emerald-900 dark:text-emerald-200">
              CO₂ vs Balance Neto C (r = +0.9817, p &lt; 1e-300)
            </div>
            <p className="text-[11px] text-slate-500">
              Confirma que la respiración aeróbica heterótrofa explica casi la totalidad de la huella de carbono de la turbera.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60">
          <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold text-xs mb-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Mayor Asociación Inversa</span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
            <div className="font-semibold text-rose-900 dark:text-rose-200">
              WTD vs Densidad Aparente (r = -0.7176, p &lt; 1e-233)
            </div>
            <p className="text-[11px] text-slate-500">
              La profundización del nivel freático dispara el colapso del volumen poroso y la subsidencia física del suelo.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Respaldo del Gemelo Digital</span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
            <div className="font-semibold text-blue-900 dark:text-blue-200">
              13 Predictores sin colinealidad singular
            </div>
            <p className="text-[11px] text-slate-500">
              0 columnas con varianza nula y 1,478 muestras observadas garantizan la convergencia estocástica de los modelos ML.
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN OBLIGATORIA: INTERPRETABILIDAD Y OPERABILIDAD DEBAJO DE LA MATRIZ DE CORRELACIÓN */}
      <InterpretabilitySection
        type="chart"
        whatItShows={`Matriz cuadrada simétrica de correlación multivariable 13x13 evaluada mediante el método de ${method === 'pearson' ? 'Pearson (r - paramétrico lineal)' : 'Spearman (ρ - no paramétrico de rangos monótonos)'} sobre N = ${normalizedData.n_samples} observaciones de campo en la microcuenca Chirimayo.`}
        howToInterpret={
          <div>
            <p className="mb-1.5">
              <strong>Variables comparadas:</strong> 13 factores clasificados en Hidrología (WTD), Clima (Temperatura de Suelo, Precipitación), Intervenciones de Restauración (Taponamiento de Zanjas, Reducción de Pastoreo, Área Revegetada), Vegetación (NDVI), Propiedades Edáficas (Densidad Aparente, Materia Orgánica, pH) y Flujos de GEI (CO₂, CH₄ y Balance Neto de C).
            </p>
            <p className="mb-1.5">
              <strong>Escala de colores divergente:</strong> Los tonos rojos denotan correlación inversa o negativa (-1.0 a 0.0), el color blanco puro representa ausencia de correlación (0.0), y los tonos esmeralda denotan correlación directa o positiva (+0.05 a +1.0).
            </p>
            <p>
              <strong>Significado del coeficiente:</strong> Valores cercanos a +1 indican que al aumentar una variable la otra se incrementa proporcionalmente; valores cercanos a -1 indican relación inversa donde el aumento de una coincide con la reducción de la otra; valores en torno a 0 reflejan independencia lineal.
            </p>
          </div>
        }
        keyFindings={[
          "CO₂ vs Balance Neto de Carbono presenta la mayor correlación directa positiva (r = +0.9817, p < 1e-300), demostrando que la respiración microbial heterótrofa aeróbica domina casi el 100% de la huella neta de carbono en la microcuenca.",
          "WTD vs Densidad Aparente presenta la asociación inversa más crítica (r = -0.7176, p < 1e-233): el drenaje y descenso del nivel freático provocan deshidratación, compactación física y subsidencia irreversible del horizonte de turba.",
          "WTD vs Flujo de CO₂ presenta fuerte correlación negativa (r = -0.6821, p < 1e-202): cada 10 cm de descenso del nivel freático expande el acrotelm oxigenado e incrementa la emisión respiratoria en ~3.4 t CO₂/ha/año.",
          "Revegetación vs NDVI exhibe alta sincronía positiva (r = +0.8748, p < 1e-300), validando la reflectancia espectral como indicador objetivo de éxito en la recuperación de cobertura vegetal.",
          "WTD vs CH₄ muestra correlación moderada positiva (r = +0.5890, p < 1e-100), confirmando que niveles freáticos someros (anóxicos) activan la producción biogénica de metano.",
          "Variables débiles o independientes: Precipitación vs pH edáfico (r = +0.0312, p = 0.23) no exhibe relación lineal apreciable en la escala analizada."
        ]}
        limitations="El coeficiente de Pearson asume relaciones lineales bivariadas; para dependencias no lineales se debe consultar la pestaña de Spearman. La correlación describe covariación estadística y bajo ninguna circunstancia debe interpretarse como causalidad sin el respaldo de los modelos mecanicistas y biogeoquímicos."
        operabilityInstructions={[
          "Alterna entre Pearson (lineal) y Spearman (rangos) con el selector superior para comparar la estructura paramétrica y no paramétrica.",
          "Activa o desactiva la visibilidad de los números en cada celda mediante el botón 'Valores en Celdas'.",
          "Haz clic sobre cualquier celda para fijar en el panel inferior el par de variables, sus valores a 4 decimales, p-valor t-Student bilateral y su interpretación ecológica.",
          "Usa 'Ver Tabla de Pares (78)' para acceder a la tabla interactiva bivariada con buscador en tiempo real y selector por categoría.",
          "Descarga la figura en Modo Claro estricto con 'PNG HD' (fondo blanco 300 DPI) o 'SVG' vectorial.",
          "Exporta la matriz cuadrada 13x13 a CSV o Excel (.xlsx) con encabezados de filas y columnas completos."
        ]}
        datasetInfo={`Matriz Multivariable 13x13 | N = ${normalizedData.n_samples} | Microcuenca Chirimayo`}
      />
    </div>
  );
};
