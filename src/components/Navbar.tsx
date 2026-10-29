import React, { useState } from 'react';
import { 
  Layers, 
  Box, 
  Map as MapIcon, 
  Cpu, 
  BarChart3, 
  Database, 
  FileText, 
  Code2, 
  Users, 
  Mountain, 
  Droplets, 
  Info,
  ShieldCheck,
  ChevronDown,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showQuechuaModal, setShowQuechuaModal] = useState(false);

  const rolesList: { role: UserRole; title: string; desc: string; icon: string }[] = [
    { role: 'scientist', title: t('navbar.roles.scientist'), desc: t('navbar.roles.scientistDesc'), icon: '🔬' },
    { role: 'field_technician', title: t('navbar.roles.field_technician'), desc: t('navbar.roles.field_technicianDesc'), icon: '🌱' },
    { role: 'decision_maker', title: t('navbar.roles.decision_maker'), desc: t('navbar.roles.decision_makerDesc'), icon: '🏛️' },
    { role: 'admin', title: t('navbar.roles.admin'), desc: t('navbar.roles.adminDesc'), icon: '⚙️' },
    { role: 'public_viewer', title: t('navbar.roles.public_viewer'), desc: t('navbar.roles.public_viewerDesc'), icon: '🌐' }
  ];

  const quechuaGlossary = [
    { es: 'Bofedal / Turbera', quechua: 'Oconal / Huallata Pampa', desc: language === 'es' ? 'Humedal de altura con acumulación de turba y colchón vegetal de agua.' : 'High-altitude wetland accumulating deep peat and water-sponge vegetation.' },
    { es: 'Regulación Hídrica', quechua: 'Yaku Kawsay / Yaku Allichay', desc: language === 'es' ? 'Capacidad de la Jalca para almacenar y dosificar agua en época de estiaje.' : 'Capacity of the Jalca to store and release water during dry seasons.' },
    { es: 'Zanja de Bloqueo', quechua: 'Yaku Hark’ana Larq’a', desc: language === 'es' ? 'Dique o tapón de tierra y piedra para retener el agua en canales de drenaje.' : 'Earth and stone plug/dike to retain water inside drainage ditches.' },
    { es: 'Turba profunda', quechua: 'Allpa Yanayaq / Champa', desc: language === 'es' ? 'Suelo orgánico negro formado por milenios de vegetación saturada.' : 'Deep black organic soil formed over millennia of saturated vegetation.' },
    { es: 'Siembra de Agua', quechua: 'Yaku Tarpuy', desc: language === 'es' ? 'Prácticas ancestrales y técnicas de recarga hídrica en cabeceras de cuenca.' : 'Ancestral practices and hydrological recharge techniques in headwater basins.' }
  ];

  return (
    <header className="bg-white/95 dark:bg-[#020617]/95 backdrop-blur-md text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-50 shadow-md dark:shadow-black/40 transition-colors duration-300">
      {/* Top Banner with HUD Telemetry status */}
      <div className="bg-slate-100 dark:bg-slate-950/90 border-b border-slate-200 dark:border-emerald-950/60 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide font-mono text-[11px]">{t('navbar.systemStatus')}</span>
          <span className="text-slate-400 dark:text-slate-600 font-mono">|</span>
          <span className="text-slate-700 dark:text-slate-300 font-sans">{t('navbar.location')}</span>
          <span className="text-slate-400 dark:text-slate-600 hidden md:inline font-mono">•</span>
          <span className="text-cyan-700 dark:text-cyan-400/90 hidden md:inline font-mono text-[11px]">{t('navbar.coreInfo')}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
          <button 
            onClick={() => setShowQuechuaModal(true)}
            className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-all font-medium cursor-pointer px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-500/30 text-[11px]"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{t('navbar.quechuaGlossary')}</span>
          </button>

          {/* Theme Switcher Toggle (☀️ Light / 🌙 Dark) */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
            title={t('common.themeToggleTooltip')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-750 transition-all cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                <span className="text-[11px] font-medium">☀️ Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-medium">🌙 Dark</span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-300 dark:border-slate-800 text-[11px]">
            <button
              onClick={() => setLanguage('es')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                language === 'es'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>🇪🇸</span>
              <span>ES</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>🇺🇸</span>
              <span>EN</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse"></span>
            <span>SENAMHI DZ3 • INAIGEM • ANA</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/30">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>{t('navbar.title')}</span>
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                {t('navbar.version')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">{t('navbar.subtitle')}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-200/80 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-300 dark:border-slate-800/90 shadow-inner transition-colors duration-300">
          <button
            onClick={() => setActiveTab('crisp_dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'crisp_dashboard' 
                ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 text-white shadow-md shadow-amber-950/30 border border-amber-400/40' 
                : 'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <span>📊 CRISP-DM</span>
          </button>
          <button
            onClick={() => setActiveTab('3d_twin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === '3d_twin' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('navbar.tabs.twin3d')}</span>
          </button>
          <button
            onClick={() => setActiveTab('map_2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'map_2d' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{t('navbar.tabs.map2d')}</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'simulator' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t('navbar.tabs.simulator')}</span>
          </button>
          <button
            onClick={() => setActiveTab('baci_restoration')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'baci_restoration' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{t('navbar.tabs.baci')}</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('navbar.tabs.analytics')}</span>
          </button>
          <button
            onClick={() => setActiveTab('scientific_charts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'scientific_charts' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>🔬 Gráficos Científicos</span>
          </button>
          <button
            onClick={() => setActiveTab('etl_catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'etl_catalog' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t('navbar.tabs.etl')}</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'reports' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span>{t('navbar.tabs.reports')}</span>
          </button>
          <button
            onClick={() => setActiveTab('model_info')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'model_info' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            <span>Info Modelo ML</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'architecture' 
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-cyan-950/30 border border-cyan-400/30 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-900/80'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{t('navbar.tabs.architecture')}</span>
          </button>
        </nav>

        {/* User Role Selector & Profile */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-850 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/40 transition-all text-left cursor-pointer shadow-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center justify-center text-xs border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              {currentUser.role === 'scientist' ? 'CI' : currentUser.role === 'field_technician' ? 'TC' : currentUser.role === 'decision_maker' ? 'TD' : currentUser.role === 'admin' ? 'AD' : 'PUB'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1] || ''}</span>
                <span className="text-[9px] font-mono px-1 rounded bg-slate-200 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 capitalize">{currentUser.role.replace('_', ' ')}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{currentUser.organization}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Role Dropdown */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 p-2 z-50 transition-colors duration-300">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/80 mb-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('navbar.rbacTitle')}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('navbar.rbacDesc')}</div>
              </div>
              <div className="space-y-1">
                {rolesList.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => {
                      setCurrentUser({
                        ...currentUser,
                        role: item.role,
                        name: item.role === 'scientist' ? 'Dr. Alejandro Vásquez' : item.role === 'field_technician' ? 'Ing. Santos Huamán' : item.role === 'decision_maker' ? 'Econ. Carmen Morales (MINAM)' : item.role === 'admin' ? 'Admin Sysop PostGIS' : 'Observador Comunal'
                      });
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      currentUser.role === item.role ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-white">{item.title}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto px-2 py-1.5 gap-1 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 scrollbar-none text-xs">
        {[
          { id: '3d_twin', label: t('navbar.tabs.twin3d'), icon: Box },
          { id: 'map_2d', label: t('navbar.tabs.map2d'), icon: MapIcon },
          { id: 'simulator', label: t('navbar.tabs.simulator'), icon: Cpu },
          { id: 'baci_restoration', label: t('navbar.tabs.baci'), icon: Droplets },
          { id: 'analytics', label: t('navbar.tabs.analytics'), icon: BarChart3 },
          { id: 'etl_catalog', label: t('navbar.tabs.etl'), icon: Database },
          { id: 'reports', label: t('navbar.tabs.reports'), icon: FileText },
          { id: 'architecture', label: t('navbar.tabs.architecture'), icon: Code2 }
        ].map((tItem) => {
          const Icon = tItem.icon;
          return (
            <button
              key={tItem.id}
              onClick={() => setActiveTab(tItem.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md whitespace-nowrap text-xs ${
                activeTab === tItem.id ? 'bg-emerald-600 text-white font-medium' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tItem.label}
            </button>
          );
        })}
      </div>

      {/* Quechua Glossary Modal */}
      {showQuechuaModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/30 rounded-2xl max-w-lg w-full p-5 shadow-2xl transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Mountain className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('navbar.quechuaModal.title')}</h3>
              </div>
              <button 
                onClick={() => setShowQuechuaModal(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
            <div className="space-y-3">
              {quechuaGlossary.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white">{item.es}</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400 italic bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                      {item.quechua}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
              {t('navbar.quechuaModal.coDesigned')}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

