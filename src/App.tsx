import React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Home, BookOpen, Library, Layers, Trophy, MessageCircle } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import CoursesScreen from './screens/CoursesScreen';
import LessonScreen from './screens/LessonScreen';
import FlashcardsScreen from './screens/FlashcardsScreen';
import LibraryScreen from './screens/LibraryScreen';
import StudyDocumentScreen from './screens/StudyDocumentScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import LearningPathScreen from './screens/LearningPathScreen';
import TutorModal from './components/TutorModal';
import { Map } from 'lucide-react';

const BottomTab = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex flex-col items-center justify-center px-4 py-2 transition-all duration-300 rounded-2xl",
      active ? "bg-purple-500/20 text-purple-400" : "text-slate-500 hover:text-slate-400"
    )}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{label}</span>
  </Link>
);

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isTutorOpen, setIsTutorOpen] = React.useState(false);
  
  return (
    <div className="flex flex-col h-screen bg-[#1e1e2f] overflow-hidden w-full relative text-slate-100">
      <header className="bg-[#252538]/90 backdrop-blur-md flex justify-between items-center w-full px-6 py-4 fixed top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
              <Trophy size={16} />
            </div>
            <h1 className="font-black tracking-tighter uppercase text-xl text-white">IMM ACADEMY</h1>
          </div>
          <div className="bg-[#2a2a40] px-3 py-1 rounded-full flex items-center gap-2 border border-slate-700">
            <span className="text-purple-400 text-xs font-bold">1,240 XP</span>
          </div>
        </div>
      </header>

      <main className="flex-1 mt-16 mb-24 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <button 
        onClick={() => setIsTutorOpen(true)}
        className="fixed bottom-28 right-6 md:right-12 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg shadow-purple-600/30 flex items-center justify-center z-50 active:scale-90 transition-transform hover:bg-purple-500"
      >
        <MessageCircle size={28} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 w-full z-40 flex justify-center bg-[#252538]/90 backdrop-blur-xl border-t border-slate-800 shadow-[0_-8px_32px_rgba(0,0,0,0.2)]">
        <div className="flex justify-around items-center w-full max-w-7xl px-4 pb-8 pt-3 md:pb-4">
          <BottomTab to="/" icon={Home} label="Home" active={location.pathname === '/'} />
          <BottomTab to="/path" icon={Map} label="Ruta" active={location.pathname === '/path'} />
          <BottomTab to="/courses" icon={BookOpen} label="Cursos" active={location.pathname === '/courses'} />
          <BottomTab to="/library" icon={Library} label="Biblioteca" active={location.pathname === '/library'} />
          <BottomTab to="/flashcards" icon={Layers} label="Flash" active={location.pathname === '/flashcards'} />
        </div>
      </nav>

      <TutorModal isOpen={isTutorOpen} onClose={() => setIsTutorOpen(false)} />
    </div>
  );
};

export default function App() {
  const user = useAppStore(state => state.user);

  return (
    <Routes>
      <Route path="/login" element={!user?.isLoggedIn ? <LoginScreen /> : <Navigate to="/" />} />
      <Route path="/*" element={
        user?.isLoggedIn ? (
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardScreen />} />
              <Route path="/path" element={<LearningPathScreen />} />
              <Route path="/courses" element={<CoursesScreen />} />
              <Route path="/lesson/:courseId/:lessonId" element={<LessonScreen />} />
              <Route path="/leaderboard" element={<LeaderboardScreen />} />
              <Route path="/flashcards" element={<FlashcardsScreen />} />
              <Route path="/library" element={<LibraryScreen />} />
              <Route path="/study-document/:itemId" element={<StudyDocumentScreen />} />
            </Routes>
          </MainLayout>
        ) : <Navigate to="/login" />
      } />
    </Routes>
  );
}
