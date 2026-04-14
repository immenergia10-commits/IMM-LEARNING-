import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserStats, Course, Flashcard, LibraryItem, StudentProgress } from '../types';
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
  flashcards: Flashcard[];
  library: LibraryItem[];
  students: StudentProgress[];
  isSupervisionMode: boolean;
  
  // Actions
  login: (email: string, name: string, role: 'admin' | 'user') => void;
  logout: () => void;
  toggleSupervisionMode: () => void;
  addXP: (amount: number) => void;
  completeLesson: (courseId: string, lessonId: string) => void;
  updateFlashcard: (id: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  addFlashcards: (cards: Omit<Flashcard, 'interval' | 'easeFactor' | 'nextReview'>[]) => void;
  addLibraryItem: (item: LibraryItem) => void;
  updateLibraryItem: (id: string, updates: Partial<LibraryItem>) => void;
  removeLibraryItem: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      stats: {
        xp: 0,
        streak: 0,
        lives: 5,
        accuracy: 0,
        lessonsCompleted: 0,
        studyHours: 0,
        flashcardsDue: 0,
      },
      courses: BUILT_IN_COURSES,
      flashcards: [
        {
          id: 'f1',
          front: 'Transformador Trifásico',
          back: 'Dispositivo que transfiere energía eléctrica entre tres circuitos.',
          interval: 1,
          easeFactor: 2.5,
          nextReview: Date.now(),
        },
      ],
      library: [],
      students: [
        { id: '1', name: 'Carlos Ruiz', email: 'carlos@imm.com', xp: 1200, level: 3, completedCourses: 2 },
        { id: '2', name: 'Ana Gómez', email: 'ana@imm.com', xp: 450, level: 1, completedCourses: 0 },
        { id: '3', name: 'Luis Pérez', email: 'luis@imm.com', xp: 2100, level: 4, completedCourses: 5 },
      ],
      isSupervisionMode: false,

      login: (email, name, role) => set({ user: { email, name, role, isLoggedIn: true } }),
      logout: () => set({ user: null }),
      toggleSupervisionMode: () => set((state) => ({ isSupervisionMode: !state.isSupervisionMode })),
      addXP: (amount) => set((state) => ({
        stats: { ...state.stats, xp: state.stats.xp + amount }
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
        return { 
          courses: newCourses,
          stats: { ...state.stats, lessonsCompleted: state.stats.lessonsCompleted + 1 }
        };
      }),
      updateFlashcard: (id, rating) => set((state) => {
        const intervals = { again: 0, hard: 1, good: 4, easy: 10 };
        const newFlashcards = state.flashcards.map(card => {
          if (card.id === id) {
            const interval = intervals[rating];
            return {
              ...card,
              interval,
              nextReview: Date.now() + interval * 24 * 60 * 60 * 1000
            };
          }
          return card;
        });
        return { flashcards: newFlashcards };
      }),
      addFlashcards: (cards) => set((state) => {
        const newCards: Flashcard[] = cards.map(c => ({
          ...c,
          interval: 0,
          easeFactor: 2.5,
          nextReview: Date.now()
        }));
        return { flashcards: [...newCards, ...state.flashcards] };
      }),
      addLibraryItem: (item) => set((state) => ({ library: [item, ...state.library] })),
      updateLibraryItem: (id, updates) => set((state) => ({
        library: state.library.map(item => item.id === id ? { ...item, ...updates } : item)
      })),
      removeLibraryItem: (id) => set((state) => ({
        library: state.library.filter(item => item.id !== id)
      })),
    }),
    {
      name: 'imm-academy-storage-v6',
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
