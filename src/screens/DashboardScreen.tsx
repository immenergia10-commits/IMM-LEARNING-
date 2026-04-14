import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Bolt, Flame, Heart, Play, School, Clock, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function DashboardScreen() {
  const { user, stats, courses, students } = useAppStore();
  const nextLevelXP = 2000;
  const progress = (stats.xp / nextLevelXP) * 100;
  const currentLevel = Math.floor(stats.xp / nextLevelXP) + 1;

  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8">
      {/* User Greeting */}
      <div className="mb-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">Hola, {user?.name}</h1>
          <p className="text-sm md:text-base font-bold text-slate-400 uppercase tracking-widest">
            {user?.role === 'admin' ? 'Administrador' : 'Estudiante'}
          </p>
        </div>
        
        {/* Certifications Desktop */}
        <div className="hidden md:flex bg-[#252538] px-6 py-4 rounded-2xl border border-slate-800 items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-purple-400" size={24} />
          </div>
          <div>
            <span className="block text-2xl font-black text-white leading-none">3</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Certificaciones</span>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <section className="bg-[#252538] p-6 md:p-8 rounded-3xl shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nivel actual</p>
            <h2 className="text-3xl font-black text-white uppercase leading-none">Nivel {currentLevel}</h2>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-purple-400">{stats.xp} / {nextLevelXP} XP</p>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
          />
        </div>
        <p className="mt-3 text-xs font-medium text-slate-400 flex items-center gap-2">
          <Bolt size={12} className="text-purple-400" />
          Progreso hacia siguiente nivel: {Math.round(progress)}%
        </p>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#252538] p-4 md:p-4 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
          <School className="text-purple-400 mb-2" size={28} />
          <span className="block text-3xl md:text-4xl font-black text-white leading-none mb-2">{stats.lessonsCompleted}</span>
          <span className="text-[10px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight leading-tight">Cursos Completados</span>
        </div>
        <div className="bg-[#252538] p-4 md:p-4 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
          <Clock className="text-cyan-400 mb-2" size={28} />
          <span className="block text-3xl md:text-4xl font-black text-white leading-none mb-2">{stats.studyHours}h</span>
          <span className="text-[10px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight leading-tight">Horas De Estudio</span>
        </div>
        <div className="bg-[#252538] p-4 md:p-4 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
          <Flame className="text-[#ff5500] mb-2" size={28} />
          <span className="block text-3xl md:text-4xl font-black text-white leading-none mb-2">{stats.streak}</span>
          <span className="text-[10px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight leading-tight">Días De Racha</span>
        </div>
        <div className="bg-[#252538] p-4 md:p-4 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
          <Bolt className="text-[#d99000] mb-2" size={28} />
          <span className="block text-3xl md:text-4xl font-black text-white leading-none mb-2">{stats.accuracy}%</span>
          <span className="text-[10px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight leading-tight">Precisión</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Continue Learning */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 ml-1">Continuar aprendiendo</h3>
          <div className="bg-[#252538] p-5 md:p-8 rounded-3xl shadow-sm border border-slate-800 relative overflow-hidden group h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded uppercase">Ruta de Aprendizaje</span>
                <h4 className="text-xl font-bold text-white leading-tight">Continúa tu progreso</h4>
              </div>
              <Link to="/path" className="text-purple-400 hover:text-purple-300 transition-colors">
                <Play size={32} fill="currentColor" />
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Módulo 3 de 5</span>
                <span>65%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[65%]"></div>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Daily Challenge */}
        <section className="pb-4 md:pb-0">
          <div className="bg-gradient-to-br from-[#2a2a40] to-[#1e1e2f] p-6 md:p-8 rounded-3xl text-white shadow-lg relative overflow-hidden h-full flex flex-col justify-center border border-slate-700">
            <div className="absolute -bottom-6 -right-6 opacity-10">
              <Bolt size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-cyan-400" size={16} />
                <h4 className="font-bold uppercase tracking-widest text-cyan-400 text-xs">Reto diario</h4>
              </div>
              <h5 className="text-xl md:text-2xl font-bold mb-6">¿Sabes cómo funciona un transformador trifásico?</h5>
              <Link 
                to="/lesson/c1/l1-1"
                className="inline-block bg-cyan-400 text-[#1e1e2f] px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide hover:opacity-90 active:scale-95 transition-all"
              >
                Comenzar Quiz
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Certifications Mobile */}
      <div className="md:hidden bg-[#252538] p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-purple-400" size={24} />
          </div>
          <div>
            <span className="block text-2xl font-black text-white leading-none">3</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Certificaciones</span>
          </div>
        </div>
        <ChevronRight className="text-slate-600" />
      </div>
      {/* Admin Panel */}
      {user?.role === 'admin' && (
        <section className="pt-4 border-t border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 ml-1">Progreso de Estudiantes</h3>
          <div className="space-y-3">
            {students.map(student => (
              <div key={student.id} className="bg-[#252538] p-4 rounded-2xl border border-slate-800 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{student.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{student.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-purple-400">Nivel {student.level}</p>
                  <p className="text-[10px] font-bold text-slate-500">{student.xp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
