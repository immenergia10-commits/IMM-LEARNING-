import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Bolt, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginScreen() {
  const login = useAppStore(state => state.login);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@imm.com') {
      login(email, 'Administrador', 'admin');
    } else if (email === 'tecnico@imm.com') {
      login(email, 'Técnico Especialista', 'user');
    } else {
      // Default to user for any other email for testing
      login(email, email.split('@')[0], 'user');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full z-10"
      >
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Bolt className="text-white" size={32} fill="currentColor" />
          </div>
          <span className="font-black text-3xl tracking-tighter text-white uppercase">IMM ACADEMY</span>
        </div>

        <div className="space-y-2 mb-10">
          <h1 className="text-4xl font-black text-white leading-tight uppercase tracking-tight">
            Aprende Energía. <br/>
            <span className="text-cyan-400">Domina la Maquinaria.</span>
          </h1>
          <p className="text-slate-400 text-lg">Accede a la formación técnica líder.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Institucional</label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 focus:ring-0 rounded-xl p-4 text-white placeholder:text-slate-600 transition-all"
                placeholder="nombre@empresa.com"
                required
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Contraseña</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 focus:ring-0 rounded-xl p-4 text-white placeholder:text-slate-600 transition-all"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider"
          >
            Iniciar sesión
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="mt-10 text-center text-slate-500 text-sm">
          ¿No tienes acceso? <a href="#" className="text-blue-400 font-bold hover:underline">Contacta a tu administrador.</a>
        </p>
      </motion.div>
    </div>
  );
}
