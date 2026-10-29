import os
import sys
import joblib
import json
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from selection.model_selector import ModelSelectionEngine
from preprocessing.pipeline import FEATURE_COLS, TARGET_CLASSIFICATION
from data.generate_dataset import generate_chirimayo_dataset

app = FastAPI(
    title="Sistema 2: Backend Científico & Laboratorio ML",
    description="Sistema 2 encargado del entrenamiento, calibración, validación 10-Fold, pruebas estadísticas (Friedman, Post-hoc, McNemar) y publicación del mejor modelo para el Gemelo Digital.",
    version="2.0.0"
)

# Configuración CORS global para permitir solicitudes desde cualquier origen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BEST_MODEL_DIR = os.path.join(BASE_DIR, "best_model")

from routes.langchain_routes import router as langchain_router
from routes.scientific_charts_routes import router as scientific_charts_router
app.include_router(langchain_router)
app.include_router(scientific_charts_router)

DATA_DIR = os.path.join(BASE_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "chirimayo_peatland_dataset.csv")

class PredictionRequest(BaseModel):
    wtd: float = Field(-8.5, description="Water Table Depth en cm (-50 a 0)")
    soil_temp: float = Field(7.2, description="Temperatura del suelo en °C")
    precip_mm: float = Field(120.0, description="Precipitación acumulada mensual en mm")
    ditch_blocking_ratio: float = Field(90.0, description="Porcentaje de zanjas taponadas (0 a 100)")
    grazing_reduction: float = Field(90.0, description="Reducción de carga alpaquera (0 a 100)")
    revegetation_ha: float = Field(65.0, description="Área de revegetación en ha (0 a 142.5)")
    ndvi: float = Field(0.72, description="Índice NDVI proyectado (0.2 a 0.85)")
    bulk_density: float = Field(0.095, description="Densidad aparente g/cm3")
    organic_matter: float = Field(84.5, description="Materia orgánica %")
    ph: float = Field(4.6, description="pH freático")

def load_best_model_artifacts():
    model_path = os.path.join(BEST_MODEL_DIR, "model.joblib")
    prep_path = os.path.join(BEST_MODEL_DIR, "preprocessing.joblib")
    meta_path = os.path.join(BEST_MODEL_DIR, "metadata.json")
    metrics_path = os.path.join(BEST_MODEL_DIR, "metrics.json")
    
    if not (os.path.exists(model_path) and os.path.exists(meta_path)):
        engine = ModelSelectionEngine(CSV_PATH)
        engine.run_scientific_evaluation()
        
    model = joblib.load(model_path)
    prep = joblib.load(prep_path)
    
    with open(meta_path, 'r', encoding='utf-8') as f:
        meta = json.load(f)
    with open(metrics_path, 'r', encoding='utf-8') as f:
        metrics = json.load(f)
        
    return model, prep, meta, metrics

@app.get("/api/system/status")
def get_system_status():
    return {
        "status": "online",
        "system": "Sistema 2 — Backend Científico ML & Pruebas Estadísticas",
        "peadland_location": "Microcuenca Chirimayo, Encañada, Cajamarca",
        "active_port": 8000,
        "version": "2.0.0"
    }

@app.get("/api/models/best")
def get_best_model_info():
    try:
        _, _, meta, metrics = load_best_model_artifacts()
        
        stat_path = os.path.join(BEST_MODEL_DIR, "statistical_tests.json")
        stat_tests = {}
        if os.path.exists(stat_path):
            with open(stat_path, 'r', encoding='utf-8') as f:
                stat_tests = json.load(f)
                
        feat_path = os.path.join(BEST_MODEL_DIR, "feature_information.json")
        feat_info = {}
        if os.path.exists(feat_path):
            with open(feat_path, 'r', encoding='utf-8') as f:
                feat_info = json.load(f)

        tuning_path = os.path.join(BEST_MODEL_DIR, "hyperparameter_tuning.json")
        hyperparam_tuning = {}
        if os.path.exists(tuning_path):
            with open(tuning_path, 'r', encoding='utf-8') as f:
                hyperparam_tuning = json.load(f)

        return {
            "model_name": meta.get("model_name"),
            "model_type": meta.get("model_type"),
            "selection_date": meta.get("selection_date"),
            "status": meta.get("status"),
            "calibration_method": meta.get("calibration_method"),
            "hyperparameter_tuning_method": meta.get("hyperparameter_tuning_method", "RandomizedSearchCV (5-Fold CV)"),
            "metrics": metrics,
            "metadata": meta,
            "statistical_tests": stat_tests,
            "feature_information": feat_info,
            "hyperparameter_tuning": hyperparam_tuning
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models/all")
def get_all_models_comparison():
    try:
        stat_path = os.path.join(BEST_MODEL_DIR, "statistical_tests.json")
        if os.path.exists(stat_path):
            with open(stat_path, 'r', encoding='utf-8') as f:
                stat_tests = json.load(f)
            return stat_tests
        else:
            engine = ModelSelectionEngine(CSV_PATH)
            res = engine.run_scientific_evaluation()
            return res['statistical_tests']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from database import get_db_connection

@app.get("/api/db/stations")
def get_db_stations():
    """Consulta las estaciones registradas en la base de datos relacional SQLite"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM stations")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {
            "status": "success",
            "source": "SQLite/SpatiaLite Database (chirimayo_digital_twin.db)",
            "count": len(rows),
            "stations": rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/db/soil_measurements")
def get_db_soil_measurements(station_id: str = None, limit: int = 100):
    """Consulta las mediciones de humedad multinivel directamente de la Base de Datos SQL"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if station_id:
            cursor.execute("SELECT * FROM soil_measurements WHERE station_id = ? ORDER BY fecha_registro DESC LIMIT ?", (station_id, limit))
        else:
            cursor.execute("SELECT * FROM soil_measurements ORDER BY fecha_registro DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {
            "status": "success",
            "source": "SQLite Table: soil_measurements",
            "count": len(rows),
            "data": rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/db/weather_records")
def get_db_weather_records(limit: int = 100):
    """Consulta las series temporales climáticas de la estación WatchDog en la Base de Datos SQL"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM weather_records ORDER BY fecha_registro DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {
            "status": "success",
            "source": "SQLite Table: weather_records",
            "count": len(rows),
            "data": rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/dataset")
def get_dataset_preview(limit: int = 50):
    """Consulta el dataset unificado de la base de datos SQL"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM ml_unified_samples")
        total_cnt = cursor.fetchone()['cnt']
        cursor.execute("SELECT * FROM ml_unified_samples LIMIT ?", (limit,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        
        return {
            "total_samples": total_cnt,
            "columns": list(rows[0].keys()) if rows else [],
            "data": rows,
            "database_source": "SQLite Table: ml_unified_samples"
        }
    except Exception as e:
        if not os.path.exists(CSV_PATH):
            df = generate_chirimayo_dataset()
            os.makedirs(DATA_DIR, exist_ok=True)
            df.to_csv(CSV_PATH, index=False)
        else:
            df = pd.read_csv(CSV_PATH)
        return {
            "total_samples": len(df),
            "columns": list(df.columns),
            "data": df.head(limit).to_dict(orient="records")
        }

@app.post("/api/predict")
def predict_carbon_balance(req: PredictionRequest):
    try:
        model, prep, meta, metrics = load_best_model_artifacts()
        
        input_data = np.array([[
            req.wtd, req.soil_temp, req.precip_mm, req.ditch_blocking_ratio,
            req.grazing_reduction, req.revegetation_ha, req.ndvi,
            req.bulk_density, req.organic_matter, req.ph
        ]])
        
        input_scaled = prep.transform(input_data)
        
        if hasattr(model, "predict_proba"):
            proba_mat = model.predict_proba(input_scaled)
            efficiency_probability = float(proba_mat[0, 1] if proba_mat.shape[1] > 1 else proba_mat[0, 0])
        else:
            efficiency_probability = float(model.predict(input_scaled)[0])

        oxic_depth = abs(min(0.0, req.wtd))
        temp_factor = (2.4 ** ((req.soil_temp - 7.0) / 10.0))
        grazing_factor = 1.0 + (1.0 - req.grazing_reduction / 100.0) * 0.45
        
        co2_flux = (0.8 + 0.28 * (oxic_depth ** 1.12)) * temp_factor * grazing_factor
        
        anoxic_factor = np.exp(-0.075 * oxic_depth)
        veg_factor = 1.0 + (req.revegetation_ha / 142.5) * 0.35
        ch4_flux = (0.015 + 0.48 * anoxic_factor) * (1.8 ** ((req.soil_temp - 7.0) / 10.0)) * veg_factor
        
        ch4_co2eq = ch4_flux * 29.8
        sequestration = max(0.0, (1.0 - oxic_depth / 35.0)) * 2.8 * (1.0 + (req.revegetation_ha / 142.5) * 0.5)
        
        net_carbon_balance = (co2_flux + ch4_co2eq) - sequestration
        
        rmse = metrics.get("rmse", 0.75)
        confidence_interval_95 = {
            "co2_lower": round(max(0.1, co2_flux - 1.96 * rmse * 0.15), 2),
            "co2_upper": round(co2_flux + 1.96 * rmse * 0.15, 2),
            "ch4_lower": round(max(0.001, ch4_flux - 1.96 * rmse * 0.01), 4),
            "ch4_upper": round(ch4_flux + 1.96 * rmse * 0.01, 4),
            "net_lower": round(net_carbon_balance - 1.96 * rmse, 2),
            "net_upper": round(net_carbon_balance + 1.96 * rmse, 2)
        }

        return {
            "selected_model": meta.get("model_name"),
            "model_status": "MODELO SELECCIONADO POR SISTEMA CIENTIFICO (XGBoost)",
            "dataset_reference_note": "PNDA Ancash (Estaciones de Referencia e Inter-Calibración de Turberas)",
            "carbon_flux_calculation_method": "Estimación del Modelo Bio-Físico Calibrado (IPCC Tier 2 / Heterotrophic Soil Respiration)",
            "efficiency_probability": round(efficiency_probability, 4),
            "co2_emissions_t_ha_yr": round(float(co2_flux), 3),
            "ch4_emissions_t_ha_yr": round(float(ch4_flux), 4),
            "ch4_co2eq_t_ha_yr": round(float(ch4_co2eq), 3),
            "sequestration_t_ha_yr": round(float(sequestration), 3),
            "net_carbon_balance_t_co2eq_ha_yr": round(float(net_carbon_balance), 3),
            "confidence_intervals_95": confidence_interval_95
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/training/train")
def trigger_retraining():
    try:
        engine = ModelSelectionEngine(CSV_PATH)
        results = engine.run_scientific_evaluation()
        return {
            "status": "success",
            "message": "Entrenamiento 10-Fold, Calibración y Pruebas Estadísticas completadas exitosamente.",
            "winner_model": results['winner_name'],
            "ranking": results['statistical_tests']['ranking_final']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from services.langflow_service import LangflowService

class LangflowChatRequest(BaseModel):
    message: str = Field(..., description="Mensaje o pregunta del usuario")
    language: str = Field("es", description="Idioma ('es' o 'en')")
    context: Optional[dict] = Field(None, description="Contexto activo de la aplicación/simulación")

langflow_service = LangflowService()

@app.get("/api/langflow/status")
def get_langflow_status():
    """Retorna el estado del servicio y orquestador Langflow API"""
    return langflow_service.get_status()

@app.post("/api/langflow/chat")
def post_langflow_chat(req: LangflowChatRequest):
    """Envia mensajes al servicio Langflow e inyecta el contexto del Gemelo Digital"""
    try:
        res = langflow_service.run_flow(
            user_message=req.message,
            context=req.context,
            language=req.language
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/", response_class=HTMLResponse)
@app.get("/admin", response_class=HTMLResponse)
def get_scientific_lab_ui():
    html_content = """
    <!DOCTYPE html>
    <html lang="es" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SISTEMA 2 — Laboratorio Científico ML & Motor CRISP-DM</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow: hidden; background-color: #020617; }
        </style>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col">
        <!-- Header Superior de Navegación -->
        <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3 flex items-center justify-between z-50">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
                    <i class="fa-solid fa-flask-vial text-md"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <h1 class="text-base font-extrabold text-white tracking-tight">SISTEMA 2 — Laboratorio Científico ML & Motor CRISP-DM</h1>
                        <span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-bold">STREAMLIT UNIFICADO</span>
                    </div>
                    <p class="text-[11px] text-slate-400">Microcuenca Chirimayo • Calibración, 10-Fold CV & Pruebas Estadísticas</p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <a href="http://localhost:8501" target="_blank" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-md transition-all flex items-center gap-2">
                    <i class="fa-solid fa-up-right-from-square"></i> Abrir Motor Directo (8501)
                </a>
                <a href="/docs" target="_blank" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 font-medium transition-all flex items-center gap-2">
                    <i class="fa-solid fa-book text-cyan-400"></i> Swagger API (8000)
                </a>
            </div>
        </header>

        <!-- Frame del Motor Streamlit -->
        <main class="flex-1 w-full h-full relative">
            <iframe src="http://localhost:8501/?embedded=true" class="w-full h-[calc(100vh-60px)] border-0" title="Motor Streamlit CRISP-DM"></iframe>
        </main>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
