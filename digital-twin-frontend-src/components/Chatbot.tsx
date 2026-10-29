import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Square, 
  RotateCcw, 
  X, 
  Sparkles,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile } from '../types';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface ChatbotProps {
  activeTab: string;
  currentUser: UserProfile;
  activeSimulationState?: any;
}

export const Chatbot: React.FC<ChatbotProps> = ({ activeTab, currentUser, activeSimulationState }) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: language === 'es'
        ? '¡Hola! Soy el **Asistente Virtual Inteligente** del Gemelo Digital Chirimayo.\n\nPuedo responder preguntas sobre:\n* 🌿 **Turberas altoandinas y balance CO₂–CH₄**\n* ⚙️ **Uso del sistema y simulador IPCC Tier 2**\n* 📊 **Metodología BACI y retribución MERESE (Ley 30215)**\n\n¿En qué te puedo ayudar hoy?'
        : 'Hello! I am the **Intelligent Virtual Assistant** of the Chirimayo Digital Twin.\n\nI can answer questions regarding:\n* 🌿 **High-Andean Peatlands & CO₂–CH₄ Balance**\n* ⚙️ **System Operations & IPCC Tier 2 Simulator**\n* 📊 **BACI Methodology & MERESE Valuation (Law 30215)**\n\nHow can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom when messages change or thinking state changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isThinking]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Update initial welcome message language if language changes and history is default
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome-1') {
        return [{
          id: 'welcome-1',
          sender: 'assistant',
          text: language === 'es'
            ? '¡Hola! Soy el **Asistente Virtual Inteligente** del Gemelo Digital Chirimayo.\n\nPuedo responder preguntas sobre:\n* 🌿 **Turberas altoandinas y balance CO₂–CH₄**\n* ⚙️ **Uso del sistema y simulador IPCC Tier 2**\n* 📊 **Metodología BACI y retribución MERESE (Ley 30215)**\n\n¿En qué te puedo ayudar hoy?'
            : 'Hello! I am the **Intelligent Virtual Assistant** of the Chirimayo Digital Twin.\n\nI can answer questions regarding:\n* 🌿 **High-Andean Peatlands & CO₂–CH₄ Balance**\n* ⚙️ **System Operations & IPCC Tier 2 Simulator**\n* 📊 **BACI Methodology & MERESE Valuation (Law 30215)**\n\nHow can I assist you today?',
          timestamp: prev[0].timestamp
        }];
      }
      return prev;
    });
  }, [language]);

  // ----------------------------------------------------
  // Speech Recognition (STT Voice Input)
  // ----------------------------------------------------
  const startSpeechRecognition = () => {
    setErrorMessage(null);
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setErrorMessage(t('chatbot.errors.micNotSupported'));
      return;
    }

    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        return;
      }

      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'es' ? 'es-ES' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(t('chatbot.errors.micPermissionDenied'));
        } else if (event.error !== 'no-speech') {
          setErrorMessage(t('chatbot.errors.speechError'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Speech error:', err);
      setIsListening(false);
      setErrorMessage(t('chatbot.errors.speechError'));
    }
  };

  // ----------------------------------------------------
  // Text-To-Speech (TTS Voice Output)
  // ----------------------------------------------------
  const handleSpeak = (messageId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      setErrorMessage(t('chatbot.errors.ttsNotSupported'));
      return;
    }

    // Clean markdown tags for natural speech reading
    const cleanText = text
      .replace(/#|\*|_|`|\[.*?\]\(.*?\)/g, '')
      .replace(/\[Dato Observado\]|\[Interpretación Científica\]|\[Hipótesis\]|\[Mecanismo\]|\[Implicación\]|\[Limitación\]/g, '')
      .replace(/\|/g, ' ');

    window.speechSynthesis.cancel();

    if (currentlySpeakingId === messageId) {
      setCurrentlySpeakingId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 1.0;

    utterance.onstart = () => setCurrentlySpeakingId(messageId);
    utterance.onend = () => setCurrentlySpeakingId(null);
    utterance.onerror = () => setCurrentlySpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingId(null);
  };

  // ----------------------------------------------------
  // Copy to Clipboard Action
  // ----------------------------------------------------
  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ----------------------------------------------------
  // Send Message Core Pipeline
  // ----------------------------------------------------
  const handleSendMessage = async (textToSend?: string, isRegeneration = false) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    setErrorMessage(null);
    let updatedMessages = [...messages];

    if (!isRegeneration) {
      const userMsgId = 'user-' + Date.now();
      const newMsg: Message = {
        id: userMsgId,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updatedMessages = [...messages, newMsg];
      setMessages(updatedMessages);
      setInputMessage('');
    }

    setIsThinking(true);

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          context: {
            module: activeTab,
            userRole: currentUser.role,
            userName: currentUser.name,
            simulationState: activeSimulationState
          },
          history: updatedMessages.slice(-6)
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const botResponseText = data.response || (language === 'es' ? 'No se pudo generar respuesta.' : 'Could not generate response.');

      const botMsg: Message = {
        id: 'assistant-' + Date.now(),
        sender: 'assistant',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackText = language === 'es'
        ? 'El Asistente está experimentando problemas de red con el backend. Por favor intenta nuevamente.'
        : 'The Assistant is experiencing network issues with the backend. Please try again.';

      setMessages(prev => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          sender: 'assistant',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // ----------------------------------------------------
  // Regenerate Response Action
  // ----------------------------------------------------
  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      // Remove last assistant message if any
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].sender === 'assistant') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      handleSendMessage(lastUserMsg.text, true);
    }
  };

  const handleClearHistory = () => {
    handleStopSpeech();
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        text: language === 'es'
          ? 'Nueva conversación iniciada. ¿Cómo puedo ayudarte hoy?'
          : 'New conversation started. How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // ----------------------------------------------------
  // Markdown & Message Rendering
  // ----------------------------------------------------
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    let inTable = false;
    let tableHeader: string[] = [];
    let tableRows: string[][] = [];
    const elements: React.ReactNode[] = [];

    const flushTable = (keyPrefix: number) => {
      if (tableHeader.length > 0) {
        elements.push(
          <div key={`table-${keyPrefix}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-200/80 dark:bg-slate-850 text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-750 font-semibold">
                  {tableHeader.map((h, i) => (
                    <th key={i} className="px-2.5 py-1.5 font-bold uppercase tracking-wider">{h.replace(/\*\*/g, '').trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white/50 dark:bg-slate-950/50">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-2.5 py-1.5 whitespace-nowrap text-slate-800 dark:text-slate-200 font-sans">{cell.replace(/\*\*/g, '').trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeader = [];
        tableRows = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Table line
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
        if (cells.every(c => /^[:\s-]+$/.test(c))) {
          // Alignment separator row, skip
          return;
        }
        if (!inTable) {
          inTable = true;
          tableHeader = cells;
        } else {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        inTable = false;
        flushTable(index);
      }

      // Headers (###)
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="font-bold text-xs text-emerald-700 dark:text-emerald-400 mt-2 mb-1 tracking-tight flex items-center gap-1.5">
            {trimmed.replace('### ', '')}
          </h4>
        );
        return;
      }

      // Blockquotes (>)
      if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={index} className="my-1.5 pl-2.5 py-1 border-l-2 border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 italic text-[11px] rounded-r">
            {trimmed.replace('> ', '')}
          </blockquote>
        );
        return;
      }

      // Bullet points (*)
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        elements.push(
          <div key={index} className="flex items-start gap-1.5 my-0.5 pl-1 text-[11.5px]">
            <span className="text-emerald-500 font-bold">•</span>
            <span className="flex-1">{trimmed.substring(2)}</span>
          </div>
        );
        return;
      }

      // Normal text with bold inline formatting
      if (trimmed.length > 0) {
        elements.push(
          <p key={index} className="my-0.5 leading-relaxed">
            {line}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return elements;
  };

  return (
    <>
      {/* Launcher Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-2xl hover:shadow-emerald-500/30 border border-emerald-400/40 hover:scale-105 transition-all duration-300 cursor-pointer group"
          title={t('chatbot.launcherTooltip')}
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-950" />
          </div>
          <span className="font-semibold text-xs sm:text-sm tracking-wide hidden sm:inline">
            {t('chatbot.launcherText')}
          </span>
        </button>
      )}

      {/* Floating Chat Modal Container */}
      {isOpen && (
        <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 w-[calc(100vw-24px)] sm:w-[460px] h-[620px] max-h-[calc(100vh-30px)] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 transition-colors">
          
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-100 via-emerald-50 to-slate-100 dark:from-slate-900 dark:via-emerald-950/80 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md border border-emerald-400/40">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
                    {t('chatbot.title')}
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    {t('chatbot.online')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>{t('chatbot.currentContext')}:</span>
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 uppercase font-medium">{activeTab.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                title={t('chatbot.clearHistory')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  handleStopSpeech();
                  setIsOpen(false);
                }}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                title={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-100 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-800/80 px-3 py-1.5 text-[11px] text-rose-900 dark:text-rose-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-600 dark:text-rose-400 hover:text-rose-900 text-xs cursor-pointer">×</button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs font-sans scrollbar-thin">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              const isSpeakingThis = currentlySpeakingId === msg.id;
              const isCopiedThis = copiedId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[86%] group relative ${isAssistant ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`p-3 rounded-2xl shadow-xs text-[12px] leading-relaxed transition-all ${
                        isAssistant
                          ? msg.isError
                            ? 'bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-tl-none'
                            : 'bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-md shadow-emerald-950/30'
                      }`}
                    >
                      {isAssistant ? (
                        <div className="space-y-1">
                          {renderFormattedMarkdown(msg.text)}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>

                    {/* Metadata & Controls */}
                    <div className={`flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 dark:text-slate-500 ${isAssistant ? 'justify-between' : 'justify-end'}`}>
                      <span>{msg.timestamp}</span>

                      {isAssistant && !msg.isError && (
                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={t('chatbot.copy')}
                          >
                            {isCopiedThis ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopiedThis ? t('chatbot.copied') : t('chatbot.copy')}</span>
                          </button>

                          {/* Speak Button */}
                          <button
                            onClick={() => handleSpeak(msg.id, msg.text)}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                              isSpeakingThis 
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-medium' 
                                : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                            title={isSpeakingThis ? t('chatbot.stop') : t('chatbot.listen')}
                          >
                            <Volume2 className={`w-3 h-3 ${isSpeakingThis ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : ''}`} />
                            <span>{isSpeakingThis ? t('chatbot.stop') : t('chatbot.listen')}</span>
                          </button>

                          {/* Regenerate Button for last message */}
                          {messages[messages.length - 1]?.id === msg.id && (
                            <button
                              onClick={handleRegenerate}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title={t('chatbot.regenerate')}
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>{t('chatbot.regenerate')}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Processing Indicator */}
            {isThinking && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs py-1">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span className="text-[11px] font-mono animate-pulse text-emerald-600 dark:text-emerald-400">
                  {t('chatbot.thinking')}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Active Audio Playback Floating Bar */}
          {currentlySpeakingId && (
            <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 border-t border-emerald-300 dark:border-emerald-800/80 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 animate-bounce text-emerald-600 dark:text-emerald-400" />
                <span>{t('chatbot.speaking')}</span>
              </div>
              <button
                onClick={handleStopSpeech}
                className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-medium cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>{t('chatbot.stop')}</span>
              </button>
            </div>
          )}

          {/* Listening STT State Bar */}
          {isListening && (
            <div className="px-3 py-1.5 bg-cyan-100 dark:bg-cyan-950/80 border-t border-cyan-300 dark:border-cyan-800/80 text-[11px] text-cyan-900 dark:text-cyan-300 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-ping" />
                <span className="font-mono font-medium">{t('chatbot.listening')} ({language === 'es' ? 'es-ES' : 'en-US'})</span>
              </div>
              <button
                onClick={startSpeechRecognition}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2 transition-colors">
            <button
              onClick={startSpeechRecognition}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_12px_rgba(225,29,72,0.5)]'
                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border-slate-300 dark:border-slate-700'
              }`}
              title={t('chatbot.microphone')}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={t('chatbot.placeholder')}
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isThinking}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md transition-all cursor-pointer"
              title={t('chatbot.send')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

