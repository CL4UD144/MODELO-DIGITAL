"""
Cadenas de procesamiento estructurado de LangChain para la síntesis de respuestas del Gemelo Digital.
"""

from typing import Dict, Any, List, Optional
import json

class StructuredResponseChain:
    """
    Cadena de síntesis que empaca las respuestas con metadatos requeridos:
    - success (bool)
    - response (str)
    - sources (list)
    - data_used (list)
    - analysis_type (str)
    - confidence (float/optional)
    - analysis (dict/optional)
    """
    def synthesize(
        self,
        query: str,
        tool_result: Dict[str, Any],
        history_str: str = ""
    ) -> Dict[str, Any]:
        
        sources = tool_result.get("sources", [])
        data_used = tool_result.get("data_used", [])
        analysis_type = tool_result.get("analysis_type", "general")
        summary_text = tool_result.get("summary", tool_result.get("response", ""))

        # Extraer análisis estructurado si existe
        analysis_data = None
        if "values" in tool_result or "metrics" in tool_result or "baseline_scenario" in tool_result:
            analysis_data = {
                "type": analysis_type,
                "variables": tool_result.get("variables", []),
                "values": tool_result.get("values", tool_result.get("metrics", {})),
                "trend": tool_result.get("trend", {})
            }

        confidence_val = tool_result.get("confidence", None)
        if confidence_val is None and "values" in tool_result and "metrics" in tool_result.get("values", {}):
            confidence_val = tool_result["values"]["metrics"].get("r2", 0.98)

        return {
            "success": True,
            "response": summary_text,
            "sources": sources,
            "data_used": data_used,
            "analysis_type": analysis_type,
            "analysis": analysis_data,
            "confidence": confidence_val
        }
