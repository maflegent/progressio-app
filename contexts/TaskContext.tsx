import { Task, TaskPriority } from "@/types";
import { TaskRepository } from "@/utils/repositories/TaskRepository";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSettings } from "./SettingsContext";

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  addTask: (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  getTask: (id: string) => Task | undefined;
  filterTasks: (filter: {
    isCompleted?: boolean;
    priority?: TaskPriority;
    tags?: string[];
  }) => Task[];
  refreshTasks: () => Promise<void>;
  clearAllTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { updateRemindersWithTaskCount } = useSettings();

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const activeTasksCount = tasks.filter((t) => !t.isCompleted).length;
      updateRemindersWithTaskCount(activeTasksCount);
    }
  }, [tasks, isLoading, updateRemindersWithTaskCount]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const loadedTasks = await TaskRepository.getAll();
      setTasks(loadedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const id = Date.now().toString();
      const now = new Date();
      const { createdAt: _, updatedAt: __, ...restData } = taskData as any;
      await TaskRepository.insert({
        id,
        ...restData,
        createdAt: now,
        updatedAt: now,
      });
      await loadTasks();
    } catch (error) {
      console.error("Error adding task:", error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await TaskRepository.update(id, updates);
      await loadTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await TaskRepository.delete(id);
      await loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    try {
      await TaskRepository.toggleComplete(id);
      await loadTasks();
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const getTask = (id: string): Task | undefined => {
    return tasks.find((task) => task.id === id);
  };

  const filterTasks = (filter: {
    isCompleted?: boolean;
    priority?: TaskPriority;
    tags?: string[];
  }): Task[] => {
    return tasks.filter((task) => {
      if (
        filter.isCompleted !== undefined &&
        task.isCompleted !== filter.isCompleted
      ) {
        return false;
      }
      if (filter.priority && task.priority !== filter.priority) {
        return false;
      }
      if (filter.tags && filter.tags.length > 0) {
        const hasAllTags = filter.tags.every((tag) => task.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      return true;
    });
  };

  const refreshTasks = async () => {
    await loadTasks();
  };

  const clearAllTasks = async () => {
    try {
      await TaskRepository.deleteAll();
      setTasks([]);
    } catch (error) {
      console.error("Error clearing all tasks:", error);
      throw error;
    }
  };

  const value = {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    getTask,
    filterTasks,
    refreshTasks,
    clearAllTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
