import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, User, Paperclip, Loader2, FileText } from 'lucide-react';
import { chatWithTutor } from '../services/geminiService';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: number;
  attachment?: { url: string; mimeType: string; name: string };
}

export default function TutorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [attachment, setAttachment] = React.useState<{ file: File; base64: string } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load from Local Storage on mount
  React.useEffect(() => {
    const savedChat = localStorage.getItem('cpu_imm_chat_history');
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        setMessages([{
          id: '1',
          text: 'Soy CPU-IMM, tu Evaluador Senior. Las dudas o errores básicos en el campo cuestan tiempo, eficiencia y seguridad. ¿Cuál es tu consulta operativa hoy?',
          sender: 'bot',
          timestamp: Date.now(),
        }]);
      }
    } else {
      setMessages([{
        id: '1',
        text: 'Soy CPU-IMM, tu Evaluador Senior. Las dudas o errores básicos en el campo cuestan tiempo, eficiencia y seguridad. ¿Cuál es tu consulta operativa hoy?',
        sender: 'bot',
        timestamp: Date.now(),
      }]);
    }
  }, []);

  // Save to Local Storage on messages change
  React.useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('cpu_imm_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, attachment]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo no debe superar los 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachment({ file, base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;
    if (isLoading) return;

    const base64Data = attachment ? attachment.base64.split(',')[1] : undefined;
    const attachmentMeta = attachment ? { url: attachment.base64, mimeType: attachment.file.type, name: attachment.file.name } : undefined;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim() || 'Archivo adjuntado para análisis.',
      sender: 'user',
      timestamp: Date.now(),
      attachment: attachmentMeta,
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setAttachment(null);
    setIsLoading(true);

    try {
      const response = await chatWithTutor(
        currentInput, 
        undefined, 
        attachment && base64Data ? { data: base64Data, mimeType: attachment.file.type } : undefined
      );
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response || 'No pude procesar tu solicitud.',
        sender: 'bot',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        text: 'Error de conexión. Las interferencias en la red anularon la transmisión.',
        sender: 'bot',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm max-w-md mx-auto">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white w-full h-[80vh] rounded-t-[32px] flex flex-col shadow-2xl relative overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>

            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                  <Bot size={24} />
                </div>
                <div>
                  <h2 className="font-black text-lg text-slate-800 leading-none uppercase tracking-tight">CPU-IMM</h2>
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">Evaluador Senior</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    localStorage.removeItem('cpu_imm_chat_history');
                    setMessages([{ id: '1', text: 'Historial borrado. Soy CPU-IMM. ¿En qué te asesoro?', sender: 'bot', timestamp: Date.now() }]);
                  }} 
                  className="text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors mr-2"
                >
                  Limpiar
                </button>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.sender === 'user' ? "flex-row-reverse ml-auto" : ""
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
                    msg.sender === 'bot' ? "bg-cyan-100 text-cyan-600" : "bg-blue-600 text-white"
                  )}>
                    {msg.sender === 'bot' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm flex flex-col gap-2",
                    msg.sender === 'bot' 
                      ? "bg-slate-50 text-slate-800 rounded-tl-none" 
                      : "bg-blue-600 text-white rounded-tr-none"
                  )}>
                    {msg.attachment && (
                      <div className="rounded-xl overflow-hidden border border-white/20 bg-black/10 flex items-center justify-center relative min-h-[60px]">
                        {msg.attachment.mimeType.startsWith('image/') ? (
                           <img src={msg.attachment.url} alt="Adjunto" className="w-full max-w-[200px] h-auto rounded-lg" />
                        ) : (
                          <div className="p-3 flex items-center gap-2 text-xs font-bold text-white">
                            <FileText size={16} /> Documento PDF Adjunto
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 pb-10 bg-white border-t border-slate-100">
              
              {/* Attachment Preview */}
              <AnimatePresence>
                {attachment && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, mb: 0 }}
                    animate={{ opacity: 1, height: 'auto', mb: 12 }}
                    exit={{ opacity: 0, height: 0, mb: 0 }}
                    className="relative inline-flex items-center gap-2 bg-slate-100 rounded-xl p-2 pr-4 border border-slate-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden text-slate-500">
                       {attachment.file.type.startsWith('image/') ? (
                         <img src={attachment.base64} alt="Preview" className="w-full h-full object-cover" />
                       ) : (
                         <FileText size={20} />
                       )}
                    </div>
                    <div className="flex flex-col min-w-0 max-w-[150px]">
                      <span className="text-xs font-bold text-slate-700 truncate">{attachment.file.name}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest text-left">{(attachment.file.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button 
                      onClick={() => setAttachment(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-slate-50 rounded-2xl p-2 flex items-center gap-2 focus-within:ring-2 ring-blue-500/20 transition-all">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                  title="Adjuntar Archivo"
                >
                  <Paperclip size={20} />
                </button>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 py-2 resize-none h-10 placeholder:text-slate-400" 
                  placeholder="Pregúntale al tutor..."
                />
                <button 
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachment) || isLoading}
                  className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:shadow-none"
                >
                  <Send size={20} fill="currentColor" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
