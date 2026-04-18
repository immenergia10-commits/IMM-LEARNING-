import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Volume2, ArrowRight, Trophy, Info, Bot, Sparkles, Flag, RotateCcw, Zap, Eye, BookOpen, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatWithTutor } from '../services/geminiService';

export default function LessonScreen() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, courses, addXP, completeLesson, isSupervisionMode, toggleSupervisionMode } = useAppStore();
  
  const course = courses.find(c => c.id === courseId);
  const lesson = course?.lessons.find(l => l.id === lessonId);
  
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState(false);
  const [isReading, setIsReading] = React.useState(false);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  
  const [score, setScore] = React.useState({ correct: 0, total: 0 });

  // Load progress on mount
  React.useEffect(() => {
    if (!lessonId) return;
    const key = `lesson-progress-${lessonId}`;
    const savedProgress = localStorage.getItem(key);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setCurrentStepIndex(parsed.currentStepIndex || 0);
        setSelectedOption(parsed.selectedOption !== undefined ? parsed.selectedOption : null);
        setIsAnswered(parsed.isAnswered || false);
        setIsCorrect(parsed.isCorrect || false);
        setScore(parsed.score || { correct: 0, total: 0 });
      } catch (e) {
        console.error("Failed to parse saved lesson progress", e);
      }
    }
  }, [lessonId]);

  // Save progress on state change
  React.useEffect(() => {
    if (!lessonId) return;
    const key = `lesson-progress-${lessonId}`;
    if (isFinished) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify({
        currentStepIndex,
        selectedOption,
        isAnswered,
        isCorrect,
        score
      }));
    }
  }, [currentStepIndex, selectedOption, isAnswered, isCorrect, score, isFinished, lessonId]);

  
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [explanationText, setExplanationText] = React.useState('');
  const [isExplaining, setIsExplaining] = React.useState(false);
  
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  if (!course || !lesson || !lesson.steps || lesson.steps.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#1e1e2f] z-[60] flex flex-col items-center justify-center p-10 text-center">
        <h2 className="text-2xl font-black text-white uppercase mb-4">Lección no disponible</h2>
        <p className="text-slate-400 mb-8">Esta lección aún no tiene contenido configurado o es incompatible con la versión actual.</p>
        <button onClick={() => navigate('/courses')} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider">
          Volver a cursos
        </button>
      </div>
    );
  }

  const currentStep = lesson.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / (lesson.steps.length || 1)) * 100;

  const handleCheck = () => {
    if (selectedOption === null || !currentStep.question) return;
    
    const correct = selectedOption === currentStep.question.correctAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    setShowExplanation(false);
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
  };

  const handleNext = () => {
    if (currentStepIndex < lesson.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsReading(false);
      setShowExplanation(false);
    } else if (!isReviewing) {
      setIsReviewing(true);
    } else {
      setIsFinished(true);
    }
  };

  const handleFinish = () => {
    addXP(50);
    completeLesson(course.id, lesson.id);
    navigate('/courses');
  };

  const handleRetry = () => {
    setCurrentStepIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setIsReviewing(false);
    setIsFinished(false);
    setScore({ correct: 0, total: 0 });
  };

  const toggleReadAloud = () => {
    if (!currentStep.content) return;
    
    if (!isReading) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentStep.content);
      utteranceRef.current = utterance;
      
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural')));
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.lang = 'es-ES';
      utterance.rate = 0.95;
      
      utterance.onend = () => {
        setIsReading(false);
        utteranceRef.current = null;
      };
      
      utterance.onerror = () => {
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
    if (!currentStep.question) return;
    setIsExplaining(true);
    setShowExplanation(true);
    try {
      const response = await chatWithTutor(`Explica por qué la respuesta correcta a "${currentStep.question.question}" es "${currentStep.question.options[currentStep.question.correctAnswer]}".`, "Eres un tutor experto y amigable. Explica de forma concisa y clara.");
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

  if (isFinished) {
    const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;
    const passed = percentage >= 85;

    return (
      <div className="fixed inset-0 bg-[#1e1e2f] z-[60] flex flex-col items-center md:justify-center text-slate-100">
        <div className="w-full max-w-3xl bg-[#1e1e2f] h-full md:h-auto md:max-h-[90vh] md:rounded-3xl md:shadow-2xl flex flex-col relative overflow-hidden md:border md:border-slate-700">
          <header className="px-6 py-4 flex items-center justify-between">
            <button onClick={() => navigate('/courses')} className="text-slate-400 hover:text-white transition-colors">
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
              <div className="text-6xl mb-4 animate-bounce">{passed ? '🎉' : '💪'}</div>
              <h2 className="text-3xl font-black text-white uppercase">
                {passed ? '¡Lección Completada!' : '¡Casi lo logras!'}
              </h2>
              <p className="text-slate-400 font-medium">
                {passed ? 'Has demostrado un excelente dominio del tema.' : 'Necesitas un 85% para aprobar. ¡Sigue practicando!'}
              </p>
              
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
            {passed ? (
              <button 
                onClick={handleFinish} 
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg shadow-lg bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
              >
                Finalizar y Ganar XP (+50) <Trophy size={20} />
              </button>
            ) : (
              <>
                <button 
                  onClick={handleRetry} 
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg shadow-lg bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} /> Reintentar Lección
                </button>
                <button 
                  onClick={() => navigate('/courses')} 
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-slate-400 hover:text-white transition-all flex items-center justify-center"
                >
                  Volver a Cursos
                </button>
              </>
            )}
          </footer>
        </div>
      </div>
    );
  }

  if (isReviewing) {
    const concepts = lesson.steps.filter(s => s.type === 'text');
    return (
      <div className="fixed inset-0 bg-[#1e1e2f] z-[60] flex flex-col items-center md:justify-center text-slate-100">
        <div className="w-full max-w-3xl bg-[#1e1e2f] h-full md:h-auto md:max-h-[90vh] md:rounded-3xl md:shadow-2xl flex flex-col relative overflow-hidden md:border md:border-slate-700">
          <header className="px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/courses')} className="text-slate-400 hover:text-white transition-colors">
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
            <h2 className="text-3xl font-black text-white uppercase">¡Módulo Completado!</h2>
            <p className="text-slate-400 font-medium">Antes de terminar, repasemos lo que aprendiste hoy:</p>
            
            <div className="space-y-3 text-left w-full mt-6">
              {concepts.map((c, i) => (
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
            onClick={handleNext} 
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg shadow-lg bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
          >
            Ver Resultados <ArrowRight size={20} />
          </button>
        </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#1e1e2f] z-[60] flex flex-col items-center md:justify-center text-slate-100">
      <div className="w-full max-w-3xl bg-[#1e1e2f] h-full md:h-[90vh] md:rounded-3xl md:shadow-2xl flex flex-col relative overflow-hidden md:border md:border-slate-700">
        {/* Success/Error Animation Overlay */}
      <AnimatePresence>
        {isAnswered && currentStep.type === 'question' && (
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
      <header className="px-6 py-4 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/courses')} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="flex-1 flex gap-1">
            {lesson.steps.map((_, idx) => (
              <div key={idx} className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
                {idx <= currentStepIndex && (
                  <motion.div 
                    initial={{ width: idx === currentStepIndex ? 0 : '100%' }}
                    animate={{ width: '100%' }}
                    className={cn("h-full rounded-full", idx < currentStepIndex ? "bg-green-500" : "bg-purple-500")}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button 
                onClick={toggleSupervisionMode}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isSupervisionMode ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-slate-400 hover:text-white"
                )}
                title={isSupervisionMode ? "Cambiar a Modo Estudio" : "Cambiar a Modo Supervisar"}
              >
                {isSupervisionMode ? <Eye size={18} /> : <BookOpen size={18} />}
              </button>
            )}
            <button 
              className="text-purple-400 hover:text-white transition-colors"
              title="Repaso rápido"
            >
              <Zap size={20} fill="currentColor" />
            </button>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors">
            <Flag size={20} />
          </button>
        </div>
        
        {/* Overall Course Progress */}
        <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mt-2 px-2">
          <span>Progreso del Curso: {course.title}</span>
          <span>{Math.round(course.progress)}% Completado</span>
        </div>
        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-1 relative">
          <motion.div 
            initial={{ width: `${course.progress}%` }}
            animate={{ width: `${course.progress}%` }}
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-600 to-cyan-500"
          />
        </div>
      </header>

      <main className="flex-1 px-6 py-8 overflow-y-auto">
        {isSupervisionMode ? (
          <div className="space-y-12 pb-20">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-8">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Settings size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">Supervisión de Lección</h3>
              </div>
              <p className="text-xs text-slate-400">Revisión técnica de los pasos configurados en esta lección.</p>
            </div>

            {lesson.steps.map((step, idx) => (
              <div key={idx} className="space-y-4 border-l-2 border-slate-800 pl-6 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 border-4 border-[#1e1e2f]"></div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">Paso {idx + 1}</span>
                  <span className="text-[10px] font-black bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded uppercase">{step.type}</span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{step.title}</h3>
                
                {step.type === 'text' ? (
                  <div className="bg-[#2a2a40] p-6 rounded-2xl border border-slate-700">
                    <p className="text-slate-300 text-sm leading-relaxed">{step.content}</p>
                  </div>
                ) : (
                  <div className="bg-[#2a2a40] p-6 rounded-2xl border border-slate-700">
                    <p className="font-bold text-white mb-4">{step.question?.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {step.question?.options.map((opt, oIdx) => (
                        <div 
                          key={oIdx} 
                          className={cn(
                            "text-xs p-3 rounded-xl border",
                            oIdx === step.question?.correctAnswer ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-[#1e1e2f] border-slate-800 text-slate-500"
                          )}
                        >
                          {opt} {oIdx === step.question?.correctAnswer && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {currentStep.type === 'text' ? (
              <div className="space-y-6">
                {currentStep.image && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl group"
                  >
                    <img 
                      src={currentStep.image} 
                      alt="Lesson" 
                      className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e2f] via-transparent to-transparent opacity-60"></div>
                  </motion.div>
                )}
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight text-center mb-8">{currentStep.title}</h2>
                  <div className="bg-[#2a2a40] p-6 rounded-2xl relative border border-slate-700">
                    <p className="text-lg text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">{currentStep.content}</p>
                    <button 
                      onClick={toggleReadAloud}
                      className={cn(
                        "absolute -bottom-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all",
                        isReading ? "bg-cyan-500 text-white animate-pulse" : "bg-purple-600 text-white hover:bg-purple-500"
                      )}
                    >
                      <Volume2 size={24} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {currentStep.question?.image && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl group"
                  >
                    <img 
                      src={currentStep.question.image} 
                      alt="Question" 
                      className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e2f] via-transparent to-transparent opacity-60"></div>
                  </motion.div>
                )}
                <h2 className="text-2xl font-bold text-white leading-tight text-center mb-8">
                  {currentStep.question?.question}
                </h2>

                <div className="space-y-3">
                  {currentStep.question?.options.map((option, i) => (
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
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        )}
      </main>

      {/* Footer Actions */}
      <footer className={cn(
        "p-6 border-t transition-colors relative",
        isAnswered ? (isCorrect ? "bg-[#2a3b2c] border-green-900" : "bg-[#3b2a2a] border-red-900") : "bg-[#252538] border-slate-700"
      )}>
        <div className="max-w-3xl mx-auto flex items-end justify-between gap-4">
          {/* Mascot Area */}
          <div className="flex items-end gap-4 relative">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-lg z-10 bg-[#1e1e2f]",
              isAnswered ? (isCorrect ? "border-green-500" : "border-red-500") : "border-slate-600"
            )}>
              <Bot size={32} className={isAnswered ? (isCorrect ? "text-green-400" : "text-red-400") : "text-purple-400"} />
            </div>
            
            {/* Speech Bubble */}
            <AnimatePresence>
              {isAnswered && (
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
                        {currentStep.question?.explanation}
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

          <button
            onClick={isAnswered || currentStep.type === 'text' ? handleNext : handleCheck}
            disabled={currentStep.type === 'question' && selectedOption === null && !isAnswered}
            className={cn(
              "px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg transition-all flex items-center justify-center gap-2",
              isAnswered 
                ? (isCorrect ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white")
                : "bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            )}
          >
            {isAnswered ? 'Continuar' : (currentStep.type === 'question' ? 'Comprobar' : 'Continuar')}
          </button>
        </div>
      </footer>

      </div>
    </div>
  );
}
