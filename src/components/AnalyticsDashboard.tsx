import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart3, 
  Droplet, 
  Flame, 
  CloudRain, 
  Thermometer, 
  Layers, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Activity, 
  Award,
  Download,
  Info,
  Clock
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
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { PIEZOMETERS, BOFEDALES, SENAMHI_STATIONS } from '../data/mockDatasets';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ChartExportToolbar } from './common/ChartExportToolbar';
import { DataTable, Column } from './common/DataTable';
import { InterpretabilitySection } from './common/InterpretabilitySection';

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const hydrographRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const climateRef = useRef<HTMLDivElement>(null);

  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const textStroke = isDark ? '#94a3b8' : '#475569';
  const tooltipBg = isDark ? '#020617' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

  const [timeRange, setTimeRange] = useState<'1y' | '5y' | '30y'>('1y');
  const [selectedPzId, setSelectedPzId] = useState<string>('pz-01');

  const selectedPiezometer = PIEZOMETERS.find(p => p.id === selectedPzId) || PIEZOMETERS[0];

  // Dynamic Piezometer Data according to selected timeRange
  const piezometerChartData = useMemo(() => {
    const isDegraded = selectedPiezometer.id === 'pz-02';
    const isHeadwater = selectedPiezometer.id === 'pz-04';
    const baseOffset = isDegraded ? -35 : isHeadwater ? 4 : 0;

    if (timeRange === '1y') {
      // 12 Monthly Records (Año 2024)
      return [
        { date: 'Ene 2024', waterTableDepth: baseOffset - 12.0, soilTemp: 7.2, co2Flux: isDegraded ? 3.45 : 1.15, ch4Flux: isDegraded ? 1.2 : 14.8 },
        { date: 'Feb 2024', waterTableDepth: baseOffset - 6.5, soilTemp: 7.5, co2Flux: isDegraded ? 3.10 : 0.85, ch4Flux: isDegraded ? 2.1 : 22.4 },
        { date: 'Mar 2024', waterTableDepth: baseOffset - 4.0, soilTemp: 7.8, co2Flux: isDegraded ? 2.65 : 0.62, ch4Flux: isDegraded ? 3.8 : 28.1 },
        { date: 'Abr 2024', waterTableDepth: baseOffset - 5.2, soilTemp: 7.4, co2Flux: isDegraded ? 2.95 : 0.74, ch4Flux: isDegraded ? 2.5 : 25.0 },
        { date: 'May 2024', waterTableDepth: baseOffset - 9.8, soilTemp: 6.9, co2Flux: isDegraded ? 3.65 : 1.02, ch4Flux: isDegraded ? 1.0 : 18.2 },
        { date: 'Jun 2024', waterTableDepth: baseOffset - 15.4, soilTemp: 6.2, co2Flux: isDegraded ? 4.20 : 1.45, ch4Flux: isDegraded ? 0.4 : 11.5 },
        { date: 'Jul 2024', waterTableDepth: baseOffset - 18.2, soilTemp: 5.8, co2Flux: isDegraded ? 4.60 : 1.68, ch4Flux: isDegraded ? 0.2 : 8.4 },
        { date: 'Ago 2024', waterTableDepth: baseOffset - 14.1, soilTemp: 6.5, co2Flux: isDegraded ? 3.90 : 1.32, ch4Flux: isDegraded ? 0.7 : 12.0 },
        { date: 'Sep 2024', waterTableDepth: baseOffset - 10.5, soilTemp: 6.9, co2Flux: isDegraded ? 3.50 : 1.10, ch4Flux: isDegraded ? 1.4 : 16.5 },
        { date: 'Oct 2024', waterTableDepth: baseOffset - 7.8, soilTemp: 7.3, co2Flux: isDegraded ? 3.20 : 0.90, ch4Flux: isDegraded ? 2.0 : 20.8 },
        { date: 'Nov 2024', waterTableDepth: baseOffset - 5.5, soilTemp: 7.6, co2Flux: isDegraded ? 2.80 : 0.75, ch4Flux: isDegraded ? 2.8 : 24.5 },
        { date: 'Dic 2024', waterTableDepth: baseOffset - 7.0, soilTemp: 7.4, co2Flux: isDegraded ? 3.05 : 0.88, ch4Flux: isDegraded ? 2.2 : 23.0 },
      ];
    } else if (timeRange === '5y') {
      // 5-Year Interannual Evolution (2020 - 2024: Pre vs Post Intervención)
      return [
        { date: '2020 (Línea Base)', waterTableDepth: isDegraded ? -48.5 : -42.0, soilTemp: 8.4, co2Flux: isDegraded ? 4.8 : 4.1, ch4Flux: 0.5 },
        { date: '2021 (Pre-Obra)', waterTableDepth: isDegraded ? -46.0 : -39.5, soilTemp: 8.1, co2Flux: isDegraded ? 4.5 : 3.8, ch4Flux: 0.9 },
        { date: '2022 (Inst. Diques)', waterTableDepth: isDegraded ? -44.0 : -22.5, soilTemp: 7.6, co2Flux: isDegraded ? 4.1 : 2.1, ch4Flux: 6.8 },
        { date: '2023 (Rehumidif.)', waterTableDepth: isDegraded ? -43.0 : -12.0, soilTemp: 7.2, co2Flux: isDegraded ? 3.9 : 1.2, ch4Flux: 15.4 },
        { date: '2024 (Restaurado)', waterTableDepth: isDegraded ? -42.0 : -8.5, soilTemp: 6.9, co2Flux: isDegraded ? 3.7 : 0.85, ch4Flux: 21.2 },
      ];
    } else {
      // 60-Year Historical Multi-Decadal Reconstruction (1964 - 2024)
      return [
        { date: '1964-1974', waterTableDepth: isDegraded ? -10.0 : -6.0, soilTemp: 6.4, co2Flux: 0.6, ch4Flux: 28.0 },
        { date: '1975-1984', waterTableDepth: isDegraded ? -14.0 : -8.5, soilTemp: 6.5, co2Flux: 0.8, ch4Flux: 25.0 },
        { date: '1985-1994 (Zanjas)', waterTableDepth: isDegraded ? -28.0 : -22.0, soilTemp: 6.7, co2Flux: 2.1, ch4Flux: 12.0 },
        { date: '1995-2004 (Drenaje)', waterTableDepth: isDegraded ? -42.0 : -36.0, soilTemp: 6.9, co2Flux: 3.5, ch4Flux: 4.5 },
        { date: '2005-2014 (Sobrepastoreo)', waterTableDepth: isDegraded ? -49.0 : -41.0, soilTemp: 7.2, co2Flux: 4.3, ch4Flux: 1.8 },
        { date: '2015-2024 (MERESE)', waterTableDepth: isDegraded ? -42.0 : -8.5, soilTemp: 7.5, co2Flux: isDegraded ? 3.7 : 0.85, ch4Flux: 21.2 }
      ];
    }
  }, [timeRange, selectedPiezometer]);

  // Dynamic Climate Series based on timeRange
  const climateSeries = useMemo(() => {
    if (timeRange === '1y') {
      // Monthly 2024 (SENAMHI Cajamarca Aeropuerto + Estación Encañada)
      return [
        { period: 'Ene', precip: 112, tavg: 14.1, tmax: 21.8, tmin: 6.4 },
        { period: 'Feb', precip: 135, tavg: 13.9, tmax: 21.5, tmin: 6.3 },
        { period: 'Mar', precip: 148, tavg: 14.0, tmax: 21.4, tmin: 6.6 },
        { period: 'Abr', precip: 92, tavg: 14.2, tmax: 21.9, tmin: 6.5 },
        { period: 'May', precip: 45, tavg: 14.5, tmax: 22.4, tmin: 6.6 },
        { period: 'Jun', precip: 18, tavg: 14.8, tmax: 23.1, tmin: 6.5 },
        { period: 'Jul', precip: 12, tavg: 15.0, tmax: 23.5, tmin: 6.5 },
        { period: 'Ago', precip: 22, tavg: 15.2, tmax: 23.8, tmin: 6.6 },
        { period: 'Sep', precip: 48, tavg: 15.1, tmax: 23.2, tmin: 7.0 },
        { period: 'Oct', precip: 85, tavg: 14.8, tmax: 22.7, tmin: 6.9 },
        { period: 'Nov', precip: 98, tavg: 14.6, tmax: 22.3, tmin: 6.9 },
        { period: 'Dic', precip: 105, tavg: 14.3, tmax: 22.0, tmin: 6.6 }
      ];
    } else if (timeRange === '5y') {
      // Annual 2020 - 2024
      return [
        { period: '2020', precip: 785, tavg: 14.6, tmax: 22.4, tmin: 6.8 },
        { period: '2021 (La Niña)', precip: 890, tavg: 14.2, tmax: 21.9, tmin: 6.5 },
        { period: '2022 (La Niña)', precip: 840, tavg: 14.3, tmax: 22.1, tmin: 6.5 },
        { period: '2023 (El Niño)', precip: 690, tavg: 15.4, tmax: 23.6, tmin: 7.2 },
        { period: '2024 (Actual)', precip: 920, tavg: 14.9, tmax: 22.8, tmin: 7.0 }
      ];
    } else {
      // 60-Year Climate Trend Data (SENAMHI Cajamarca 1964 - 2024 decadal aggregations)
      return [
        { period: '1964-1974', precip: 760, tavg: 13.8, tmax: 21.2, tmin: 6.4 },
        { period: '1975-1984', precip: 745, tavg: 13.9, tmax: 21.4, tmin: 6.5 },
        { period: '1985-1994', precip: 710, tavg: 14.1, tmax: 21.8, tmin: 6.7 },
        { period: '1995-2004', precip: 695, tavg: 14.3, tmax: 22.1, tmin: 6.9 },
        { period: '2005-2014', precip: 680, tavg: 14.6, tmax: 22.5, tmin: 7.2 },
        { period: '2015-2024', precip: 665, tavg: 14.9, tmax: 22.9, tmin: 7.5 }
      ];
    }
  }, [timeRange]);

  // Peat Stratigraphy Carbon Stock by Depth Layer
  const peatStratumData = [
    { stratum: '0.0 - 1.0 m (Acrotelmo / Raíces)', bulkDensity: 0.08, organicMatter: 88, carbonTonsHa: 440, state: 'Vivo' },
    { stratum: '1.0 - 3.0 m (Mesotelmo / Turba Fibrosa)', bulkDensity: 0.11, organicMatter: 84, carbonTonsHa: 924, state: 'Saturado' },
    { stratum: '3.0 - 5.0 m (Catotelmo / Turba Sáprica)', bulkDensity: 0.14, organicMatter: 79, carbonTonsHa: 1106, state: 'Denso' },
    { stratum: '> 5.0 m (Turba Basal C-14 8000 BP)', bulkDensity: 0.18, organicMatter: 72, carbonTonsHa: 1296, state: 'Arcillo-Orgánico' }
  ];

  // Dynamic Ecohydrological Health Radar Data
  const ecoHealthData = useMemo(() => {
    if (timeRange === '1y') {
      return [
        { subject: 'Nivel Freático', Chirimayo: 88, PromedioJalca: 52, fullMark: 100 },
        { subject: 'Retención de Agua', Chirimayo: 92, PromedioJalca: 60, fullMark: 100 },
        { subject: 'Cobertura Distichia', Chirimayo: 84, PromedioJalca: 45, fullMark: 100 },
        { subject: 'Stock de Carbono', Chirimayo: 95, PromedioJalca: 58, fullMark: 100 },
        { subject: 'Ausencia de Zanjas', Chirimayo: 78, PromedioJalca: 38, fullMark: 100 },
        { subject: 'Control Pastoreo', Chirimayo: 82, PromedioJalca: 40, fullMark: 100 }
      ];
    } else if (timeRange === '5y') {
      return [
        { subject: 'Nivel Freático', Chirimayo: 88, PromedioJalca: 38, fullMark: 100 },
        { subject: 'Retención de Agua', Chirimayo: 90, PromedioJalca: 48, fullMark: 100 },
        { subject: 'Cobertura Distichia', Chirimayo: 82, PromedioJalca: 40, fullMark: 100 },
        { subject: 'Stock de Carbono', Chirimayo: 94, PromedioJalca: 54, fullMark: 100 },
        { subject: 'Ausencia de Zanjas', Chirimayo: 84, PromedioJalca: 30, fullMark: 100 },
        { subject: 'Control Pastoreo', Chirimayo: 80, PromedioJalca: 35, fullMark: 100 }
      ];
    } else {
      return [
        { subject: 'Nivel Freático', Chirimayo: 74, PromedioJalca: 50, fullMark: 100 },
        { subject: 'Retención de Agua', Chirimayo: 78, PromedioJalca: 55, fullMark: 100 },
        { subject: 'Cobertura Distichia', Chirimayo: 72, PromedioJalca: 48, fullMark: 100 },
        { subject: 'Stock de Carbono', Chirimayo: 92, PromedioJalca: 62, fullMark: 100 },
        { subject: 'Ausencia de Zanjas', Chirimayo: 65, PromedioJalca: 42, fullMark: 100 },
        { subject: 'Control Pastoreo', Chirimayo: 70, PromedioJalca: 45, fullMark: 100 }
      ];
    }
  }, [timeRange]);

  // Dynamic KPIs according to timeRange
  const kpis = useMemo(() => {
    if (timeRange === '1y') {
      return {
        card1Title: 'Área de Bofedales Monitoreada',
        card1Value: '385.0 ha',
        card1Sub: '(4 bofedales)',
        card1DetailLabel: 'En Restauración:',
        card1DetailVal: '185.2 ha (48.1%)',
        card1Color: 'emerald',

        card2Title: 'Almacén de Carbono Orgánico (SOC)',
        card2Value: '1.81 M t C',
        card2Sub: 'en turba',
        card2DetailLabel: 'Balance Neto 2024:',
        card2DetailVal: '-485 t CO₂eq/año',
        card2Color: 'amber',

        card3Title: 'Índice de Salud Hídrica (ISH)',
        card3Value: '86.4/100',
        card3Sub: 'Excelente',
        card3DetailLabel: 'Nivel Freático Medio:',
        card3DetailVal: '-8.5 cm (saturado)',
        card3Color: 'cyan',

        card4Title: 'Caudal Ecológico Regulado',
        card4Value: '1.19 M m³',
        card4Sub: '/año',
        card4DetailLabel: 'Población Beneficiaria:',
        card4DetailVal: '14,200 hab.',
        card4Color: 'blue',
      };
    } else if (timeRange === '5y') {
      return {
        card1Title: 'Ascenso Freático (2020-2024)',
        card1Value: '+33.5 cm',
        card1Sub: 'recuperación',
        card1DetailLabel: 'Nivel: -42.0 cm →',
        card1DetailVal: '-8.5 cm actual',
        card1Color: 'emerald',

        card2Title: 'Mitigación de GEI (5 Años)',
        card2Value: '2,840 t',
        card2Sub: 'CO₂eq evitado',
        card2DetailLabel: 'Valor MERESE:',
        card2DetailVal: '$52,540 USD',
        card2Color: 'amber',

        card3Title: 'Evolución de Salud Ecosistémica',
        card3Value: '+45.2 pts',
        card3Sub: 'de mejora',
        card3DetailLabel: 'ISH Inicial vs Actual:',
        card3DetailVal: '41.2 → 86.4 / 100',
        card3Color: 'cyan',

        card4Title: 'Diques de Restauración Instalados',
        card4Value: '84 diques',
        card4Sub: 'activos',
        card4DetailLabel: 'Zanjas Bloqueadas:',
        card4DetailVal: '12.4 km obturados',
        card4Color: 'blue',
      };
    } else {
      return {
        card1Title: 'Stock Total de Carbono Orgánico',
        card1Value: '1.81 M t C',
        card1Sub: 'en 385 ha',
        card1DetailLabel: 'Equivalente CO₂:',
        card1DetailVal: '6.64 M t CO₂eq',
        card1Color: 'emerald',

        card2Title: 'Tendencia Térmica SENAMHI (60a)',
        card2Value: '+1.1 °C',
        card2Sub: '1964-2024',
        card2DetailLabel: 'T. Media Cajamarca:',
        card2DetailVal: '13.8°C → 14.9°C',
        card2Color: 'amber',

        card3Title: 'Reducción Lluvia de Estiaje',
        card3Value: '-12.5%',
        card3Sub: 'en 60 años',
        card3DetailLabel: 'Precipitación Anual:',
        card3DetailVal: '760 mm → 665 mm',
        card3Color: 'cyan',
        card4Title: 'Proyección Mitigación (30 Años)',
        card4Value: '82,400 t',
        card4Sub: 'CO₂eq mitigable',
        card4DetailLabel: 'Incentivo Retribución:',
        card4DetailVal: '$1,524,400 USD',
        card4Color: 'blue',
      };
    }
  }, [timeRange]);

  const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444'];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-white overflow-y-auto p-4 lg:p-6 space-y-6 tech-grid-bg transition-colors duration-300">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('analytics.tag')}
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t('analytics.title')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('analytics.subtitle')}
          </p>
        </div>

        {/* Time Horizon Selector Buttons */}
        <div className="flex items-center bg-slate-200 dark:bg-slate-950/80 p-1 rounded-2xl border border-slate-300 dark:border-slate-800">
          <button
            onClick={() => setTimeRange('1y')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              timeRange === '1y'
                ? 'bg-emerald-600 text-white font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('analytics.horizon1y')}</span>
          </button>
          <button
            onClick={() => setTimeRange('5y')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              timeRange === '5y'
                ? 'bg-emerald-600 text-white font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('analytics.horizon5y')}</span>
          </button>
          <button
            onClick={() => setTimeRange('30y')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              timeRange === '30y'
                ? 'bg-emerald-600 text-white font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t('analytics.horizon30y')}</span>
          </button>
        </div>
      </div>


      {/* Dynamic Temporal Context Indicator */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-xs backdrop-blur-sm transition-colors duration-300">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {timeRange === '1y' && (
              <>
                <strong className="text-emerald-700 dark:text-emerald-300">Escala Activa: Año Hidrológico 2024</strong> — Monitoreo mensual de alta resolución (Ene - Dic 2024) con régimen de lluvias y estiaje.
              </>
            )}
            {timeRange === '5y' && (
              <>
                <strong className="text-emerald-700 dark:text-emerald-300">Escala Activa: Quinquenio 2020 – 2024</strong> — Análisis interanual pre-obra vs post-bloqueo de zanjas artificiales (MERESE-FIDA).
              </>
            )}
            {timeRange === '30y' && (
              <>
                <strong className="text-emerald-700 dark:text-emerald-300">Escala Activa: Reconstrucción Histórica 1964 – 2024 (60 Años)</strong> — Series decenales SENAMHI y balance de largo plazo de turberas.
              </>
            )}
          </span>
        </div>
        <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold">
          {timeRange === '1y' ? '12 Meses QA' : timeRange === '5y' ? '5 Periodos Anuales' : '6 Décadas SENAMHI'}
        </span>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">{kpis.card1Title}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">{kpis.card1Value}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{kpis.card1Sub}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-200 dark:border-slate-800/90 pt-2.5 flex justify-between">
            <span>{kpis.card1DetailLabel}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{kpis.card1DetailVal}</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-amber-500/30 transition-all">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">{kpis.card2Title}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono text-amber-600 dark:text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">{kpis.card2Value}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{kpis.card2Sub}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-200 dark:border-slate-800/90 pt-2.5 flex justify-between">
            <span>{kpis.card2DetailLabel}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">{kpis.card2DetailVal}</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-cyan-500/30 transition-all">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">{kpis.card3Title}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono text-cyan-600 dark:text-cyan-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.3)]">{kpis.card3Value}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{kpis.card3Sub}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-200 dark:border-slate-800/90 pt-2.5 flex justify-between">
            <span>{kpis.card3DetailLabel}</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">{kpis.card3DetailVal}</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 shadow-md dark:shadow-2xl hover:border-blue-500/30 transition-all">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">{kpis.card4Title}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black font-mono text-blue-600 dark:text-blue-300 drop-shadow-[0_0_12px_rgba(96,165,250,0.3)]">{kpis.card4Value}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{kpis.card4Sub}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-200 dark:border-slate-800/90 pt-2.5 flex justify-between">
            <span>{kpis.card4DetailLabel}</span>
            <span className="text-slate-900 dark:text-white font-mono font-bold">{kpis.card4DetailVal}</span>
          </div>
        </div>
      </div>

      {/* Grid: Hydrograph Piezometer Series & Gas Flux Chamber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Piezometer Time-Series (7 Cols) */}
        <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Hidrograma de Nivel Freático & Flujos de Gases
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-mono font-semibold">
                  {timeRange === '1y' ? '12 Meses' : timeRange === '5y' ? '2020-2024' : '1964-2024'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{selectedPiezometer.name}</p>
            </div>

            {/* Piezometer Selector Dropdown & Export Toolbar */}
            <div className="flex items-center gap-2">
              <select
                value={selectedPzId}
                onChange={(e) => setSelectedPzId(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
              >
                {PIEZOMETERS.map((pz) => (
                  <option key={pz.id} value={pz.id}>{pz.code} ({pz.name.slice(0, 24)}...)</option>
                ))}
              </select>

              <ChartExportToolbar
                chartRef={hydrographRef}
                data={piezometerChartData}
                filename={`hidrograma_${selectedPiezometer.code.toLowerCase()}_${timeRange}`}
                title={`Hidrograma ${selectedPiezometer.name} (${timeRange})`}
                subtitle={`Serie temporal del nivel freático, flujos de respiración de CO₂ y temperatura del suelo en el sensor ${selectedPiezometer.code}`}
              />
            </div>
          </div>

          <div className="h-64 w-full" ref={hydrographRef}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={piezometerChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} />
                <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 10, fill: textStroke }} label={{ value: 'Nivel Freático (cm)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 10, fill: textStroke }} label={{ value: 'CO₂ Flux (g C/m²/d)', angle: 90, position: 'insideRight', fill: '#f43f5e', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '16px', fontSize: '11px', color: isDark ? '#ffffff' : '#0f172a' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="waterTableDepth" name="Nivel Freático (cm)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line yAxisId="right" type="monotone" dataKey="co2Flux" name="Flujo CO₂ Suelo" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} />
                <Line yAxisId="left" type="monotone" dataKey="soilTemp" name="Temp. Suelo (°C)" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Piezometer Attributes */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Prof. Turba:</span>
              <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{selectedPiezometer.peatDepth} m</div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Materia Orgánica:</span>
              <div className="font-bold font-mono text-amber-600 dark:text-amber-400">{selectedPiezometer.organicMatter}%</div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Densidad Aparente:</span>
              <div className="font-bold font-mono text-cyan-600 dark:text-cyan-400">{selectedPiezometer.bulkDensity} g/cm³</div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">pH Suelo:</span>
              <div className="font-bold font-mono text-slate-900 dark:text-white">{selectedPiezometer.ph}</div>
            </div>
          </div>

          {/* SECCIÓN OBLIGATORIA: INTERPRETABILIDAD Y OPERABILIDAD DEBAJO DEL HIDROGRAMA */}
          <InterpretabilitySection
            type="chart"
            whatItShows={`Serie temporal ecohidrológica del piezómetro ${selectedPiezometer.code} (${selectedPiezometer.name}), vinculando la dinámica del nivel freático WTD (cm), el flujo de respiración de CO₂ (g C/m²/d) y la temperatura del suelo a 20 cm.`}
            howToInterpret="Eje izquierdo celeste: Nivel freático WTD (cm). Eje derecho rojo: Flujo de respiración de CO₂ del suelo. Línea discontinua ámbar: Temperatura del suelo. Permite diagnosticar la respuesta del suelo ante el secado o inundación."
            keyFindings={[
              `En ${selectedPiezometer.code}, el WTD medio se sitúa en ${selectedPiezometer.currentWaterTableDepth} cm con una columna de turba de ${selectedPiezometer.peatDepth} m y ${selectedPiezometer.organicMatter}% de materia orgánica.`,
              "El ascenso freático hacia -10 cm atenúa la respiración heterótrofa de CO₂ en más de un 60% por restablecimiento de la anoxia.",
              "Las fluctuaciones térmicas estacionales modulan la respiración basal con un coeficiente Q10 de 2.1."
            ]}
            limitations="Lecturas telemétricas calibradas mensualmente con sonda freatimétrica manual."
            datasetInfo={`Piezómetro ${selectedPiezometer.code} | Red PNDA Chirimayo`}
          />
        </div>

        {/* Ecohydrological Radar (5 Cols) */}
        <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Índice Compuesto de Salud Ecosistémica
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {timeRange === '1y' && 'Chirimayo 2024 vs Promedio Regional Jalca'}
                {timeRange === '5y' && 'Impacto de 5 Años de Restauración MERESE'}
                {timeRange === '30y' && 'Trayectoria Histórica y Resiliencia Climática'}
              </p>
            </div>

            <ChartExportToolbar
              chartRef={radarRef}
              data={ecoHealthData}
              filename={`radar_salud_ecohidrologica_${timeRange}`}
              title={`Índice de Salud Ecosistémica (${timeRange})`}
              subtitle="Evaluación multicriterio de salud de la turbera: nivel freático, retención hídrica, stock de C y biodiversidad"
            />
          </div>

          <div className="h-64 w-full" ref={radarRef}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={ecoHealthData}>
                <PolarGrid stroke={gridStroke} />
                <PolarAngleAxis dataKey="subject" stroke={textStroke} tick={{ fontSize: 9, fill: textStroke }} />
                <PolarRadiusAxis stroke={textStroke} angle={30} domain={[0, 100]} />
                <Radar name="Chirimayo (Restaurado)" dataKey="Chirimayo" stroke="#10b981" fill="#10b981" fillOpacity={0.45} />
                <Radar name="Promedio Jalca Cajamarca" dataKey="PromedioJalca" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '16px', fontSize: '11px', color: isDark ? '#ffffff' : '#0f172a' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* SECCIÓN OBLIGATORIA: INTERPRETABILIDAD Y OPERABILIDAD DEBAJO DEL RADAR */}
          <InterpretabilitySection
            type="chart"
            whatItShows="Diagrama radial multicriterio con 5 indicadores normalizados (0 a 100): Régimen Freático, Retención Hídrica, Stock de Carbono, Cobertura Vegetal y Resiliencia Estival, comparando Chirimayo frente al promedio regional de bofedales de la Jalca."
            howToInterpret="Mayor área cubierta por el polígono verde indica mejor estado de conservación y salud ecohidrológica. El polígono gris demarca la línea base regional degradada."
            keyFindings={[
              "Chirimayo Restaurado supera en un 38% la media regional en retención hídrica y estabilidad freática.",
              "El stock de carbono preservado alcanza una calificación de 88/100 gracias a la anoxia inducida por los diques de turba.",
              "La cobertura vegetal nativa (Distichia muscoides) exhibe una recuperación sostenida tras la exclusión ganadera."
            ]}
            limitations="Los índices sintetizan múltiples variables físico-químicas en una escala adimensional para diagnóstico ejecutivo rápido."
            datasetInfo={`Salud Ecohidrológica | Escala: ${timeRange}`}
          />
        </div>
      </div>

      {/* Bottom Grid: Dynamic Climate Series SENAMHI & Stratigraphy Soil Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Climate Series SENAMHI */}
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {timeRange === '1y' && 'Serie Hidrometeorológica Mensual SENAMHI (2024)'}
                {timeRange === '5y' && 'Variabilidad Climática Interanual SENAMHI (2020 – 2024)'}
                {timeRange === '30y' && 'Tendencia Climática Histórica SENAMHI DZ3 (1964 – 2024)'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {timeRange === '1y' ? 'Precipitación mensual (mm) y Temperatura media (°C) en 2024' : 'Precipitación acumulada y temperatura'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 font-mono rounded-lg font-semibold">
                {timeRange === '1y' ? 'Est. Encañada + Aero' : '370 Estaciones QA'}
              </span>

              <ChartExportToolbar
                chartRef={climateRef}
                data={climateSeries}
                filename={`serie_climatica_senamhi_${timeRange}`}
                title={`Serie Hidrometeorológica SENAMHI (${timeRange})`}
                subtitle="Monitoreo climatológico de precipitación y temperatura media de la estación meteorológica Encañada - SENAMHI DZ3"
              />
            </div>
          </div>

          <div className="h-60 w-full" ref={climateRef}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={climateSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="period" stroke={textStroke} tick={{ fontSize: 10, fill: textStroke }} />
                <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 10, fill: textStroke }} label={{ value: timeRange === '1y' ? 'Lluvia (mm/mes)' : 'Precipitación (mm/año)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10, fill: textStroke }} domain={timeRange === '1y' ? [10, 26] : [12, 16]} label={{ value: 'Temp. (°C)', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '16px', fontSize: '11px', color: isDark ? '#ffffff' : '#0f172a' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar yAxisId="left" dataKey="precip" name={timeRange === '1y' ? 'Lluvia Mensual (mm)' : 'Precipitación (mm)'} fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="tavg" name="Temp. Media (°C)" stroke="#f59e0b" strokeWidth={2.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800/40 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/60">
            {timeRange === '1y' && (
              <span>Régimen bimodal típico de la Jalca: concentración de lluvias entre <strong>Enero y Abril</strong> (pico de 148 mm en marzo) y estiaje pronunciado de <strong>Junio a Agosto</strong> (12 mm en julio).</span>
            )}
            {timeRange === '5y' && (
              <span>Ciclo interanual marcado por eventos <strong>La Niña (2021-2022)</strong> con 890 mm y <strong>El Niño Costero (2023)</strong> con déficit hídrico (690 mm) y temperaturas más cálidas (+0.8°C).</span>
            )}
            {timeRange === '30y' && (
              <span>Tendencia de calentamiento de <strong>+1.1 °C</strong> en los últimos 60 años con reducción del 12.5% en la lluvia de estiaje, lo que incrementa la vulnerabilidad de las turberas sin diques.</span>
            )}
          </div>

          {/* SECCIÓN OBLIGATORIA: INTERPRETABILIDAD Y OPERABILIDAD DEBAJO DE LA SERIE CLIMÁTICA */}
          <InterpretabilitySection
            type="chart"
            whatItShows={`Monitoreo meteorológico e hidrológico oficial de la estación SENAMHI Encañada DZ3 y sensores pluviométricos PNDA, reportando precipitación acumulada y temperatura media en escala ${timeRange}.`}
            howToInterpret="Barras azules: Precipitación (mm/mes o mm/año). Línea naranja: Temperatura media (°C). Permite evaluar la estacionalidad hídrica y detectar anomalías asociadas al ENOS."
            keyFindings={[
              "Precipitación media anual de 785 mm con fuerte estiaje entre junio y agosto (< 5% del volumen anual).",
              "Los bofedales constituyen la única fuente de recarga hídrica de base para la cuenca durante los 4 meses de estiaje.",
              "Se evidencia una tendencia de calentamiento regional de +1.1 °C en el registro histórico decadal de 60 años."
            ]}
            limitations="Datos de estación base con corrección orográfica por gradiente altitudinal andino (+0.65 °C / 100 m)."
            datasetInfo={`SENAMHI DZ3 + PNDA | Escala: ${timeRange}`}
          />
        </div>

        {/* Stratigraphy Soil Profile Carbon Distribution con DataTable */}
        <div className="space-y-4">
          <DataTable
            data={peatStratumData}
            columns={[
              { key: 'stratum', header: 'Estrato / Profundidad', className: 'font-semibold text-slate-900 dark:text-white' },
              { key: 'bulkDensity', header: 'Densidad', className: 'font-mono text-cyan-600 dark:text-cyan-400', sortable: true, render: (i: any) => `${i.bulkDensity} g/cm³` },
              { key: 'organicMatter', header: 'M. Orgánica', className: 'font-mono text-amber-600 dark:text-amber-400', sortable: true, render: (i: any) => `${i.organicMatter}%` },
              { key: 'carbonTonsHa', header: 'Stock C', className: 'font-mono font-bold text-emerald-600 dark:text-emerald-400', sortable: true, render: (i: any) => `${i.carbonTonsHa} t C/ha` },
              { key: 'state', header: 'Estado', className: 'text-[10px] font-mono uppercase text-slate-500 font-bold', sortable: true }
            ]}
            title="Estratigrafía y Densidad de Carbono por Profundidad"
            subtitle="Perfil edafológico en barreno ruso (0 a >5 metros) — SoilGrids + Lab UNC"
            filename="perfil_estratigrafico_carbono_chirimayo"
            initialRowsPerPage={5}
            searchPlaceholder="Filtrar por estrato o estado..."
          />

          {/* SECCIÓN OBLIGATORIA: INTERPRETABILIDAD Y OPERABILIDAD DEBAJO DE LA TABLA DE ESTRATIGRAFÍA */}
          <InterpretabilitySection
            type="table"
            whatItShows="Perfil estratigráfico del suelo y distribución vertical de densidad aparente, materia orgánica y stock de carbono edáfico (t C/ha) medido en testigos continuos de barreno ruso desde la superficie hasta >5 m de profundidad."
            howToInterpret="Cada fila representa un estrato u horizonte (acrotelm, mesotelm y catotelm profundo). La columna 'Stock C' cuantifica las toneladas métricas de carbono orgánico almacenadas por hectárea en cada nivel."
            keyFindings={[
              "El catotelm fósil profundo (>1.5 m) alberga más del 65% de la reserva total de carbono de la microcuenca.",
              "La densidad aparente aumenta con la profundidad debido a la compresión litostática natural de los estratos milenarios.",
              "El stock acumulado en la columna vertical completa supera las 980 t C/ha, clasificando a Chirimayo como un sumidero crítico de carbono a nivel andino."
            ]}
            limitations="Los análisis de laboratorio fueron determinados mediante calcinación a 550°C (LOI) y validados con analizador elemental CHN."
            datasetInfo="Testigo Ruso 5m | SoilGrids + Lab UNC"
          />
        </div>
      </div>
    </div>
  );
};
