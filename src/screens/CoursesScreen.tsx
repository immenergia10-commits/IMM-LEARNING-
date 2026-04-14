import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CourseCategory } from '../types';
import { Search, Filter, Play, ChevronRight, BookOpen, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function CoursesScreen() {
  const { library } = useAppStore();
  const [activeFilter, setActiveFilter] = React.useState<CourseCategory | 'All'>('All');

  const filters = ['All', ...Object.values(CourseCategory)];

  // Generate dynamic courses from library
  const dynamicCourses = library
    .filter(item => item.status === 'ready' && item.studyMaterial)
    .map((item, index) => {
      const material = item.studyMaterial!;
      return {
        id: item.id,
        title: material.title || item.name,
        description: material.summary || 'Documento procesado por IA',
        category: CourseCategory.AI_GENERATED,
        gradient: 'from-purple-600 to-cyan-500',
        progress: 0,
        lessons: material.sections.map((sec, i) => ({
          id: `sec-${i}`,
          title: sec.title,
          steps: [] // We don't need steps here, we link to study-document
        }))
      };
    });

  const filteredCourses = activeFilter === 'All' 
    ? dynamicCourses 
    : dynamicCourses.filter(c => c.category === activeFilter);

  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Cursos</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar cursos..."
            className="w-full bg-[#252538] border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-0 focus:border-purple-500 transition-all shadow-sm text-white placeholder:text-slate-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar md:flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all",
                activeFilter === filter 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                  : "bg-[#252538] text-slate-400 border border-slate-700"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {dynamicCourses.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-[#252538] rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={40} className="text-slate-500" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">No hay cursos disponibles</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            Sube documentos en la Biblioteca para que la IA genere tus cursos y material de estudio automáticamente.
          </p>
          <Link 
            to="/library"
            className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-all"
          >
            Ir a la Biblioteca
          </Link>
        </div>
      )}

      {/* Course List */}
      <div className="space-y-12 max-w-3xl mx-auto">
        {filteredCourses.map((course, courseIndex) => (
          <div key={course.id} className="space-y-4">
            {/* Course Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sección {courseIndex + 1}</h2>
                <h3 className="text-2xl font-black text-white mt-1">{course.title}</h3>
                <p className="text-slate-400 mt-1 text-sm">{course.description}</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center relative shrink-0">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-purple-600"
                    strokeDasharray={`${course.progress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
                <span className="text-sm font-bold text-slate-300">{Math.round(course.progress)}%</span>
              </div>
            </div>

            {/* Lessons List */}
            <div className="space-y-3">
              {course.lessons.map((lesson, lessonIndex) => {
                return (
                  <Link
                    key={lesson.id}
                    to={`/study-document/${course.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl border-2 transition-all bg-[#252538] border-slate-700 hover:border-purple-500 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#1e1e2f] flex items-center justify-center text-xs font-bold text-slate-400">
                        {String(lessonIndex + 1).padStart(2, '0')}
                      </div>
                      <span className="font-bold text-slate-200">{lesson.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs uppercase tracking-wider">
                        <BookOpen size={14} /> Aprender
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
