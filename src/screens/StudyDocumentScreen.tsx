import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Volume2, ArrowRight, Trophy, Bot, Sparkles, UserPlus, RotateCcw, Zap, Eye, BookOpen, Settings, Heart, Flame, Bookmark, BookmarkCheck, MessageSquare, Search, Maximize, Minimize, List, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatWithTutor } from '../services/geminiService';

type StudyMode = 'reading' | 'quiz' | 'debate' | 'roleplay' | 'complete' | 'failed' | 'gameover';

export default function StudyDocumentScreen() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user, library, addXP, loseLife, gainLife, incrementStreak, resetStreak, stats, isSupervisionMode, toggleSupervisionMode, bookmarks, addBookmark, removeBookmark, annotations, addAnnotation, deleteAnnotation, markDocumentCompleted } = useAppStore();
  
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
  const [activeHotspot, setActiveHotspot] = React.useState<number | null>(null);
  
  // New features state
  const [isImmersive, setIsImmersive] = React.useState(false);
  const [showTOC, setShowTOC] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAnnotationModal, setShowAnnotationModal] = React.useState(false);
  const [annotationText, setAnnotationText] = React.useState('');
  
  const [isSummarizing, setIsSummarizing] = React.useState(false);
  const [sectionSummary, setSectionSummary] = React.useState('');

  // Clear summary when section changes
  React.useEffect(() => {
    setSectionSummary('');
  }, [currentSectionIndex]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const res = await chatWithTutor(`Por favor resume esta sección de manera muy concisa, extrayendo las ideas más críticas y operativas (máximo 3 bullets): ${currentSection.content}`, "Eres un experto en pedagogía y resúmenes técnicos.");
      setSectionSummary(res);
    } catch (e) {
      setSectionSummary('Error al generar el resumen.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const documentBookmarks = React.useMemo(() => bookmarks.filter(b => b.documentId === itemId), [bookmarks, itemId]);
  const documentAnnotations = React.useMemo(() => annotations.filter(a => a.documentId === itemId && a.sectionIndex === currentSectionIndex), [annotations, itemId, currentSectionIndex]);

  const isCurrentSectionBookmarked = documentBookmarks.some(b => b.sectionIndex === currentSectionIndex);

  const handleToggleBookmark = () => {
    const existing = documentBookmarks.find(b => b.sectionIndex === currentSectionIndex);
    if (existing) {
      removeBookmark(existing.id);
    } else {
      addBookmark({
        id: Math.random().toString(36).substr(2, 9),
        documentId: itemId!,
        documentName: item!.name,
        sectionIndex: currentSectionIndex,
        sectionTitle: currentSection.title
      });
    }
  };

  const handleSaveAnnotation = () => {
    if (!annotationText.trim()) return;
    addAnnotation({
      id: Math.random().toString(36).substr(2, 9),
      documentId: itemId!,
      sectionIndex: currentSectionIndex,
      text: annotationText,
      date: new Date().toISOString()
    });
    setAnnotationText('');
    setShowAnnotationModal(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-cyan-500/50 text-white rounded px-1">{part}</mark> 
            : part
        )}
      </>
    );
  };

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

  // Restore progress on mount
  React.useEffect(() => {
    if (!itemId) return;
    const progressKey = `study-progress-${itemId}`;
    const saved = localStorage.getItem(progressKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentSectionIndex !== undefined && parsed.currentSectionIndex >= 0 && parsed.currentSectionIndex < material.sections.length) {
          setCurrentSectionIndex(parsed.currentSectionIndex);
          if (parsed.scrollTop) {
            setTimeout(() => {
               const scrollContainer = document.getElementById('study-scroll-container');
               if (scrollContainer) scrollContainer.scrollTop = parsed.scrollTop;
            }, 100);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved study progress", e);
      }
    }
  }, [itemId, material?.sections?.length]);

  // Save section progress
  React.useEffect(() => {
    if (itemId && mode === 'reading') {
        localStorage.setItem(`study-progress-${itemId}`, JSON.stringify({
          currentSectionIndex,
          scrollTop: 0
        }));
    }
  }, [currentSectionIndex, mode, itemId]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (!itemId || mode !== 'reading') return;
    const scrollTop = e.currentTarget.scrollTop;
    localStorage.setItem(`study-progress-${itemId}`, JSON.stringify({
      currentSectionIndex,
      scrollTop
    }));
  };

  const currentSection = material.sections[currentSectionIndex];
  
  const [quizDifficulty, setQuizDifficulty] = React.useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const activeQuestions = React.useMemo(() => {
    if (!currentSection?.questions) return [];
    if (quizDifficulty === 'all') return currentSection.questions;
    const filtered = currentSection.questions.filter(q => q.difficulty === quizDifficulty);
    return filtered.length > 0 ? filtered : currentSection.questions;
  }, [currentSection, quizDifficulty]);

  const currentQuestion = activeQuestions[currentQuestionIndex];

  const getDocumentImage = (hint?: string, index?: number) => {
    if (item.documentImages && item.documentImages.length > 0) {
      const imgIndex = (index || 0) % item.documentImages.length;
      return {
        src: item.documentImages[imgIndex],
        isReal: true
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

    if (correct) {
      addXP(10);
      incrementStreak();
    } else {
      resetStreak();
      loseLife();
      if (stats.lives - 1 <= 0) {
        setTimeout(() => setMode('gameover'), 2000);
      }
    }
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    
    if (mode === 'reading') {
      setMode('quiz');
    } else if (mode === 'quiz') {
      if (currentQuestionIndex < activeQuestions.length - 1) {
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
          text: `¡Excelente trabajo con los micro-desafíos! Ahora seré tu evaluador. ¿Qué opinas sobre: ${material.debateTopics?.[0] || 'este tema'}? Defiende tu punto técnica y operativamente.`
        }]);
      }
    } else if (mode === 'debate') {
      setMode('roleplay');
      const scenario = material.roleplayScenarios?.[0];
      setChatMessages([{
        role: 'bot',
        text: `Iniciemos la evaluación crítica final (Roleplay). Escenario: ${scenario?.title || 'Falla Crítica'}. ${scenario?.description || 'Actúa según el procedimiento estándar'}. Tu Rol: ${scenario?.role || 'Técnico de Turno'}. ¿Cuál es tu primera acción?`
      }]);
    } else if (mode === 'roleplay') {
      const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;
      if (percentage >= 85) {
        setMode('complete');
        addXP(200);
        if (itemId) markDocumentCompleted(itemId);
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
      setCurrentQuestionIndex(activeQuestions.length > 0 ? activeQuestions.length - 1 : 0);
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
      <div className={cn(
        "bg-[#1e1e2f] h-full flex flex-col relative overflow-hidden transition-all duration-500",
        isImmersive ? "w-full max-w-none md:rounded-none md:shadow-none md:border-none" : "w-full max-w-6xl md:h-[95vh] md:rounded-3xl md:shadow-2xl md:border md:border-slate-700"
      )}>
        
        {/* Main layout with Sidebar and Content */}
        <div className="flex flex-1 h-full overflow-hidden">
          
          {/* TOC Sidebar */}
          <AnimatePresence>
            {!isImmersive && showTOC && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-[#252538] border-r border-slate-700 h-full shrink-0 overflow-y-auto"
              >
                <div className="p-4 w-[280px]">
                  <h3 className="text-white font-black uppercase tracking-widest text-sm mb-4">Índice del Documento</h3>
                  <ul className="space-y-2">
                    {material.sections.map((sec, idx) => (
                      <li 
                        key={idx} 
                        className={cn(
                          "text-xs p-2 rounded-lg cursor-pointer transition-colors border",
                          currentSectionIndex === idx ? "bg-purple-600/20 text-purple-300 border-purple-500/30" : "hover:bg-[#2a2a40] text-slate-400 border-transparent"
                        )}
                        onClick={() => {
                          setMode('reading');
                          setCurrentSectionIndex(idx);
                          if(window.innerWidth < 768) setShowTOC(false); // Auto close on mobile
                        }}
                      >
                        {sec.title}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <h3 className="text-white font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                      <Bookmark size={14} /> Mis Marcadores
                    </h3>
                    {documentBookmarks.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No hay marcadores aún.</p>
                    ) : (
                      <ul className="space-y-2">
                        {documentBookmarks.map(b => (
                          <li key={b.id} className="text-xs text-slate-300 bg-[#2a2a40] p-2 rounded-lg flex items-center justify-between border border-slate-700">
                            <span 
                              className="cursor-pointer hover:text-purple-400 truncate max-w-[150px]" 
                              onClick={() => { setMode('reading'); setCurrentSectionIndex(b.sectionIndex); if(window.innerWidth < 768) setShowTOC(false); }}
                            >
                              Sec {b.sectionIndex + 1}: {b.sectionTitle}
                            </span>
                            <button onClick={() => removeBookmark(b.id)} className="text-red-400 hover:text-red-300 p-1 bg-red-400/10 rounded">
                              <X size={12}/>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col min-w-0">
            {/* Header (Hidden in Immersive) */}
            {!isImmersive && (
              <header className="px-6 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate('/library')} className="text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                  <button 
                    onClick={() => setShowTOC(!showTOC)}
                    className={cn("p-2 rounded-lg transition-colors border", showTOC ? "bg-purple-600/20 text-purple-400 border-purple-500/30" : "text-slate-400 border-transparent hover:bg-slate-800")}
                    title="Mostrar/Ocultar Índice"
                  >
                    <List size={20} />
                  </button>
                </div>
                <div className="flex flex-col items-center flex-1 mx-4">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                    {isSupervisionMode ? 'MODO SUPERVISAR' : mode}
                  </span>
                  <h2 className="text-sm font-bold text-slate-300 truncate max-w-[200px] md:max-w-md">{material.title}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsImmersive(true)} className="px-3 py-1.5 flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700" title="Activar Modo Lectura Inmersiva">
                     <Maximize size={16} /> <span className="text-xs font-bold uppercase hidden md:inline">Modo Inmersivo</span>
                  </button>

                  {/* Health & Streak Indicators */}
                  {!isSupervisionMode && (
                    <div className="hidden md:flex items-center gap-3 bg-[#2a2a40] px-3 py-1.5 rounded-full border border-slate-700">
                      <div className="flex items-center gap-1 text-red-500 font-black">
                        <Heart size={16} className="fill-current" />
                        <span className="text-sm">{stats.lives}</span>
                      </div>
                      <div className="w-[1px] h-4 bg-slate-700"></div>
                      <div className={cn("flex items-center gap-1 font-black", stats.tempStreak && stats.tempStreak > 0 ? "text-orange-400" : "text-slate-500")}>
                        <Flame size={16} className={stats.tempStreak && stats.tempStreak > 0 ? "fill-current" : ""} />
                        <span className="text-sm">{stats.tempStreak || 0}/3</span>
                      </div>
                    </div>
                  )}

                  {user?.role === 'admin' && (
                    <button 
                      onClick={toggleSupervisionMode}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0",
                        isSupervisionMode ? "bg-amber-500 text-white shadow-amber-500/20" : "bg-slate-800 text-slate-400 hover:text-white"
                      )}
                      title={isSupervisionMode ? "Cambiar a Modo Estudio" : "Cambiar a Modo Supervisar"}
                    >
                      {isSupervisionMode ? <Eye size={20} /> : <BookOpen size={20} />}
                    </button>
                  )}
                </div>
              </header>
            )}

            {/* Immersive Floating Tools */}
            {isImmersive && (
              <div className="absolute top-4 right-4 z-50 flex gap-2">
                <button onClick={() => setIsImmersive(false)} className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur text-white rounded-full transition-all shadow-xl">
                  <Minimize size={20} />
                </button>
              </div>
            )}

            <main id="study-scroll-container" onScroll={handleScroll} className={cn("flex-1 px-4 md:px-8 overflow-y-auto no-scrollbar scroll-smooth", isImmersive ? "py-12 max-w-4xl mx-auto w-full" : "py-8")}>
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
            <motion.div key="reading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 relative">
              
              {/* Floating Navigation Controls */}
              {!isImmersive && (
                <>
                  <button 
                    onClick={() => currentSectionIndex > 0 && setCurrentSectionIndex(prev => prev - 1)}
                    disabled={currentSectionIndex === 0}
                    className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-3 md:p-4 bg-purple-600/80 hover:bg-purple-600 rounded-full text-white shadow-xl backdrop-blur-sm disabled:opacity-0 disabled:pointer-events-none transition-all hidden sm:flex"
                    title="Sección Anterior"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={() => currentSectionIndex < material.sections.length - 1 && setCurrentSectionIndex(prev => prev + 1)}
                    disabled={currentSectionIndex === material.sections.length - 1}
                    className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-3 md:p-4 bg-purple-600/80 hover:bg-purple-600 rounded-full text-white shadow-xl backdrop-blur-sm disabled:opacity-0 disabled:pointer-events-none transition-all hidden sm:flex"
                    title="Siguiente Sección"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400 shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{currentSection.title}</h3>
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-1">Sección {currentSectionIndex + 1} de {material.sections.length}</p>
                  </div>
                </div>

                {/* Section Tools: Search, Bookmark, Annotate */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative bg-[#2a2a40] rounded-xl border border-slate-700 flex items-center px-3 py-1">
                    <Search size={14} className="text-slate-400 mr-2" />
                    <input 
                      type="text" 
                      placeholder="Buscar en sección..." 
                      className="bg-transparent border-none text-xs text-white focus:outline-none w-32 md:w-auto"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      title="Buscar texto en la lectura de esta sección"
                    />
                  </div>
                  <button 
                    onClick={handleToggleBookmark}
                    title="Añade esta sección actual a tus marcadores del índice"
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold",
                      isCurrentSectionBookmarked ? "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30" : "bg-[#2a2a40] border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
                    )}
                  >
                    {isCurrentSectionBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    <span className="hidden sm:inline">{isCurrentSectionBookmarked ? 'Guardado' : 'Guardar'}</span>
                  </button>
                  <button 
                    onClick={() => setShowAnnotationModal(true)}
                    title="Anota recordatorios propios para esta lectura"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-[#2a2a40] text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xs font-bold"
                  >
                    <MessageSquare size={14} /> <span className="hidden sm:inline">Anotar</span>
                  </button>
                </div>
              </div>

              {/* Summarize button */}
              <div className="mb-6">
                {sectionSummary ? (
                   <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl relative">
                     <button onClick={() => setSectionSummary('')} className="absolute top-2 right-2 text-purple-400 hover:text-purple-300"><X size={16}/></button>
                     <p className="text-purple-200 text-sm whitespace-pre-wrap leading-relaxed">{sectionSummary}</p>
                   </div>
                ) : (
                   <button onClick={handleSummarize} disabled={isSummarizing} className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest bg-cyan-400/10 hover:bg-cyan-400/20 px-4 py-2 rounded-xl">
                     {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                     {isSummarizing ? 'Generando resumen estratégico...' : 'Resumir con IA'}
                   </button>
                )}
              </div>

              {/* Step 1: Interactive Image */}
              {currentSection.imageHint && getDocumentImage(currentSection.imageHint, currentSectionIndex) && (
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
                                onMouseEnter={() => setActiveHotspot(idx)}
                                onMouseLeave={() => setActiveHotspot(null)}
                                onClick={() => setActiveHotspot(activeHotspot === idx ? null : idx)}
                                className={cn(
                                  "w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white shadow-2xl transition-all",
                                  activeHotspot === idx 
                                    ? "bg-amber-500 scale-125 ring-4 ring-amber-500/30" 
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
                                    className="absolute bottom-10 left-0 -translate-x-1/2 w-64 bg-[#2a2a40]/95 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-30 pointer-events-none"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                                      <p className="text-xs font-black text-white uppercase tracking-tighter">{hs.label}</p>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{hs.description}</p>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2a2a40] rotate-45 border-r border-b border-amber-500/30" />
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
                    {highlightText(currentSection.content, searchQuery)}
                  </p>
                  
                  {/* Display Annotations */}
                  {documentAnnotations.length > 0 && (
                    <div className="mt-8 relative z-10 border-t border-slate-700 pt-6 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                        <MessageSquare size={14}/> Tus Anotaciones
                      </h4>
                      {documentAnnotations.map(anno => (
                        <div key={anno.id} className="bg-[#1e1e2f] p-4 rounded-xl border border-slate-700 flex justify-between items-start gap-4 shadow-inner">
                           <p className="text-sm text-slate-300 italic whitespace-pre-wrap">"{anno.text}"</p>
                           <button onClick={() => deleteAnnotation(anno.id)} className="text-red-400 hover:text-red-300 shrink-0 p-1 bg-red-400/10 rounded-lg">
                             <X size={14} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}

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
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Preguntas de Tarea</h3>
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-1">Evaluación de la Sección {currentSectionIndex + 1}</p>
                </div>
              </div>

              {/* Difficulty Toggle */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {(['all', 'easy', 'medium', 'hard'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => {
                      setQuizDifficulty(diff);
                      setCurrentQuestionIndex(0);
                      setSelectedOption(null);
                      setIsAnswered(false);
                      setShowExplanation(false);
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      quizDifficulty === diff 
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                        : "bg-[#252538] text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700"
                    )}
                  >
                    {diff === 'all' ? 'Todos' : diff === 'easy' ? 'Fácil' : diff === 'medium' ? 'Medio' : 'Difícil'}
                  </button>
                ))}
              </div>

              {!currentQuestion ? (
                <div className="text-center py-10 text-slate-400">No hay preguntas de esta dificultad.</div>
              ) : (
                <>
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
              <div className="space-y-3" style={{ perspective: "1000px" }}>
                {currentQuestion.options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrectAnswer = currentQuestion.correctAnswer === i;
                  
                  let buttonClass = "border-slate-700 bg-[#2a2a40] text-slate-300 hover:border-slate-500 hover:bg-[#32324a]";
                  let scaleEffect = 1;
                  
                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      buttonClass = "border-green-500 bg-green-500/20 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.3)] z-10 relative";
                      scaleEffect = 1.02;
                    } else if (isSelected) {
                      buttonClass = "border-red-500 bg-red-500/20 text-red-100";
                    } else {
                      buttonClass = "border-slate-800 bg-[#1e1e2f] text-slate-600 opacity-50";
                    }
                  } else if (isSelected) {
                    buttonClass = "border-purple-500 bg-purple-500/20 text-purple-100 ring-4 ring-purple-500/10";
                  }

                  return (
                    <motion.button
                      key={i}
                      disabled={isAnswered}
                      onClick={() => setSelectedOption(i)}
                      animate={{ 
                        scale: scaleEffect,
                        x: isAnswered && isSelected && !isCorrectAnswer ? [-10, 10, -10, 10, 0] : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border-2 transition-all font-bold flex justify-between items-center",
                        buttonClass
                      )}
                    >
                      <span>{opt}</span>
                      {isAnswered && isCorrectAnswer && <Check size={20} className="text-green-400 shrink-0 ml-2" />}
                      {isAnswered && isSelected && !isCorrectAnswer && <X size={20} className="text-red-400 shrink-0 ml-2" />}
                    </motion.button>
                  );
                })}
              </div>
              </>
              )}
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

      {/* Footer Actions (Hidden in Immersive) */}
      {!isImmersive && (
        <footer className={cn(
          "p-4 md:p-6 border-t transition-colors relative shrink-0",
          mode === 'quiz' && isAnswered ? (isCorrect ? "bg-[#2a3b2c] border-green-900" : "bg-[#3b2a2a] border-red-900") : "bg-[#252538] border-slate-700"
        )}>
          <div className="max-w-4xl mx-auto flex items-end justify-between gap-4">
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
                  <p className={cn("text-sm font-bold mb-1 flex items-center gap-1", isCorrect ? "text-green-400" : "text-red-400")}>
                    {isCorrect ? '✓ Buen análisis.' : '❌ ¡Error operativo!'}
                  </p>
                  
                  {showExplanation ? (
                    <div className="mt-2 text-xs text-slate-300">
                      {isExplaining ? (
                        <span className="animate-pulse">CPU-IMM está evaluando...</span>
                      ) : (
                        <p>{explanationText}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-300 relative">
                      <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 text-[8px]", isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                        <Bot size={10} /> CPU-IMM
                      </div>
                      <p className="font-medium leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
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
      )}
          </div>
        </div>

      {/* Annotation Modal */}
      <AnimatePresence>
        {showAnnotationModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[#2a2a40] p-6 rounded-3xl w-full max-w-lg border border-slate-600 shadow-2xl">
               <h3 className="text-lg font-black text-white uppercase mb-4">Añadir Anotación a la Sección</h3>
               <textarea 
                 value={annotationText}
                 onChange={e => setAnnotationText(e.target.value)}
                 placeholder="Escribe tus notas, dudas o ideas clave sobre este texto..."
                 className="w-full h-32 bg-[#1e1e2f] border border-slate-700 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-purple-500 resize-none mb-6"
                 autoFocus
               />
               <div className="flex gap-3 justify-end">
                 <button onClick={() => setShowAnnotationModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
                 <button onClick={handleSaveAnnotation} className="px-5 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-colors flex items-center gap-2">
                   Guardar Nota
                 </button>
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
      
      {/* Absolute modals - repositioned relative to the main viewport wrapper instead of the document card to ensure they span safely */}
      {/* Game Over Modal overlay */}
      <AnimatePresence>
        {mode === 'gameover' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="bg-[#2a2a40] p-8 rounded-3xl border border-red-500/30 text-center max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <Heart size={40} className="fill-current" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">¡Sin Vidas!</h2>
              <p className="text-slate-400 mb-8 font-medium">Has perdido tus vidas y debes reiniciar este módulo técnico. ¡Recuerda, la precisión salva vidas en el campo!</p>
              <button 
                onClick={handleRetry}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw size={20} /> Reiniciar Documento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Error Animation Overlay */}
      <AnimatePresence>
        {mode === 'quiz' && isAnswered && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-40 h-40 rounded-full flex items-center justify-center shadow-2xl",
              isCorrect ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"
            )}
          >
            {isCorrect ? <Check size={80} className="text-white" /> : <X size={80} className="text-white" />}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
