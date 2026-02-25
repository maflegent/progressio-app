// utils/taskChecker.ts
import { Task } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateRecurringTasks, shouldGenerateNextRecurringTask } from './recurringTasks';

const TASKS_KEY = '@progressio_tasks';
const LAST_CHECK_KEY = '@progressio_last_recurring_check';

/**
 * Проверяет и создает повторяющиеся задачи при запуске приложения
 */
export const checkAndGenerateRecurringTasks = async (): Promise<void> => {
  try {
    const now = new Date();
    const lastCheck = await getLastCheckDate();
    
    // Проверяем не чаще чем раз в день
    if (lastCheck && (now.getTime() - lastCheck.getTime() < 24 * 60 * 60 * 1000)) {
      return;
    }

    const tasksJson = await AsyncStorage.getItem(TASKS_KEY);
    if (!tasksJson) return;

    const tasks: Task[] = JSON.parse(tasksJson).map((task: any) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    }));

    let hasChanges = false;
    const newTasks: Task[] = [];

    for (const task of tasks) {
      if (task.isRecurring && task.recurringPattern) {
        try {
          const rule = JSON.parse(task.recurringPattern);
          
          // Проверяем, нужно ли создать новую задачу
          if (shouldGenerateNextRecurringTask(task, now)) {
            const generatedTasks = generateRecurringTasks(task, rule, now);
            
            if (generatedTasks.length > 0) {
              // Добавляем только ближайшую задачу
              newTasks.push(generatedTasks[0]);
              hasChanges = true;
            }
          }
        } catch (error) {
          console.error('Error processing recurring task:', error);
        }
      }
    }

    if (hasChanges) {
      const allTasks = [...tasks, ...newTasks];
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(allTasks));
      await updateLastCheckDate(now);
      console.log(`Generated ${newTasks.length} recurring tasks`);
    }
  } catch (error) {
    console.error('Error checking recurring tasks:', error);
  }
};

/**
 * Получает дату последней проверки
 */
const getLastCheckDate = async (): Promise<Date | null> => {
  try {
    const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
    return lastCheck ? new Date(lastCheck) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Обновляет дату последней проверки
 */
const updateLastCheckDate = async (date: Date): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_CHECK_KEY, date.toISOString());
  } catch (error) {
    console.error('Error updating last check date:', error);
  }
};

/**
 * Возвращает список просроченных задач
 */
export const getOverdueTasks = async (): Promise<Task[]> => {
  try {
    const tasksJson = await AsyncStorage.getItem(TASKS_KEY);
    if (!tasksJson) return [];

    const tasks: Task[] = JSON.parse(tasksJson).map((task: any) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    }));

    const now = new Date();
    
    return tasks.filter(task => 
      !task.isCompleted && 
      task.dueDate && 
      task.dueDate < now
    );
  } catch (error) {
    console.error('Error getting overdue tasks:', error);
    return [];
  }
};