import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserStats, Course, LibraryItem, StudentProgress, Bookmark, Annotation } from '../types';
import { BUILT_IN_COURSES } from '../constants';

interface AppState {
  user: {
    name: string;
    email: string;
    role: 'admin' | 'user';
    isLoggedIn: boolean;
  } | null;
  stats: UserStats;
  courses: Course[];
  library: LibraryItem[];
  students: StudentProgress[];
  bookmarks: Bookmark[];
  annotations: Annotation[];
  isSupervisionMode: boolean;
  
  // Actions
  login: (email: string, name: string, role: 'admin' | 'user') => void;
  logout: () => void;
  updateUser: (updates: Partial<{name: string, email: string}>) => void;
  toggleSupervisionMode: () => void;
  addXP: (amount: number) => void;
  completedLessons: string[];
  completeLesson: (courseId: string, lessonId: string) => void;
  markDocumentCompleted: (documentId: string) => void;
  addLibraryItem: (item: LibraryItem) => void;
  updateLibraryItem: (id: string, updates: Partial<LibraryItem>) => void;
  removeLibraryItem: (id: string) => void;
  loseLife: () => void;
  gainLife: () => void;
  resetLives: () => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
  addAnnotation: (annotation: Annotation) => void;
  deleteAnnotation: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      stats: {
        xp: 0,
        streak: 0,
        tempStreak: 0, // Used for the "3 correct answers in a row = 1 life" logic
        lives: 5,
        accuracy: 0,
        lessonsCompleted: 0,
        studyHours: 0,
        level: 1,
        rank: 'Aprendiz',
      },
      courses: BUILT_IN_COURSES,
      library: [],
      bookmarks: [],
      annotations: [],
      completedLessons: [],
      students: [
        { id: '1', name: 'Carlos Ruiz', email: 'carlos@imm.com', xp: 1200, level: 2, rank: 'Técnico', completedCourses: 2 },
        { id: '2', name: 'Ana Gómez', email: 'ana@imm.com', xp: 450, level: 1, rank: 'Aprendiz', completedCourses: 0 },
        { id: '3', name: 'Luis Pérez', email: 'luis@imm.com', xp: 3200, level: 4, rank: 'Especialista', completedCourses: 5 },
      ],
      isSupervisionMode: false,

      login: (email, name, role) => set({ user: { email, name, role, isLoggedIn: true } }),
      logout: () => set({ user: null }),
      updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      toggleSupervisionMode: () => set((state) => ({ isSupervisionMode: !state.isSupervisionMode })),
      addXP: (amount) => set((state) => {
        const newXp = state.stats.xp + amount;
        let rank = 'Aprendiz';
        if (newXp >= 6000) rank = 'Máster Máquina';
        else if (newXp >= 3000) rank = 'Especialista';
        else if (newXp >= 1000) rank = 'Técnico';
        
        const newLevel = Math.floor(newXp / 1000) + 1;

        return {
          stats: { ...state.stats, xp: newXp, level: newLevel, rank }
        };
      }),
      loseLife: () => set((state) => ({
        stats: { ...state.stats, lives: Math.max(0, state.stats.lives - 1) }
      })),
      gainLife: () => set((state) => ({
        stats: { ...state.stats, lives: Math.min(5, state.stats.lives + 1) }
      })),
      resetLives: () => set((state) => ({
        stats: { ...state.stats, lives: 5, tempStreak: 0 }
      })),
      incrementStreak: () => set((state) => {
        const newTempStreak = (state.stats.tempStreak || 0) + 1;
        let lives = state.stats.lives;
        let tempStreakToSet = newTempStreak;
        
        // Recover life every 3 consecutive valid answers
        if (newTempStreak >= 3) {
          lives = Math.min(5, lives + 1);
          tempStreakToSet = 0;
        }

        return {
          stats: {
            ...state.stats,
            streak: state.stats.streak + 1,
            tempStreak: tempStreakToSet,
            lives
          }
        };
      }),
      resetStreak: () => set((state) => ({
        stats: { ...state.stats, streak: 0, tempStreak: 0 }
      })),
      completeLesson: (courseId, lessonId) => set((state) => {
        const newCourses = state.courses.map(course => {
          if (course.id === courseId) {
            const completedCount = course.lessons.filter(l => l.id === lessonId || l.id === 'completed').length; // Simplified logic
            const progress = Math.min(100, (completedCount / course.lessons.length) * 100);
            return { ...course, progress };
          }
          return course;
        });
        const completedId = `${courseId}-${lessonId}`;
        const newCompleted = state.completedLessons.includes(completedId) ? state.completedLessons : [...state.completedLessons, completedId];
        return { 
          courses: newCourses,
          completedLessons: newCompleted,
          stats: { ...state.stats, lessonsCompleted: state.stats.lessonsCompleted + 1 }
        };
      }),
      markDocumentCompleted: (documentId) => set((state) => {
        const completedId = `doc-${documentId}`;
        if (state.completedLessons.includes(completedId)) return state;
        return {
           completedLessons: [...state.completedLessons, completedId],
           stats: { ...state.stats, lessonsCompleted: state.stats.lessonsCompleted + 1 }
        };
      }),
      addLibraryItem: (item) => set((state) => ({ library: [item, ...state.library] })),
      updateLibraryItem: (id, updates) => set((state) => ({
        library: state.library.map(item => item.id === id ? { ...item, ...updates } : item)
      })),
      removeLibraryItem: (id) => set((state) => ({
        library: state.library.filter(item => item.id !== id)
      })),
      addBookmark: (b) => set((state) => {
        if (state.bookmarks.find(exist => exist.documentId === b.documentId && exist.sectionIndex === b.sectionIndex)) return state;
        return { bookmarks: [...state.bookmarks, b] };
      }),
      removeBookmark: (id) => set((state) => ({ bookmarks: state.bookmarks.filter(b => b.id !== id) })),
      addAnnotation: (a) => set((state) => ({ annotations: [...state.annotations, a] })),
      deleteAnnotation: (id) => set((state) => ({ annotations: state.annotations.filter(a => a.id !== id) })),
    }),
    {
      name: 'imm-academy-storage-v9',
      merge: (persistedState: any, currentState: AppState) => {
        return {
          ...currentState,
          ...persistedState,
          courses: currentState.courses.map(course => {
            const persistedCourse = persistedState.courses?.find((c: any) => c.id === course.id);
            return {
              ...course, // Always use the latest course structure from constants
              progress: persistedCourse?.progress || 0
            };
          })
        };
      }
    }
  )
);
