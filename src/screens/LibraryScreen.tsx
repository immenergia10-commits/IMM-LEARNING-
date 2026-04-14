import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CloudUpload, FileText, Video, CheckCircle2, Loader2, Sparkles, ArrowRight, Trash2, Music, FileCode, Table, Presentation } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { processDocument } from '../services/geminiService';
import { extractImagesFromPDF } from '../lib/pdfUtils';

export default function LibraryScreen() {
  const { user, library, addLibraryItem, updateLibraryItem, removeLibraryItem } = useAppStore();
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = React.useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (files.length > 10) {
      setUploadError("Puedes subir un máximo de 10 documentos a la vez.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    // Calculate estimated time based on total file size (assuming ~10s per MB for processing/upload)
    let totalSizeInMB = 0;
    files.forEach(f => totalSizeInMB += f.size / (1024 * 1024));
    
    const estimatedSeconds = Math.max(15, Math.round(totalSizeInMB * 10));
    setEstimatedTime(`~${estimatedSeconds} segundos`);

    // Process files sequentially to avoid rate limits and UI freezing
    for (const file of files) {
      const id = Math.random().toString(36).substr(2, 9);
      
      const newItem = {
        id,
        name: file.name,
        type: file.type.includes('pdf') ? 'pdf' : 
              file.type.includes('video') ? 'video' : 
              file.type.includes('audio') ? 'audio' : 
              file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'excel' : 
              file.name.endsWith('.pptx') || file.name.endsWith('.ppt') ? 'presentation' :
              file.name.endsWith('.html') || file.name.endsWith('.htm') ? 'html' : 'doc',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        date: 'Recién subido',
        status: 'processing' as const,
      };

      addLibraryItem(newItem);

      try {
        let documentImages: string[] = [];
        if (file.type === 'application/pdf') {
          try {
            documentImages = await extractImagesFromPDF(file);
          } catch (e) {
            console.warn('Could not extract images from PDF:', e);
          }
        }

        const aiResult = await processDocument(file);
        
        if (!aiResult || !aiResult.sections || aiResult.sections.length === 0) {
          setUploadError(prev => prev ? `${prev}\nEl documento "${file.name}" no pudo ser procesado.` : `El documento "${file.name}" no pudo ser procesado.`);
          removeLibraryItem(id);
          continue;
        }

        updateLibraryItem(id, { 
          status: 'ready',
          studyMaterial: aiResult,
          documentImages: documentImages.length > 0 ? documentImages : undefined
        });

        if (aiResult.flashcards && aiResult.flashcards.length > 0) {
          useAppStore.getState().addFlashcards(
            aiResult.flashcards.map((fc: any, index: number) => ({
              id: `fc-${id}-${index}`,
              front: fc.front,
              back: fc.back
            }))
          );
        }
      } catch (error) {
        console.error(error);
        setUploadError(prev => prev ? `${prev}\nError al procesar "${file.name}".` : `Error al procesar "${file.name}".`);
        removeLibraryItem(id);
      }
    }
    
    setIsUploading(false);
    setEstimatedTime(null);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="p-6 space-y-8">
      {user?.role === 'admin' && (
        <section>
          <div className="flex items-end gap-2 mb-6">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Biblioteca Inteligente</h1>
            <div className="h-1 w-12 bg-cyan-400 rounded-full mb-1"></div>
          </div>

          {uploadError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 font-medium">
              {uploadError}
            </div>
          )}

          <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-500 opacity-10 blur rounded-2xl group-hover:opacity-20 transition-opacity"></div>
          <label className="relative bg-[#252538] border-2 border-dashed border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all hover:border-purple-500 cursor-pointer">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isUploading} 
              accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx,.ppt,.html,.htm,.mp4,.mp3,.wav,.m4a"
            />
            <div className="w-16 h-16 rounded-full bg-[#1e1e2f] flex items-center justify-center mb-4 text-purple-400">
              {isUploading ? <Loader2 className="animate-spin" size={32} /> : <CloudUpload size={32} />}
            </div>
            <p className="text-lg font-bold text-white mb-1">Subir contenido técnico</p>
            <p className="text-sm text-slate-400 mb-6">Soporta PDF, Word, Excel, HTML, Video y Audio</p>
            <div className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/20">
              <Sparkles size={16} />
              Procesar con IA
            </div>
          </label>
        </div>
      </section>
      )}

      {/* AI Pipeline Status */}
      {isUploading && (
        <section className="bg-[#252538] rounded-2xl p-6 border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={18} />
              <h3 className="font-bold text-sm uppercase tracking-widest text-white">AI Pipeline Status</h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded uppercase animate-pulse">Analizando...</span>
              {estimatedTime && <span className="text-[10px] font-bold text-slate-400 mt-1">Tiempo est: {estimatedTime}</span>}
            </div>
          </div>
          <div className="flex justify-between relative">
            <div className="absolute top-4 left-0 w-full h-1 bg-slate-800 z-0"></div>
            {[
              { label: 'Subida', icon: CloudUpload, active: true },
              { label: 'OCR', icon: FileText, active: true },
              { label: 'IA', icon: Sparkles, active: true },
              { label: 'Curso', icon: CheckCircle2, active: false },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                  step.active ? "bg-purple-600 text-white" : "bg-[#1e1e2f] text-slate-600 border border-slate-800"
                )}>
                  <step.icon size={16} />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-tight text-slate-400">{step.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Archivos Recientes</h2>
          <button className="text-sm font-bold text-purple-400 flex items-center gap-1">Ver todos <ArrowRight size={14} /></button>
        </div>
        <div className="space-y-4">
          {library.map((item) => (
            <div key={item.id} className="bg-[#252538] rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-800 hover:border-slate-700 transition-all group">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                item.type === 'pdf' ? "bg-red-500/10 text-red-400" : 
                item.type === 'video' ? "bg-purple-500/10 text-purple-400" : 
                item.type === 'audio' ? "bg-cyan-500/10 text-cyan-400" :
                item.type === 'excel' ? "bg-green-500/10 text-green-400" :
                item.type === 'presentation' ? "bg-amber-500/10 text-amber-400" :
                item.type === 'html' ? "bg-orange-500/10 text-orange-400" :
                "bg-[#1e1e2f] text-slate-400"
              )}>
                {item.type === 'pdf' && <FileText size={24} />}
                {item.type === 'video' && <Video size={24} />}
                {item.type === 'audio' && <Music size={24} />}
                {item.type === 'excel' && <Table size={24} />}
                {item.type === 'presentation' && <Presentation size={24} />}
                {item.type === 'html' && <FileCode size={24} />}
                {item.type === 'doc' && <FileText size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white truncate">{item.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.size} • {item.date}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'processing' ? (
                  <div className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    Procesando
                  </div>
                ) : (
                  <Link 
                    to={`/study-document/${item.id}`}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-purple-600/10 hover:bg-purple-500 transition-all"
                  >
                    Estudiar
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => removeLibraryItem(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    title="Eliminar documento"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Module */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#2a2a40] p-5 rounded-2xl text-white flex flex-col justify-between border border-slate-700">
          <div className="flex justify-between items-start">
            <CloudUpload size={32} className="opacity-50 text-purple-400" />
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase">Capacidad Cloud</p>
              <p className="text-sm font-black text-white">4.5 GB / 5.0 GB</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-cyan-500" 
                style={{ width: '90%' }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest opacity-60">
              <span>90% Espacio Reservado</span>
              <span>0.5 GB Libres</span>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-[9px] text-slate-400 leading-tight">
              <span className="text-purple-400 font-bold">Distribución:</span>
            </p>
            <p className="text-[9px] text-slate-500 leading-tight flex justify-between">
              <span>• Sistema e IA (Reservado):</span>
              <span className="text-white">4.2 GB</span>
            </p>
            <p className="text-[9px] text-slate-500 leading-tight flex justify-between">
              <span>• Caché de Procesamiento:</span>
              <span className="text-white">0.2 GB</span>
            </p>
            <p className="text-[9px] text-slate-500 leading-tight flex justify-between">
              <span>• Tus Documentos:</span>
              <span className="text-cyan-400 font-bold">{(library.length * 0.07).toFixed(2)} GB</span>
            </p>
          </div>
          <p className="mt-3 text-[8px] text-slate-500 italic leading-tight">
            * El sistema reserva espacio para el procesamiento de IA y modelos offline. Tus archivos ocupan una fracción mínima.
          </p>
        </div>
        <div className="bg-cyan-900/30 p-5 rounded-2xl text-cyan-400 flex flex-col justify-between border border-cyan-900/50">
          <Sparkles size={32} className="opacity-50" />
          <div>
            <p className="text-4xl font-black leading-none mb-1">{library.length * 3 + 14}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">AI Insights Generados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
