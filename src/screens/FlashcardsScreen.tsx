import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Zap, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FlashcardsScreen() {
  const { flashcards, updateFlashcard } = useAppStore();
  const [shuffledCards, setShuffledCards] = React.useState([...flashcards]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);

  const shuffleCards = React.useCallback(() => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  React.useEffect(() => {
    if (shuffledCards.length !== flashcards.length) {
      shuffleCards();
    }
  }, [flashcards, shuffledCards.length, shuffleCards]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      shuffleCards();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [shuffleCards]);

  const currentCard = shuffledCards[currentIndex];

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    updateFlashcard(currentCard.id, rating);
    setIsFlipped(false);
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      shuffleCards(); // Reshuffle when done
    }
  };

  if (!currentCard) return <div className="p-6 text-center text-slate-400">No hay flashcards disponibles. Sube documentos a la biblioteca para generar flashcards.</div>;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estudio Activo</span>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Flashcards</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={shuffleCards}
            className="flex items-center gap-1 text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full hover:bg-purple-500/20 transition-colors"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
          <span className="text-2xl font-black text-purple-400">{currentIndex + 1}<span className="text-slate-500 text-lg">/{shuffledCards.length}</span></span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div 
          className="relative w-full aspect-[4/5] max-w-sm perspective-1000 cursor-pointer"
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
                <Zap className="text-slate-600" size={24} />
                <span className="text-slate-600 font-bold text-[10px] tracking-widest">ID: {currentCard.id}</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Zap className="text-purple-400" size={40} fill="currentColor" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">
                  {currentCard.front}
                </h2>
                <div className="h-1 w-12 bg-purple-500 rounded-full"></div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-60">Toca para voltear</p>
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <div className="w-6 h-6 border-2 border-slate-600 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-slate-400 rounded-full" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden bg-[#252538] rounded-3xl p-8 flex flex-col justify-between shadow-2xl border border-slate-700 rotate-y-180">
              <div className="flex justify-between items-start">
                <RotateCcw className="text-slate-600" size={24} />
                <span className="text-slate-600 font-bold text-[10px] tracking-widest">DEFINICIÓN</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-6 justify-center flex-1">
                <p className="text-2xl font-bold text-slate-200 leading-relaxed">
                  {currentCard.back}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Toca para volver</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 grid grid-cols-4 gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); handleRate('again'); }}
          className="flex flex-col items-center justify-center py-4 bg-[#2a2a40] text-red-400 rounded-2xl border-b-4 border-red-900/50 active:translate-y-1 active:border-b-0 transition-all hover:bg-[#32324a]"
        >
          <span className="font-black text-sm md:text-lg uppercase">De nuevo</span>
          <span className="text-[10px] font-bold opacity-60">1 MIN</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleRate('hard'); }}
          className="flex flex-col items-center justify-center py-4 bg-[#2a2a40] text-orange-400 rounded-2xl border-b-4 border-orange-900/50 active:translate-y-1 active:border-b-0 transition-all hover:bg-[#32324a]"
        >
          <span className="font-black text-sm md:text-lg uppercase">Difícil</span>
          <span className="text-[10px] font-bold opacity-60">2 D</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleRate('good'); }}
          className="flex flex-col items-center justify-center py-4 bg-[#2a2a40] text-blue-400 rounded-2xl border-b-4 border-blue-900/50 active:translate-y-1 active:border-b-0 transition-all hover:bg-[#32324a]"
        >
          <span className="font-black text-sm md:text-lg uppercase">Bueno</span>
          <span className="text-[10px] font-bold opacity-60">4 D</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleRate('easy'); }}
          className="flex flex-col items-center justify-center py-4 bg-[#2a2a40] text-green-400 rounded-2xl border-b-4 border-green-900/50 active:translate-y-1 active:border-b-0 transition-all hover:bg-[#32324a]"
        >
          <span className="font-black text-sm md:text-lg uppercase">Fácil</span>
          <span className="text-[10px] font-bold opacity-60">7 D</span>
        </button>
      </div>
    </div>
  );
}
