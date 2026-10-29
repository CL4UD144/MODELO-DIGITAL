import os
import json
import requests
from typing import Dict, Any, Optional

class LangflowService:
    """
    Servicio Integrado para la orquestación de Langflow API con el Backend Científico.
    Permite enviar mensajes a flujos de Langflow y recuperar respuestas con contexto real del Gemelo Digital.
    """
    def __init__(self):
        self.base_url = os.getenv("LANGFLOW_BASE_URL", "http://localhost:7860")
        self.flow_id = os.getenv("LANGFLOW_FLOW_ID", "chirimayo-peatland-tutor-flow")
        self.token = os.getenv("LANGFLOW_APPLICATION_TOKEN", os.getenv("LANGFLOW_API_KEY", ""))
        self.flow_json_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "langflow",
            "peatland_tutor_flow.json"
        )

    def get_status(self) -> Dict[str, Any]:
        """Obtiene el estado de conexión e integración del servicio Langflow"""
        is_configured = bool(self.base_url and self.flow_id)
        has_token = bool(self.token)
        flow_file_exists = os.path.exists(self.flow_json_path)

        # Probar ping al servidor Langflow
        is_server_online = False
        try:
            res = requests.get(f"{self.base_url}/health", timeout=1.5)
            if res.status_code == 200:
                is_server_online = True
        except Exception:
            is_server_online = False

        return {
            "status": "online" if (is_server_online and is_configured) else ("configured_standby" if is_configured else "unconfigured"),
            "service": "Langflow API Orchestrator Module",
            "base_url": self.base_url,
            "flow_id": self.flow_id,
            "has_auth_token": has_token,
            "is_server_online": is_server_online,
            "flow_definition_file": self.flow_json_path,
            "flow_file_exists": flow_file_exists,
            "architecture": "Frontend -> FastAPI (/api/langflow/chat) -> Langflow API -> LLM Engine"
        }

    def run_flow(self, user_message: str, context: Optional[Dict[str, Any]] = None, language: str = "es") -> Dict[str, Any]:
        """
        Ejecuta el flujo de Langflow enviando la consulta e inyectando el contexto real del Gemelo Digital.
        """
        status_info = self.get_status()
        
        # Inyectar contexto del sistema real (metadatos del modelo XGBoost y DB)
        system_context = {
            "peadland_location": "Microcuenca Chirimayo, Encañada, Cajamarca",
            "data_source": "Estaciones PNDA Ancash (Quinuacocha/Cátac) Inter-calibradas",
            "active_module": context.get("module", "general") if context else "general",
            "user_role": context.get("userRole", "investigador") if context else "investigador",
            "simulation_state": context.get("simulationState", {}) if context else {}
        }

        payload = {
            "input_value": user_message,
            "input_type": "chat",
            "output_type": "chat",
            "tweaks": {
                "prompt_template_1": {
                    "system_context": json.dumps(system_context, ensure_ascii=False),
                    "user_message": user_message
                }
            }
        }

        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        if status_info["is_server_online"]:
            try:
                url = f"{self.base_url}/api/v1/run/{self.flow_id}"
                response = requests.post(url, json=payload, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    # Extraer respuesta según el esquema de salida de Langflow
                    outputs = data.get("outputs", [{}])[0].get("outputs", [{}])[0]
                    result_text = outputs.get("results", {}).get("message", {}).get("text", "")
                    
                    return {
                        "status": "success",
                        "response_source": "LANGFLOW_API_REAL",
                        "flow_id": self.flow_id,
                        "text": result_text or "Respuesta procesada correctamente por el flujo Langflow.",
                        "system_context_injected": system_context
                    }
            except Exception as e:
                print(f"[LANGFLOW WARNING] Fallo conexión a Langflow: {e}")

        # Fallback estructurado cuando el servidor local Langflow no está activo en puerto 7860
        fallback_text = (
            f"**[Módulo Langflow - Respuesta de Servicio]**\n\n"
            f"Consulta recibida: *\"{user_message}\"*\n\n"
            f"📌 **Estado del Flujo Langflow:** Configurado (`{self.flow_id}`).\n"
            f"🌐 **Endpoint FastAPI Activo:** `/api/langflow/chat`\n"
            f"📊 **Contexto Inyectado:** Ubicación: Microcuenca Chirimayo (Cajamarca), Datasets PNDA Ancash Inter-calibrados, Módulo: `{system_context['active_module']}`.\n\n"
            f"💡 *Nota:* Para ejecutar la orquestación visual en tiempo real, asegúrese de iniciar el servidor de Langflow (`langflow run`) en `{self.base_url}` y definir `LANGFLOW_APPLICATION_TOKEN`."
        )

        return {
            "status": "success",
            "response_source": "LANGFLOW_MODULE_STANDBY_FALLBACK",
            "flow_id": self.flow_id,
            "text": fallback_text,
            "system_context_injected": system_context,
            "langflow_status": status_info
        }
