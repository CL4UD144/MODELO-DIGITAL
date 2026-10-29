import React, { useState } from 'react';
import { 
  Droplets, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  ShieldCheck, 
  BarChart2, 
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { INTERVENTION_PROJECTS, BACI_SERIES, BOFEDALES } from '../data/mockDatasets';
import { InterventionProject } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const RestorationBACI: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const textStroke = isDark ? '#94a3b8' : '#475569';
  const tooltipBg = isDark ? '#020617' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

  const [interventions, setInterventions] = useState<InterventionProject[]>(INTERVENTION_PROJECTS);
  const [selectedBaciPeriod, setSelectedBaciPeriod] = useState<'all' | 'pre' | 'post'>('all');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAiRecommender, setShowAiRecommender] = useState(false);

  // New intervention form state
  const [newProject, setNewProject] = useState({
    title: '',
    type: 'Ditch_Blocking',
    targetBofedalId: 'bof-03',
    budgetUSD: 15000,
    damsCount: 20,
    responsibleCommunity: 'Comunidad Campesina Chirimayo-Combayo'
  });

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    const created: InterventionProject = {
      id: `proj-${Date.now()}`,
      code: `INT-CHIR-2024-0${interventions.length + 1}`,
      title: newProject.title || 'Nueva Intervención de Restauración',
      type: newProject.type as any,
      status: 'Planificado',
      targetBofedalId: newProject.targetBofedalId,
      startDate: new Date().toISOString().slice(0, 10),
      budgetUSD: newProject.budgetUSD,
      damsCount: newProject.damsCount,
      responsibleCommunity: newProject.responsibleCommunity,
      initialWaterTable: -40.0,
      currentWaterTable: -40.0,
      targetWaterTable: -10.0,
      avoidedEmissionsTonsCO2eqYear: Math.round(newProject.damsCount * 12.5),
      lat: -7.0470,
      lng: -78.3820,
      localCoords: [8, -1, 10]
    };
    setInterventions([...interventions, created]);
    setShowNewProjectModal(false);
  };

  const aiRecommendations = [
    {
      id: 'rec-01',
      title: 'Sector Drenaje Crítico El Pajonal (Zanja Principal Este)',
      reason: 'Pendiente 2.8%, espesor de turba 4.2m, densidad de zanja 4.8 km/ha.',
      suggestedAction: 'Instalar 18 diques de piedra y champa escalonados cada 25 metros.',
      expectedWtdRecovery: '+28 cm (de -42 cm a -14 cm)',
      avoidedCO2eq: '240 t CO₂eq/año',
      priority: 'Alta'
    },
    {
      id: 'rec-02',
      title: 'Bofedal Rumichaca - Tramo de Erosión Fluvial Regresiva',
      reason: 'Conectividad hidrológica alta, riesgo de vaciado del acuífero colgado.',
      suggestedAction: 'Dique vertedero de gavión vegetado y clausura perimétrica de 45 ha.',
      expectedWtdRecovery: '+15 cm (de -21 cm a -6 cm)',
      avoidedCO2eq: '185 t CO₂eq/año',
      priority: 'Media-Alta'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-white overflow-y-auto p-4 lg:p-6 space-y-6 tech-grid-bg transition-colors duration-300">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-cyan-500/30 transition-all">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            {t('baci.baciMethodology')}
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t('baci.title')}</span>
            <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('baci.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAiRecommender(!showAiRecommender)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('baci.iaOptimizedDikes')}</span>
          </button>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('baci.registerIntervention')}</span>
          </button>
        </div>
      </div>

      {/* BACI Statistical Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-cyan-500/30 transition-all">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">{t('baci.waterTableRise')}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono text-cyan-600 dark:text-cyan-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.3)]">+29.5 cm</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Recuperación efectiva</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-200 dark:border-slate-800/90 pt-2.5">
            {t('baci.statisticalSignificance')}: <span className="text-slate-900 dark:text-white font-mono font-bold">{t('baci.significant')}</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">{t('baci.co2Reduction')}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">-64.2 %</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">vs. Microcuenca Control</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-200 dark:border-slate-800/90 pt-2.5">
            Tamaño de Efecto: <span className="text-slate-900 dark:text-white font-mono font-bold">Cohen's d = 2.45 (Muy Alto)</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-lime-500/30 transition-all">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">{t('baci.vegetationRecovery')}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono text-lime-600 dark:text-lime-300 drop-shadow-[0_0_12px_rgba(163,230,53,0.3)]">+0.26</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Sentinel-2 MSI</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-200 dark:border-slate-800/90 pt-2.5">
            Regeneración: <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">Distichia & Carex</span>
          </div>
        </div>
      </div>

      {/* BACI Charts: Comparison Before vs After */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Water Table Depth Hydrograph BACI */}
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('baci.timelineTitle')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Comparativa mensual Pre (2018-2020) y Post Intervención (2021-2024)</p>
            </div>
            <span className="text-[10px] px-2.5 py-1 bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30 font-mono rounded-lg font-semibold">
              Piezómetros Continuos
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={BACI_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="month" stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} />
                <YAxis stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} label={{ value: 'Nivel Freático (cm)', angle: -90, position: 'insideLeft', fill: textStroke, fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '16px', fontSize: '11px', color: isDark ? '#ffffff' : '#0f172a' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="impactWTD" name="Chirimayo Intervenido (WTD)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="controlWTD" name="Microcuenca Control (WTD)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800/40 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/60">
            Nótese el salto dramático en Chirimayo a partir de la rehumidificación (Post-Intervención), estabilizando el agua a &gt; -12 cm en estiaje.
          </div>
        </div>

        {/* Chart 2: Soil CO2 Respiration Flux BACI */}
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Flujos de Respiración de CO₂ del Suelo</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Cámaras estáticas oscuras en g C / m² / día</p>
            </div>
            <span className="text-[10px] px-2.5 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 font-mono rounded-lg font-semibold">
              Gases Suelo
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={BACI_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="month" stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} />
                <YAxis stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} label={{ value: 'g C / m² / día', angle: -90, position: 'insideLeft', fill: textStroke, fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '16px', fontSize: '11px', color: isDark ? '#ffffff' : '#0f172a' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="impactCO2Flux" name="Chirimayo CO₂ (Respiración)" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="controlCO2Flux" name="Control CO₂" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800/40 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/60">
            La respiración en Chirimayo cayó de un promedio de 4.1 g C/m²/d (drenado) a solo 1.2 g C/m²/d tras la inundación parcial de las zanjas.
          </div>
        </div>
      </div>

      {/* Active Interventions Directory */}
      <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Proyectos de Intervención en la Microcuenca Chirimayo
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Obras físicas, monitoreo y co-gestión comunal</p>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-300 dark:border-slate-700/60">
            {interventions.length} proyectos registrados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interventions.map((proj) => (
            <div key={proj.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 backdrop-blur-xs rounded-2xl border border-slate-200 dark:border-slate-700/70 hover:border-emerald-500/50 transition-all shadow-xs hover:shadow-emerald-950/20">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700/80 text-emerald-700 dark:text-emerald-300 border border-slate-300 dark:border-slate-600/50 font-bold">
                    {proj.code}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1.5">{proj.title}</h4>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                  proj.status === 'Completado' || proj.status === 'Monitoreo_Activo'
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                    : proj.status === 'En_Ejecución'
                    ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40'
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                }`}>
                  {proj.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Comunidad Responsable:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{proj.responsibleCommunity}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Presupuesto MERESE:</span>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-300">${proj.budgetUSD.toLocaleString()} USD</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Nivel Freático Actual:</span>
                  <div className="font-mono font-bold text-cyan-600 dark:text-cyan-300">{proj.currentWaterTable} cm (Meta: {proj.targetWaterTable} cm)</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Emisiones Evitadas:</span>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{proj.avoidedEmissionsTonsCO2eqYear} t CO₂eq/año</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  Inicio: {proj.startDate}
                </span>
                {proj.damsCount && (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {proj.damsCount} Diques de Retención
                  </span>
                )}
                {proj.fencedLengthMeters && (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {proj.fencedLengthMeters}m de cerco
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-sm">{t('baci.modalTitle')}</h3>
              <button 
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                {t('common.close')}
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">{t('baci.projectNameLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Diques de retención quebrada alta"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Tipo de Intervención:</label>
                  <select
                    value={newProject.type}
                    onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ditch_Blocking">Bloqueo de Zanjas de Drenaje</option>
                    <option value="Stone_Check_Dam">Dique de Piedra y Champa</option>
                    <option value="Cattle_Exclusion">Clausura y Cerco de Pastoreo</option>
                    <option value="Revegetation">Revegetación Almohadillas Nativas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">{t('baci.locationLabel')}</label>
                  <select
                    value={newProject.targetBofedalId}
                    onChange={(e) => setNewProject({ ...newProject, targetBofedalId: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {BOFEDALES.map(b => (
                      <option key={b.id} value={b.id}>{b.name.replace('Turbera Bofedal ', '')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">{t('baci.budgetLabel')}</label>
                  <input
                    type="number"
                    value={newProject.budgetUSD}
                    onChange={(e) => setNewProject({ ...newProject, budgetUSD: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">N° Estructuras / Diques:</label>
                  <input
                    type="number"
                    value={newProject.damsCount}
                    onChange={(e) => setNewProject({ ...newProject, damsCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Comunidad Campesina Aliada:</label>
                <input
                  type="text"
                  value={newProject.responsibleCommunity}
                  onChange={(e) => setNewProject({ ...newProject, responsibleCommunity: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium cursor-pointer transition-all shadow-md"
                >
                  {t('baci.createProjectBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Recommendation Modal */}
      {showAiRecommender && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900/95 backdrop-blur-md border border-purple-300 dark:border-purple-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-sm">Optimizador Espacial de Restauración (IA Topo-Hidrológica)</h3>
              </div>
              <button 
                onClick={() => setShowAiRecommender(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                {t('common.close')}
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Algoritmo de idoneidad geoespacial basado en Índice de Humedad Topográfica (TWI), Modelo ALOS DEM (30m), espesor de turba y densidad de drenajes artificiales:
            </p>

            <div className="space-y-3">
              {aiRecommendations.map((rec) => (
                <div key={rec.id} className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                    <span>{rec.title}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 rounded-full border border-purple-300 dark:border-purple-500/40 font-mono font-semibold">
                      Prioridad {rec.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 mb-2">{rec.suggestedAction}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-purple-200 dark:border-purple-900/50 pt-2">
                    <span>Causa: {rec.reason}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">+{rec.avoidedCO2eq}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center font-mono">
              Las coordenadas óptimas han sido proyectadas en el Gemelo 3D y en la tabla <code>intervenciones_recomendadas</code> de PostgreSQL/PostGIS.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
