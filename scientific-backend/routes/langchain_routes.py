"""
Rutas API FastAPI para el Módulo Inteligente de LangChain.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from modules.langchain.service import LangChainService

router = APIRouter(prefix="/api/ai", tags=["LangChain AI Assistant"])
langchain_service = LangChainService()

class ChatRequest(BaseModel):
    message: str = Field(..., description="Consulta o pregunta del usuario en lenguaje natural")
    conversation_id: Optional[str] = Field("default_session", description="Identificador único de la sesión de conversación")
    language: Optional[str] = Field("es", description="Idioma de preferencia ('es' o 'en')")

class ClearMemoryRequest(BaseModel):
    conversation_id: str = Field(..., description="ID de la sesión a reiniciar")

@router.post("/chat")
def langchain_chat(req: ChatRequest):
    """
    Endpoint principal de Asistente de IA con LangChain para el Gemelo Digital de Turberas.
    """
    try:
        response_data = langchain_service.chat(
            message=req.message,
            conversation_id=req.conversation_id,
            language=req.language or "es"
        )
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en LangChain Service: {str(e)}")

@router.post("/clear")
def clear_chat_memory(req: ClearMemoryRequest):
    """
    Reinicia el historial de memoria conversacional para una sesión.
    """
    try:
        return langchain_service.clear_session(req.conversation_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
def get_langchain_status():
    """
    Retorna el estado de disponibilidad del Módulo LangChain.
    """
    return {
        "status": "online",
        "framework": "LangChain 1.3+",
        "architecture": "LangChain Agent + 7 Specialized Tools + Conversational Session Memory + RAG",
        "endpoint": "/api/ai/chat",
        "tools": [
            "DatasetTool",
            "DatabaseTool",
            "CarbonAnalysisTool",
            "HydrologyTool",
            "GeospatialTool",
            "SimulationTool",
            "ScientificDocsTool"
        ]
    }
