import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { generateAdvancedDomainFallback } from './src/services/chatRagService';

dotenv.config();

function chatApiPlugin(): Plugin {
  return {
    name: 'chat-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const userMessage: string = data.message || '';
            const language: 'es' | 'en' = data.language === 'en' ? 'en' : 'es';
            const contextInfo = data.context || {};
            const historyMessages: any[] = data.history || [];

            if (!userMessage.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: language === 'es' ? 'Mensaje vacío' : 'Empty message'
              }));
              return;
            }

            const apiKey = process.env.GEMINI_API_KEY;
            let assistantResponse = '';

            if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
              try {
                const ai = new GoogleGenAI({ apiKey });
                const systemPrompt = `Tu nombre es "Asistente Virtual Gemelo Digital Chirimayo". Eres un arquitecto senior de IA y científico de datos experto en hidrología de turberas altoandinas (bofedales), balance de gases de efecto invernadero (CO2-CH4), metodología BACI (Before-After Control-Impact), evaluación MERESE (Ley 30215) y gemelos digitales en la Jalca de Cajamarca, Perú (3,680 - 4,060 m.s.n.m.).

CONTEXTO ACTUAL DE LA APLICACIÓN:
- Módulo activo actual del usuario: "${contextInfo.module || 'general'}"
- Rol de usuario: "${contextInfo.userRole || 'investigador'}"
- Estado de Simulación Activa: ${JSON.stringify(contextInfo.simulationState || {})}

DIRECTIVAS CRÍTICAS DE RESPUESTA:
1. Responde ÚNICAMENTE en el idioma solicitado: ${language === 'es' ? 'ESPAÑOL (es-ES)' : 'INGLÉS (en-US)'}.
2. FORMATO Y ESTRUCTURA: Utiliza títulos, listas con viñetas, tablas de comparación en Markdown cuando sea adecuado. Evita párrafos densos e ilegibles.
3. CONTEXTO Y MEMORIA: Revisa el historial de conversación para comprender preguntas de seguimiento (ej. "¿Y cómo afecta al CH4?").
4. ETIQUETADO RIGUROSO:
   - Usa **[Dato Observado]** para mediciones reales o parámetros activos del sistema.
   - Usa **[Interpretación Científica]** para explicaciones científicas fundamentadas en la biogeoquímica del suelo y literatura IPCC.
   - Usa **[Hipótesis]** para escenarios hipotéticos no simulados aún en la plataforma.
5. POLÍTICA ESTRICTA DE ANTI-ALUCINACIÓN: NUNCA inventes números específicos de lluvia en fechas no registradas, coordenadas ficticias o datos no disponibles. Si te piden un dato no registrado en el sistema, responde exactamente:
   "${language === 'es' ? 'No dispongo de información suficiente en los registros del sistema para responder con precisión.' : 'I do not have sufficient information in the system records to answer with precision.'}"
6. MODO DE EXPLICACIÓN: Adapta la profundidad si el usuario pide explicación sencilla, técnica, en 3 puntos o detallada.`;

                // Build history context string
                const historyStr = historyMessages
                  .slice(-6)
                  .map(m => `${m.sender === 'user' ? 'Usuario' : 'Asistente'}: ${m.text}`)
                  .join('\n');

                const prompt = `${systemPrompt}\n\nHISTORIAL DE CONVERSACIÓN RECIENTE:\n${historyStr}\n\nPregunta actual del usuario: ${userMessage}`;
                
                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: prompt,
                });
                assistantResponse = response.text || '';
              } catch (genAiError) {
                console.warn('Gemini API call failed, using domain fallback engine:', genAiError);
              }
            }

            // Fallback Domain RAG Engine if API Key is not set or fails
            if (!assistantResponse) {
              assistantResponse = generateAdvancedDomainFallback(userMessage, language, contextInfo, historyMessages);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              response: assistantResponse,
              language
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), chatApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
