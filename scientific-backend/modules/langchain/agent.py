"""
Orquestador Principal / Router Agent de LangChain para el Gemelo Digital.
Determina qué herramienta ejecutar basándose en la intención de la consulta y las reglas científicas.
"""

import os
import re
from typing import Dict, Any, List, Optional
from .prompts import SYSTEM_PROMPT_PEATLAND_ASSISTANT, REJECT_NO_DATA_MESSAGE
from .tools.dataset_tool import DatasetTool
from .tools.database_tool import DatabaseTool
from .tools.carbon_tool import CarbonAnalysisTool
from .tools.hydrology_tool import HydrologyTool
from .tools.geospatial_tool import GeospatialTool
from .tools.simulation_tool import SimulationTool
from .tools.scientific_docs_tool import ScientificDocsTool
from .chains import StructuredResponseChain

class PeatlandLangChainAgent:
    """
    Agente inteligente que orquesta las 7 herramientas de LangChain del Gemelo Digital.
    Garantiza que NUNCA se inventen datos y aplica el prompt de guardián científico.
    """
    def __init__(self):
        self.dataset_tool = DatasetTool()
        self.database_tool = DatabaseTool()
        self.carbon_tool = CarbonAnalysisTool()
        self.hydrology_tool = HydrologyTool()
        self.geospatial_tool = GeospatialTool()
        self.simulation_tool = SimulationTool()
        self.scientific_docs_tool = ScientificDocsTool()
        self.response_chain = StructuredResponseChain()

    def process_query(self, query: str, history_str: str = "") -> Dict[str, Any]:
        q = query.strip().lower()

        # 0. Detección de preguntas sobre predicción temporal imposible / inexistente en el sistema
        # Ejemplo: "¿Cuánto CH4 habrá exactamente dentro de 20 años?" sin modelo prospectivo climatológico a 20 años
        if ("dentro de 20 años" in q or "exactamente en el año 20" in q or "predice el futuro a 50 años" in q) and not ("simula" in q or "escenario" in q):
            return {
                "success": False,
                "response": REJECT_NO_DATA_MESSAGE,
                "sources": [],
                "data_used": [],
                "analysis_type": "no_data",
                "analysis": None,
                "confidence": None
            }

        # 1. RAG / Scientific Documents Tool (Prioridad Alta cuando menciona literatura/IPCC/BACI/MERESE)
        if any(w in q for w in ["literatura", "ipcc", "baci", "merese", "estudio", "artículo", "articulo", "según la literatura", "segun la literatura"]):
            tool_res = self.scientific_docs_tool.search_literature(query)
            if tool_res.get("found", False):
                return self.response_chain.synthesize(query, tool_res, history_str)

        # 2. Geospatial Tool (Elevación, coordenadas, DEM, ubicación)
        if any(w in q for w in ["elevaci", "altitud", "coordenada", "dem", "ubicaci", "dónde", "donde", "límite", "limite", "sector", "msnm"]):
            tool_res = self.geospatial_tool.query(query)
            return self.response_chain.synthesize(query, tool_res, history_str)

        # 3. Simulation Tool (Simulación de escenarios, comparaciones actual/restaurado, qué pasa si aumenta WTD)
        if any(w in q for w in ["restaur", "escenario", "simul", "qué pasa si", "que pasa si", "ocurre si", "aumenta el nivel", "eficiencia"]):
            tool_res = self.simulation_tool.query_scenario(query)
            return self.response_chain.synthesize(query, tool_res, history_str)

        # 4. Carbon Tool (Procesamiento específico de CO2, CH4, métricas de modelo XGBoost)
        if any(w in q for w in ["ch4", "co2", "metano", "dióxido", "dioxido", "emisi", "tendencia", " balance", "modelo", "xgboost", "r2", "rmse"]):
            tool_res = self.carbon_tool.analyze(query)
            return self.response_chain.synthesize(query, tool_res, history_str)

        # 5. Hydrology Tool (Nivel freático, WTD, humedad 20/60/100cm, precipitación, lluvia)
        if any(w in q for w in ["freatico", "freático", "wtd", "humedad", "precipita", "lluvia", "seco", "húmedo", "humedo"]):
            tool_res = self.hydrology_tool.query(query)
            return self.response_chain.synthesize(query, tool_res, history_str)

        # 6. Dataset Tool (Variables, filas/registros, promedios de pH, faltantes, periodos)
        if any(w in q for w in ["dataset", "variable", "registro", "filas", "promedio", "ph", "faltante", "nulo", "periodo", "correlaci", "cuántos"]):
            tool_res = self.dataset_tool.query(query)
            return self.response_chain.synthesize(query, tool_res, history_str)

        # Fallback 1: Probar búsqueda en literatura si no encajó en reglas previas
        rag_res = self.scientific_docs_tool.search_literature(query)
        if rag_res.get("found", False):
            return self.response_chain.synthesize(query, rag_res, history_str)

        # Fallback 2: Consultar resumen general del dataset
        ds_res = self.dataset_tool.query(query)
        if ds_res.get("success", False):
            return self.response_chain.synthesize(query, ds_res, history_str)

        # Si nada aplica o no hay datos suficientes
        return {
            "success": False,
            "response": REJECT_NO_DATA_MESSAGE,
            "sources": [],
            "data_used": [],
            "analysis_type": "no_data",
            "analysis": None,
            "confidence": None
        }
