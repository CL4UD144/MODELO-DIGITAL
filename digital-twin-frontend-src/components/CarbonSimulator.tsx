import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Droplet, 
  DollarSign, 
  Sliders, 
  Info, 
  Sparkles, 
  BarChart2, 
  Layers, 
  CheckCircle2,
  RefreshCw
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
  AreaChart, 
  Area,
  BarChart,
  Bar
} from 'recharts';
import { runCarbonSimulation } from '../models/carbonModel';
import { SimulationParameters } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const CarbonSimulator: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Chart theme token colors
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const textStroke = isDark ? '#94a3b8' : '#475569';
  const tooltipBg = isDark ? '#020617' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

  // Preset scenarios
  const presets: { id: string; name: string; desc: string; params: SimulationParameters }[] = [
    {
      id: 'baseline_degraded',
      name: '1. Escenario Base (Degradado por Drenaje)',
      desc: 'Condición con zanjas artificiales abiertas, WTD = -45 cm, sobrepastoreo ovino sin control.',
      params: {
        scenarioName: 'Base Degradado',
        targetWTD: -45,
        soilTempAnomaly: 0,
        precipChangePercent: 0,
        grazingReductionPercent: 0,
        ditchBlockingRatio: 0,
        revegetationAreaHa: 0,
        gwpTimeframe: 'GWP-100',
        carbonPriceUSD: 18.5,
        simulationYears: 30
      }
    },
    {
      id: 'full_restoration',
      name: '2. Restauración Hidrológica Integral (Recomendado)',
      desc: 'Bloqueo del 90% de zanjas con diques de piedra/turba, exclusión de pastoreo y rehumidificación (WTD = -8 cm).',
      params: {
        scenarioName: 'Restauración Integral',
        targetWTD: -8,
        soilTempAnomaly: 0,
        precipChangePercent: 0,
        grazingReductionPercent: 90,
        ditchBlockingRatio: 90,
        revegetationAreaHa: 65,
        gwpTimeframe: 'GWP-100',
        carbonPriceUSD: 18.5,
        simulationYears: 30
      }
    },
    {
      id: 'revegetation_only',
      name: '3. Revegetación Sin Bloqueo de Drenajes',
      desc: 'Siembra de almohadillas sin elevar el nivel freático (baja supervivencia de plántulas).',
      params: {
        scenarioName: 'Solo Revegetación',
        targetWTD: -35,
        soilTempAnomaly: 0,
        precipChangePercent: 0,
        grazingReductionPercent: 30,
        ditchBlockingRatio: 0,
        revegetationAreaHa: 40,
        gwpTimeframe: 'GWP-100',
        carbonPriceUSD: 18.5,
        simulationYears: 30
      }
    },
    {
      id: 'climate_ssp585',
      name: '4. Cambio Climático Extremo (SSP5-8.5)',
      desc: 'Aumento de +2.8 °C en temperatura y -15% en precipitación según proyecciones IPCC AR6 para los Andes.',
      params: {
        scenarioName: 'Calentamiento Extremo',
        targetWTD: -25,
        soilTempAnomaly: 2.8,
        precipChangePercent: -15,
        grazingReductionPercent: 50,
        ditchBlockingRatio: 50,
        revegetationAreaHa: 20,
        gwpTimeframe: 'GWP-100',
        carbonPriceUSD: 18.5,
        simulationYears: 30
      }
    }
  ];

  const [activePreset, setActivePreset] = useState<string>('full_restoration');
  const [params, setParams] = useState<SimulationParameters>(presets[1].params);

  // Computed simulation result
  const result = useMemo(() => {
    return runCarbonSimulation(params, 142.5);
  }, [params]);

  // Baseline scenario for comparison
  const baselineResult = useMemo(() => {
    return runCarbonSimulation(presets[0].params, 142.5);
  }, []);

  // Tipping Point response curve data (WTD from -50cm to 0cm)
  const tippingPointData = useMemo(() => {
    const points = [];
    for (let wtd = -50; wtd <= 0; wtd += 2) {
      const sim = runCarbonSimulation({ ...params, targetWTD: wtd }, 142.5);
      points.push({
        wtd: `${wtd}cm`,
        wtdValue: wtd,
        co2Respiration: sim.annualCO2Respiration,
        ch4EmissionCO2eq: sim.annualCH4_CO2eq,
        netBalance: sim.netCarbonBalanceCO2eq
      });
    }
    return points;
  }, [params]);

  const handlePresetChange = (presetId: string) => {
    const selected = presets.find(p => p.id === presetId);
    if (selected) {
      setActivePreset(presetId);
      setParams(selected.params);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-white overflow-y-auto p-4 lg:p-6 space-y-6 tech-grid-bg transition-colors duration-300">
      {/* Top Header & Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('simulator.ipccTag')}
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t('simulator.title')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('simulator.subtitle')}
          </p>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {presets.map((pr) => (
            <button
              key={pr.id}
              onClick={() => handlePresetChange(pr.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                activePreset === pr.id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400/50 text-white font-semibold shadow-md dark:shadow-emerald-950/60 ring-1 ring-emerald-400/30'
                  : 'bg-slate-200 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700/90 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {pr.id === 'baseline_degraded' ? t('simulator.presets.baseline') :
               pr.id === 'full_restoration' ? t('simulator.presets.fullRestoration') :
               pr.id === 'revegetation_only' ? t('simulator.presets.revegetationOnly') :
               t('simulator.presets.climateSsp')}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net CO2eq Flux */}
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>{t('simulator.kpi.netBalance')}</span>
            <div className={`p-2 rounded-xl ${result.netCarbonBalanceCO2eq < 0 ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'}`}>
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl font-black font-mono tracking-tight ${result.netCarbonBalanceCO2eq < 0 ? 'text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]' : 'text-rose-600 dark:text-rose-400'}`}>
              {result.netCarbonBalanceCO2eq > 0 ? `+${result.netCarbonBalanceCO2eq}` : result.netCarbonBalanceCO2eq}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">t CO₂eq/ha/año</span>
          </div>
          <div className="text-[11px] mt-3 text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/90 pt-2.5">
            <span>{t('simulator.kpi.vsDrainedBase')}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
              -{Math.round((baselineResult.netCarbonBalanceCO2eq - result.netCarbonBalanceCO2eq) * 10) / 10} t CO₂eq/ha
            </span>
          </div>
        </div>

        {/* Total Avoided Emissions (30 yrs) */}
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-cyan-500/30 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>{t('simulator.kpi.totalSequestration')}</span>
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-cyan-600 dark:text-cyan-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.3)]">
              {result.totalMitigationTonsCO2eq.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{t('simulator.kpi.co2EquivalentVal')}</span>
          </div>
          <div className="text-[11px] mt-3 text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/90 pt-2.5">
            <span>Área Intervenida:</span>
            <span className="text-cyan-600 dark:text-cyan-300 font-mono font-medium">142.5 ha bofedal</span>
          </div>
        </div>

        {/* MERESE / Carbon Market Value */}
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-amber-500/30 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>{t('simulator.kpi.carbonValuation')}</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">
              ${result.mereseEconomicBenefitUSD.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">USD ({params.carbonPriceUSD} $/t)</span>
          </div>
          <div className="text-[11px] mt-3 text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/90 pt-2.5">
            <span>{t('simulator.kpi.carbonPriceUsd')}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">Fondo Comunal</span>
          </div>
        </div>

        {/* Hydrological Water Regulation Yield */}
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-blue-500/30 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Regulación Hídrica Estiaje</span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-300 drop-shadow-[0_0_12px_rgba(96,165,250,0.3)]">
              {result.waterYieldRegulatedM3.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">m³ agua/año</span>
          </div>
          <div className="text-[11px] mt-3 text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/90 pt-2.5">
            <span>NDVI Proyectado:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{result.vegetationIndexProjected}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Parameter Workshop & Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Parameter Sliders Workshop (5 Cols) */}
        <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">{t('simulator.parameters.title')}</h2>
            </div>
            <button
              onClick={() => handlePresetChange('full_restoration')}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {t('common.reset')}
            </button>
          </div>

          {/* Slider 1: Target WTD */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{t('simulator.parameters.targetWtd')}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{params.targetWTD} cm</span>
            </div>
            <input
              type="range"
              min="-50"
              max="0"
              step="1"
              value={params.targetWTD}
              onChange={(e) => setParams({ ...params, targetWTD: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>-50 cm (Desecado)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">-15 cm (Óptimo)</span>
              <span>0 cm (Saturado)</span>
            </div>
          </div>

          {/* Slider 2: Ditch Blocking Ratio */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{t('simulator.parameters.ditchBlockingRatio')}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{params.ditchBlockingRatio}% ({Math.round(params.ditchBlockingRatio * 0.46)} diques)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={params.ditchBlockingRatio}
              onChange={(e) => setParams({ ...params, ditchBlockingRatio: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Slider 3: Grazing Reduction */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{t('simulator.parameters.grazingReduction')}</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{params.grazingReductionPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={params.grazingReductionPercent}
              onChange={(e) => setParams({ ...params, grazingReductionPercent: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Slider 4: Revegetation Area */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{t('simulator.parameters.revegetationArea')}</span>
              <span className="font-mono text-lime-600 dark:text-lime-400 font-bold">{params.revegetationAreaHa} ha (Distichia/Sphagnum)</span>
            </div>
            <input
              type="range"
              min="0"
              max="142"
              step="2"
              value={params.revegetationAreaHa}
              onChange={(e) => setParams({ ...params, revegetationAreaHa: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-500"
            />
          </div>

          {/* Slider 5: Temperature Anomaly */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{t('simulator.parameters.tempAnomaly')}</span>
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">+{params.soilTempAnomaly} °C</span>
            </div>
            <input
              type="range"
              min="0"
              max="4.0"
              step="0.2"
              value={params.soilTempAnomaly}
              onChange={(e) => setParams({ ...params, soilTempAnomaly: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* GWP Timeframe & Carbon Price Settings */}
          <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('simulator.parameters.gwpHorizon')}</label>
              <select
                value={params.gwpTimeframe}
                onChange={(e) => setParams({ ...params, gwpTimeframe: e.target.value as any })}
                className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="GWP-100">GWP-100 (29.8x)</option>
                <option value="GWP-20">GWP-20 (84.0x)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('simulator.kpi.carbonPriceUsd')}</label>
              <input
                type="number"
                value={params.carbonPriceUSD}
                onChange={(e) => setParams({ ...params, carbonPriceUSD: Math.max(1, parseFloat(e.target.value) || 1) })}
                className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Diagnóstico del Modelo:</span> Con un WTD efectivo de <strong className="text-slate-900 dark:text-white font-mono">{result.wtdMean} cm</strong>, la respiración del suelo se reduce a <strong className="text-slate-900 dark:text-white font-mono">{result.annualCO2Respiration} t CO₂/ha/año</strong> mientras las emisiones de metano son de <strong className="text-slate-900 dark:text-white font-mono">{result.annualCH4Emission} t CH₄/ha/año</strong> ({result.annualCH4_CO2eq} t CO₂eq).
          </div>
        </div>

        {/* Right: Charts Section (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Chart 1: 30-Year Trajectory of Net Balance & Cumulative Mitigation */}
          <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  {t('simulator.charts.decadalTitle')}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Evolución de emisiones netas de CO₂eq y reducción acumulada</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.yearlyProjections}>
                  <defs>
                    <linearGradient id="mitigationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="year" stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} label={{ value: 'Años de Simulación', position: 'insideBottom', offset: -5, fill: textStroke, fontSize: 10 }} />
                  <YAxis yAxisId="left" stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} label={{ value: 't CO₂eq / ha / año', angle: -90, position: 'insideLeft', fill: textStroke, fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{ fontSize: 10, fill: '#06b6d4' }} label={{ value: 'Mitigación Acumulada (t CO₂eq)', angle: 90, position: 'insideRight', fill: '#06b6d4', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '16px', fontSize: '11px', color: isDark ? '#ffffff' : '#0f172a', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="co2Emissions" name="Emisiones CO₂ (Respiración)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="netBalanceCO2eq" name="Balance Neto CO₂eq" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Area yAxisId="right" type="monotone" dataKey="cumulativeMitigation" name="Mitigación Acumulada (Total Cuenca)" stroke="#06b6d4" fill="url(#mitigationGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Tipping Point Trade-off Curve (CO2 drop vs CH4 increase) */}
          <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {t('simulator.charts.tippingPointTitle')}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Disminución drástica de CO₂ vs leve incremento de CH₄ al aumentar la humedad</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tippingPointData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="wtd" stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} label={{ value: 'Nivel Freático (WTD cm)', position: 'insideBottom', offset: -5, fill: textStroke, fontSize: 10 }} />
                  <YAxis stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} label={{ value: 't CO₂eq / ha / año', angle: -90, position: 'insideLeft', fill: textStroke, fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '16px', fontSize: '11px', color: isDark ? '#ffffff' : '#0f172a' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="co2Respiration" name="Oxidación CO₂ (Caída al humedecer)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ch4EmissionCO2eq" name="Metanogénesis CH₄ (Subida en saturación)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="netBalance" name="Balance Neto GEI (Óptimo entre -15cm y -5cm)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

