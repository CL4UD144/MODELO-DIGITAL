"""
Herramienta de LangChain para la consulta segura e inyección parametrizada de la Base de Datos SQLite relacional.
"""

import os
import sqlite3
import re
from typing import Dict, Any, List, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DB_PATH = os.path.join(BASE_DIR, "chirimayo_digital_twin.db")

class DatabaseTool:
    """
    Herramienta de solo lectura para ejecutar consultas SQL parametrizadas en SQLite.
    Protección contra SQL Injection y comandos destructivos.
    """
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def safe_query(self, sql: str, params: tuple = ()) -> Dict[str, Any]:
        """
        Ejecuta una consulta SQL de SOLO LECTURA (SELECT).
        """
        clean_sql = sql.strip()
        # Verificar que solo sea SELECT o PRAGMA table_info
        upper_sql = clean_sql.upper()
        if not (upper_sql.startswith("SELECT") or upper_sql.startswith("PRAGMA") or upper_sql.startswith("EXPLAIN")):
            return {
                "success": False,
                "error": "Seguridad: Solo se permiten consultas SQL de lectura (SELECT). Operaciones de modificación (INSERT, UPDATE, DELETE, DROP) están estrictamente prohibidas.",
                "sources": ["SQLite/SpatiaLite Database Guard"]
            }

        # Palabras clave peligrosas
        forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "CREATE", "EXEC", "EXECUTE"]
        for kw in forbidden:
            if re.search(r'\b' + kw + r'\b', upper_sql):
                return {
                    "success": False,
                    "error": f"Seguridad: Se detectó la palabra clave no permitida '{kw}'.",
                    "sources": ["SQLite/SpatiaLite Database Guard"]
                }

        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(clean_sql, params)
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()

            # Extraer nombres de tablas referenciadas
            tables_found = []
            for t in ["stations", "soil_measurements", "weather_records", "ml_unified_samples", "model_evaluations"]:
                if t in clean_sql.lower():
                    tables_found.append(f"Tabla: {t}")

            return {
                "success": True,
                "count": len(rows),
                "data": rows[:50],  # Limitar a 50 registros por seguridad de payload
                "truncated": len(rows) > 50,
                "sources": ["chirimayo_digital_twin.db"] + tables_found,
                "data_used": [f"Consulta SQL SQLite: `{clean_sql}`"]
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error al ejecutar SQL: {str(e)}",
                "sources": ["chirimayo_digital_twin.db"]
            }

    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """Retorna el esquema seguro de una tabla"""
        valid_tables = ["stations", "soil_measurements", "weather_records", "ml_unified_samples", "model_evaluations"]
        if table_name not in valid_tables:
            return {"success": False, "error": f"Tabla '{table_name}' no permitida."}

        return self.safe_query(f"PRAGMA table_info({table_name})")
