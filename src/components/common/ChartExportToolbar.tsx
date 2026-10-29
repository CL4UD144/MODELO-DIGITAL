import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Image as ImageIcon, 
  FileCode, 
  FileSpreadsheet, 
  Table, 
  Copy, 
  Check, 
  ChevronDown,
  Sparkles,
  FileText,
  Globe,
  Loader2
} from 'lucide-react';
import { 
  exportSvgToPng, 
  exportSvgElement, 
  exportChartToPdf,
  exportHtmlInteractive,
  exportToCSV, 
  exportToExcel, 
  exportToJSON, 
  copyTableToClipboard,
  ExportColumnDef 
} from '../../utils/exportUtils';

export interface ChartExportToolbarProps {
  /** Referencia al elemento HTML o SVG que contiene la figura (nombre principal) */
  chartRef?: React.RefObject<HTMLElement | SVGSVGElement | null>;
  /** Alias compatible para targetRef */
  targetRef?: React.RefObject<HTMLElement | SVGSVGElement | null>;
  /** Arreglo de datos del gráfico */
  data?: any[];
  /** Nombre base para los archivos exportados (sin extensión) */
  filename: string;
  /** Título de la figura para metadatos */
  title?: string;
  /** Subtítulo o notas adicionales */
  subtitle?: string;
  /** Definición opcional de columnas para CSV/Excel */
  columns?: ExportColumnDef[];
  /** Estilo compacto (solo iconos) o extendido */
  compact?: boolean;
  /** Acción adicional (ej. toggle de pantalla completa o selector) */
  extraActions?: React.ReactNode;
}

export const ChartExportToolbar: React.FC<ChartExportToolbarProps> = ({
  chartRef,
  targetRef,
  data,
  filename,
  title,
  subtitle,
  columns,
  compact = false,
  extraActions
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Resuelve referencia unificada (soporta chartRef y targetRef)
  const resolvedRef = chartRef || targetRef;

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleExportPng = async () => {
    if (!resolvedRef?.current) {
      showStatus('⚠️ Figura no disponible');
      return;
    }
    setIsExporting(true);
    const success = await exportSvgToPng(resolvedRef.current, `${filename}_300dpi`, {
      scale: 3.0,
      watermarkText: 'Gemelo Digital Turberas Chirimayo • INAIGEM-UNC'
    });
    setIsExporting(false);
    setIsOpen(false);
    showStatus(success ? '✓ PNG HD descargado' : '⚠️ Error al generar PNG');
  };

  const handleExportSvg = () => {
    if (!resolvedRef?.current) {
      showStatus('⚠️ Figura no disponible');
      return;
    }
    const success = exportSvgElement(resolvedRef.current, filename, title);
    setIsOpen(false);
    showStatus(success ? '✓ SVG Vector descargado' : '⚠️ Error al exportar SVG');
  };

  const handleExportPdf = async () => {
    if (!resolvedRef?.current) {
      showStatus('⚠️ Figura no disponible');
      return;
    }
    setIsExporting(true);
    const success = await exportChartToPdf(resolvedRef.current, filename, {
      title: title || 'Figura Científica',
      subtitle: subtitle || 'Gemelo Digital de Turberas Chirimayo — Monitoreo Biofísico e Hidrológico',
      notes: 'Datos de campo calibrados | Modelo IPCC Tier 2 / XGBoost | Microcuenca Chirimayo, Cajamarca'
    });
    setIsExporting(false);
    setIsOpen(false);
    showStatus(success ? '✓ PDF Oficial generado' : '⚠️ Error al generar PDF');
  };

  const handleExportHtml = () => {
    if (!data || data.length === 0) {
      showStatus('⚠️ Sin datos para HTML');
      return;
    }
    const success = exportHtmlInteractive(
      filename,
      title || 'Visualizador Interactivo de Figura',
      data,
      columns
    );
    setIsOpen(false);
    showStatus(success ? '✓ HTML descargado' : '⚠️ Error al exportar HTML');
  };

  const handleExportCsv = () => {
    if (!data || data.length === 0) {
      showStatus('⚠️ Sin datos para CSV');
      return;
    }
    const success = exportToCSV(filename, data, columns);
    setIsOpen(false);
    showStatus(success ? '✓ CSV (UTF-8) generado' : '⚠️ Error al generar CSV');
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      showStatus('⚠️ Sin datos para Excel');
      return;
    }
    const success = exportToExcel(filename, [
      {
        sheetName: title ? title.slice(0, 25).replace(/[\\/?*[\]]/g, '') : 'Datos_Grafico',
        data,
        columns
      }
    ]);
    setIsOpen(false);
    showStatus(success ? '✓ Libro Excel generado' : '⚠️ Error al generar XLSX');
  };

  const handleExportJson = () => {
    if (!data) {
      showStatus('⚠️ Sin datos');
      return;
    }
    const success = exportToJSON(filename, data);
    setIsOpen(false);
    showStatus(success ? '✓ JSON exportado' : '⚠️ Error al exportar JSON');
  };

  const handleCopy = async () => {
    if (!data || data.length === 0) return;
    const success = await copyTableToClipboard(data, columns);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
      showStatus('✓ Copiado al portapapeles');
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5 z-20" ref={dropdownRef}>
      {extraActions}

      {/* Botón Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
          isOpen
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/20'
            : 'bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-xs'
        }`}
        title="Opciones completas de descarga de la figura y datos de origen"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5 text-emerald-500" />
        )}
        {!compact && <span>{isExporting ? 'Procesando...' : 'Descargar'}</span>}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Notificación rápida flotante */}
      {statusMessage && (
        <div className="absolute right-0 bottom-full mb-2 bg-slate-900 text-emerald-400 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-xl whitespace-nowrap animate-in fade-in z-50">
          {statusMessage}
        </div>
      )}

      {/* Menú Desplegable Multiformato */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 text-xs text-slate-800 dark:text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md">
          {/* Encabezado */}
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 mb-1 flex items-center justify-between">
            <span>Formatos de Figura</span>
            <span className="text-emerald-500 font-bold">Alta Calidad</span>
          </div>

          {/* Formatos Gráficos */}
          <div className="space-y-0.5">
            <button
              onClick={handleExportPng}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Imagen PNG (300 DPI)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 font-bold">HD</span>
            </button>

            <button
              onClick={handleExportSvg}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-purple-500" />
                <span>Vectorial SVG</span>
              </div>
              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">Vector</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>Documento PDF Oficial</span>
              </div>
              <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold">PDF</span>
            </button>
          </div>

          {/* Formatos de Datos */}
          {data && data.length > 0 && (
            <>
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold border-t border-slate-200 dark:border-slate-800 my-1 pt-1.5 flex items-center justify-between">
                <span>Datos de Origen</span>
                <span className="text-slate-500">{data.length} pts</span>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={handleExportCsv}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Datos en CSV (UTF-8 BOM)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">CSV</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Table className="w-3.5 h-3.5 text-teal-500" />
                    <span>Libro de Excel (.xlsx)</span>
                  </div>
                  <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">XLSX</span>
                </button>

                <button
                  onClick={handleExportHtml}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    <span>HTML Interactivo Autónomo</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">HTML</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                    <span>{copied ? '¡Copiado al portapapeles!' : 'Copiar TSV para Sheets/Excel'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">TSV</span>
                </button>

                <button
                  onClick={handleExportJson}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                    <span>JSON Estructurado</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">JSON</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
