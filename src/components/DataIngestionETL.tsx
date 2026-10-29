import React, { useState } from 'react';
import { 
  Database, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  FileCode, 
  ShieldCheck, 
  Zap, 
  Layers, 
  FileSpreadsheet,
  Check,
  Server,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { GEOSPATIAL_CATALOG } from '../data/mockDatasets';
import { GeospatialDatasetCatalogItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { DataTable, Column } from './common/DataTable';
import { InterpretabilitySection } from './common/InterpretabilitySection';

export const DataIngestionETL: React.FC = () => {
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState<GeospatialDatasetCatalogItem[]>(GEOSPATIAL_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadLogs, setUploadLogs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const catalogColumns: Column<GeospatialDatasetCatalogItem>[] = [
    { 
      key: 'source', 
      header: 'Fuente', 
      sortable: true, 
      render: (d) => (
        <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700">
          {d.source}
        </span>
      ) 
    },
    { 
      key: 'title', 
      header: 'Nombre del Dataset', 
      sortable: true, 
      render: (d) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{d.title}</div>
          <div className="text-[10px] text-slate-500 italic">{d.iso19115Category}</div>
        </div>
      ) 
    },
    { 
      key: 'format', 
      header: 'Formato', 
      sortable: true, 
      render: (d) => <span className="font-mono text-slate-700 dark:text-slate-300">{d.format}</span> 
    },
    { 
      key: 'epsg', 
      header: 'SRC / EPSG', 
      sortable: true, 
      render: (d) => <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{d.epsg}</span> 
    },
    { key: 'spatialResolution', header: 'Resolución Espacial', sortable: true },
    { key: 'temporalCoverage', header: 'Cobertura Temporal', sortable: true },
    { 
      key: 'lastUpdated', 
      header: 'Última Sync', 
      sortable: true, 
      render: (d) => <span className="font-mono text-emerald-600 dark:text-emerald-400">{d.lastUpdated}</span> 
    },
    { 
      key: 'status', 
      header: 'Estado', 
      sortable: true, 
      render: (d) => (
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {d.status}
        </span>
      ) 
    }
  ];

  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = selectedSource === 'all' || item.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  const handleSimulateUpload = (fileType: string) => {
    setIsUploading(true);
    setUploadSuccess(false);
    setUploadLogs([
      `[1/5] Ingestando archivo: ${fileType}...`,
      `[2/5] Verificando sistema de referencia de coordenadas: EPSG:4326 -> EPSG:32717 (UTM 17S)...`,
      `[3/5] Algoritmo QA/QC: Detección de outliers (Z-Score > 3.0)...`,
      `[4/5] Interpolación espacial IDW / Kriging para 3 piezómetros con datos faltantes...`,
      `[5/5] Inserción en TimescaleDB Hypertable & generación de hash SHA-256 para reproducibilidad científica.`
    ]);

    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-white overflow-y-auto p-4 lg:p-6 space-y-6 tech-grid-bg transition-colors duration-300">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('etl.title')}
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t('etl.title')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('etl.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-300 text-xs font-medium shadow-xs">
            <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            7 {t('etl.sources.senamhi')} + PostGIS
          </span>
        </div>
      </div>

      {/* Field Upload & Pipeline Execution Workshop */}
      <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-cyan-500/30 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              {t('etl.uploadSection.title')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t('etl.uploadSection.dragDrop')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Dropzone */}
          <div className="lg:col-span-6 border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-emerald-500/70 rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all bg-slate-50 dark:bg-slate-950/60 backdrop-blur-xs">
            <UploadCloud className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-2 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
            <div className="font-bold text-xs text-slate-900 dark:text-white">{t('etl.uploadSection.dragDrop')}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-xs leading-relaxed">
              {t('etl.uploadSection.supportedFormats')}
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleSimulateUpload('Piezometros_Chirimayo_2024_08.csv')}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800/90 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700/80 cursor-pointer flex items-center gap-2 transition-all hover:border-emerald-500/40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Cargar CSV Piezómetros
              </button>
              <button
                onClick={() => handleSimulateUpload('Camaras_Flujo_CO2_CH4_Agosto.csv')}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800/90 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700/80 cursor-pointer flex items-center gap-2 transition-all hover:border-amber-500/40"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Cargar CSV Flujos Gases
              </button>
              <button
                onClick={() => handleSimulateUpload('Poligonos_Restauracion_2024.zip')}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 cursor-pointer flex items-center gap-2 transition-all hover:border-cyan-500/40"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Cargar Shapefile (.zip)
              </button>
            </div>
          </div>

          {/* ETL Pipeline Execution Log */}
          <div className="lg:col-span-6 bg-slate-950/80 rounded-3xl p-5 border border-slate-800/90 flex flex-col justify-between font-mono text-xs shadow-inner">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] pb-3 border-b border-slate-800 mb-3">
                <span className="font-semibold text-slate-300">Pipeline ETL Geoespacial (Celery + GDAL + PostGIS)</span>
                <span className={isUploading ? 'text-amber-400 animate-pulse font-bold' : uploadSuccess ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {isUploading ? t('etl.uploadSection.validating') : uploadSuccess ? t('etl.uploadSection.success') : '○ En Espera'}
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                {uploadLogs.length === 0 ? (
                  <div className="text-slate-500 py-8 text-center italic">
                    Selecciona un archivo de prueba para ejecutar el pipeline de limpieza, detección de outliers e interpolación Kriging.
                  </div>
                ) : (
                  uploadLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {uploadSuccess && (
              <div className="mt-4 p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl text-[11px] text-emerald-300 flex items-center justify-between shadow-lg">
                <span>UUID Hash: <code className="bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-200 font-mono">7f8a9b2c-4e1d-8f3a</code></span>
                <span className="font-bold">24 registros insertados</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ISO 19115 GeoData Catalog Section */}
      <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl space-y-4 hover:border-emerald-500/30 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t('etl.catalogTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Estándar ISO 19115 / OGC WMS-WFS con sincronización continua</p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  viewMode === 'cards'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tarjetas</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  viewMode === 'table'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabla & Exportar</span>
              </button>
            </div>

            {/* Search & Filter for Cards */}
            {viewMode === 'cards' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-60 font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {viewMode === 'table' ? (
          <DataTable<GeospatialDatasetCatalogItem>
            data={catalog}
            columns={catalogColumns}
            title="Catálogo Maestro de Datos Geoespaciales (ISO 19115 / OGC)"
            subtitle="Inventario de capas raster y vectoriales integradas en el Gemelo Digital Chirimayo"
            filename="catalogo_geoespacial_iso19115_chirimayo"
            searchPlaceholder="Buscar por fuente, dataset, EPSG, formato..."
            initialRowsPerPage={10}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCatalog.map((ds) => (
            <div key={ds.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 backdrop-blur-xs rounded-2xl border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-xs hover:shadow-emerald-950/10">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-mono">
                    {ds.source}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-mono font-medium">
                    {ds.format}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{ds.title}</h4>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">{ds.iso19115Category}</div>

                <div className="grid grid-cols-2 gap-2 my-3 text-[11px] bg-white dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Resolución Espacial:</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{ds.spatialResolution}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Cobertura Temporal:</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{ds.temporalCoverage}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Sistema Coordenadas:</span>
                    <div className="font-mono text-cyan-700 dark:text-cyan-300 font-semibold">{ds.epsg}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Última Sincronización:</span>
                    <div className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">{ds.lastUpdated}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2.5">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {ds.status}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] truncate max-w-[200px]">
                  {ds.endpointUrl}
                </span>
              </div>
            </div>
          ))}
        </div>
        )}

        <InterpretabilitySection
          type="table"
          title="Catálogo Maestro de Datos Geoespaciales (ISO 19115 / OGC)"
          whatItShows="Metadatos estandarizados de las 7 fuentes primarias de datos geoespaciales y climáticos integradas en el gemelo digital (SENAMHI, ANA, INAIGEM, MINAM, Google Earth Engine, ISRIC SoilGrids y sensores de campo)."
          howToInterpret="Cada registro especifica la fuente oficial, categoría temática ISO 19115, formato nativo (GeoTIFF, GeoJSON, NetCDF), sistema de referencia espacial (EPSG:32717 UTM 17S), resolución y estado de sincronización."
          keyFindings="Todas las capas vectoriales y ráster se encuentran reproyectadas uniformemente a EPSG:32717 (WGS 84 / UTM Zona 17 Sur), garantizando la consistencia topológica y la precisión métrica en el cálculo de áreas y pendientes."
          limitations="La resolución espacial varía desde 10 m en Sentinel-2 hasta 250 m en SoilGrids 2.0; las capas satelitales ópticas pueden presentar huecos temporales en época de lluvias por alta nubosidad andina."
          howToOperate={[
            "Alterna entre la vista de 'Tarjetas' y la vista de 'Tabla & Exportar' con el conmutador superior.",
            "Busca por nombre de dataset, formato, código EPSG o institución fuente.",
            "En la vista de tabla, ordena las columnas o descarga el catálogo a Excel (.xlsx) o CSV.",
            "Usa el panel superior de subida para ejecutar pipelines ETL de prueba con validación QA/QC e interpolación Kriging."
          ]}
        />
      </div>
    </div>
  );
};
