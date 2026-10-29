import React, { useState } from 'react';
import { 
  Info, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Layers, 
  Search, 
  Download, 
  MousePointerClick 
} from 'lucide-react';

export interface InterpretabilityProps {
  // ¿Qué muestra?
  whatItShows: string;
  // ¿Cómo se interpreta? (ejes, unidades, escalas, colores)
  howToInterpret: string | React.ReactNode;
  // Hallazgos principales basados en datos reales
  keyFindings: string[] | React.ReactNode;
  // Limitaciones del método / datos
  limitations: string;
  
  // Operabilidad
  type?: 'chart' | 'table' | 'map' | 'model';
  // Instrucciones específicas de interactividad
  operabilityInstructions?: string[];
  
  // Custom badges o metadatos (opcional)
  datasetInfo?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export const InterpretabilitySection: React.FC<InterpretabilityProps> = ({
  whatItShows,
  howToInterpret,
  keyFindings,
  limitations,
  type = 'chart',
  operabilityInstructions,
  datasetInfo,
  defaultExpanded = true,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'interpretability' | 'operability'>('interpretability');

  // Default operability steps depending on type
  const defaultChartOperability = [
    "Pasa el cursor (hover) sobre los puntos, líneas o barras para inspeccionar valores exactos, unidades y metadata contextual.",
    "Utiliza la barra de herramientas superior para descargar la figura en PNG HD (300 DPI con fondo blanco para publicaciones), SVG vectorial o PDF institucional.",
    "Exporta los datos numéricos de la figura directamente a CSV, Excel (.xlsx) o cópialos al portapapeles.",
    "Para gráficos de series temporales o dispersión, usa la rueda del ratón o el gesto táctil para aplicar zoom en tramos críticos de datos.",
    "Haz clic en las categorías de la leyenda para ocultar o aislar series específicas y comparar comportamientos."
  ];

  const defaultTableOperability = [
    "Escribe en la barra de búsqueda superior para filtrar registros en tiempo real por cualquier campo o indicador.",
    "Haz clic en los encabezados de cualquier columna para ordenar los datos de forma ascendente o descendente (indicado por flechas).",
    "Utiliza el selector de filas por página o los botones de navegación inferior para cambiar de página rápidamente.",
    "Descarga el conjunto completo de datos o únicamente las filas filtradas mediante los botones 'Descargar CSV' o 'Excel'.",
    "Usa el botón 'Copiar al Portapapeles' para pegar la tabla formateada directamente en hojas de cálculo o documentos."
  ];

  const defaultMapOperability = [
    "Haz clic y arrastra con el ratón para desplazarte (pan) por la cuenca hidrográfica de Chirimayo.",
    "Usa los botones de zoom (+/-) o la rueda del ratón para ampliar zonas específicas de bofedales y piezómetros.",
    "Activa o desactiva capas temáticas en el panel lateral (Bofedales PNDA, Isoyetas DZ3, Canales de Drenaje, Red Hídrica).",
    "Haz clic sobre cualquier elemento geográfico para abrir la ficha de atributos detallada con coordenadas UTM y métricas.",
    "Descarga la vista cartográfica en PNG HD con fondo claro o exporta la tabla de capas geográficas a CSV/GeoJSON."
  ];

  const instructionsToUse = operabilityInstructions && operabilityInstructions.length > 0
    ? operabilityInstructions
    : type === 'table'
      ? defaultTableOperability
      : type === 'map'
        ? defaultMapOperability
        : defaultChartOperability;

  return (
    <div className={`mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 overflow-hidden shadow-sm transition-all ${className}`}>
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-100/90 to-slate-50/50 dark:from-slate-800/80 dark:to-slate-900/40 border-b border-slate-200 dark:border-slate-800 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Interpretabilidad y Operabilidad
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                {type === 'table' ? 'Tabla de Datos' : type === 'map' ? 'Visualizador SIG' : 'Figura Científica'}
              </span>
              {datasetInfo && (
                <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono">
                  {datasetInfo}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            {isExpanded ? 'Ocultar detalles' : 'Desplegar análisis'}
          </span>
          <div className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expandable Content Area */}
      {isExpanded && (
        <div className="p-5 space-y-4 text-xs">
          {/* Subtabs for Easy Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('interpretability')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'interpretability'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              Interpretabilidad Científica
            </button>
            <button
              onClick={() => setActiveTab('operability')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'operability'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {type === 'table' ? 'Cómo utilizar esta tabla' : 'Cómo interactuar con este gráfico'}
            </button>
          </div>

          {/* TAB 1: INTERPRETABILIDAD */}
          {activeTab === 'interpretability' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. ¿Qué muestra? */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span>1. ¿Qué muestra {type === 'table' ? 'esta tabla' : 'este gráfico'}?</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-5.5">
                  {whatItShows}
                </p>
              </div>

              {/* 2. ¿Cómo se interpreta? */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>2. ¿Cómo se interpreta?</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed pl-5.5">
                  {typeof howToInterpret === 'string' ? (
                    <p>{howToInterpret}</p>
                  ) : (
                    howToInterpret
                  )}
                </div>
              </div>

              {/* 3. Hallazgos principales */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>3. Hallazgos principales</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 pl-5.5 space-y-1">
                  {Array.isArray(keyFindings) ? (
                    <ul className="list-disc list-outside ml-3 space-y-1">
                      {keyFindings.map((finding, idx) => (
                        <li key={idx} className="leading-relaxed">{finding}</li>
                      ))}
                    </ul>
                  ) : (
                    keyFindings
                  )}
                </div>
              </div>

              {/* 4. Limitaciones */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>4. Consideraciones y limitaciones</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-5.5">
                  {limitations}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: OPERABILIDAD */}
          {activeTab === 'operability' && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                <MousePointerClick className="w-4 h-4 text-emerald-500" />
                <span>
                  {type === 'table' ? 'Operaciones disponibles en esta tabla' : 'Operaciones disponibles en este gráfico'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                A continuación se describen las funcionalidades interactivas y de exportación efectivamente implementadas en este componente:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {instructionsToUse.map((inst, index) => (
                  <div key={index} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 leading-snug">{inst}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
