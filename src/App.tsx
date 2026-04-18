import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Library, Layers, Trophy, MessageCircle, Map, User, Search, FileText } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import CoursesScreen from './screens/CoursesScreen';
import LessonScreen from './screens/LessonScreen';
import LibraryScreen from './screens/LibraryScreen';
import StudyDocumentScreen from './screens/StudyDocumentScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import LearningPathScreen from './screens/LearningPathScreen';
import ProfileScreen from './screens/ProfileScreen';
import TutorModal from './components/TutorModal';

const BottomTab = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex flex-col items-center justify-center px-4 py-2 transition-all duration-300 rounded-2xl",
      active ? "bg-purple-500/20 text-purple-400" : "text-slate-500 hover:text-slate-400"
    )}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold uppercase tracking-wider mt-1 hidden sm:block md:block lg:block xl:block">{label}</span>
  </Link>
);

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { library, courses } = useAppStore();
  
  const [isTutorOpen, setIsTutorOpen] = React.useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = React.useMemo(() => {
    if (!globalSearch.trim()) return { docs: [], courses: [] };
    const q = globalSearch.toLowerCase();
    return {
      docs: library.filter(l => l.name.toLowerCase().includes(q)),
      courses: courses.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    };
  }, [globalSearch, library, courses]);

  const handleSelectResult = (path: string) => {
    setGlobalSearch('');
    setIsSearchFocused(false);
    navigate(path);
  };
  
  return (
    <div className="flex flex-col h-screen bg-[#1e1e2f] overflow-hidden w-full relative text-slate-100">
      <header className="bg-[#252538]/90 backdrop-blur-md flex justify-between items-center w-full px-4 md:px-6 py-4 fixed top-0 z-50 border-b border-slate-800">
        <div className="flex items-center gap-4 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2 shrink-0 hidden sm:flex">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
              <Trophy size={16} />
            </div>
            <h1 className="font-black tracking-tighter uppercase text-xl text-white hidden md:block">IMM ACADEMY</h1>
          </div>
          
          {/* Global Search Bar */}
          <div className="flex-1 max-w-2xl mx-auto relative group">
            <div className={cn(
              "flex items-center bg-[#1e1e2f] border rounded-full px-4 py-2 transition-all",
              isSearchFocused ? "border-purple-500 ring-2 ring-purple-500/20" : "border-slate-700"
            )}>
              <Search size={18} className={isSearchFocused ? "text-purple-400" : "text-slate-500"} />
              <input 
                type="text"
                placeholder="Buscar módulos, documentos..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="bg-transparent border-none w-full text-sm text-white focus:outline-none px-3"
              />
            </div>
            
            {/* Search Dropdown */}
            <AnimatePresence>
              {isSearchFocused && globalSearch && (searchResults.docs.length > 0 || searchResults.courses.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a40] border border-slate-700 rounded-2xl shadow-xl overflow-hidden max-h-96 overflow-y-auto z-50"
                >
                  {searchResults.courses.length > 0 && (
                    <div className="p-2 border-b border-slate-700">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2 py-1 mb-1">Cursos Internos</h4>
                      {searchResults.courses.map(c => (
                        <button key={c.id} onClick={() => handleSelectResult(`/lesson/${c.id}/${c.lessons[0].id}`)} className="w-full text-left p-2 hover:bg-[#32324a] rounded-xl flex items-center gap-3 transition-colors">
                          <BookOpen size={16} className="text-purple-400 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-white line-clamp-1">{c.title}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{c.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.docs.length > 0 && (
                    <div className="p-2">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2 py-1 mb-1">Documentos & Módulos IA</h4>
                      {searchResults.docs.map(d => (
                        <button key={d.id} onClick={() => handleSelectResult(d.status === 'ready' ? `/study-document/${d.id}` : '/library')} className="w-full text-left p-2 hover:bg-[#32324a] rounded-xl flex items-center gap-3 transition-colors">
                          <FileText size={16} className="text-cyan-400 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-white line-clamp-1">{d.name}</p>
                            <p className="text-[10px] text-slate-400">{d.status === 'ready' ? 'Generado' : 'Procesando/Pendiente'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-[#2a2a40] px-3 py-1 rounded-full flex items-center gap-2 border border-slate-700 shrink-0">
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
        <div className="flex justify-around items-center w-full max-w-7xl px-2 sm:px-4 pb-8 pt-3 md:pb-4">
          <BottomTab to="/" icon={Home} label="Home" active={location.pathname === '/'} />
          <BottomTab to="/path" icon={Map} label="Ruta" active={location.pathname === '/path'} />
          <BottomTab to="/courses" icon={BookOpen} label="Cursos" active={location.pathname === '/courses'} />
          <BottomTab to="/library" icon={Library} label="Biblio" active={location.pathname === '/library'} />
          <BottomTab to="/profile" icon={User} label="Perfil" active={location.pathname === '/profile'} />
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
              <Route path="/library" element={<LibraryScreen />} />
              <Route path="/study-document/:itemId" element={<StudyDocumentScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Routes>
          </MainLayout>
        ) : <Navigate to="/login" />
      } />
    </Routes>
  );
}
