import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Save, User, Shield, GraduationCap, CheckCircle2, Camera, Eye, EyeOff, Key, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ProfileScreen() {
  const { user, stats, logout, updateUser, annotations, library } = useAppStore();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaved, setIsSaved] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleSave = () => {
    updateUser({ name, email });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSavePassword = () => {
    if (newPassword && newPassword === confirmPassword && currentPassword) {
      // In a real app we would verify currentPassword and hit an API here
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileImage(url);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto pb-10 px-4 md:px-0">
      
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-[#252538] p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
        <div className="relative group shrink-0 z-10">
          <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-4xl text-white font-black shadow-lg shadow-purple-600/30 overflow-hidden border-2 border-[#252538] group-hover:border-purple-400 transition-colors">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-[#2a2a40] border border-slate-600 rounded-full flex items-center justify-center text-slate-300 cursor-pointer hover:bg-purple-600 hover:text-white transition-all shadow-md">
            <Camera size={14} />
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
        <div className="text-center sm:text-left z-10">
          <h1 className="text-2xl font-black text-white">{user.name}</h1>
          <p className="text-slate-400 font-medium">{user.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
            <span className={cn(
              "text-[10px] uppercase font-black px-3 py-1 rounded-full",
              user.role === 'admin' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
            )}>
              {user.role === 'admin' ? 'Administrador' : 'Estudiante'}
            </span>
            <span className="text-[10px] uppercase font-black px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              Nivel {stats.level}
            </span>
          </div>
        </div>
      </div>

      {/* TABS / SECTIONS (We'll stack them for simplicity) */}
      
      {/* BASIC INFO */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#252538] p-6 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden"
      >
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <User size={20} className="text-purple-400" />
          Datos del Perfil
        </h2>

        <div className="space-y-4 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 block">
              Nombre Completo
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1e1e2f] border border-slate-700 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              placeholder="Tu nombre"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 block">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1e1e2f] border border-slate-700 rounded-2xl px-4 py-3 text-white font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              placeholder="tu@email.com"
            />
          </div>

          <div className="pt-2 flex items-center gap-4">
            <button 
              onClick={handleSave}
              className="flex-1 sm:flex-none sm:w-48 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-600/20 transition-all flex justify-center items-center gap-2"
            >
              <Save size={16} />
              Actualizar Datos
            </button>
            <AnimatePresence>
              {isSaved && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-green-400 font-bold inline-flex items-center gap-1 text-sm bg-green-400/10 px-3 py-1.5 rounded-full"
                >
                  <CheckCircle2 size={16} /> Guardado
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* PASSWORD SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#252538] p-6 rounded-3xl border border-slate-800 space-y-6"
      >
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Key size={20} className="text-cyan-400" />
          Seguridad
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 block">
              Contraseña Actual
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#1e1e2f] border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="********"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 block">
                Nueva Contraseña
              </label>
              <input 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#1e1e2f] border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 block">
                Confirmar Contraseña
              </label>
              <input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#1e1e2f] border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="********"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-4">
             <button 
              onClick={handleSavePassword}
              disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
              className="flex-1 sm:flex-none sm:w-48 py-3 bg-[#2a2a40] hover:bg-cyan-600 border border-slate-700 hover:border-cyan-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield size={16} />
              Cambiar Clave
            </button>
            <AnimatePresence>
              {passwordSaved && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-green-400 font-bold inline-flex items-center gap-1 text-sm bg-green-400/10 px-3 py-1.5 rounded-full"
                >
                  <CheckCircle2 size={16} /> Contraseña actualizada
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ANNOTATIONS / NOTES SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#252538] p-6 rounded-3xl border border-slate-800 space-y-6"
      >
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <BookOpen size={20} className="text-amber-400" />
          Tus Apuntes y Notas
        </h2>
        
        {annotations.length === 0 ? (
          <div className="text-center py-8 bg-[#1e1e2f] rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-sm">Aún no tienes notas guardadas.</p>
            <p className="text-xs text-slate-500 mt-2">Abre un documento y usa la herramienta "Anotar" para guardar tus pensamientos.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {annotations.map((anno) => {
              const doc = library.find(item => item.id === anno.documentId);
              const sectionTitle = doc?.studyMaterial?.sections?.[anno.sectionIndex]?.title || `Sección ${anno.sectionIndex + 1}`;
              return (
                <div key={anno.id} className="bg-[#1e1e2f] p-4 rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {doc?.name || 'Documento Desconocido'}
                      </h4>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">{sectionTitle}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">{new Date(anno.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">"{anno.text}"</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* LOGOUT */}
      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="py-3 px-6 bg-[#2a2a40] hover:bg-red-500/20 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center gap-2 group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
