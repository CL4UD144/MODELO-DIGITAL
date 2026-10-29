import sqlite3
import os
import pandas as pd
import json

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "chirimayo_digital_twin.db")
DATA_DIR = os.path.join(DB_DIR, "data")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa el esquema de Base de Datos relacional para el Gemelo Digital Chirimayo"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Tabla de Estaciones de Monitoreo
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stations (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            station_type TEXT NOT NULL,
            location TEXT NOT NULL,
            department TEXT NOT NULL,
            province TEXT NOT NULL,
            district TEXT NOT NULL,
            ubigeo INTEGER,
            latitude REAL,
            longitude REAL,
            altitude REAL,
            source_dataset TEXT NOT NULL,
            calibration_region TEXT NOT NULL
        )
    ''')

    # 2. Tabla de Mediciones de Suelo y Humedad Multinivel
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS soil_measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT NOT NULL,
            fecha_registro INTEGER NOT NULL,
            fecha_iso TEXT NOT NULL,
            humedad_20cm REAL,
            humedad_60cm REAL,
            humedad_100cm REAL,
            wtd_estimated REAL,
            FOREIGN KEY (station_id) REFERENCES stations(id)
        )
    ''')

    # 3. Tabla de Series Climatológicas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS weather_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT NOT NULL,
            fecha_registro INTEGER NOT NULL,
            fecha_iso TEXT NOT NULL,
            precipitacion REAL,
            temperatura_promedio REAL,
            temperatura_minima REAL,
            temperatura_maxima REAL,
            FOREIGN KEY (station_id) REFERENCES stations(id)
        )
    ''')

    # 4. Tabla de Dataset Maestro Unificado para ML
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ml_unified_samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_iso TEXT NOT NULL,
            wtd REAL,
            soil_temp REAL,
            precip_mm REAL,
            ditch_blocking_ratio REAL,
            grazing_reduction REAL,
            revegetation_ha REAL,
            ndvi REAL,
            bulk_density REAL,
            organic_matter REAL,
            ph REAL,
            co2_flux REAL,
            ch4_flux REAL,
            net_carbon_balance REAL,
            high_impact_class INTEGER
        )
    ''')

    # 5. Tabla de Evaluaciones de Modelos ML
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS model_evaluations (
            model_name TEXT PRIMARY KEY,
            f1_score REAL,
            accuracy REAL,
            roc_auc REAL,
            mae REAL,
            rmse REAL,
            r2 REAL,
            selected INTEGER,
            evaluation_date TEXT
        )
    ''')

    conn.commit()
    conn.close()
    print(f"Base de Datos SQLite/SpatiaLite creada en: {DB_PATH}")

def seed_db_from_csv():
    """Popula la base de datos desde los datasets CSV procesados"""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Limpiar tablas existentes para asegurar consistencia
    cursor.execute("DELETE FROM stations")
    cursor.execute("DELETE FROM soil_measurements")
    cursor.execute("DELETE FROM weather_records")
    cursor.execute("DELETE FROM ml_unified_samples")

    # Insertar Estaciones
    stations_data = [
        ("QUI-TAY-MEHM-02", "QUI-TAY-MEHM-02", "Estación Quinuacocha (PNDA Referencia)", "Humedad Multinivel (20/60/100cm)", "Independencia, Huaraz", "ANCASH", "HUARAZ", "INDEPENDENCIA", 20105, -9.5120, -77.5340, 3950, "4 QUI-TAY-MEHM-02_PNDA.csv", "PNDA Ancash (Inter-cuencas)"),
        ("CIC-MEHM-04", "CIC-MEHM-04", "Estación Cátac (PNDA Referencia)", "Humedad Multinivel (20/60/100cm)", "Catac, Recuay", "ANCASH", "RECUAY", "CATAC", 21702, -9.7540, -77.3820, 3820, "6 Dataset CIC-MEHM-04_PNDA.csv", "PNDA Ancash (Inter-cuencas)"),
        ("CIC-MEHM-01", "CIC-MEHM-01", "Estación WatchDog Meteorológica", "Precipitación & Temperatura", "Catac, Recuay", "ANCASH", "RECUAY", "CATAC", 21702, -9.7510, -77.3800, 3810, "7 Dataset CIC-MEHM-01_PNDA_0.csv", "PNDA Ancash (Inter-cuencas)")
    ]
    cursor.executemany('''
        INSERT INTO stations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', stations_data)

    # Ingestar Suelo 1 (QUI-TAY-MEHM-02)
    s1_path = os.path.join(DATA_DIR, "4 QUI-TAY-MEHM-02_PNDA.csv")
    if os.path.exists(s1_path):
        df1 = pd.read_csv(s1_path)
        for _, r in df1.iterrows():
            f_str = str(r['FECHA_REGISTRO'])
            if len(f_str) == 8:
                iso_date = f"{f_str[:4]}-{f_str[4:6]}-{f_str[6:]}"
                hum20 = float(r['HUMEDAD_SUELO_PROMEDIO_20']) if pd.notnull(r['HUMEDAD_SUELO_PROMEDIO_20']) else 0.0
                hum60 = float(r['HUMEDAD_SUELO_PROMEDIO_60']) if pd.notnull(r['HUMEDAD_SUELO_PROMEDIO_60']) else 0.0
                hum100 = float(r['HUMEDAD_SUELO_PROMEDIO_100']) if pd.notnull(r['HUMEDAD_SUELO_PROMEDIO_100']) else 0.0
                wtd = -50.0 + (hum20 / 100.0) * 50.0
                cursor.execute('''
                    INSERT INTO soil_measurements (station_id, fecha_registro, fecha_iso, humedad_20cm, humedad_60cm, humedad_100cm, wtd_estimated)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', ("QUI-TAY-MEHM-02", int(r['FECHA_REGISTRO']), iso_date, hum20, hum60, hum100, round(wtd, 2)))

    # Ingestar Suelo 2 (CIC-MEHM-04)
    s2_path = os.path.join(DATA_DIR, "6 Dataset CIC-MEHM-04_PNDA.csv")
    if os.path.exists(s2_path):
        df2 = pd.read_csv(s2_path)
        for _, r in df2.iterrows():
            f_str = str(r['FECHA_REGISTRO'])
            if len(f_str) == 8:
                iso_date = f"{f_str[:4]}-{f_str[4:6]}-{f_str[6:]}"
                hum20 = float(r['HUMEDAD_SUELO_PROMEDIO_20']) if pd.notnull(r['HUMEDAD_SUELO_PROMEDIO_20']) else 0.0
                hum60 = float(r['HUMEDAD_SUELO_PROMEDIO_60']) if pd.notnull(r['HUMEDAD_SUELO_PROMEDIO_60']) else 0.0
                hum100 = float(r['HUMEDAD_SUELO_PROMEDIO_100']) if pd.notnull(r['HUMEDAD_SUELO_PROMEDIO_100']) else 0.0
                wtd = -50.0 + (hum20 / 100.0) * 50.0
                cursor.execute('''
                    INSERT INTO soil_measurements (station_id, fecha_registro, fecha_iso, humedad_20cm, humedad_60cm, humedad_100cm, wtd_estimated)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', ("CIC-MEHM-04", int(r['FECHA_REGISTRO']), iso_date, hum20, hum60, hum100, round(wtd, 2)))

    # Ingestar Clima (CIC-MEHM-01)
    w_path = os.path.join(DATA_DIR, "7 Dataset CIC-MEHM-01_PNDA_0.csv")
    if os.path.exists(w_path):
        dfw = pd.read_csv(w_path)
        for _, r in dfw.iterrows():
            f_str = str(r['FECHA_REGISTRO'])
            if len(f_str) == 8:
                iso_date = f"{f_str[:4]}-{f_str[4:6]}-{f_str[6:]}"
                pr = float(r['PRECIPITACION']) if pd.notnull(r['PRECIPITACION']) else 0.0
                tavg = float(r['TEMPERATURA_PROMEDIO']) if pd.notnull(r['TEMPERATURA_PROMEDIO']) else 0.0
                tmin = float(r['TEMPERATURA_MINIMA']) if pd.notnull(r['TEMPERATURA_MINIMA']) else 0.0
                tmax = float(r['TEMPERATURA_MAXIMA']) if pd.notnull(r['TEMPERATURA_MAXIMA']) else 0.0
                cursor.execute('''
                    INSERT INTO weather_records (station_id, fecha_registro, fecha_iso, precipitacion, temperatura_promedio, temperatura_minima, temperatura_maxima)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', ("CIC-MEHM-01", int(r['FECHA_REGISTRO']), iso_date, pr, tavg, tmin, tmax))

    # Ingestar Dataset Unificado ML
    ml_path = os.path.join(DATA_DIR, "chirimayo_peatland_dataset.csv")
    if os.path.exists(ml_path):
        dfml = pd.read_csv(ml_path)
        for idx, r in dfml.iterrows():
            cursor.execute('''
                INSERT INTO ml_unified_samples (fecha_iso, wtd, soil_temp, precip_mm, ditch_blocking_ratio, grazing_reduction, revegetation_ha, ndvi, bulk_density, organic_matter, ph, co2_flux, ch4_flux, net_carbon_balance, high_impact_class)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (f"Sample-{idx+1}", r['wtd'], r['soil_temp'], r['precip_mm'], r['ditch_blocking_ratio'], r['grazing_reduction'], r['revegetation_ha'], r['ndvi'], r['bulk_density'], r['organic_matter'], r['ph'], r['co2_flux'], r['ch4_flux'], r['net_carbon_balance'], int(r['high_impact_class'])))

    conn.commit()
    conn.close()
    print("Base de datos alimentada exitosamente desde los datasets CSV.")

if __name__ == "__main__":
    seed_db_from_csv()
