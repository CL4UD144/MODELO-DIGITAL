import React from 'react';
import { 
  LayoutDashboard, 
  Target, 
  Database, 
  Wrench, 
  BrainCircuit, 
  CheckCircle2, 
  Rocket, 
  Activity, 
  Sparkles,
  ChevronRight,
  Layers,
  Box,
  Map as MapIcon,
  Cpu,
  FileText,
  Droplets,
  ShieldCheck,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface CrispDmSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CrispDmSidebar: React.FC<CrispDmSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen = true,
  onClose
}) => {
  const { t, language } = useLanguage();

  const crispPhases = [
    {
      id: 'crisp_main',
      phaseNumber: '0',
      title: language === 'es' ? 'Panel Principal' : 'Main Dashboard',
      subtitle: language === 'es' ? 'Resumen & Progreso' : 'Summary & Progress',
      icon: LayoutDashboard,
      color: 'from-cyan-500 to-blue-600',
      badgeColor: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
      mappedTab: 'crisp_dashboard'
    },
    {
      id: 'crisp_p1',
      phaseNumber: '1',
      title: language === 'es' ? '1. Comprensión Negocio' : '1. Business Understanding',
      subtitle: language === 'es' ? 'Metas & MERESE CO₂-CH₄' : 'Goals & MERESE CO₂-CH₄',
      icon: Target,
      color: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30',
      mappedTab: 'simulator'
    },
    {
      id: 'crisp_p2',
      phaseNumber: '2',
      title: language === 'es' ? '2. Comprensión Datos' : '2. Data Understanding',
      subtitle: language === 'es' ? 'Estaciones, IoT & Rásteres' : 'Stations, IoT & Rasters',
      icon: Database,
      color: 'from-sky-500 to-blue-600',
      badgeColor: 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/30',
      mappedTab: 'etl_catalog'
    },
    {
      id: 'crisp_p3',
      phaseNumber: '3',
      title: language === 'es' ? '3. Preparación Datos' : '3. Data Preparation',
      subtitle: language === 'es' ? 'ETL, Outliers & Kriging' : 'ETL, Outliers & Kriging',
      icon: Wrench,
      color: 'from-teal-500 to-emerald-600',
      badgeColor: 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-500/30',
      mappedTab: 'data_prep'
    },
    {
      id: 'crisp_p4',
      phaseNumber: '4',
      title: language === 'es' ? '4. Modelado' : '4. Modeling',
      subtitle: language === 'es' ? 'SVM, RF, XGBoost & IPCC' : 'SVM, RF, XGBoost & IPCC',
      icon: BrainCircuit,
      color: 'from-purple-500 to-indigo-600',
      badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30',
      mappedTab: 'model_info'
    },
    {
      id: 'crisp_p5',
      phaseNumber: '5',
      title: language === 'es' ? '5. Evaluación' : '5. Evaluation',
      subtitle: language === 'es' ? 'Validación BACI & Hypothesis' : 'BACI Validation & Hypothesis',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-green-600',
      badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
      mappedTab: 'baci_restoration'
    },
    {
      id: 'crisp_p6',
      phaseNumber: '6',
      title: language === 'es' ? '6. Despliegue' : '6. Deployment',
      subtitle: language === 'es' ? 'Gemelo 3D, GIS & Reportes' : 'Twin 3D, GIS & Reports',
      icon: Rocket,
      color: 'from-rose-500 to-pink-600',
      badgeColor: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30',
      mappedTab: '3d_twin'
    }
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/95 dark:bg-[#030712]/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 shadow-2xl transition-transform duration-300 flex flex-col justify-between ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } lg:static lg:w-72 lg:flex-shrink-0`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-emerald-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-950/30 border border-amber-400/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
                  Gemelo Digital
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30">
                  CRISP-DM
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                {language === 'es' ? 'Motor Predictivo Chirimayo' : 'Chirimayo Predictive Engine'}
              </p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold flex items-center justify-between">
          <span>{language === 'es' ? 'Navegación CRISP-DM' : 'CRISP-DM Navigation'}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
            6 Fases
          </span>
        </div>

        {crispPhases.map((phase) => {
          const IconComponent = phase.icon;
          const isActive = activeTab === phase.mappedTab || 
            (phase.mappedTab === 'crisp_dashboard' && activeTab === 'crisp_dashboard');

          return (
            <button
              key={phase.id}
              onClick={() => setActiveTab(phase.mappedTab)}
              className={`w-full group flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-md shadow-emerald-950/20 border-emerald-400/40 font-medium'
                  : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-transform group-hover:scale-105 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:text-emerald-500'
                }`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>{phase.title}</span>
                  </div>
                  <div className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {phase.subtitle}
                  </div>
                </div>
              </div>

              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                isActive ? 'text-white translate-x-0.5' : 'text-slate-400 opacity-0 group-hover:opacity-100'
              }`} />
            </button>
          );
        })}

        {/* Separator */}
        <div className="my-4 border-t border-slate-200 dark:border-slate-800/80" />

        {/* Additional Quick Views */}
        <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
          {language === 'es' ? 'Vistas Espaciales & Reportes' : 'Spatial Views & Reports'}
        </div>

        <button
          onClick={() => setActiveTab('3d_twin')}
          className={`w-full flex items-center gap-3 p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === '3d_twin'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <Box className="w-4 h-4 text-emerald-500" />
          <span>{language === 'es' ? '🌐 Gemelo Digital 3D' : '🌐 3D Digital Twin'}</span>
        </button>

        <button
          onClick={() => setActiveTab('map_2d')}
          className={`w-full flex items-center gap-3 p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'map_2d'
              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <MapIcon className="w-4 h-4 text-sky-500" />
          <span>{language === 'es' ? '🗺️ Mapa GIS 2D' : '🗺️ 2D GIS Map'}</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`w-full flex items-center gap-3 p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>{language === 'es' ? '📄 Reportes & MERESE' : '📄 Reports & MERESE'}</span>
        </button>

        <button
          onClick={() => setActiveTab('scientific_charts')}
          className={`w-full flex items-center gap-3 p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'scientific_charts'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>{language === 'es' ? '🔬 Gráficos Científicos' : '🔬 Scientific Charts'}</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`w-full flex items-center gap-3 p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'architecture'
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <Droplets className="w-4 h-4 text-purple-500" />
          <span>{language === 'es' ? '🏛️ Arquitectura C4' : '🏛️ C4 Architecture'}</span>
        </button>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 rounded-b-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
            {language === 'es' ? 'Estado del Sistema' : 'System Status'}
          </span>
        </div>
        <div className="space-y-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <div className="flex justify-between items-center">
            <span>{language === 'es' ? 'Fase actual:' : 'Current phase:'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{activeTab}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{language === 'es' ? 'Datos cargados:' : 'Loaded data:'}</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">SENAMHI + IoT</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{language === 'es' ? 'Modelos:' : 'Models:'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">SVM / RF / IPCC</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
