"""
Servicio LangChain para el Gemelo Digital de Turberas.
Proporciona la interfaz unificada para procesar solicitudes de chat con memoria por sesión.
"""

from typing import Dict, Any, Optional
from .agent import PeatlandLangChainAgent
from .memory import ConversationMemoryManager

class LangChainService:
    """
    Servicio de Inteligencia Artificial basado en LangChain para el Gemelo Digital.
    Mantiene memoria conversacional aislada por conversation_id.
    """
    def __init__(self):
        self.agent = PeatlandLangChainAgent()
        self.memory_manager = ConversationMemoryManager(k=10)

    def chat(self, message: str, conversation_id: str = "default_session", language: str = "es") -> Dict[str, Any]:
        """
        Procesa un mensaje de usuario mediante el agente de LangChain.
        """
        if not conversation_id:
            conversation_id = "default_session"

        # Recuperar historial conversacional previa
        history_str = self.memory_manager.format_history_for_prompt(conversation_id)

        # Registrar entrada del usuario en memoria
        self.memory_manager.add_user_message(conversation_id, message)

        # Procesar con el Agente Inteligente / Router de LangChain
        result = self.agent.process_query(message, history_str=history_str)

        # Registrar respuesta de la IA en memoria
        ai_response_text = result.get("response", "")
        self.memory_manager.add_ai_message(conversation_id, ai_response_text)

        # Estructurar la salida exactamente como requiere la especificación API
        return {
            "success": result.get("success", True),
            "response": result.get("response", ""),
            "sources": result.get("sources", []),
            "data_used": result.get("data_used", []),
            "analysis_type": result.get("analysis_type", "general"),
            "analysis": result.get("analysis", None),
            "confidence": result.get("confidence", None)
        }

    def clear_session(self, conversation_id: str) -> Dict[str, Any]:
        """Limpia el historial de memoria conversacional de una sesión"""
        self.memory_manager.clear_session(conversation_id)
        return {
            "success": True,
            "message": f"Memoria de la sesión '{conversation_id}' reiniciada exitosamente."
        }
