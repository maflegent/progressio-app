// utils/taskStorage.ts
import { EisenhowerMatrix, Task, TaskPriority } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  generateRecurringTasks,
  shouldGenerateNextRecurringTask,
} from "./recurringTasks";

const TASKS_KEY = "@progressio_tasks";
const LAST_RECURRING_CHECK_KEY = "@progressio_last_recurring_check";
const MIN_RECURRING_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Счетчик для гарантии уникальности ID
let idCounter = 0;

// Вспомогательные функции
const generateId = (): string => {
  idCounter++;
  return `${Date.now()}_${idCounter}_${Math.random().toString(36).substr(2, 9)}`;
};

// Конвертация дат при сериализации/десериализации
const serializeTask = (task: Task): any => ({
  ...task,
  dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  reminderDate: task.reminderDate ? task.reminderDate.toISOString() : null,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
});

const deserializeTask = (data: any): Task => ({
  ...data,
  dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
  reminderDate: data.reminderDate ? new Date(data.reminderDate) : undefined,
  createdAt: new Date(data.createdAt),
  updatedAt: new Date(data.updatedAt),
});

const getLastRecurringCheckDate = async (): Promise<Date | null> => {
  try {
    const value = await AsyncStorage.getItem(LAST_RECURRING_CHECK_KEY);
    return value ? new Date(value) : null;
  } catch {
    return null;
  }
};

const setLastRecurringCheckDate = async (date: Date): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_RECURRING_CHECK_KEY, date.toISOString());
  } catch (error) {
    console.error("Error updating recurring check date:", error);
  }
};

export const taskStorage = {
  // Сохранить все задачи
  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      const serializedTasks = tasks.map(serializeTask);
      const jsonValue = JSON.stringify(serializedTasks);
      await AsyncStorage.setItem(TASKS_KEY, jsonValue);
    } catch (error) {
      console.error("Error saving tasks:", error);
      throw error;
    }
  },

  // Загрузить все задачи
  async getAllTasks(): Promise<Task[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
      if (!jsonValue) return [];

      const parsedData = JSON.parse(jsonValue);
      return parsedData.map(deserializeTask);
    } catch (error) {
      console.error("Error loading tasks:", error);
      return [];
    }
  },

  // Создать новую задачу
  async createTask(
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const tasks = await this.getAllTasks();
      const now = new Date();

      // Генерируем уникальный ID
      let newId: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        newId = generateId();
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(
            "Failed to generate unique ID after multiple attempts",
          );
        }
      } while (tasks.some((task) => task.id === newId));

      const newTask: Task = {
        ...taskData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      // Если это повторяющаяся задача, создаем первую следующую задачу
      if (newTask.isRecurring && newTask.recurringPattern) {
        try {
          const rule = JSON.parse(newTask.recurringPattern);
          const nextTasks = generateRecurringTasks(newTask, rule, now);

          if (nextTasks.length > 0) {
            // Генерируем уникальный ID для следующей задачи
            let nextId: string;
            do {
              nextId = generateId();
            } while (
              tasks.some((task) => task.id === nextId) ||
              nextId === newId
            );

            nextTasks[0].id = nextId;
            tasks.push(newTask, nextTasks[0]);
          } else {
            tasks.push(newTask);
          }
        } catch (error) {
          console.error("Error creating recurring task:", error);
          tasks.push(newTask);
        }
      } else {
        tasks.push(newTask);
      }

      await this.saveTasks(tasks);
      return newTask.id;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  // Обновить задачу
  async updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const tasks = await this.getAllTasks();
      const index = tasks.findIndex((task) => task.id === id);

      if (index === -1) return false;

      tasks[index] = {
        ...tasks[index],
        ...updates,
        updatedAt: new Date(),
      };

      await this.saveTasks(tasks);
      return true;
    } catch (error) {
      console.error("Error updating task:", error);
      return false;
    }
  },

  // Удалить задачу
  async deleteTask(id: string): Promise<boolean> {
    try {
      const tasks = await this.getAllTasks();
      const filteredTasks = tasks.filter((task) => task.id !== id);

      if (filteredTasks.length === tasks.length) return false;

      await this.saveTasks(filteredTasks);
      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      return false;
    }
  },

  // Переключить статус выполнения с обработкой повторяющихся задач
  async toggleTaskCompletion(id: string): Promise<boolean> {
    try {
      const tasks = await this.getAllTasks();
      const index = tasks.findIndex((task) => task.id === id);

      if (index === -1) return false;

      const wasCompleted = tasks[index].isCompleted;

      tasks[index] = {
        ...tasks[index],
        isCompleted: !tasks[index].isCompleted,
        updatedAt: new Date(),
      };

      await this.saveTasks(tasks);

      // Если задача стала выполненной и она повторяющаяся
      if (
        !wasCompleted &&
        tasks[index].isCompleted &&
        tasks[index].isRecurring
      ) {
        await this.processCompletedRecurringTask(id);
      }

      return true;
    } catch (error) {
      console.error("Error toggling task completion:", error);
      return false;
    }
  },

  // Обработка выполненной повторяющейся задачи
  async processCompletedRecurringTask(taskId: string): Promise<void> {
    try {
      const tasks = await this.getAllTasks();
      const task = tasks.find((t) => t.id === taskId);

      if (!task || !task.isRecurring || !task.recurringPattern) return;

      // Проверяем, нужно ли создать следующую задачу
      if (shouldGenerateNextRecurringTask(task)) {
        try {
          const rule = JSON.parse(task.recurringPattern);
          const now = new Date();
          const newTasks = generateRecurringTasks(task, rule, now);

          if (newTasks.length > 0) {
            // Добавляем первую следующую задачу
            tasks.push(newTasks[0]);
            await this.saveTasks(tasks);
            console.log(`Created next recurring task for: ${task.title}`);
          }
        } catch (error) {
          console.error("Error generating next recurring task:", error);
        }
      }
    } catch (error) {
      console.error("Error processing recurring task:", error);
    }
  },

  // Получить задачу по ID
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const tasks = await this.getAllTasks();
      return tasks.find((task) => task.id === id) || null;
    } catch (error) {
      console.error("Error getting task by id:", error);
      return null;
    }
  },

  // Получить задачи по фильтру
  async getTasksByFilter(filter: {
    isCompleted?: boolean;
    priority?: TaskPriority;
    tags?: string[];
    searchQuery?: string;
    eisenhower?: EisenhowerMatrix;
    showRecurring?: boolean;
    dueDate?: Date;
  }): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();

      return tasks.filter((task) => {
        // Фильтр по статусу выполнения
        if (
          filter.isCompleted !== undefined &&
          task.isCompleted !== filter.isCompleted
        ) {
          return false;
        }

        // Фильтр по приоритету
        if (filter.priority && task.priority !== filter.priority) {
          return false;
        }

        // Фильтр по матрице Эйзенхауэра
        if (filter.eisenhower && task.eisenhower !== filter.eisenhower) {
          return false;
        }

        // Фильтр по тегам
        if (filter.tags && filter.tags.length > 0) {
          const hasAllTags = filter.tags.every((tag) =>
            task.tags.includes(tag),
          );
          if (!hasAllTags) return false;
        }

        // Фильтр по повторяющимся задачам
        if (filter.showRecurring !== undefined) {
          if (filter.showRecurring && !task.isRecurring) return false;
          if (!filter.showRecurring && task.isRecurring) return false;
        }

        // Фильтр по дате выполнения
        if (filter.dueDate && task.dueDate) {
          const dueDate = new Date(filter.dueDate);
          const taskDueDate = new Date(task.dueDate);
          if (taskDueDate.toDateString() !== dueDate.toDateString()) {
            return false;
          }
        }

        // Поиск по тексту
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(query);
          const matchesDescription =
            task.description?.toLowerCase().includes(query) || false;
          const matchesTags = task.tags.some((tag) =>
            tag.toLowerCase().includes(query),
          );

          if (!matchesTitle && !matchesDescription && !matchesTags) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error("Error filtering tasks:", error);
      return [];
    }
  },

  // Получить задачи для матрицы Эйзенхауэра
  async getTasksForEisenhowerMatrix(): Promise<{
    do: Task[];
    decide: Task[];
    delegate: Task[];
    delete: Task[];
  }> {
    try {
      const tasks = await this.getAllTasks();
      const pendingTasks = tasks.filter((task) => !task.isCompleted);

      const result = {
        do: [] as Task[],
        decide: [] as Task[],
        delegate: [] as Task[],
        delete: [] as Task[],
      };

      pendingTasks.forEach((task) => {
        if (task.eisenhower && result[task.eisenhower]) {
          result[task.eisenhower].push(task);
        }
      });

      return result;
    } catch (error) {
      console.error("Error getting Eisenhower matrix:", error);
      return { do: [], decide: [], delegate: [], delete: [] };
    }
  },

  // Получить статистику по задачам
  async getTaskStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    recurring: number;
    byPriority: Record<TaskPriority, number>;
    byEisenhower: Record<EisenhowerMatrix, number>;
  }> {
    try {
      const tasks = await this.getAllTasks();
      const now = new Date();

      const stats = {
        total: tasks.length,
        completed: tasks.filter((t) => t.isCompleted).length,
        pending: tasks.filter((t) => !t.isCompleted).length,
        overdue: tasks.filter(
          (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now,
        ).length,
        recurring: tasks.filter((t) => t.isRecurring).length,
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        } as Record<TaskPriority, number>,
        byEisenhower: {
          do: 0,
          decide: 0,
          delegate: 0,
          delete: 0,
        } as Record<EisenhowerMatrix, number>,
      };

      // Подсчет по приоритетам
      tasks.forEach((task) => {
        stats.byPriority[task.priority]++;
      });

      // Подсчет по матрице Эйзенхауэра
      tasks
        .filter((t) => !t.isCompleted)
        .forEach((task) => {
          if (task.eisenhower) {
            stats.byEisenhower[task.eisenhower]++;
          }
        });

      return stats;
    } catch (error) {
      console.error("Error getting task stats:", error);
      return {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        recurring: 0,
        byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
        byEisenhower: { do: 0, decide: 0, delegate: 0, delete: 0 },
      };
    }
  },

  // Получить задачи на сегодня
  async getTodayTasks(): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      const today = new Date();

      return tasks.filter((task) => {
        if (task.isCompleted) return false;

        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          return dueDate.toDateString() === today.toDateString();
        }

        return false;
      });
    } catch (error) {
      console.error("Error getting today tasks:", error);
      return [];
    }
  },

  // Получить повторяющиеся задачи
  async getRecurringTasks(): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      return tasks.filter((task) => task.isRecurring);
    } catch (error) {
      console.error("Error getting recurring tasks:", error);
      return [];
    }
  },

  // Проверить и создать повторяющиеся задачи (для запуска при старте приложения)
  async checkAndGenerateRecurringTasks(): Promise<void> {
    try {
      const now = new Date();
      const lastCheck = await getLastRecurringCheckDate();

      if (
        lastCheck &&
        now.getTime() - lastCheck.getTime() < MIN_RECURRING_CHECK_INTERVAL_MS
      ) {
        return;
      }

      const tasks = await this.getAllTasks();
      let hasChanges = false;

      // Находим выполненные повторяющиеся задачи
      const completedRecurringTasks = tasks.filter(
        (task) => task.isCompleted && task.isRecurring && task.recurringPattern,
      );

      for (const task of completedRecurringTasks) {
        try {
          const rule = JSON.parse(task.recurringPattern || "{}");

          // Проверяем, нужно ли создать новую задачу
          if (shouldGenerateNextRecurringTask(task, now)) {
            const newTasks = generateRecurringTasks(task, rule, now);

            if (newTasks.length > 0) {
              // Добавляем первую следующую задачу
              tasks.push(newTasks[0]);
              hasChanges = true;
              console.log(`Auto-generated recurring task: ${task.title}`);
            }
          }
        } catch (error) {
          console.error("Error processing recurring task:", error);
        }
      }

      if (hasChanges) {
        await this.saveTasks(tasks);
      }

      await setLastRecurringCheckDate(now);
    } catch (error) {
      console.error("Error checking recurring tasks:", error);
    }
  },

  // Очистить все задачи (для тестов)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TASKS_KEY);
    } catch (error) {
      console.error("Error clearing tasks:", error);
      throw error;
    }
  },

  // Экспорт задач
  async exportTasks(): Promise<string> {
    try {
      const tasks = await this.getAllTasks();
      return JSON.stringify(tasks, null, 2);
    } catch (error) {
      console.error("Error exporting tasks:", error);
      throw error;
    }
  },

  // Импорт задач
  async importTasks(jsonString: string): Promise<boolean> {
    try {
      const importedTasks = JSON.parse(jsonString);

      // Валидация импортированных данных
      const validTasks = importedTasks
        .filter((task: any) => task.id && task.title && task.priority)
        .map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt || new Date()),
          updatedAt: new Date(task.updatedAt || new Date()),
        }));

      if (validTasks.length === 0) return false;

      const currentTasks = await this.getAllTasks();
      const allTasks = [...currentTasks, ...validTasks];

      await this.saveTasks(allTasks);
      return true;
    } catch (error) {
      console.error("Error importing tasks:", error);
      return false;
    }
  },
};
