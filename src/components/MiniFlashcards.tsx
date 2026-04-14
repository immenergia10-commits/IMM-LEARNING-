import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Zap, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface MiniFlashcardsProps {
  onClose: () => void;
  filterId?: string; // Optional ID to filter flashcards related to a specific document
}

export default function MiniFlashcards({ onClose, filterId }: MiniFlashcardsProps) {
  const { flashcards, updateFlashcard } = useAppStore();
  
  // Filter flashcards if filterId is provided (assuming ID format fc-itemId-index)
  const relevantCards = React.useMemo(() => {
    if (!filterId) return flashcards;
    return flashcards.filter(card => card.id.includes(filterId));
  }, [flashcards, filterId]);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);

  const currentCard = relevantCards[currentIndex];

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    updateFlashcard(currentCard.id, rating);
    setIsFlipped(false);
    if (currentIndex < relevantCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop back or show finished state
    }
  };

  if (relevantCards.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      >
        <div className="bg-[#1e1e2f] border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
          <Zap size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Sin Flashcards</h3>
          <p className="text-slate-400 text-sm">No se generaron flashcards específicas para este contenido aún.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="w-full max-w-md flex flex-col gap-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <Zap size={16} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Repaso Rápido</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Conceptos Clave • {currentIndex + 1}/{relevantCards.length}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Card Area */}
        <div className="relative flex flex-col items-center">
          <div 
            className="relative w-full aspect-[4/5] perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full h-full relative preserve-3d"
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#2a2a40] to-[#1e1e2f] rounded-3xl p-8 flex flex-col justify-between shadow-2xl border border-slate-700">
                <div className="flex justify-between items-start">
                  <Zap className="text-slate-600" size={20} />
                  <span className="text-slate-600 font-bold text-[8px] tracking-widest uppercase">Pregunta</span>
                </div>
                <div className="flex flex-col items-center text-center space-y-6">
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-tight">
                    {currentCard.front}
                  </h2>
                  <div className="h-1 w-8 bg-purple-500 rounded-full"></div>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Toca para descubrir</p>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-[#252538] rounded-3xl p-8 flex flex-col justify-between shadow-2xl border border-slate-700 rotate-y-180">
                <div className="flex justify-between items-start">
                  <RotateCcw className="text-slate-600" size={20} />
                  <span className="text-slate-600 font-bold text-[8px] tracking-widest uppercase">Respuesta</span>
                </div>
                <div className="flex flex-col items-center text-center space-y-6 justify-center flex-1">
                  <p className="text-lg font-bold text-slate-200 leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Toca para volver</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 -right-4 flex justify-between pointer-events-none">
            <button 
              onClick={(e) => { e.stopPropagation(); if (currentIndex > 0) setCurrentIndex(prev => prev - 1); }}
              disabled={currentIndex === 0}
              className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-white pointer-events-auto disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); if (currentIndex < relevantCards.length - 1) setCurrentIndex(prev => prev + 1); }}
              disabled={currentIndex === relevantCards.length - 1}
              className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-white pointer-events-auto disabled:opacity-0 transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Rating Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'De nuevo', rating: 'again', color: 'text-red-400', border: 'border-red-900/50' },
            { label: 'Difícil', rating: 'hard', color: 'text-orange-400', border: 'border-orange-900/50' },
            { label: 'Bueno', rating: 'good', color: 'text-blue-400', border: 'border-blue-900/50' },
            { label: 'Fácil', rating: 'easy', color: 'text-green-400', border: 'border-green-900/50' }
          ].map((btn) => (
            <button 
              key={btn.rating}
              onClick={() => handleRate(btn.rating as any)}
              className={cn(
                "flex flex-col items-center justify-center py-3 bg-[#2a2a40] rounded-xl border-b-4 active:translate-y-1 active:border-b-0 transition-all",
                btn.color,
                btn.border
              )}
            >
              <span className="font-black text-[10px] uppercase">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
