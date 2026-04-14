import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, User, Paperclip, Loader2 } from 'lucide-react';
import { chatWithTutor } from '../services/geminiService';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: number;
}

export default function TutorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu tutor de IMM Academy. ¿En qué puedo ayudarte hoy con respecto a generadores o sistemas de energía?',
      sender: 'bot',
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithTutor(input);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response || 'No pude procesar tu solicitud.',
        sender: 'bot',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
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
                <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                  <Bot size={24} />
                </div>
                <div>
                  <h2 className="font-black text-lg text-blue-900 leading-none uppercase tracking-tight">Tutor IA</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Experto en Energía IMM</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
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
                    "p-4 rounded-2xl shadow-sm",
                    msg.sender === 'bot' 
                      ? "bg-slate-50 text-slate-800 rounded-tl-none" 
                      : "bg-blue-600 text-white rounded-tr-none"
                  )}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
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
              <div className="bg-slate-50 rounded-2xl p-2 flex items-center gap-2 focus-within:ring-2 ring-blue-500/20 transition-all">
                <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
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
                  disabled={!input.trim() || isLoading}
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
