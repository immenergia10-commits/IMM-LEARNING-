import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Volume2, ArrowRight, Trophy, Bot, Sparkles, UserPlus, RotateCcw, Zap, Eye, BookOpen, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatWithTutor } from '../services/geminiService';
import MiniFlashcards from '../components/MiniFlashcards';

type StudyMode = 'reading' | 'quiz' | 'debate' | 'roleplay' | 'complete' | 'failed';

export default function StudyDocumentScreen() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user, library, addXP, isSupervisionMode, toggleSupervisionMode } = useAppStore();
  
  const item = library.find(i => i.id === itemId);
  const material = item?.studyMaterial;

  const [mode, setMode] = React.useState<StudyMode>('reading');
  const [currentSectionIndex, setCurrentSectionIndex] = React.useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState(false);
  const [isReading, setIsReading] = React.useState(false);
  const [score, setScore] = React.useState({ correct: 0, total: 0 });

  // Debate/Roleplay state
  const [chatMessages, setChatMessages] = React.useState<{role: 'bot' | 'user', text: string}[]>([]);
  const [chatInput, setChatInput] = React.useState('');
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [explanationText, setExplanationText] = React.useState('');
  const [isExplaining, setIsExplaining] = React.useState(false);
  const [showMiniFlashcards, setShowMiniFlashcards] = React.useState(false);
  const [activeHotspot, setActiveHotspot] = React.useState<number | null>(null);
  
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  React.useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!item || !material || !material.sections || material.sections.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#1e1e2f] z-[60] flex flex-col items-center justify-center p-10 text-center">
        <h2 className="text-2xl font-black text-white uppercase mb-4">Documento no listo</h2>
        <p className="text-slate-400 mb-8">El material de estudio para este documento no se ha generado correctamente o está vacío.</p>
        <button onClick={() => navigate('/library')} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider">
          Volver a biblioteca
        </button>
      </div>
    );
  }

  const currentSection = material.sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions?.[currentQuestionIndex];

  const getDocumentImage = (hint?: string, index?: number) => {
    if (item.documentImages && item.documentImages.length > 0) {
      const imgIndex = (index || 0) % item.documentImages.length;
      return {
        src: item.documentImages[imgIndex],
        isReal: true
      };
    }
    if (hint) {
      return {
        src: `https://picsum.photos/seed/${encodeURIComponent(hint)}/800/400`,
        isReal: false
      };
    }
    return null;
  };

  const handleCheck = () => {
    if (selectedOption === null || !currentQuestion) return;
    
    const correct = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    setShowExplanation(false);
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    
    if (mode === 'reading') {
      setMode('quiz');
    } else if (mode === 'quiz') {
      if (currentQuestionIndex < (currentSection?.questions?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowExplanation(false);
      } else if (currentSectionIndex < material.sections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowExplanation(false);
        setActiveHotspot(null);
        setMode('reading');
      } else {
        setMode('debate');
        setChatMessages([{
          role: 'bot',
          text: `¡Excelente trabajo con las secciones! Ahora, debatamos un poco. ¿Qué opinas sobre: ${material.debateTopics?.[0] || 'este tema'}?`
        }]);
      }
    } else if (mode === 'debate') {
      setMode('roleplay');
      const scenario = material.roleplayScenarios?.[0];
      setChatMessages([{
        role: 'bot',
        text: `Iniciemos un Roleplay. Escenario: ${scenario?.title || 'Simulación'}. ${scenario?.description || 'Actúa según tu rol'}. Tú eres: ${scenario?.role || 'Especialista'}. ¡Adelante!`
      }]);
    } else if (mode === 'roleplay') {
      const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;
      if (percentage >= 85) {
        setMode('complete');
        addXP(100);
      } else {
        setMode('failed');
      }
    } else {
      navigate('/library');
    }
  };

  const handleRetry = () => {
    setMode('reading');
    setCurrentSectionIndex(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setScore({ correct: 0, total: 0 });
    setChatMessages([]);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = { role: 'user' as const, text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await chatWithTutor(chatInput, `Contexto del documento: ${material.summary}. Modo: ${mode}`);
      setChatMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleBack = () => {
    if (mode === 'quiz') {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowExplanation(false);
      } else {
        setMode('reading');
      }
    } else if (mode === 'reading') {
      if (currentSectionIndex > 0) {
        setCurrentSectionIndex(prev => prev - 1);
        setMode('quiz');
        // Set to last question of previous section
        const prevSection = material.sections[currentSectionIndex - 1];
        setCurrentQuestionIndex((prevSection.questions?.length || 1) - 1);
      }
    } else if (mode === 'debate') {
      setMode('quiz');
      setCurrentQuestionIndex((currentSection.questions?.length || 1) - 1);
    } else if (mode === 'roleplay') {
      setMode('debate');
    }
  };

  const toggleReadAloud = () => {
    if (!currentSection.content) return;
    if (!isReading) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentSection.content);
      utteranceRef.current = utterance;
      
      // Try to find a more "human" voice
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural')));
      if (spanishVoice) utterance.voice = spanishVoice;
      
      utterance.lang = 'es-ES';
      utterance.rate = 0.95; 
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setIsReading(false);
        utteranceRef.current = null;
      };
      
      utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance error', event);
        setIsReading(false);
        utteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    } else {
      window.speechSynthesis.cancel();
      setIsReading(false);
      utteranceRef.current = null;
    }
  };

  const handleExplain = async () => {
    if (!currentQuestion) return;
    setIsExplaining(true);
    setShowExplanation(true);
    try {
      const response = await chatWithTutor(`Explica por qué la respuesta correcta a "${currentQuestion.question}" es "${currentQuestion.options[currentQuestion.correctAnswer]}".`, "Eres un tutor experto y amigable. Explica de forma concisa y clara.");
      setExplanationText(response);
    } catch (e) {
      setExplanationText("Hubo un error al obtener la explicación.");
    } finally {
      setIsExplaining(false);
    }
  };

  React.useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  if (mode === 'failed') {
    const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;
    return (
      <div className="fixed inset-0 bg-[#1e1e2f] z-[60] flex flex-col items-center md:justify-center text-slate-100">
        <div className="w-full max-w-3xl bg-[#1e1e2f] h-full md:h-auto md:max-h-[90vh] md:rounded-3xl md:shadow-2xl flex flex-col relative overflow-hidden md:border md:border-slate-700">
          <header className="px-6 py-4 flex items-center justify-between">
            <button onClick={() => navigate('/library')} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <div className="text-sm font-bold text-purple-400 uppercase tracking-widest">Resultados</div>
            <div className="w-6"></div>
          </header>

          <main className="flex-1 px-6 py-8 overflow-y-auto flex flex-col items-center justify-center text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="space-y-6 w-full"
            >
              <div className="text-6xl mb-4 animate-bounce">💪</div>
              <h2 className="text-3xl font-black text-white uppercase">¡Casi lo logras!</h2>
              <p className="text-slate-400 font-medium">Necesitas un 85% para aprobar este documento. ¡Sigue practicando!</p>
              
              <div className="bg-[#2a2a40] p-6 rounded-2xl border border-slate-700 max-w-sm mx-auto mt-8">
                <div className="text-5xl font-black text-white mb-2">{percentage}%</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Precisión</div>
                <div className="mt-4 flex justify-center gap-2">
                  <span className="text-green-400 font-bold">{score.correct} correctas</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-red-400 font-bold">{score.total - score.correct} incorrectas</span>
                </div>
              </div>
            </motion.div>
          </main>

          <footer className="p-6 border-t border-slate-700 bg-[#252538] flex flex-col gap-3">
            <button 
              onClick={handleRetry} 
              className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg shadow-lg bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} /> Reintentar Documento
            </button>
            <button 
              onClick={() => navigate('/library')} 
              className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-slate-400 hover:text-white transition-all flex items-center justify-center"
            >
              Volver a Biblioteca
            </button>
          </footer>
        </div>
      </div>
    );
  }

  if (mode === 'complete') {
    const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;
    return (
      <div className="fixed inset-0 bg-[#1e1e2f] z-[60] flex flex-col items-center md:justify-center text-slate-100">
        <div className="w-full max-w-3xl bg-[#1e1e2f] h-full md:h-auto md:max-h-[90vh] md:rounded-3xl md:shadow-2xl flex flex-col relative overflow-hidden md:border md:border-slate-700">
          <header className="px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/library')} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="text-sm font-bold text-purple-400 uppercase tracking-widest">Resumen</div>
          <div className="w-6"></div>
        </header>

        <main className="flex-1 px-6 py-8 overflow-y-auto flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="space-y-6 w-full"
          >
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-black text-white uppercase">¡Documento Dominado!</h2>
            <p className="text-slate-400 font-medium">Has completado el estudio metódico de este documento.</p>
            
            <div className="bg-[#2a2a40] p-6 rounded-2xl border border-slate-700 max-w-sm mx-auto mt-4">
              <div className="text-5xl font-black text-white mb-2">{percentage}%</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Precisión</div>
            </div>

            <div className="space-y-3 text-left w-full mt-6">
              {material.sections.map((c, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="bg-[#2a2a40] p-4 rounded-xl border border-slate-700 flex items-center gap-3"
                >
                  <div className="bg-purple-600 text-white p-1 rounded-full shrink-0">
                    <Check size={16} />
                  </div>
                  <span className="font-bold text-white">{c.title}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </main>

        <footer className="p-6 border-t border-slate-700 bg-[#252538]">
          <button 
            onClick={() => navigate('/library')} 
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg shadow-lg bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
          >
            Finalizar y Ganar XP (+100) <Trophy size={20} />
          </button>
        </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#1e1e2f] z-[60] flex flex-col items-center md:justify-center text-slate-100">
      <div className="w-full max-w-5xl bg-[#1e1e2f] h-full md:h-[90vh] md:rounded-3xl md:shadow-2xl flex flex-col relative overflow-hidden md:border md:border-slate-700">
        {/* Success/Error Animation Overlay */}
      <AnimatePresence>
        {mode === 'quiz' && isAnswered && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-40 h-40 rounded-full flex items-center justify-center shadow-2xl",
              isCorrect ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"
            )}
          >
            {isCorrect ? <Check size={80} className="text-white" /> : <X size={80} className="text-white" />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-700">
        <button onClick={() => navigate('/library')} className="text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
            {isSupervisionMode ? 'MODO SUPERVISAR' : mode}
          </span>
          <h2 className="text-sm font-bold text-slate-300 truncate max-w-[150px]">{material.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <button 
              onClick={toggleSupervisionMode}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg",
                isSupervisionMode ? "bg-amber-500 text-white shadow-amber-500/20" : "bg-slate-800 text-slate-400 hover:text-white"
              )}
              title={isSupervisionMode ? "Cambiar a Modo Estudio" : "Cambiar a Modo Supervisar"}
            >
              {isSupervisionMode ? <Eye size={20} /> : <BookOpen size={20} />}
            </button>
          )}
          <button 
            onClick={() => setShowMiniFlashcards(true)}
            className="w-10 h-10 rounded-full bg-purple-600/10 text-purple-400 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-lg shadow-purple-600/10"
            title="Repaso rápido"
          >
            <Zap size={20} fill="currentColor" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 overflow-y-auto">
        {isSupervisionMode ? (
          <div className="space-y-12 pb-20">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-8">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Settings size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">Panel de Supervisión</h3>
              </div>
              <p className="text-xs text-slate-400">Estás viendo todo el material generado. Como administrador puedes revisar cada sección y sus preguntas asociadas.</p>
            </div>

            {material.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-6 border-l-2 border-slate-800 pl-6 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 border-4 border-[#1e1e2f]"></div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{section.title}</h3>
                
                {section.imageHint && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 max-w-md">
                    {(() => {
                      const img = getDocumentImage(section.imageHint, sIdx);
                      if (!img) return null;
                      return (
                        <div className="relative">
                          <img src={img.src} alt="Preview" className="w-full h-auto opacity-50" />
                          {section.hotspots?.map((hs, hIdx) => (
                            <div 
                              key={hIdx}
                              className="absolute w-4 h-4 bg-cyan-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                              style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                              title={`${hs.label}: ${hs.description}`}
                            >
                              {hIdx + 1}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="bg-[#2a2a40] p-6 rounded-2xl border border-slate-700">
                  <p className="text-slate-300 leading-relaxed">{section.content}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-[#1e1e2f] p-4 rounded-xl border border-slate-800">
                      <p className="font-bold text-white text-sm mb-3">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <div 
                            key={oIdx} 
                            className={cn(
                              "text-xs p-2 rounded-lg border",
                              oIdx === q.correctAnswer ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-slate-800/50 border-slate-700 text-slate-500"
                            )}
                          >
                            {opt} {oIdx === q.correctAnswer && '✓'}
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-[10px] text-slate-500 italic">Explicación: {q.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-8 border-t border-slate-800">
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Debate y Roleplay</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#2a2a40] p-4 rounded-xl border border-slate-700">
                  <p className="text-xs font-bold text-purple-400 uppercase mb-2">Temas de Debate</p>
                  <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                    {material.debateTopics.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
                <div className="bg-[#2a2a40] p-4 rounded-xl border border-slate-700">
                  <p className="text-xs font-bold text-purple-400 uppercase mb-2">Escenarios de Roleplay</p>
                  <div className="space-y-3">
                    {material.roleplayScenarios.map((s, i) => (
                      <div key={i} className="text-xs">
                        <p className="font-bold text-white">{s.title}</p>
                        <p className="text-slate-400">{s.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {mode === 'reading' && (
            <motion.div key="reading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{currentSection.title}</h3>
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-1">Sección {currentSectionIndex + 1} de {material.sections.length}</p>
                </div>
              </div>

              {/* Step 1: Interactive Image */}
              {currentSection.imageHint && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                    <Sparkles size={14} className="text-purple-400" />
                    <span>Explora la imagen interactiva</span>
                  </div>
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative rounded-3xl overflow-hidden border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group bg-[#161625]"
                  >
                    {(() => {
                      const img = getDocumentImage(currentSection.imageHint, currentSectionIndex);
                      if (!img) return null;
                      return (
                        <div className="relative aspect-video flex items-center justify-center overflow-hidden">
                          <img 
                            src={img.src} 
                            alt="Visual Aid" 
                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Hotspots */}
                          {currentSection.hotspots?.map((hs, idx) => (
                            <div 
                              key={idx}
                              className="absolute"
                              style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                            >
                              <button
                                onClick={() => setActiveHotspot(activeHotspot === idx ? null : idx)}
                                className={cn(
                                  "w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white shadow-2xl transition-all",
                                  activeHotspot === idx 
                                    ? "bg-cyan-500 scale-125 ring-4 ring-cyan-500/30" 
                                    : "bg-purple-600 hover:bg-purple-500 animate-pulse"
                                )}
                              >
                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                              </button>
                              
                              <AnimatePresence>
                                {activeHotspot === idx && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute bottom-10 left-0 -translate-x-1/2 w-64 bg-[#2a2a40]/95 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-30 pointer-events-none"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                      <p className="text-xs font-black text-white uppercase tracking-tighter">{hs.label}</p>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{hs.description}</p>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2a2a40] rotate-45 border-r border-b border-cyan-500/30" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}

                          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#161625] to-transparent opacity-80 pointer-events-none"></div>
                          <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end pointer-events-none">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest bg-purple-600/80 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                              {img.isReal ? '🔍 Evidencia del Documento' : '🤖 Ilustración de Apoyo'}
                            </p>
                            {currentSection.hotspots && currentSection.hotspots.length > 0 && (
                              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-cyan-400/20">
                                {currentSection.hotspots.length} Puntos Interactivos
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                </div>
              )}

              {/* Step 2: Text Explanation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                  <BookOpen size={14} className="text-cyan-400" />
                  <span>Explicación Detallada</span>
                </div>
                <div className="bg-[#252538] p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Bot size={120} />
                  </div>
                  <p className="text-slate-200 leading-relaxed text-lg font-medium relative z-10 whitespace-pre-wrap">
                    {currentSection.content}
                  </p>
                  <button 
                    onClick={toggleReadAloud}
                    className={cn(
                      "absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all z-20",
                      isReading ? "bg-cyan-500 text-white animate-pulse" : "bg-purple-600 text-white hover:bg-purple-500 hover:scale-110"
                    )}
                  >
                    <Volume2 size={28} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              {currentQuestion.imageHint && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-lg mb-4">
                  {(() => {
                    const img = getDocumentImage(currentQuestion.imageHint, currentQuestionIndex + 100);
                    if (!img) return null;
                    return (
                      <>
                        <img 
                          src={img.src} 
                          alt="Question Context" 
                          className="w-full h-auto object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-[10px] font-bold text-white uppercase tracking-widest">
                          {img.isReal ? 'Imagen Extraída del Documento' : 'Ilustración Sugerida por IA'}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              <h2 className="text-2xl font-bold text-white leading-tight text-center mb-8">
                {currentQuestion.question}
              </h2>
              <div className="space-y-3">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={isAnswered}
                    onClick={() => setSelectedOption(i)}
                    className={cn(
                      "w-full text-left p-5 rounded-2xl border-2 transition-all font-bold",
                      selectedOption === i 
                        ? "border-purple-500 bg-purple-500/20 text-purple-100" 
                        : "border-slate-700 bg-[#2a2a40] text-slate-300 hover:border-slate-500"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {(mode === 'debate' || mode === 'roleplay') && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col space-y-4">
              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", msg.role === 'bot' ? "bg-[#2a2a40] text-purple-400 border border-slate-700" : "bg-purple-600 text-white")}>
                      {msg.role === 'bot' ? <Bot size={16} /> : <UserPlus size={16} />}
                    </div>
                    <div className={cn("p-4 rounded-2xl text-sm", msg.role === 'bot' ? "bg-[#2a2a40] text-slate-200 border border-slate-700" : "bg-purple-600 text-white")}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && <div className="text-xs text-slate-400 animate-pulse">Tutor escribiendo...</div>}
              </div>
              <div className="flex gap-2">
                <input 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 bg-[#2a2a40] border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder:text-slate-500"
                />
                <button onClick={handleChatSend} className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-500 transition-colors">
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </main>

      {/* Footer Actions */}
      <footer className={cn(
        "p-6 border-t transition-colors relative",
        mode === 'quiz' && isAnswered ? (isCorrect ? "bg-[#2a3b2c] border-green-900" : "bg-[#3b2a2a] border-red-900") : "bg-[#252538] border-slate-700"
      )}>
        <div className="max-w-3xl mx-auto flex items-end justify-between gap-4">
          {/* Mascot Area */}
          <div className="flex items-end gap-4 relative">
            <button
              onClick={handleBack}
              disabled={mode === 'reading' && currentSectionIndex === 0}
              className="w-12 h-12 rounded-xl bg-[#2a2a40] border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RotateCcw size={20} className="-scale-x-100" />
            </button>

            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-lg z-10 bg-[#1e1e2f]",
              mode === 'quiz' && isAnswered ? (isCorrect ? "border-green-500" : "border-red-500") : "border-slate-600"
            )}>
              <Bot size={32} className={mode === 'quiz' && isAnswered ? (isCorrect ? "text-green-400" : "text-red-400") : "text-purple-400"} />
            </div>
            
            {/* Speech Bubble */}
            <AnimatePresence>
              {mode === 'quiz' && isAnswered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "absolute bottom-full left-0 mb-4 w-max max-w-[280px] p-4 rounded-2xl rounded-bl-none border shadow-xl z-20",
                    isCorrect ? "bg-[#1a2f1e] border-green-800" : "bg-[#2f1a1a] border-red-800"
                  )}
                >
                  <p className={cn("text-sm font-bold mb-1", isCorrect ? "text-green-400" : "text-red-400")}>
                    {isCorrect ? '¡Correcto!' : 'Respuesta incorrecta.'}
                  </p>
                  
                  {showExplanation ? (
                    <div className="mt-2 text-xs text-slate-300">
                      {isExplaining ? (
                        <span className="animate-pulse">El tutor está escribiendo...</span>
                      ) : (
                        <p>{explanationText}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300">{currentQuestion.explanation}</p>
                  )}
                  
                  {isCorrect && !showExplanation && (
                    <button 
                      onClick={handleExplain} 
                      className="mt-3 flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Sparkles size={14} /> ¿Quieres que te lo explique?
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {(mode === 'reading' || mode === 'quiz') && (
            <button
              onClick={mode === 'quiz' && !isAnswered ? handleCheck : handleNext}
              disabled={mode === 'quiz' && selectedOption === null && !isAnswered}
              className={cn(
                "px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg transition-all flex items-center justify-center gap-2",
                mode === 'quiz' && isAnswered 
                  ? (isCorrect ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white")
                  : "bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
              )}
            >
              {mode === 'quiz' && !isAnswered ? 'Comprobar' : 'Continuar'}
            </button>
          )}
          {(mode === 'debate' || mode === 'roleplay') && (
            <button
              onClick={handleNext}
              className="px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg transition-all flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Siguiente Fase
            </button>
          )}
        </div>
      </footer>

      <AnimatePresence>
        {showMiniFlashcards && (
          <MiniFlashcards 
            onClose={() => setShowMiniFlashcards(false)} 
            filterId={itemId}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
