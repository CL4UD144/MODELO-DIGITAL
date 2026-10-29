"""
Módulo de memoria conversacional por sesión para LangChain.
"""

from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

class ConversationMemoryManager:
    """
    Gestor de memoria de conversación aislado por conversation_id / sesión.
    Evita mezclar sesiones entre usuarios y mantiene una ventana de mensajes.
    """
    def __init__(self, k: int = 10):
        self.k = k
        self._sessions: Dict[str, List[BaseMessage]] = {}

    def get_session_history(self, conversation_id: str) -> List[BaseMessage]:
        if conversation_id not in self._sessions:
            self._sessions[conversation_id] = []
        return self._sessions[conversation_id]

    def add_user_message(self, conversation_id: str, text: str):
        history = self.get_session_history(conversation_id)
        history.append(HumanMessage(content=text))
        if len(history) > self.k * 2:
            self._sessions[conversation_id] = history[-(self.k * 2):]

    def add_ai_message(self, conversation_id: str, text: str):
        history = self.get_session_history(conversation_id)
        history.append(AIMessage(content=text))
        if len(history) > self.k * 2:
            self._sessions[conversation_id] = history[-(self.k * 2):]

    def format_history_for_prompt(self, conversation_id: str) -> str:
        history = self.get_session_history(conversation_id)
        if not history:
            return ""
        formatted = []
        for msg in history[-6:]:
            role = "Usuario" if isinstance(msg, HumanMessage) else "Asistente"
            formatted.append(f"{role}: {msg.content}")
        return "\n".join(formatted)

    def clear_session(self, conversation_id: str):
        if conversation_id in self._sessions:
            del self._sessions[conversation_id]
