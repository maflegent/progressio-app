// types/index.ts
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type EisenhowerMatrix = "do" | "decide" | "delegate" | "delete";
export type Mood = "awful" | "bad" | "neutral" | "good" | "awesome";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  eisenhower?: EisenhowerMatrix;
  folder?: string; // Новое поле для папок
  isCompleted: boolean;
  dueDate?: Date;
  isRecurring: boolean;
  recurringPattern?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // Новые поля для улучшения функциональности
  estimatedDuration?: number; // в минутах
  actualDuration?: number; // в минутах
  subtasks?: SubTask[];
  attachments?: string[];
  location?: string;
  reminderDate?: Date;
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
}

export interface DiaryEntry {
  id: string;
  date: Date;
  content: string;
  mood: Mood;
  linkedTasks?: string[];
  photoUri?: string;
  location?: string;
  createdAt: Date;
  // Улучшения
  weather?: string;
  sleepHours?: number;
  energyLevel?: number; // 1-10
  tags?: string[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  linkedTasks?: string[];
  files?: string[];
  folder?: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
color?: string;
}

// Новые интерфейсы для улучшения UX
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  notifications: {
    taskReminders: boolean;
    dailyDigest: boolean;
    weeklyReview: boolean;
  };
  defaultTaskPriority: TaskPriority;
  workingHours: {
    start: string;
    end: string;
  };
}

export interface AppState {
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  version: string;
}
