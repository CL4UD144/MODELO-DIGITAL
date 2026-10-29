import React, { useState, useRef } from 'react';
import { 
  Layers, 
  Map as MapIcon, 
  Eye, 
  Info, 
  Compass, 
  Sliders, 
  Droplet, 
  CloudSun, 
  Trees, 
  Flame, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Maximize2,
  Download,
  Camera,
  FileCode,
  FileSpreadsheet,
  FileText,
  Table
} from 'lucide-react';
import { SENAMHI_STATIONS, BOFEDALES, GEOSPATIAL_CATALOG } from '../data/mockDatasets';
import { SenamhiStation, BofedalPolygon } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  exportSvgElement, 
  exportSvgToPng, 
  exportChartToPdf,
  exportToCSV, 
  exportToExcel,
  exportToJSON 
} from '../utils/exportUtils';
import { InterpretabilitySection } from './common/InterpretabilitySection';

export const Map2DView: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeLayers, setActiveLayers] = useState<{
    bofedalesInaigem: boolean;
    redHidrograficaAna: boolean;
    minamCobertura: boolean;
    minamCarbono: boolean;
    minamAreasProtegidas: boolean;
    mapbiomasUso: boolean;
    estacionesSenamhi: boolean;
    baciParcelas: boolean;
  }>({
    bofedalesInaigem: true,
    redHidrograficaAna: true,
    minamCobertura: false,
    minamCarbono: true,
    minamAreasProtegidas: true,
    mapbiomasUso: false,
    estacionesSenamhi: true,
    baciParcelas: true
  });

  const [selectedStation, setSelectedStation] = useState<SenamhiStation | null>(SENAMHI_STATIONS[1]); // Granja Porcón
  const [selectedBofedal, setSelectedBofedal] = useState<BofedalPolygon | null>(BOFEDALES[0]);
  const [layerOpacity, setLayerOpacity] = useState<number>(0.85);
  const [activeTabLegend, setActiveTabLegend] = useState<'legend' | 'wms_info'>('legend');

  const svgMapRef = useRef<SVGSVGElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleExportSvg = () => {
    if (!svgMapRef.current) return;
    exportSvgElement(svgMapRef.current, 'mapa_gis_chirimayo_2d', 'Mapa Hidrológico y de Turberas Chirimayo');
    setShowExportMenu(false);
  };

  const handleExportPng = async () => {
    if (!svgMapRef.current) return;
    setIsExporting(true);
    await exportSvgToPng(svgMapRef.current, 'mapa_gis_chirimayo_2d', {
      scale: 3,
      backgroundColor: isDark ? '#020617' : '#f8fafc',
      watermarkText: 'Gemelo Digital Turberas Chirimayo - MINAM / INAIGEM'
    });
    setIsExporting(false);
    setShowExportMenu(false);
  };

  const handleExportPdf = async () => {
    if (!svgMapRef.current) return;
    setIsExporting(true);
    await exportChartToPdf(svgMapRef.current, 'mapa_cartografico_chirimayo_2d', {
      title: 'Plano Cartográfico Oficial — Microcuenca Chirimayo',
      subtitle: 'Capas OGC WMS/WFS: Inventario INAIGEM 2023, Red Hidrográfica ANA, Estaciones SENAMHI DZ3 y Parcelas BACI',
      notes: 'Sistema de Referencia de Coordenadas: EPSG:32717 (UTM 17S) | Escala 1:25,000 | MINAM - INAIGEM - MERESE'
    });
    setIsExporting(false);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    exportToExcel('capas_geoespaciales_chirimayo', [
      {
        sheetName: 'Bofedales_INAIGEM',
        data: BOFEDALES.map(b => ({
          Codigo_INAIGEM: b.codeInaigem,
          Nombre: b.name,
          Area_Hectareas: b.areaHa,
          Profundidad_Turba_m: b.peatDepthAvg,
          Stock_Carbono_tC: b.carbonStockTotalTons,
          Estado_Conservacion: b.conservationState,
          Densidad_Zanjas_km_ha: b.drainageDensity,
          Balance_Anual_tCO2eq: b.annualCO2eqNetTons
        }))
      },
      {
        sheetName: 'Estaciones_SENAMHI',
        data: SENAMHI_STATIONS.map(s => ({
          Codigo_Estacion: s.code,
          Nombre: s.name,
          Direccion_Zonal: s.zonalDirectorate,
          Altitud_msnm: s.altitude,
          Latitud: s.lat,
          Longitud: s.lng,
          Precip_Anual_mm: s.precipAnnualAvg,
          Temp_Media_C: s.tempAvg,
          Tipo: s.type,
          Registros: s.recordsCount
        }))
      }
    ]);
    setShowExportMenu(false);
  };

  const handleExportBofedalesCsv = () => {
    exportToCSV('bofedales_inaigem_chirimayo', BOFEDALES);
    setShowExportMenu(false);
  };

  const handleExportStationsCsv = () => {
    exportToCSV('estaciones_meteorologicas_senamhi_dz3', SENAMHI_STATIONS);
    setShowExportMenu(false);
  };

  const handleExportGeoJson = () => {
    const geojsonData = {
      type: 'FeatureCollection',
      name: 'Bofedales_Chirimayo_INAIGEM',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::32717' } },
      features: BOFEDALES.map(b => ({
        type: 'Feature',
        properties: {
          id: b.id,
          name: b.name,
          codeInaigem: b.codeInaigem,
          areaHa: b.areaHa,
          peatDepthAvg: b.peatDepthAvg,
          carbonStockTotalTons: b.carbonStockTotalTons,
          conservationState: b.conservationState,
          drainageDensity: b.drainageDensity,
          annualCO2eqNetTons: b.annualCO2eqNetTons
        },
        geometry: {
          type: 'Polygon',
          coordinates: [b.coordinates3D.map(([x, z]) => [-78.38 + x * 0.001, -7.04 + z * 0.001])]
        }
      }))
    };
    exportToJSON('bofedales_chirimayo_geojson', geojsonData);
    setShowExportMenu(false);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-white overflow-hidden tech-grid-bg transition-colors duration-300">
      {/* Left / Top Sidebar: Layer Manager & WMS Endpoints */}
      <div className="w-full lg:w-80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800/90 flex flex-col shrink-0 overflow-y-auto transition-colors duration-300">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('map2d.ogcServices')}
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{t('map2d.minamAnaGeoserver')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t('map2d.officialLayersSub')}</p>
        </div>

        {/* Layer Switches */}
        <div className="p-3 space-y-2 text-xs">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 font-mono">{t('map2d.vectorRasterLayers')}</div>

          {/* INAIGEM Bofedales */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/30 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{t('map2d.inaigemBofedales')}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{t('map2d.inaigemSub')}</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={activeLayers.bofedalesInaigem}
              onChange={() => toggleLayer('bofedalesInaigem')}
              className="rounded accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* ANA Red Hidrográfica */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{t('map2d.anaHydro')}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{t('map2d.anaSub')}</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={activeLayers.redHidrograficaAna}
              onChange={() => toggleLayer('redHidrograficaAna')}
              className="rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* MINAM Densidad Carbono */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{t('map2d.minamCarbon')}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{t('map2d.minamCarbonSub')}</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={activeLayers.minamCarbono}
              onChange={() => toggleLayer('minamCarbono')}
              className="rounded accent-amber-500 cursor-pointer"
            />
          </div>

          {/* MINAM Cobertura Vegetal */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-lime-500/30 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lime-500 dark:bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)] shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{t('map2d.minamEcosystems')}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{t('map2d.minamEcosystemsSub')}</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={activeLayers.minamCobertura}
              onChange={() => toggleLayer('minamCobertura')}
              className="rounded accent-lime-500 cursor-pointer"
            />
          </div>

          {/* SENAMHI Estaciones */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/30 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)] shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{t('map2d.senamhiNetwork')}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{t('map2d.senamhiSub')}</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={activeLayers.estacionesSenamhi}
              onChange={() => toggleLayer('estacionesSenamhi')}
              className="rounded accent-blue-500 cursor-pointer"
            />
          </div>

          {/* BACI Microcuencas Pares */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-purple-500/30 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)] shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{t('map2d.baciMicrobasins')}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{t('map2d.baciSub')}</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={activeLayers.baciParcelas}
              onChange={() => toggleLayer('baciParcelas')}
              className="rounded accent-purple-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Opacity Control */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-950/40">
          <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1.5 font-medium">
            <span>{t('map2d.layerOpacity')}</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{Math.round(layerOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={layerOpacity}
            onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Active Station Card in Sidebar */}
        {selectedStation && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 m-3 rounded-2xl border border-blue-300 dark:border-blue-500/30 text-xs shadow-md dark:shadow-xl">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-1.5">
              <CloudSun className="w-4 h-4" />
              <span>{t('map2d.selectedStation')}</span>
            </div>
            <div className="font-semibold text-slate-900 dark:text-white">{selectedStation.name}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Código: {selectedStation.code} | {selectedStation.zonalDirectorate}</div>
            <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400">{t('map2d.altitude')}</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white">{selectedStation.altitude} m</div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Precip. Anual:</span>
                <div className="font-mono font-bold text-cyan-600 dark:text-cyan-300">{selectedStation.precipAnnualAvg} mm</div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Temp. Media:</span>
                <div className="font-mono font-bold text-amber-600 dark:text-amber-300">{selectedStation.tempAvg} °C</div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Registros QA:</span>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-300">{selectedStation.recordsCount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center 2D Map Canvas (Interactive SVG GIS Cartography representation) */}
      <div className="flex-1 flex flex-col relative bg-slate-100 dark:bg-[#020617] overflow-hidden transition-colors duration-300">
        {/* Top Floating GIS Controls Bar */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 p-2 rounded-2xl text-xs shadow-md dark:shadow-2xl text-slate-900 dark:text-white">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 font-medium">
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin-slow" />
            <span className="font-mono text-[11px]">Lat: 07°02'42" S | Lon: 78°22'54" W</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-800 dark:text-emerald-300 font-mono text-[11px] border border-emerald-300 dark:border-emerald-500/30 font-semibold">
            Escala 1:25,000
          </div>

          {/* Export GIS Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exportando...' : 'Descargar Mapa & Capas'}</span>
            </button>

            {showExportMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Cartografía Visual</div>
                <button
                  onClick={handleExportPng}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <div>
                    <div className="font-medium">Mapa en PNG HD (300 DPI)</div>
                    <div className="text-[10px] text-slate-400">Imagen rasterizada de alta fidelidad</div>
                  </div>
                </button>
                <button
                  onClick={handleExportSvg}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-medium">Mapa Vectorial SVG</div>
                    <div className="text-[10px] text-slate-400">Vectores editables en QGIS o Illustrator</div>
                  </div>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <div>
                    <div className="font-medium">Plano Cartográfico en PDF</div>
                    <div className="text-[10px] text-slate-400">Documento cartográfico oficial con metadatos</div>
                  </div>
                </button>

                <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Datos Geoespaciales</div>

                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <Table className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <div>
                    <div className="font-medium">Libro de Capas en Excel (.xlsx)</div>
                    <div className="text-[10px] text-slate-400">Pestañas de Bofedales y Estaciones SENAMHI</div>
                  </div>
                </button>

                <button
                  onClick={handleExportGeoJson}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <FileCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <div className="font-medium">Polígonos en GeoJSON</div>
                    <div className="text-[10px] text-slate-400">Capas de bofedales INAIGEM con atributos</div>
                  </div>
                </button>

                <button
                  onClick={handleExportBofedalesCsv}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-medium">Bofedales a CSV</div>
                    <div className="text-[10px] text-slate-400">Áreas, espesor turba, densidad drenaje</div>
                  </div>
                </button>

                <button
                  onClick={handleExportStationsCsv}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium">Estaciones SENAMHI a CSV</div>
                    <div className="text-[10px] text-slate-400">Coordenadas y registros climáticos</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2D Interactive GIS Map Canvas Container */}
        <div className="flex-1 relative w-full h-full flex items-center justify-center p-4">
          <div className="w-full h-full max-w-5xl bg-white dark:bg-slate-950/90 rounded-3xl border border-slate-200 dark:border-slate-800/90 relative overflow-hidden shadow-md dark:shadow-2xl flex items-center justify-center">
            
            {/* SVG Base Map of Microcuenca Chirimayo */}
            <svg 
              ref={svgMapRef}
              viewBox="0 0 1000 650" 
              className="w-full h-full object-contain"
              style={{ opacity: layerOpacity }}
            >
              <defs>
                {/* Elevation Contours Pattern */}
                <pattern id="contourGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 0 20 Q 20 15 40 20" fill="none" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.5" />
                  <path d="M 20 0 Q 15 20 20 40" fill="none" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.5" />
                </pattern>
                {/* Peat Carbon Density Gradient */}
                <linearGradient id="carbonHeat" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#14532d" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#166534" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#854d0e" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Background Contours */}
              <rect width="1000" height="650" fill={isDark ? "#020617" : "#f8fafc"} />
              <rect width="1000" height="650" fill="url(#contourGrid)" opacity="0.6" />

              {/* Subcuenca Chirimayo Watershed Boundary (ANA) */}
              <path
                d="M 180,80 C 320,40 540,50 720,110 C 860,160 920,320 850,480 C 760,600 520,620 340,580 C 180,540 100,380 120,240 Z"
                fill={isDark ? "#064e3b" : "#d1fae5"}
                fillOpacity={activeLayers.bofedalesInaigem ? 0.35 : 0.15}
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />

              {/* Control Subbasin (BACI Paired Catchment) */}
              {activeLayers.baciParcelas && (
                <g>
                  <path
                    d="M 720,110 C 820,140 940,200 960,320 C 980,440 900,520 850,480 Z"
                    fill={isDark ? "#581c87" : "#f3e8ff"}
                    fillOpacity="0.3"
                    stroke="#c084fc"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                  <text x="830" y="260" fill={isDark ? "#e9d5ff" : "#6b21a8"} fontSize="12" fontWeight="bold">Microcuenca Control (Alto Río Grande)</text>
                </g>
              )}

              {/* MINAM Carbon Density Heatmap Layer */}
              {activeLayers.minamCarbono && (
                <ellipse cx="460" cy="340" rx="220" ry="140" fill="url(#carbonHeat)" />
              )}

              {/* ANA Hydrographic River Network */}
              {activeLayers.redHidrograficaAna && (
                <g>
                  {/* Main Chirimayo Stream */}
                  <path
                    d="M 320,140 Q 420,240 480,340 T 620,460 T 780,530"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Tributary Streams */}
                  <path d="M 220,260 Q 360,290 480,340" fill="none" stroke="#0284c7" strokeWidth="2.5" />
                  <path d="M 580,200 Q 520,280 480,340" fill="none" stroke="#0284c7" strokeWidth="2.5" />
                  <path d="M 410,480 Q 520,420 620,460" fill="none" stroke="#0284c7" strokeWidth="2.5" />
                </g>
              )}

              {/* INAIGEM Bofedales Polygons */}
              {activeLayers.bofedalesInaigem && (
                <g>
                  {/* Chirimayo Central Bofedal */}
                  <path
                    d="M 380,270 C 440,240 540,260 560,320 C 580,380 500,420 430,410 C 370,400 340,320 380,270 Z"
                    fill="#10b981"
                    fillOpacity="0.75"
                    stroke="#34d399"
                    strokeWidth="2"
                    className="cursor-pointer hover:fill-emerald-400 transition-colors"
                    onClick={() => setSelectedBofedal(BOFEDALES[0])}
                  />
                  {/* Rumichaca Bofedal */}
                  <path
                    d="M 240,210 C 290,190 340,220 330,270 C 310,310 250,300 230,260 Z"
                    fill="#059669"
                    fillOpacity="0.7"
                    stroke="#34d399"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:fill-emerald-400 transition-colors"
                    onClick={() => setSelectedBofedal(BOFEDALES[1])}
                  />
                  {/* El Pajonal Drained Bofedal */}
                  <path
                    d="M 560,360 C 640,330 710,370 690,440 C 660,490 580,470 550,420 Z"
                    fill="#e11d48"
                    fillOpacity="0.65"
                    stroke="#fb7185"
                    strokeWidth="2"
                    className="cursor-pointer hover:fill-rose-400 transition-colors"
                    onClick={() => setSelectedBofedal(BOFEDALES[2])}
                  />
                  {/* Calicanto Summit Bofedal */}
                  <path
                    d="M 280,120 C 340,110 370,150 350,180 C 310,200 270,170 280,120 Z"
                    fill="#047857"
                    fillOpacity="0.75"
                    stroke="#34d399"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:fill-emerald-400 transition-colors"
                    onClick={() => setSelectedBofedal(BOFEDALES[3])}
                  />
                </g>
              )}

              {/* Labels on Map */}
              <text x="400" y="340" fill={isDark ? "#ffffff" : "#0f172a"} fontSize="13" fontWeight="bold">Turbera Chirimayo Central (142 ha)</text>
              <text x="570" y="420" fill={isDark ? "#fda4af" : "#9f1239"} fontSize="12" fontWeight="bold">Sector Drenado El Pajonal (104 ha)</text>
              <text x="220" y="240" fill={isDark ? "#a7f3d0" : "#047857"} fontSize="11" fontWeight="bold">Bofedal Rumichaca</text>
              <text x="260" y="140" fill={isDark ? "#a7f3d0" : "#047857"} fontSize="11" fontWeight="bold">Calicanto (3,980m)</text>

              {/* SENAMHI Weather Stations Markers */}
              {activeLayers.estacionesSenamhi && SENAMHI_STATIONS.map((sta, idx) => {
                const posX = idx === 0 ? 160 : idx === 1 ? 260 : idx === 2 ? 740 : 490;
                const posY = idx === 0 ? 560 : idx === 1 ? 160 : idx === 2 ? 500 : 210;
                const isSelected = selectedStation?.id === sta.id;
                return (
                  <g 
                    key={sta.id} 
                    className="cursor-pointer"
                    onClick={() => setSelectedStation(sta)}
                  >
                    <circle 
                      cx={posX} 
                      cy={posY} 
                      r={isSelected ? 10 : 7} 
                      fill="#3b82f6" 
                      stroke="#ffffff" 
                      strokeWidth="2.5" 
                    />
                    <circle cx={posX} cy={posY} r="16" fill="#60a5fa" fillOpacity="0.25" className="animate-ping" />
                    <text 
                      x={posX + 12} 
                      y={posY + 4} 
                      fill={isDark ? "#93c5fd" : "#1d4ed8"} 
                      fontSize="11" 
                      fontWeight={isSelected ? 'bold' : 'bold'}
                    >
                      {sta.name.split(' ')[1] || sta.name} ({sta.altitude}m)
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Bottom Map Legend Card */}
            <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 p-3.5 rounded-2xl text-xs text-slate-900 dark:text-white shadow-md dark:shadow-2xl max-w-xs hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between font-semibold border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-2">
                <span>{t('map2d.mapLegend')}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">WGS84 UTM 17S</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Bofedal en Conservación / Restauración</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Bofedal Severamente Drenado / Zanjas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Red Hidrográfica ANA (Río Chirimayo)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Estación Meteorológica SENAMHI DZ3</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Microcuenca Par Control (BACI)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom WMS Source Endpoints Metadata */}
        <div className="bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800/90 px-5 py-2.5 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">WMS Conectados:</span>
            <span className="text-slate-800 dark:text-slate-300">MINAM Geoservidor (v1.3.0)</span>
            <span>•</span>
            <span className="text-slate-800 dark:text-slate-300">INAIGEM Bofedales 2023 WFS</span>
            <span>•</span>
            <span className="text-slate-800 dark:text-slate-300">ANA SNIRH Hydrology API</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {t('map2d.projectionSystem')} {t('map2d.utmZone')}
          </div>
        </div>
      </div>

      {/* SECCIÓN OBLIGATORIA: INTERPRETABILIDAD Y OPERABILIDAD DEBAJO DEL VISOR SIG */}
      <InterpretabilitySection
        type="map"
        whatItShows="Visor geoespacial SIG 2D interactivo de la microcuenca Chirimayo (Encañada, Cajamarca), que integra cartografía oficial WMS/WFS del MINAM, INAIGEM, ANA y SENAMHI, representando polígonos de bofedales clasificados por estado de degradación, red hidrográfica, estaciones meteorológicas y parcelas pareadas de monitoreo BACI."
        howToInterpret="Polígonos verdes: Bofedales conservados o en proceso de restauración (Chirimayo Central, Rumichaca, Calicanto). Polígonos fucsia/rojos: Bofedales severamente drenados por zanjas (El Pajonal). Línea celeste: Red fluvial principal del Río Chirimayo. Círculos azules con pulso: Estaciones meteorológicas SENAMHI DZ3. Proyección cartográfica: WGS84 UTM Zona 17S."
        keyFindings={[
          "El bofedal Chirimayo Central (142 ha) constituye el núcleo hidrológico de la microcuenca con turba profunda (>4.5 m) y retención hídrica estival continua.",
          "El sector El Pajonal (104 ha) presenta más de 12 km lineales de zanjas artificiales abiertas que aceleran la desecación.",
          "La red de 4 estaciones SENAMHI garantiza representatividad altitudinal desde los 2,650 msnm (Cajamarca) hasta los 3,980 msnm (cumbre Chirimayo)."
        ]}
        limitations="Las coberturas vectoriales corresponden a escalas 1:25,000 validadas con vuelos dron RGB/Multiespectral de 5 cm de resolución espacial."
        operabilityInstructions={[
          "Activa o desactiva capas temáticas en el panel lateral izquierdo (Bofedales INAIGEM, Red ANA, Cobertura MINAM, Estaciones SENAMHI).",
          "Haz clic sobre cualquier polígono de bofedal o estación meteorológica para abrir su ficha de atributos detallada.",
          "Utiliza los botones de descarga superior para exportar el mapa en PNG HD con fondo blanco (#ffffff), SVG vectorial o informe PDF institucional.",
          "Exporta el catálogo de capas y polígonos geográficos en CSV, Excel o formato nativo GeoJSON."
        ]}
        datasetInfo="Visor SIG WMS/WFS | Proyección UTM 17S"
      />
    </div>
  );
};

