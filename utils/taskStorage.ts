// utils/taskStorage.ts
import { Task } from "@/types";
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
  return `${Date.now()}_${idCounter}_${Math.random().toString(36).substring(2, 11)}`;
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

  // Очистить все задачи (для тестов/сброса)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TASKS_KEY);
    } catch (error) {
      console.error("Error clearing tasks:", error);
      throw error;
    }
  },
};
