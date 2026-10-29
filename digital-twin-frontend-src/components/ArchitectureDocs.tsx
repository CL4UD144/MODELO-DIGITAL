import React, { useState } from 'react';
import { 
  Code2, 
  Database, 
  Layers, 
  Server, 
  Terminal, 
  Copy, 
  Check, 
  Cpu, 
  Workflow, 
  FileCode, 
  FolderGit2, 
  ShieldCheck,
  Zap,
  Boxes
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

export const ArchitectureDocs: React.FC = () => {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'c4' | 'db_schema' | 'fastapi' | 'roadmap'>('c4');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sqlSchemaCode = `-- =========================================================================
-- MODELO DE DATOS POSTGRESQL 15+ / POSTGIS 3.3 / TIMESCALEDB 2.11
-- Gemelo Digital de Turberas Altoandinas - Microcuenca Chirimayo, Cajamarca
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- 1. TABLA DE CUENCAS Y MICROCUENCAS (ANA)
CREATE TABLE cuencas_hidrograficas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_ana VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    nivel_cuenca VARCHAR(50) DEFAULT 'Microcuenca',
    area_ha NUMERIC(12, 2) NOT NULL,
    perimetro_km NUMERIC(10, 2),
    elevacion_min_msnm NUMERIC(6, 1),
    elevacion_max_msnm NUMERIC(6, 1),
    geom GEOMETRY(MultiPolygon, 32717) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cuencas_geom ON cuencas_hidrograficas USING GIST (geom);

-- 2. TABLA DE BOFEDALES Y TURBERAS (INAIGEM 2023)
CREATE TABLE bofedales_turberas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuenca_id UUID REFERENCES cuencas_hidrograficas(id) ON DELETE CASCADE,
    codigo_inaigem VARCHAR(50) UNIQUE NOT NULL,
    nombre_sector VARCHAR(150) NOT NULL,
    area_ha NUMERIC(10, 2) NOT NULL,
    profundidad_turba_media_m NUMERIC(5, 2) NOT NULL,
    profundidad_turba_max_m NUMERIC(5, 2) NOT NULL,
    densidad_zanjas_km_ha NUMERIC(6, 2) DEFAULT 0.0,
    estado_conservacion VARCHAR(50) CHECK (estado_conservacion IN ('Excelente', 'Moderadamente Degradado', 'Severamente Drenado', 'En Restauración')),
    presion_pastoreo VARCHAR(30) CHECK (presion_pastoreo IN ('Baja', 'Media', 'Alta', 'Excluido')),
    stock_carbono_estimado_tc NUMERIC(14, 2),
    geom GEOMETRY(MultiPolygon, 32717) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bofedales_geom ON bofedales_turberas USING GIST (geom);

-- 3. ESTACIONES METEOROLÓGICAS (SENAMHI DZ3 CAJAMARCA)
CREATE TABLE estaciones_senamhi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_estacion VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    altitud_msnm INTEGER NOT NULL,
    direccion_zonal VARCHAR(50) DEFAULT 'DZ3 Cajamarca',
    geom GEOMETRY(Point, 32717) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_estaciones_geom ON estaciones_senamhi USING GIST (geom);

-- 4. RED DE PIEZÓMETROS Y TUBOS DE OBSERVACIÓN
CREATE TABLE piezometros_monitoreo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bofedal_id UUID REFERENCES bofedales_turberas(id) ON DELETE CASCADE,
    codigo_piezometro VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    profundidad_tubo_m NUMERIC(5, 2) NOT NULL,
    profundidad_turba_local_m NUMERIC(5, 2) NOT NULL,
    materia_organica_porc NUMERIC(5, 2),
    densidad_aparente_g_cm3 NUMERIC(5, 3),
    ph_suelo NUMERIC(4, 2),
    geom GEOMETRY(Point, 32717) NOT NULL,
    fecha_instalacion DATE NOT NULL
);
CREATE INDEX idx_piezometros_geom ON piezometros_monitoreo USING GIST (geom);

-- 5. TIMESCALEDB HYPERTABLE: MEDICIONES CONTINUAS DE NIVEL FREÁTICO
CREATE TABLE mediciones_piezometricas_ts (
    tiempo TIMESTAMPTZ NOT NULL,
    piezometro_id UUID NOT NULL REFERENCES piezometros_monitoreo(id),
    nivel_freatico_cm NUMERIC(6, 2) NOT NULL, -- Negativo respecto a superficie
    temperatura_suelo_c NUMERIC(5, 2),
    conductividad_electrica_us_cm NUMERIC(8, 2),
    bateria_voltios NUMERIC(4, 2),
    calidad_qa_qc VARCHAR(20) DEFAULT 'VALIDADO'
);
-- Conversión a Hypertable TimescaleDB
SELECT create_hypertable('mediciones_piezometricas_ts', 'tiempo');
CREATE INDEX idx_piezo_ts_id_tiempo ON mediciones_piezometricas_ts (piezometro_id, tiempo DESC);
CREATE INDEX idx_piezo_ts_brin ON mediciones_piezometricas_ts USING BRIN (tiempo);

-- 6. TIMESCALEDB HYPERTABLE: FLUJOS DE GASES DE EFECTO INVERNADERO (CO2 & CH4)
CREATE TABLE flujos_gases_suelo_ts (
    tiempo TIMESTAMPTZ NOT NULL,
    piezometro_id UUID REFERENCES piezometros_monitoreo(id),
    bofedal_id UUID NOT NULL REFERENCES bofedales_turberas(id),
    flujo_co2_g_c_m2_dia NUMERIC(8, 4) NOT NULL,
    flujo_ch4_mg_c_m2_dia NUMERIC(8, 4) NOT NULL,
    tipo_camara VARCHAR(30) DEFAULT 'Camara Oscura No Ventilada',
    operador VARCHAR(100),
    metodo_cromatografia VARCHAR(50) DEFAULT 'GC-FID / Laser IR'
);
SELECT create_hypertable('flujos_gases_suelo_ts', 'tiempo');
CREATE INDEX idx_flujos_ts_tiempo ON flujos_gases_suelo_ts (bofedal_id, tiempo DESC);

-- 7. PROYECTOS DE RESTAURACIÓN E INTERVENCIONES FÍSICAS (BACI)
CREATE TABLE intervenciones_restauracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bofedal_id UUID REFERENCES bofedales_turberas(id),
    codigo_proyecto VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    tipo_intervencion VARCHAR(50) NOT NULL,
    estado VARCHAR(30) DEFAULT 'Planificado',
    numero_diques INTEGER,
    longitud_cerco_m NUMERIC(10, 2),
    plantulas_sembradas INTEGER,
    presupuesto_usd NUMERIC(12, 2),
    comunidad_responsable VARCHAR(150),
    wtd_inicial_cm NUMERIC(5, 1),
    wtd_meta_cm NUMERIC(5, 1),
    emisiones_evitadas_anuales_tco2eq NUMERIC(10, 2),
    geom GEOMETRY(Geometry, 32717) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_termino DATE
);
CREATE INDEX idx_intervenciones_geom ON intervenciones_restauracion USING GIST (geom);

-- 8. SIMULACIONES Y METADATOS DE ESCENARIOS (REPRODUCIBILIDAD)
CREATE TABLE simulaciones_escenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bofedal_id UUID REFERENCES bofedales_turberas(id),
    usuario_id UUID NOT NULL,
    nombre_escenario VARCHAR(100) NOT NULL,
    parametros_json JSONB NOT NULL,
    wtd_simulado_cm NUMERIC(5, 2) NOT NULL,
    emision_co2_respiracion_t_ha_yr NUMERIC(8, 2) NOT NULL,
    emision_ch4_t_ha_yr NUMERIC(8, 4) NOT NULL,
    balance_neto_co2eq_t_ha_yr NUMERIC(8, 2) NOT NULL,
    mitigacion_acumulada_tco2eq NUMERIC(12, 2) NOT NULL,
    beneficio_merese_usd NUMERIC(14, 2) NOT NULL,
    hash_sha256_reproducibilidad VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_simulaciones_params ON simulaciones_escenarios USING GIN (parametros_json);`;

  const fastapiEndpointsCode = `# =========================================================================
# FASTAPI 0.110+ / PYDANTIC v2 / PYTHON 3.11+ ENDPOINTS
# RESTful API para el Gemelo Digital Chirimayo (OpenAPI 3.0 Compliant)
# =========================================================================

from fastapi import FastAPI, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

app = FastAPI(
    title="API Gemelo Digital Turberas Chirimayo",
    version="2.4.0",
    description="Endpoints para modelación de balance CO2-CH4, series TimescaleDB y capas PostGIS"
)

# -------------------------------------------------------------
# SCHEMAS PYDANTIC V2
# -------------------------------------------------------------
class SimulationRequest(BaseModel):
    bofedal_id: UUID = Field(..., description="ID del bofedal en PostGIS")
    target_wtd_cm: float = Field(-8.0, ge=-60.0, le=0.0, description="Nivel freático meta en cm")
    soil_temp_anomaly_c: float = Field(0.0, ge=-2.0, le=5.0, description="Anomalía de temperatura")
    ditch_blocking_ratio_pct: float = Field(90.0, ge=0.0, le=100.0, description="Porcentaje de zanjas bloqueadas")
    grazing_reduction_pct: float = Field(85.0, ge=0.0, le=100.0, description="Exclusión de pastoreo")
    revegetation_area_ha: float = Field(65.0, ge=0.0, le=500.0, description="Área de almohadillas sembrada")
    gwp_metric: str = Field("GWP-100", pattern="^(GWP-100|GWP-20)$")
    carbon_price_usd: float = Field(18.5, ge=1.0)
    horizon_years: int = Field(30, ge=1, le=50)

class SimulationResponse(BaseModel):
    simulation_id: UUID
    bofedal_name: str
    effective_wtd_cm: float
    annual_co2_respiration_t_ha_yr: float
    annual_ch4_emissions_t_ha_yr: float
    net_co2eq_balance_t_ha_yr: float
    total_mitigation_30yr_tco2eq: float
    merese_economic_benefit_usd: float
    water_yield_regulation_m3_yr: float
    sha256_hash: str
    execution_time_ms: float

# -------------------------------------------------------------
# ENDPOINTS PRINCIPALES
# -------------------------------------------------------------
@app.post("/api/v1/simulations/run", response_model=SimulationResponse, tags=["Simulación IPCC & ML"])
async def run_carbon_simulation(req: SimulationRequest, current_user = Depends(get_current_user)):
    """Ejecuta el modelo biofísico de balance CO2-CH4 y proyección a 30 años."""
    result = await carbon_engine.simulate(req)
    return result

@app.get("/api/v1/piezometers/{piezo_id}/timeseries", tags=["TimescaleDB Hidrología"])
async def get_piezometer_timeseries(
    piezo_id: UUID,
    start_date: datetime = Query(..., description="Fecha inicial ISO 8601"),
    end_date: datetime = Query(..., description="Fecha final ISO 8601"),
    interval: str = Query("1 day", pattern="^(1 hour|1 day|1 week|1 month)$")
):
    """Consulta series temporales agregadas (TimescaleDB time_bucket) de nivel freático y temperatura."""
    return await timescaledb.query_bucket(piezo_id, start_date, end_date, interval)

@app.get("/api/v1/geospatial/bofedales/geojson", tags=["PostGIS Vector WFS"])
async def get_bofedales_geojson(
    cuenca_codigo: Optional[str] = "0134",
    estado: Optional[str] = None
):
    """Retorna polígonos vectoriales GeoJSON con atributos biofísicos para el visor 3D/2D."""
    return await postgis_repo.get_bofedales_geojson(cuenca_codigo, estado)

@app.post("/api/v1/etl/ingest/field-csv", tags=["ETL Geoespacial"])
async def ingest_field_csv(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    dataset_type: str = Query("piezometers", pattern="^(piezometers|gas_fluxes|soil_cores)$")
):
    """Ingesta asíncrona de datos de campo con Celery, QA/QC, detección de outliers e interpolación."""
    task_id = await celery_etl.dispatch(file, dataset_type)
    return {"task_id": task_id, "status": "QUEUED", "message": "Pipeline ETL iniciado con éxito"}`;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-white overflow-y-auto p-4 lg:p-6 space-y-6 tech-grid-bg transition-colors duration-300">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Entregables de Ingeniería de Software & Computación Ambiental
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Arquitectura de Software, Modelo PostGIS & API RESTful</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Diseño del sistema bajo Modelo C4 (Nivel 2), DDL relacional-geoespacial TimescaleDB/PostGIS, especificación OpenAPI 3.0 y hoja de ruta por fases.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-slate-200 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700/80 text-xs shadow-inner">
          <button
            onClick={() => setActiveSubTab('c4')}
            className={`px-3.5 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
              activeSubTab === 'c4' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('architecture.tabs.c4')}
          </button>
          <button
            onClick={() => setActiveSubTab('db_schema')}
            className={`px-3.5 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
              activeSubTab === 'db_schema' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('architecture.tabs.postgis')}
          </button>
          <button
            onClick={() => setActiveSubTab('fastapi')}
            className={`px-3.5 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
              activeSubTab === 'fastapi' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('architecture.tabs.fastapi')}
          </button>
          <button
            onClick={() => setActiveSubTab('roadmap')}
            className={`px-3.5 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
              activeSubTab === 'roadmap' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('architecture.tabs.roadmap')}
          </button>
        </div>
      </div>

      {/* Subtab Content 1: C4 Model Level 2 Container Diagram */}
      {activeSubTab === 'c4' && (
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-teal-500/30 transition-all">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Diagrama de Contenedores C4 (Nivel 2) & Flujo de Datos
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Muestra cómo los contenedores interactúan desde la ingesta de datasets públicos (SENAMHI, ANA, INAIGEM, GEE) hasta la renderización 3D WebGL con React Three Fiber.
            </p>

            {/* Visual SVG Diagram */}
            <div className="w-full bg-slate-50 dark:bg-slate-950/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-800/90 overflow-x-auto shadow-inner">
              <svg viewBox="0 0 950 480" className="w-full min-w-[750px] h-auto text-xs">
                {/* External Systems */}
                <g>
                  <rect x="20" y="30" width="180" height="420" rx="14" fill={activeSubTab === 'c4' ? (document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc') : '#0f172a'} stroke="#cbd5e1" strokeDasharray="4 4" />
                  <text x="35" y="55" fill="#64748b" fontWeight="bold" fontSize="11">FUENTES EXTERNAS</text>
                  
                  {/* Sources Boxes */}
                  <rect x="35" y="75" width="150" height="45" rx="8" fill="#e0f2fe" stroke="#0284c7" />
                  <text x="45" y="95" fill="#0369a1" fontWeight="bold">SENAMHI DZ3 API</text>
                  <text x="45" y="110" fill="#475569" fontSize="9">370 Estaciones Históricas</text>

                  <rect x="35" y="135" width="150" height="45" rx="8" fill="#d1fae5" stroke="#10b981" />
                  <text x="45" y="155" fill="#047857" fontWeight="bold">ANA Perú SNIRH</text>
                  <text x="45" y="170" fill="#475569" fontSize="9">Límites Cuencas / Ríos</text>

                  <rect x="35" y="195" width="150" height="45" rx="8" fill="#d1fae5" stroke="#10b981" />
                  <text x="45" y="215" fill="#047857" fontWeight="bold">INAIGEM Bofedales</text>
                  <text x="45" y="230" fill="#475569" fontSize="9">Inventario 2023 WFS</text>

                  <rect x="35" y="255" width="150" height="45" rx="8" fill="#fef3c7" stroke="#f59e0b" />
                  <text x="45" y="275" fill="#b45309" fontWeight="bold">MINAM Geoservidor</text>
                  <text x="45" y="290" fill="#475569" fontSize="9">WMS Carbono & Biomasa</text>

                  <rect x="35" y="315" width="150" height="45" rx="8" fill="#f3e8ff" stroke="#a855f7" />
                  <text x="45" y="335" fill="#7e22ce" fontWeight="bold">Google Earth Engine</text>
                  <text x="45" y="350" fill="#475569" fontSize="9">Sentinel-2 / ALOS DEM</text>

                  <rect x="35" y="375" width="150" height="45" rx="8" fill="#fce7f3" stroke="#ec4899" />
                  <text x="45" y="395" fill="#be185d" fontWeight="bold">SoilGrids 2.0 ISRIC</text>
                  <text x="45" y="410" fill="#475569" fontSize="9">SOC, Bulk Density, pH</text>
                </g>

                {/* Arrows: External to Backend */}
                <path d="M 185 240 L 260 240" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />

                {/* Core Backend System Boundary */}
                <g>
                  <rect x="240" y="30" width="420" height="420" rx="14" fill="#f0fdf4" stroke="#0d9488" strokeWidth="1.5" />
                  <text x="260" y="55" fill="#0f766e" fontWeight="bold" fontSize="11">SISTEMA BACKEND (Python 3.11+ / FastAPI / PostGIS)</text>

                  {/* FastAPI Core */}
                  <rect x="260" y="75" width="170" height="80" rx="10" fill="#0d9488" stroke="#14b8a6" />
                  <text x="275" y="100" fill="#ffffff" fontWeight="bold">FastAPI REST Server</text>
                  <text x="275" y="118" fill="#ccfbf1" fontSize="9">Async Router, Pydantic v2</text>
                  <text x="275" y="134" fill="#e6fffa" fontSize="8">Auth JWT, OpenAPI 3.0</text>

                  {/* Celery + Redis Queue */}
                  <rect x="470" y="75" width="170" height="80" rx="10" fill="#4338ca" stroke="#6366f1" />
                  <text x="485" y="100" fill="#ffffff" fontWeight="bold">Celery Worker + Redis</text>
                  <text x="485" y="118" fill="#e0e7ff" fontSize="9">Background ETL Jobs</text>
                  <text x="485" y="134" fill="#eef2ff" fontSize="8">Kriging / Outlier Filter</text>

                  {/* Scientific ML Engine */}
                  <rect x="260" y="180" width="380" height="70" rx="10" fill="#3730a3" stroke="#818cf8" />
                  <text x="275" y="205" fill="#ffffff" fontWeight="bold">Motor Científico Biofísico & ML</text>
                  <text x="275" y="222" fill="#e0e7ff" fontSize="9">IPCC Wetlands Tier 2 + XGBoost + Walter-Heimann CH4 + Q10 Respiración</text>
                  <text x="275" y="238" fill="#c7d2fe" fontSize="8">Evaluación BACI (ANOVA) & Optimización IA de Diques</text>

                  {/* Database Tier */}
                  <rect x="260" y="275" width="180" height="150" rx="10" fill="#047857" stroke="#10b981" />
                  <text x="275" y="300" fill="#ffffff" fontWeight="bold">PostgreSQL 15+ / PostGIS</text>
                  <text x="275" y="318" fill="#ecfdf5" fontSize="9">• Tablas Vectoriales (GIST)</text>
                  <text x="275" y="334" fill="#ecfdf5" fontSize="9">• Cuencas, Bofedales, Diques</text>
                  <text x="275" y="350" fill="#ecfdf5" fontSize="9">• Piezómetros & Intervenciones</text>
                  <text x="275" y="366" fill="#ecfdf5" fontSize="9">• Auditoría RBAC & Usuarios</text>
                  <text x="275" y="395" fill="#a7f3d0" fontSize="8">SRID: EPSG:32717 (UTM 17S)</text>

                  <rect x="460" y="275" width="180" height="150" rx="10" fill="#1d4ed8" stroke="#3b82f6" />
                  <text x="475" y="300" fill="#ffffff" fontWeight="bold">TimescaleDB 2.11+</text>
                  <text x="475" y="318" fill="#eff6ff" fontSize="9">• Hypertables Particionadas</text>
                  <text x="475" y="334" fill="#eff6ff" fontSize="9">• Series Hidrológicas WTD</text>
                  <text x="475" y="350" fill="#eff6ff" fontSize="9">• Flujos Gases CO2/CH4</text>
                  <text x="475" y="366" fill="#eff6ff" fontSize="9">• SENAMHI DZ3 (1964-2024)</text>
                  <text x="475" y="395" fill="#bfdbfe" fontSize="8">Índices BRIN + Compresión 85%</text>
                </g>

                {/* Arrows Backend to Frontend */}
                <path d="M 660 240 L 710 240" stroke="#0d9488" strokeWidth="2.5" />

                {/* Frontend Single Page App */}
                <g>
                  <rect x="700" y="30" width="230" height="420" rx="14" fill="#f0fdfa" stroke="#14b8a6" strokeWidth="1.5" />
                  <text x="715" y="55" fill="#0f766e" fontWeight="bold" fontSize="11">FRONTEND WEB CLIENT</text>

                  <rect x="715" y="75" width="200" height="100" rx="8" fill="#0f766e" stroke="#2dd4bf" />
                  <text x="725" y="98" fill="#ffffff" fontWeight="bold">React Three Fiber / Three.js</text>
                  <text x="725" y="115" fill="#ccfbf1" fontSize="9">• Relieve 3D ALOS DEM (30m)</text>
                  <text x="725" y="130" fill="#ccfbf1" fontSize="9">• Dinámica Nivel Freático</text>
                  <text x="725" y="145" fill="#ccfbf1" fontSize="9">• Time-lapse Satelital 1984-2024</text>
                  <text x="725" y="160" fill="#ccfbf1" fontSize="9">• Piezómetros & Diques 3D</text>

                  <rect x="715" y="190" width="200" height="75" rx="8" fill="#0284c7" stroke="#38bdf8" />
                  <text x="725" y="212" fill="#ffffff" fontWeight="bold">Visor 2D OGC WMS/WFS</text>
                  <text x="725" y="228" fill="#e0f2fe" fontSize="9">• MINAM Geoservidor</text>
                  <text x="725" y="243" fill="#e0f2fe" fontSize="9">• INAIGEM Bofedales 2023</text>
                  <text x="725" y="258" fill="#e0f2fe" fontSize="9">• SENAMHI Estaciones Activas</text>

                  <rect x="715" y="280" width="200" height="70" rx="8" fill="#d97706" stroke="#fbbf24" />
                  <text x="725" y="302" fill="#ffffff" fontWeight="bold">Dashboards & ECharts</text>
                  <text x="725" y="318" fill="#fef3c7" fontSize="9">• Simulador Escenarios IPCC</text>
                  <text x="725" y="333" fill="#fef3c7" fontSize="9">• BACI Paired Hydrographs</text>

                  <rect x="715" y="365" width="200" height="65" rx="8" fill="#db2777" stroke="#ec4899" />
                  <text x="725" y="388" fill="#ffffff" fontWeight="bold">ReportLab / jsPDF / XLSX</text>
                  <text x="725" y="405" fill="#fce7f3" fontSize="9">Exportación Informes MINAM</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Subtab Content 2: PostgreSQL / PostGIS DDL Schema */}
      {activeSubTab === 'db_schema' && (
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl space-y-4 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Script DDL de Creación de Tablas & Hypertables
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">PostgreSQL 15+ con extensiones PostGIS y TimescaleDB para la microcuenca Chirimayo</p>
            </div>
            <button
              onClick={() => copyToClipboard(sqlSchemaCode, 'sql')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer border border-slate-300 dark:border-slate-700/80 transition-all"
            >
              {copiedCode === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'sql' ? 'Copiado' : 'Copiar SQL'}
            </button>
          </div>

          <pre className="bg-slate-900 dark:bg-slate-950/90 p-5 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 dark:text-emerald-300 overflow-x-auto max-h-[500px] shadow-inner">
            <code>{sqlSchemaCode}</code>
          </pre>
        </div>
      )}

      {/* Subtab Content 3: FastAPI OpenAPI Spec */}
      {activeSubTab === 'fastapi' && (
        <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl space-y-4 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Endpoints Backend FastAPI (Python 3.11+)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Definición de rutas RESTful, schemas Pydantic v2 y control de acceso RBAC</p>
            </div>
            <button
              onClick={() => copyToClipboard(fastapiEndpointsCode, 'py')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer border border-slate-300 dark:border-slate-700/80 transition-all"
            >
              {copiedCode === 'py' ? <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'py' ? 'Copiado' : 'Copiar Python'}
            </button>
          </div>

          <pre className="bg-slate-900 dark:bg-slate-950/90 p-5 rounded-2xl border border-slate-800 text-[11px] font-mono text-cyan-400 dark:text-cyan-300 overflow-x-auto max-h-[500px] shadow-inner">
            <code>{fastapiEndpointsCode}</code>
          </pre>
        </div>
      )}

      {/* Subtab Content 4: Implementation Roadmap in 3 Phases */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl space-y-6 hover:border-emerald-500/30 transition-all">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Plan de Implementación en Fases & Criterios de Aceptación
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Cronograma de despliegue progresivo de la plataforma computacional</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Phase 1: MVP */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/80 rounded-3xl border border-emerald-300 dark:border-emerald-500/40 relative flex flex-col justify-between shadow-xs hover:border-emerald-500/70 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 font-mono">
                      Fase 1 (MVP) — Meses 1 a 3
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Fundación Geoespacial & Dashboard 2D</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li>• Ingesta automatizada de 370 estaciones SENAMHI DZ3 (1964-2014).</li>
                    <li>• Delimitación de cuenca Chirimayo con shapefiles de ANA.</li>
                    <li>• Base de datos PostgreSQL 15 + PostGIS + TimescaleDB operativa.</li>
                    <li>• Visor 2D Leaflet con capas WMS del MINAM Geoservidor.</li>
                    <li>• Módulo de autenticación RBAC con JWT (5 roles de usuario).</li>
                    <li>• Generador de reportes PDF simples.</li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/90 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Criterio de Aceptación MVP: Carga sub-segundo de series temporales y visualización WMS interoperable.
                </div>
              </div>

              {/* Phase 2: Core */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/80 rounded-3xl border border-cyan-300 dark:border-cyan-500/40 relative flex flex-col justify-between shadow-xs hover:border-cyan-500/70 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30 font-mono">
                      Fase 2 (Core) — Meses 4 a 6
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Gemelo 3D, GEE & Modelos ML</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li>• Gemelo Digital 3D interactivo en Three.js con ALOS DEM 30m.</li>
                    <li>• Integración con Google Earth Engine API Python (Sentinel-2, NDVI).</li>
                    <li>• Ingesta del Inventario Nacional de Bofedales INAIGEM 2023.</li>
                    <li>• Motor de simulación de carbono IPCC Wetlands Tier 2 + ML.</li>
                    <li>• Simulador de escenarios What-If (WTD, diques, pastoreo, clima).</li>
                    <li>• Exportación de libros de cálculo Excel (.xlsx) en 4 hojas.</li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/90 text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">
                  Criterio de Aceptación Core: Tasa de refresco 3D &gt; 50 FPS y calibración del modelo con R² &gt; 0.85.
                </div>
              </div>

              {/* Phase 3: Full */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/80 rounded-3xl border border-purple-300 dark:border-purple-500/40 relative flex flex-col justify-between shadow-xs hover:border-purple-500/70 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30 font-mono">
                      Fase 3 (Completa) — Meses 7 a 8
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Restauración BACI & Optimización IA</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li>• Módulo de seguimiento de obras físicas de restauración.</li>
                    <li>• Análisis estadístico Before-After-Control-Impact (BACI).</li>
                    <li>• Algoritmo de recomendación IA para ubicación óptima de diques.</li>
                    <li>• Time-lapse multitemporal 1984-2024 de retracción/recuperación.</li>
                    <li>• Dictamen MERESE Hídrico (Ley 30215) para retribución comunal.</li>
                    <li>• Pruebas de carga, seguridad ISO y manuales bilingües.</li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/90 text-[11px] text-purple-700 dark:text-purple-400 font-semibold">
                  Criterio de Aceptación Final: Despliegue en producción con alta disponibilidad y validación comunal.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
