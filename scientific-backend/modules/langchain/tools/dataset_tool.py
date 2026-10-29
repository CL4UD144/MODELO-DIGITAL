"""
Herramienta de LangChain para consultar datasets reales (CSV/XLSX) del Gemelo Digital de Turberas.
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from langchain_core.tools import BaseTool
from pydantic import Field

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.path.join(BASE_DIR, "data")
ML_CSV_PATH = os.path.join(DATA_DIR, "chirimayo_peatland_dataset.csv")

class DatasetTool:
    """
    Herramienta de análisis exploratorio sobre los datasets CSV reales del sistema.
    Sin valores hardcodeados.
    """
    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self.ml_csv = os.path.join(data_dir, "chirimayo_peatland_dataset.csv")
        self.s1_csv = os.path.join(data_dir, "4 QUI-TAY-MEHM-02_PNDA.csv")
        self.s2_csv = os.path.join(data_dir, "6 Dataset CIC-MEHM-04_PNDA.csv")
        self.weather_csv = os.path.join(data_dir, "7 Dataset CIC-MEHM-01_PNDA_0.csv")

    def _load_ml_df(self) -> pd.DataFrame:
        if os.path.exists(self.ml_csv):
            return pd.read_csv(self.ml_csv)
        raise FileNotFoundError(f"Dataset no encontrado en {self.ml_csv}")

    def query(self, question: str) -> Dict[str, Any]:
        """
        Analiza la pregunta y responde consultando directamente pandas DataFrames reales.
        """
        q = question.lower()
        df = self._load_ml_df()
        
        sources_used = ["chirimayo_peatland_dataset.csv"]
        
        # 1. Variables contenidas
        if "variable" in q or "columna" in q or "qué contiene" in q:
            cols = list(df.columns)
            return {
                "success": True,
                "dataset": "chirimayo_peatland_dataset.csv",
                "total_variables": len(cols),
                "variables": cols,
                "summary": f"El dataset unificado contiene {len(cols)} variables: {', '.join(cols)}.",
                "sources": sources_used,
                "data_used": ["chirimayo_peatland_dataset.csv (Estructura de columnas)"]
            }

        # 2. Número de registros
        if "registro" in q or "muestra" in q or "cuántos" in q or "filas" in q:
            count = len(df)
            return {
                "success": True,
                "total_records": count,
                "summary": f"El dataset de la turbera contiene {count} registros u observaciones empíricas.",
                "sources": sources_used,
                "data_used": [f"chirimayo_peatland_dataset.csv ({count} filas)"]
            }

        # 3. Promedio de CO2
        if "promedio" in q and "co2" in q:
            val = float(df['co2_flux'].mean()) if 'co2_flux' in df.columns else None
            if val is not None:
                return {
                    "success": True,
                    "variable": "co2_flux",
                    "average": round(val, 4),
                    "unit": "t CO2 / ha / año",
                    "summary": f"El promedio observado de emisiones de CO2 es {val:.4f} t CO2/ha/año (rango: {df['co2_flux'].min():.3f} a {df['co2_flux'].max():.3f}).",
                    "sources": sources_used,
                    "data_used": ["chirimayo_peatland_dataset.csv (columna co2_flux)"]
                }

        # 4. Promedio de CH4
        if "promedio" in q and "ch4" in q:
            val = float(df['ch4_flux'].mean()) if 'ch4_flux' in df.columns else None
            if val is not None:
                return {
                    "success": True,
                    "variable": "ch4_flux",
                    "average": round(val, 4),
                    "unit": "t CH4 / ha / año",
                    "summary": f"El promedio observado de emisiones de CH4 es {val:.4f} t CH4/ha/año (rango: {df['ch4_flux'].min():.4f} a {df['ch4_flux'].max():.4f}).",
                    "sources": sources_used,
                    "data_used": ["chirimayo_peatland_dataset.csv (columna ch4_flux)"]
                }

        # 5. Promedio de pH
        if "ph" in q and ("promedio" in q or "cuál" in q or "que" in q):
            val = float(df['ph'].mean()) if 'ph' in df.columns else None
            if val is not None:
                return {
                    "success": True,
                    "variable": "ph",
                    "average": round(val, 2),
                    "summary": f"El pH freático promedio en el dataset es {val:.2f} (rango: {df['ph'].min():.2f} a {df['ph'].max():.2f}, característico de suelos orgánicos de turba).",
                    "sources": sources_used,
                    "data_used": ["chirimayo_peatland_dataset.csv (columna ph)"]
                }

        # 6. Promedio de humedad del suelo
        if "humedad" in q:
            # Consultar archivos PNDA si están disponibles
            if os.path.exists(self.s1_csv):
                dfs1 = pd.read_csv(self.s1_csv)
                sources_used.append("4 QUI-TAY-MEHM-02_PNDA.csv")
                h20 = float(dfs1['HUMEDAD_SUELO_PROMEDIO_20'].dropna().mean())
                h60 = float(dfs1['HUMEDAD_SUELO_PROMEDIO_60'].dropna().mean())
                h100 = float(dfs1['HUMEDAD_SUELO_PROMEDIO_100'].dropna().mean())
                return {
                    "success": True,
                    "humedad_20cm_avg": round(h20, 2),
                    "humedad_60cm_avg": round(h60, 2),
                    "humedad_100cm_avg": round(h100, 2),
                    "summary": f"La humedad promedio del suelo en la estación de referencia Quinuacocha es: 20cm: {h20:.2f}%, 60cm: {h60:.2f}%, 100cm: {h100:.2f}%.",
                    "sources": sources_used,
                    "data_used": ["4 QUI-TAY-MEHM-02_PNDA.csv (Sensores 20/60/100cm)"]
                }

        # 7. Promedio de temperatura
        if "temperatura" in q:
            t_soil = float(df['soil_temp'].mean()) if 'soil_temp' in df.columns else None
            summary_msg = f"La temperatura del suelo promedio es {t_soil:.2f} °C."
            data_u = ["chirimayo_peatland_dataset.csv (columna soil_temp)"]
            
            if os.path.exists(self.weather_csv):
                dfw = pd.read_csv(self.weather_csv)
                sources_used.append("7 Dataset CIC-MEHM-01_PNDA_0.csv")
                t_air = float(dfw['TEMPERATURA_PROMEDIO'].dropna().mean())
                summary_msg += f" La temperatura ambiental promedio (Estación WatchDog) es {t_air:.2f} °C."
                data_u.append("7 Dataset CIC-MEHM-01_PNDA_0.csv (TEMPERATURA_PROMEDIO)")

            return {
                "success": True,
                "soil_temp_avg": round(t_soil, 2) if t_soil else None,
                "summary": summary_msg,
                "sources": sources_used,
                "data_used": data_u
            }

        # 8. Datos faltantes
        if "faltante" in q or "nulo" in q or "missing" in q:
            nulls = df.isnull().sum().to_dict()
            total_nulls = int(df.isnull().sum().sum())
            return {
                "success": True,
                "total_missing_values": total_nulls,
                "missing_per_variable": nulls,
                "summary": f"Se registraron {total_nulls} valores faltantes en el dataset unificado.",
                "sources": sources_used,
                "data_used": ["chirimayo_peatland_dataset.csv (Auditoría de valores nulos)"]
            }

        # 9. Periodo temporal disponible
        if "periodo" in q or "fecha" in q or "tiempo" in q or "rango" in q:
            dates = []
            if os.path.exists(self.s1_csv):
                dfs1 = pd.read_csv(self.s1_csv)
                dates.extend(dfs1['FECHA_REGISTRO'].astype(str).tolist())
                sources_used.append("4 QUI-TAY-MEHM-02_PNDA.csv")
            if dates:
                min_d = min(dates)
                max_d = max(dates)
                min_iso = f"{min_d[:4]}-{min_d[4:6]}-{min_d[6:]}"
                max_iso = f"{max_d[:4]}-{max_d[4:6]}-{max_d[6:]}"
                return {
                    "success": True,
                    "start_date": min_iso,
                    "end_date": max_iso,
                    "summary": f"El periodo temporal monitoreado abarca desde {min_iso} hasta {max_iso}.",
                    "sources": sources_used,
                    "data_used": ["4 QUI-TAY-MEHM-02_PNDA.csv (Serie de fechas FECHA_REGISTRO)"]
                }

        # 10. Correlaciones con CH4
        if "correlaci" in q or ("relaci" in q and "ch4" in q):
            numeric_cols = df.select_dtypes(include=[np.number])
            corr = numeric_cols.corr()['ch4_flux'].sort_values(ascending=False).to_dict()
            top_corr = {k: round(v, 4) for k, v in corr.items() if k != 'ch4_flux'}
            return {
                "success": True,
                "target": "ch4_flux",
                "correlations": top_corr,
                "summary": f"Las variables con mayor correlación con CH4 son: {', '.join([f'{k} ({v:.4f})' for k, v in list(top_corr.items())[:4]])}.",
                "sources": sources_used,
                "data_used": ["chirimayo_peatland_dataset.csv (Matriz de correlación de Pearson)"]
            }

        # Consulta general genérica de resumen del dataset
        stats = {
            "total_rows": len(df),
            "columns": list(df.columns),
            "co2_avg": round(float(df['co2_flux'].mean()), 4) if 'co2_flux' in df.columns else None,
            "ch4_avg": round(float(df['ch4_flux'].mean()), 4) if 'ch4_flux' in df.columns else None,
            "wtd_avg": round(float(df['wtd'].mean()), 2) if 'wtd' in df.columns else None
        }

        return {
            "success": True,
            "dataset_info": stats,
            "summary": f"Dataset Chirimayo ({stats['total_rows']} muestras). CO2 prom: {stats['co2_avg']} t/ha/año, CH4 prom: {stats['ch4_avg']} t/ha/año, WTD prom: {stats['wtd_avg']} cm.",
            "sources": sources_used,
            "data_used": ["chirimayo_peatland_dataset.csv"]
        }
