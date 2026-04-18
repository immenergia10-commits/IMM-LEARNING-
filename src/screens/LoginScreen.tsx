import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Bolt, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginScreen() {
  const login = useAppStore(state => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('imm_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('El correo electrónico es obligatorio');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Ingresa un formato de correo válido (ej. usuario@empresa.com)');
      isValid = false;
    }

    if (!password) {
      setPasswordError('La contraseña es obligatoria');
      isValid = false;
    }

    return isValid;
  };

  const processAuth = async (authAction: () => void) => {
    setIsLoading(true);
    // Simulate network request delay (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Remember credentials logic
    if (rememberMe && email) {
      localStorage.setItem('imm_remembered_email', email);
    } else {
      localStorage.removeItem('imm_remembered_email');
    }

    authAction();
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    processAuth(() => {
      if (email === 'admin@imm.com') {
        login(email, 'Administrador', 'admin');
      } else if (email === 'tecnico@imm.com') {
        login(email, 'Técnico Especialista', 'user');
      } else {
        login(email, email.split('@')[0], 'user');
      }
    });
  };

  const handleGoogleLogin = () => {
    // Simulación de Google Auth compatible
    processAuth(() => {
      login('google-user@gmail.com', 'Usuario Google', 'user');
    });
  };

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none"></div>

      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0A1628]/80 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
            <p className="text-white font-medium tracking-wide">Autenticando...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm sm:max-w-md lg:max-w-lg z-10 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 sm:p-8 lg:p-10 rounded-3xl shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-8 sm:mb-10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
            <Bolt className="text-white" size={24} fill="currentColor" />
          </div>
          <span className="font-black text-2xl sm:text-3xl tracking-tighter text-white uppercase">IMM ACADEMY</span>
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight uppercase tracking-tight">
            Aprende Energía. <br className="hidden sm:block"/>
            <span className="text-cyan-400">Domina la Maquinaria.</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">Accede a la formación técnica líder.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Institucional</label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                className={`w-full bg-slate-800/50 border ${emailError ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} focus:ring-0 rounded-xl p-3.5 sm:p-4 text-white placeholder:text-slate-600 transition-all`}
                placeholder="nombre@empresa.com"
              />
              <Mail className={`absolute right-4 top-1/2 -translate-y-1/2 ${emailError ? 'text-red-500' : 'text-slate-600'}`} size={20} />
            </div>
            {emailError && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1 ml-1">
                <AlertCircle size={12} /> {emailError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Contraseña</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                className={`w-full bg-slate-800/50 border ${passwordError ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} focus:ring-0 rounded-xl p-3.5 sm:p-4 text-white placeholder:text-slate-600 transition-all`}
                placeholder="••••••••"
              />
              <Lock className={`absolute right-4 top-1/2 -translate-y-1/2 ${passwordError ? 'text-red-500' : 'text-slate-600'}`} size={20} />
            </div>
            {passwordError && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1 ml-1">
                <AlertCircle size={12} /> {passwordError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pb-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border ${rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-slate-800 border-slate-600 group-hover:border-slate-500'} transition-colors flex items-center justify-center`}>
                  {rememberMe && <svg className="w-3.5 h-3.5 text-white pointer-events-none" viewBox="0 0 14 14" fill="none"><path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"></path></svg>}
                </div>
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Recordar credenciales</span>
            </label>
            
            <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">¿Olvidaste tu clave?</a>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base sm:text-lg uppercase tracking-wider disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Iniciar sesión
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">O continuar con</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          type="button"
          className="w-full bg-white text-slate-800 hover:bg-slate-50 font-bold py-3 sm:py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>

        <p className="mt-8 text-center text-slate-500 text-xs sm:text-sm">
          ¿No tienes acceso? <a href="#" className="text-blue-400 font-bold hover:underline">Contacta a tu administrador.</a>
        </p>
      </motion.div>
    </div>
  );
}
