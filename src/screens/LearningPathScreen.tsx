import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  BookOpen, 
  Target, 
  Hammer, 
  Star, 
  Lock, 
  CheckCircle2, 
  Flame, 
  Trophy,
  Lightbulb,
  Zap,
  Sprout,
  Wind,
  Droplets,
  Wrench
} from 'lucide-react';

type Tab = 'aprender' | 'practica' | 'construir';

export default function LearningPathScreen() {
  const { library, stats } = useAppStore();
  const [activeTab, setActiveTab] = React.useState<Tab>('aprender');

  const readyItems = library.filter(item => item.status === 'ready' && item.studyMaterial);

  const dynamicPathItems = readyItems.map((item, index) => {
    const colors = [
      'from-blue-500 to-cyan-400',
      'from-green-500 to-emerald-400',
      'from-purple-500 to-pink-500',
      'from-red-500 to-orange-400',
      'from-yellow-400 to-orange-500'
    ];
    const color = colors[index % colors.length];
    
    return {
      id: item.id,
      type: 'lesson',
      label: item.studyMaterial?.title || item.name,
      documentId: item.id,
      color,
      theme: 'energy', // Default theme, could be inferred from content
      locked: false
    };
  });

  const pathItems: any[] = [
    { id: 'start', type: 'start', label: 'Bienvenida IMM', icon: Star, color: 'from-yellow-400 to-orange-500', locked: false, isStart: true },
    ...dynamicPathItems,
    { id: 'end', type: 'end', label: 'Experto IMM', icon: Trophy, color: 'from-yellow-500 to-amber-600', locked: dynamicPathItems.length === 0 },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Thematic Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 text-cyan-500/30"
        >
          <Wind size={300} strokeWidth={0.5} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/2 -right-20 text-green-500/30"
        >
          <Sprout size={250} strokeWidth={0.5} />
        </motion.div>
        
        {/* Floating Particles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 p-6 max-w-7xl mx-auto">
        {/* Main Path Area */}
        <div className="flex-1 space-y-8">
          {/* Header with IMM Logo */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
                <span className="text-2xl font-black text-[#1e1e2f] tracking-tighter">IMM</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Ruta de Maestría</h1>
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Academia Técnica IMM</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#252538] px-4 py-2 rounded-2xl border border-slate-800">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-sm font-black text-white">{stats.xp} XP</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-[#252538]/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 sticky top-0 z-20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            {(['aprender', 'practica', 'construir'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2",
                  activeTab === tab 
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {tab === 'aprender' && <BookOpen size={14} />}
                {tab === 'practica' && <Target size={14} />}
                {tab === 'construir' && <Hammer size={14} />}
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'aprender' && (
              <motion.div 
                key="aprender"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative py-10 flex flex-col items-center"
              >
                {/* Path Line with Glow */}
                <div className="absolute top-0 bottom-0 w-3 bg-slate-800 left-1/2 -translate-x-1/2 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ y: ["0%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-full h-1/2 bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-50"
                  />
                </div>

                <div className="space-y-24 relative w-full max-w-sm">
                  {dynamicPathItems.length === 0 && (
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 w-64 text-center z-10">
                      <div className="bg-[#252538] p-4 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 mb-4 animate-bounce">
                        <p className="text-sm font-bold text-white mb-2">¡Tu ruta está vacía!</p>
                        <p className="text-xs text-slate-400">Sube documentos en la Biblioteca para generar tus módulos de estudio.</p>
                      </div>
                    </div>
                  )}
                  {pathItems.map((item, index) => {
                    const isEven = index % 2 === 0;
                    const Icon = item.icon || CheckCircle2;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className={cn(
                          "flex items-center gap-8",
                          isEven ? "flex-row" : "flex-row-reverse"
                        )}
                      >
                        <div className="relative group">
                          {/* Floating Thematic Icons */}
                          {item.theme === 'energy' && (
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-6 -right-6 text-yellow-400 opacity-40">
                              <Zap size={20} />
                            </motion.div>
                          )}
                          {item.theme === 'agri' && (
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute -top-6 -left-6 text-green-400 opacity-40">
                              <Sprout size={20} />
                            </motion.div>
                          )}

                          {/* Node Button */}
                          <div className="relative">
                            <div className={cn(
                              "absolute -inset-4 rounded-full opacity-0 blur-xl group-hover:opacity-40 transition-opacity bg-gradient-to-r",
                              item.color
                            )}></div>

                            <Link
                              to={item.locked ? '#' : (item.documentId ? `/study-document/${item.documentId}` : item.isStart ? '/library' : '/')}
                              className={cn(
                                "relative w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 transition-all active:scale-90 overflow-hidden bg-gradient-to-br",
                                item.locked || (!item.documentId && !item.isStart && item.type !== 'end')
                                  ? "from-slate-800 to-slate-900 border-slate-700 text-slate-600 cursor-not-allowed" 
                                  : cn(item.color, "border-white/30 text-white hover:scale-110 hover:rotate-3")
                              )}
                            >
                              {item.locked ? <Lock size={32} /> : <Icon size={36} strokeWidth={2.5} />}
                              
                              {/* Animated Shine */}
                              {!item.locked && (
                                <motion.div 
                                  animate={{ x: ["-100%", "200%"] }}
                                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                                />
                              )}
                            </Link>

                            {/* Progress Indicator */}
                            {!item.locked && (
                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1e1e2f] px-3 py-1 rounded-full border border-slate-700 shadow-lg">
                                <div className="flex gap-1">
                                  {[1, 2, 3].map(i => (
                                    <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i <= 2 ? "bg-cyan-400" : "bg-slate-700")} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Label Card */}
                          <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-40 p-4 rounded-2xl bg-[#252538]/90 backdrop-blur-sm border border-slate-800 shadow-xl transition-all group-hover:border-slate-600",
                            isEven ? "left-full ml-10" : "right-full mr-10 text-right"
                          )}>
                            <h4 className={cn(
                              "font-black uppercase tracking-tighter text-xs leading-tight mb-1",
                              item.locked ? "text-slate-600" : "text-white"
                            )}>
                              {item.label}
                            </h4>
                            <div className="flex items-center gap-2 opacity-60">
                              <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">
                                {item.type === 'lesson' ? 'Módulo' : 'Especial'}
                              </span>
                              <div className="h-1 w-1 bg-slate-600 rounded-full" />
                              <span className="text-[8px] font-bold text-slate-400 uppercase">
                                {item.theme === 'energy' ? 'Energía' : item.theme === 'agri' ? 'Maquinaria' : item.theme === 'ducati' ? 'Ducati' : item.theme === 'policy' ? 'Política' : 'IMM'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'practica' && (
              <motion.div 
                key="practica"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="group bg-[#252538] p-8 rounded-[2.5rem] border border-slate-800 flex flex-col items-center text-center space-y-4 hover:border-orange-500/50 transition-all">
                  <div className="w-20 h-20 bg-orange-500/20 rounded-3xl flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                    <Flame size={40} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Repaso de Campo</h3>
                  <p className="text-slate-400 text-sm font-medium">Refuerza los manuales de maquinaria y seguridad de hoy.</p>
                  <button className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-500/20">Empezar Sesión</button>
                </div>
                <div className="group bg-[#252538] p-8 rounded-[2.5rem] border border-slate-800 flex flex-col items-center text-center space-y-4 hover:border-cyan-500/50 transition-all">
                  <div className="w-20 h-20 bg-cyan-500/20 rounded-3xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <Target size={40} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Simulador de Cargas</h3>
                  <p className="text-slate-400 text-sm font-medium">Practica cálculos de kW y kVA con casos reales de IMM.</p>
                  <button className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-cyan-500/20">Abrir Simulador</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'construir' && (
              <motion.div 
                key="construir"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#252538] p-12 rounded-[3rem] border border-slate-800 flex flex-col items-center text-center space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-cyan-500 to-green-500" />
                <div className="w-24 h-24 bg-purple-500/20 rounded-[2rem] flex items-center justify-center text-purple-400">
                  <Wrench size={48} />
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Taller de Proyectos</h3>
                <p className="text-slate-400 max-w-md font-medium">
                  Diseña sistemas de riego automatizados y configuraciones de generadores para clientes IMM.
                </p>
                <div className="flex gap-4 w-full max-w-sm">
                  <div className="flex-1 p-6 bg-[#1e1e2f] rounded-3xl border border-slate-700 opacity-40 flex flex-col items-center gap-2">
                    <Droplets size={24} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Riego Inteligente</span>
                  </div>
                  <div className="flex-1 p-6 bg-[#1e1e2f] rounded-3xl border border-slate-700 opacity-40 flex flex-col items-center gap-2">
                    <Zap size={24} className="text-yellow-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Planta Eléctrica</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-purple-500/10 px-6 py-3 rounded-full border border-purple-500/20">
                  <Lock size={16} className="text-purple-400" />
                  <span className="text-xs text-purple-400 font-black uppercase tracking-widest">Desbloquea en Nivel 5</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar: Challenges & Tips */}
        <div className="w-full lg:w-80 space-y-6">
          {/* XP Card */}
          <div className="bg-gradient-to-br from-[#1e1e2f] to-[#252538] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nivel Actual</span>
                </div>
                <span className="text-2xl font-black text-white">{Math.floor(stats.xp / 2000) + 1}</span>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-black tracking-tighter">{stats.xp}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">XP Totales</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.xp % 2000) / 20}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                  />
                </div>
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
                Faltan {2000 - (stats.xp % 2000)} XP para el siguiente nivel
              </p>
            </div>
          </div>

          {/* Daily Tip */}
          <div className="bg-[#252538] p-6 rounded-[2rem] border border-slate-800 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Lightbulb size={60} />
            </div>
            <div className="flex items-center gap-2 text-yellow-400">
              <Zap size={18} fill="currentColor" />
              <h4 className="text-xs font-black uppercase tracking-widest">Flash Tip IMM</h4>
            </div>
            <p className="text-sm text-slate-300 font-bold leading-relaxed">
              "En agricultura, un motor bien mantenido consume hasta un 15% menos combustible. ¡Revisa los filtros cada 50 horas!"
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[9px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full uppercase tracking-widest">Sabiduría Técnica</span>
            </div>
          </div>

          {/* Active Challenges */}
          <div className="bg-[#252538] p-6 rounded-[2rem] border border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Misiones</h4>
              <span className="text-[10px] font-black text-purple-400">3 ACTIVAS</span>
            </div>
            <div className="space-y-5">
              {[
                { label: 'Ingeniero de Energía', progress: 80, xp: 200, icon: Zap, color: 'text-blue-400' },
                { label: 'Mantenimiento Pro', progress: 33, xp: 500, icon: Wrench, color: 'text-green-400' },
                { label: 'Racha Semanal', progress: 10, xp: 150, icon: Flame, color: 'text-orange-400' },
              ].map((challenge, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <challenge.icon size={14} className={challenge.color} />
                      <span className="text-[10px] font-black text-white uppercase tracking-tight">{challenge.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-purple-400">+{challenge.xp} XP</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${challenge.progress}%` }}
                      className={cn("h-full bg-gradient-to-r", i === 0 ? "from-blue-500 to-cyan-400" : i === 1 ? "from-green-500 to-emerald-400" : "from-orange-500 to-red-500")}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
