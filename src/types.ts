export enum CourseCategory {
  ENERGY = 'Energía',
  MACHINERY = 'Maquinaria Agrícola y Jardinero',
  POLICIES = 'Políticas y Referencias',
  AI_GENERATED = 'IA Generada',
}

export interface LessonStep {
  id: string;
  type: 'text' | 'question';
  title?: string;
  content?: string;
  image?: string;
  imageHint?: string;
  question?: Question;
}

export interface Lesson {
  id: string;
  title: string;
  steps: LessonStep[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  image?: string;
  imageHint?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  gradient: string;
  lessons: Lesson[];
  progress: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  nextReview: number; // timestamp
}

export interface UserStats {
  xp: number;
  streak: number;
  lives: number;
  accuracy: number;
  lessonsCompleted: number;
  studyHours: number;
  flashcardsDue: number;
}

export interface Hotspot {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  description: string;
}

export interface StudyMaterial {
  title: string;
  summary: string;
  sections: {
    title: string;
    content: string;
    imageHint?: string;
    hotspots?: Hotspot[];
    questions: Question[];
  }[];
  debateTopics: string[];
  roleplayScenarios: {
    title: string;
    description: string;
    role: string;
  }[];
  flashcards: { front: string; back: string }[];
}

export interface StudentProgress {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  completedCourses: number;
}

export interface LibraryItem {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: 'processing' | 'ready';
  studyMaterial?: StudyMaterial;
  documentImages?: string[]; // Array of base64 images extracted from the document
}
