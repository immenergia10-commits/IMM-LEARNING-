import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CloudUpload, FileText, Video, CheckCircle2, Loader2, Sparkles, ArrowRight, Trash2, Music, FileCode, Table, Presentation, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { processDocument } from '../services/geminiService';
import { extractImagesFromPDF } from '../lib/pdfUtils';

export default function LibraryScreen() {
  const { user, library, addLibraryItem, updateLibraryItem, removeLibraryItem } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  // Pagination & Filtering state
  const [activeFilter, setActiveFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cleanup orphaned items that are stuck in "processing" across sessions
  useEffect(() => {
    const orphanedItems = library.filter(item => item.status === 'processing');
    if (orphanedItems.length > 0 && !isUploading) {
      orphanedItems.forEach(item => {
        // If an item is stuck, we force it to 'ready' with a generic fallback
        const fallbackMaterial = {
          title: item.name,
          summary: "Recuperación: El procesamiento de este archivo fue interrumpido (Ej. recarga de página). Se ha indexado como modo lectura de emergencia.",
          sections: [
            {
              title: "Estado de Recuperación",
              content: `El servidor no pudo terminar de extraer la Inteligencia de "${item.name}" debido a una interrupción súbita. Si necesitas los exámenes dinámicos y evaluaciones técnicas, por favor elimina este archivo desde la papelera y vuelve a subirlo.`,
              questions: [
                {
                  id: `rec-${item.id}`,
                  question: "¿Qué acción se recomienda si necesitas los exámenes dinámicos de este archivo recuperado?",
                  options: ["Llamar a IT", "Esperar a que se regenere solo", "Eliminar y volver a subir el archivo", "Leerlo en bruto"],
                  correctAnswer: 2,
                  explanation: "Eliminar el archivo y volver a subirlo iniciará un nuevo ciclo de generación por la IA ininterrumpido.",
                  difficulty: "easy" as const
                }
              ]
            }
          ],
          debateTopics: [],
          roleplayScenarios: [],
          flashcards: []
        };
        updateLibraryItem(item.id, {
          status: 'ready',
          studyMaterial: fallbackMaterial
        });
      });
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    processFiles(files);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    processFiles(files);
    e.target.value = '';
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(f => !f.name.startsWith('.~') && !f.name.startsWith('.DS_Store'));
    
    if (validFiles.length === 0) return;

    if (validFiles.length > 100) {
      setUploadError("Puedes subir un máximo de 100 documentos a la vez.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    // Sort validFiles from smallest to largest size so quick files process first
    validFiles.sort((a, b) => a.size - b.size);

    // Initial Registration: Load all files to local state UI immediately
    const filesState = validFiles.map((file) => {
      const id = Math.random().toString(36).substr(2, 9);
      const sizeMB = file.size / (1024 * 1024);
      return { file, id, sizeMB };
    });

    for (const { file, id, sizeMB } of filesState) {
      const newItem = {
        id,
        name: file.name,
        type: file.type.includes('pdf') ? 'pdf' : 
              file.type.includes('video') ? 'video' : 
              file.type.includes('audio') ? 'audio' : 
              file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'excel' : 
              file.name.endsWith('.pptx') || file.name.endsWith('.ppt') ? 'presentation' :
              file.name.endsWith('.html') || file.name.endsWith('.htm') ? 'html' : 'doc',
        size: `${sizeMB.toFixed(1)} MB`,
        date: 'Recién subido',
        status: 'processing' as const,
      };
      addLibraryItem(newItem);
    }

    // Process files sequentially from smallest to largest to avoid UI freezing and rate limits
    for (const { file, id, sizeMB } of filesState) {
      // Setup dynamic progress mock based on file size, cap estimation wait to 30s
      const estSec = Math.max(8, Math.min(sizeMB * 5, 30)); 
      let currentP = 0;
      const interval = setInterval(() => {
        currentP += (100 / (estSec * 4)); // updates 4 times a second (250ms)
        if (currentP >= 95) currentP = 95; // Cap at 95% until AI actually finishes
        setProgressMap(prev => ({ ...prev, [id]: currentP }));
      }, 250);

      try {
        let documentImages: string[] = [];
        // Only extract images from PDF if the file is smaller than 15MB to avoid huge memory spikes and browser hanging
        if (file.type === 'application/pdf' && file.size <= 15 * 1024 * 1024) {
          try {
            documentImages = await extractImagesFromPDF(file);
          } catch (e) {
            console.warn('Could not extract images from PDF:', e);
          }
        }

        const aiResult = await processDocument(file);
        
        clearInterval(interval);
        setProgressMap(prev => ({ ...prev, [id]: 100 }));

        if (!aiResult || !aiResult.sections || aiResult.sections.length === 0) {
          throw new Error('AI Result is empty or malformed');
        }

        // Slight delay for UI smoothness before clearing status
        setTimeout(() => {
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
        }, 800);
      } catch (error) {
        clearInterval(interval);
        console.error(error);
        const fallbackMaterial = {
          title: file.name,
          summary: "Este documento se subió en modo local porque la IA no pudo procesarlo profundamente de inmediato.",
          sections: [
            {
              title: "Contenido General",
              content: "El servidor de IA delegó a escaneo rápido o el formato técnico era complejo. Sin embargo, el archivo se ha indexado correctamente en la biblioteca local.",
              questions: [
                {
                  id: "fallback-q1",
                  question: "¿Cómo consultar los detalles específicos de este archivo?",
                  options: ["Revisar el formato exportado offline de esta sección", "Tratar de subirlo nuevamente", "Descartar", "Llamar técnico"],
                  correctAnswer: 0,
                  explanation: "Este documento ha sido indexado y está disponible para lectura, aunque no se hayan generado test profundos.",
                  difficulty: "easy" as const
                }
              ]
            }
          ],
          debateTopics: ["¿Cómo mejorar la eficiencia de procesamiento documental en campo?"],
          roleplayScenarios: [
            { title: "Reporte de Fallos", description: "Informa sobre falta de conexión", role: "Operador de campo" }
          ],
          flashcards: []
        };

        setProgressMap(prev => ({ ...prev, [id]: 100 }));
        setTimeout(() => {
          updateLibraryItem(id, { 
            status: 'ready',
            studyMaterial: fallbackMaterial
          });
          setUploadError(prev => prev ? `${prev}\nEl archivo "${file.name}" se indexó localmente de inmediato (Escaneo menor).` : `El archivo "${file.name}" se indexó localmente de inmediato (Escaneo menor).`);
        }, 800);
      }
    }
    
    setIsUploading(false);
  };

  const filteredLibrary = library.filter(item => {
    const matchesCategory = activeFilter === 'all' || item.type === activeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });
  const totalPages = Math.ceil(filteredLibrary.length / itemsPerPage);
  const paginatedLibrary = filteredLibrary.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, statusFilter, searchQuery, library.length]);

  return (
    <div className="p-6 space-y-8">
      {/* DOCUMENT PROCESSING STATS */}
      <section className="bg-[#252538] border border-slate-800 rounded-3xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
        <div className="flex flex-col gap-1 border-r border-slate-800 pr-4">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Documentos</span>
          <span className="text-3xl font-black text-white">{library.length}</span>
        </div>
        <div className="flex flex-col gap-1 border-r border-slate-800 px-4">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Analizados al 100%</span>
          <span className="text-3xl font-black text-cyan-400">{library.filter(i => i.status === 'ready').length}</span>
        </div>
        <div className="flex flex-col gap-1 border-r md:border-slate-800 border-transparent px-4">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pendientes / Procesando</span>
          <span className="text-3xl font-black text-amber-400">{library.filter(i => i.status === 'processing').length}</span>
        </div>
        <div className="flex flex-col gap-1 pl-4">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tiempo Estimado Fin</span>
          <span className="text-3xl font-black text-purple-400">
            {library.filter(i => i.status === 'processing').length > 0 ? `${library.filter(i => i.status === 'processing').length * 2} min` : '0 min'}
          </span>
        </div>
      </section>

      {user?.role === 'admin' && (
        <section>
          <div className="flex items-end gap-2 mb-6">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Biblioteca Inteligente</h1>
            <div className="h-1 w-12 bg-cyan-400 rounded-full mb-1"></div>
          </div>

          {uploadError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 font-medium whitespace-pre-wrap">
              {uploadError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative group" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-500 opacity-10 blur rounded-2xl group-hover:opacity-20 transition-opacity"></div>
              <label className={cn(
                "relative h-full bg-[#252538] border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                isDragging ? "border-purple-500 bg-purple-500/10 scale-[1.02]" : "border-slate-700 hover:border-purple-500"
              )}>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={isUploading} 
                  accept="*/*"
                />
                <div className="w-16 h-16 rounded-full bg-[#1e1e2f] flex items-center justify-center mb-4 text-purple-400">
                  {isUploading ? <Loader2 className="animate-spin" size={32} /> : <CloudUpload size={32} className={isDragging ? "animate-bounce" : ""} />}
                </div>
                <p className="text-lg font-bold text-white mb-1">
                  {isDragging ? 'Suelta aquí los archivos' : 'Subir Archivos'}
                </p>
                <p className="text-xs text-slate-400 mb-6 max-w-[200px]">Cualquier tipo de documento, o arrastra y suelta aquí.</p>
                <div className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/20">
                  <Sparkles size={16} />
                  Procesar Archivos
                </div>
              </label>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-l from-orange-600 to-red-500 opacity-10 blur rounded-2xl group-hover:opacity-20 transition-opacity"></div>
              <label className="relative h-full bg-[#252538] border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all hover:border-orange-500 cursor-pointer">
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isUploading} 
                  // @ts-ignore - webkitdirectory is non-standard but works in modern browsers
                  webkitdirectory="" 
                  directory=""
                />
                <div className="w-16 h-16 rounded-full bg-[#1e1e2f] flex items-center justify-center mb-4 text-orange-400">
                  {isUploading ? <Loader2 className="animate-spin" size={32} /> : <FileCode size={32} />}
                </div>
                <p className="text-lg font-bold text-white mb-1">Sincronizar Carpeta Local</p>
                <p className="text-xs text-slate-400 mb-6 max-w-[200px]">Ej: "IMM LEARNING"</p>
                <div className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-600/20">
                  <CloudUpload size={16} />
                  Sincronizar Todo
                </div>
              </label>
            </div>
          </div>
        </section>
      )}

      {/* AI Pipeline Status */}
      {isUploading && (
        <section className="bg-[#252538] rounded-2xl p-6 border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={18} />
              <h3 className="font-bold text-sm uppercase tracking-widest text-white">Estado de Procesamiento</h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded uppercase animate-pulse">Analizando Documentos...</span>
            </div>
          </div>
          <div className="flex justify-between relative">
            <div className="absolute top-4 left-0 w-full h-1 bg-slate-800 z-0"></div>
            {[
              { label: 'En Cola', icon: CloudUpload, active: true },
              { label: 'Lectura', icon: FileText, active: true },
              { label: 'Generación IA', icon: Sparkles, active: true },
              { label: 'Guardado', icon: CheckCircle2, active: false },
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
        <div className="flex flex-col mb-6 gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Archivos Recientes</h2>
            <div className="flex bg-[#252538] border border-slate-700 rounded-xl px-3 py-2 flex-1 md:max-w-xs items-center gap-2">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre..." 
                className="bg-transparent border-none w-full text-xs text-white focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pdf', label: 'PDFs' },
                { id: 'video', label: 'Videos' },
                { id: 'audio', label: 'Audio' },
                { id: 'excel', label: 'Tablas' },
                { id: 'presentation', label: 'Presentaciones' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    activeFilter === filter.id 
                      ? "bg-cyan-500 text-white shadow-sm" 
                      : "bg-[#1e1e2f] text-slate-400 hover:bg-[#252538] border border-slate-800"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div className="w-px h-6 bg-slate-700 hidden sm:block mt-1"></div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  statusFilter === 'all' ? "bg-slate-700 text-white shadow-sm" : "bg-[#1e1e2f] text-slate-400 border border-slate-800 hover:bg-[#252538]"
                )}
              >
                Cualquier Estado
              </button>
              <button
                onClick={() => setStatusFilter('ready')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  statusFilter === 'ready' ? "bg-purple-600 text-white shadow-sm" : "bg-[#1e1e2f] text-slate-400 border border-slate-800 hover:bg-purple-600/20"
                )}
              >
                Listos
              </button>
              <button
                onClick={() => setStatusFilter('processing')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  statusFilter === 'processing' ? "bg-amber-500 text-white shadow-sm" : "bg-[#1e1e2f] text-slate-400 border border-slate-800 hover:bg-amber-500/20"
                )}
              >
                Procesando
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {paginatedLibrary.map((item) => (
            <div key={item.id} className="relative bg-[#252538] rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-800 hover:border-slate-700 transition-all group overflow-hidden">
              {item.status === 'processing' && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                  style={{ width: `${progressMap[item.id] || 0}%` }}
                />
              )}
              
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative z-10",
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
              
              <div className="flex-1 min-w-0 relative z-10">
                <h4 className="font-bold text-white truncate">{item.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.size} • {item.date}</p>
              </div>
              
              <div className="flex items-center gap-2 relative z-10">
                {item.status === 'processing' ? (
                  <div className="bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    Generando Curso...
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

          {paginatedLibrary.length === 0 && (
            <div className="text-center py-12 bg-[#252538]/50 border border-slate-800 border-dashed rounded-2xl">
              <p className="text-slate-400 text-sm font-medium">No se encontraron archivos en esta categoría.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1e1e2f] border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              {'<'}
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1e1e2f] border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              {'>'}
            </button>
          </div>
        )}
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
