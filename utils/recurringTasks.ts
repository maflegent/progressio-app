// utils/recurringTasks.ts
import { Task } from '@/types';

export type RecurringPattern = 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'yearly' 
  | 'weekdays' 
  | 'weekends'
  | 'custom';

export interface RecurringRule {
  pattern: RecurringPattern;
  interval?: number; // Например: каждые 2 дня
  weekDays?: number[]; // 0-6 (воскресенье-суббота)
  monthDay?: number; // День месяца (1-31)
  endDate?: Date; // Дата окончания повторений
  occurrences?: number; // Максимальное количество повторений
}

/**
 * Создает новые задачи на основе повторяющегося шаблона
 */
export const generateRecurringTasks = (
  originalTask: Task,
  rule: RecurringRule,
  fromDate: Date = new Date()
): Task[] => {
  const newTasks: Task[] = [];
  const now = new Date();
  
  // Определяем, сколько повторений создать
  const maxOccurrences = rule.occurrences || 365; // По умолчанию на год вперед
  
  for (let i = 1; i <= maxOccurrences; i++) {
    const dueDate = calculateNextDueDate(
      originalTask.dueDate || originalTask.createdAt,
      rule,
      i
    );
    
    // Если дата в будущем и не превышает endDate
    if (dueDate > now && (!rule.endDate || dueDate <= rule.endDate)) {
      const newTask: Task = {
        ...originalTask,
        id: `${originalTask.id}_recur_${i}_${dueDate.getTime()}`,
        dueDate,
        isCompleted: false,
        isRecurring: true,
        recurringPattern: JSON.stringify(rule),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      newTasks.push(newTask);
    } else if (dueDate > now && rule.endDate && dueDate > rule.endDate) {
      break; // Превысили endDate
    }
  }
  
  return newTasks;
};

/**
 * Вычисляет следующую дату выполнения на основе правила повторения
 */
export const calculateNextDueDate = (
  startDate: Date,
  rule: RecurringRule,
  occurrence: number = 1
): Date => {
  const date = new Date(startDate);
  
  switch (rule.pattern) {
    case 'daily':
      date.setDate(date.getDate() + (rule.interval || 1) * occurrence);
      break;
      
    case 'weekly':
      date.setDate(date.getDate() + 7 * (rule.interval || 1) * occurrence);
      break;
      
    case 'monthly':
      date.setMonth(date.getMonth() + (rule.interval || 1) * occurrence);
      // Корректировка для дней, которых нет в месяце
      if (rule.monthDay) {
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(rule.monthDay, daysInMonth));
      }
      break;
      
    case 'yearly':
      date.setFullYear(date.getFullYear() + (rule.interval || 1) * occurrence);
      break;
      
    case 'weekdays':
      let daysAdded = 0;
      let currentOccurrence = 0;
      
      while (currentOccurrence < occurrence) {
        date.setDate(date.getDate() + 1);
        daysAdded++;
        
        const dayOfWeek = date.getDay(); // 0 - воскресенье, 6 - суббота
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Понедельник-пятница
          currentOccurrence++;
        }
      }
      break;
      
    case 'weekends':
      let weekendDaysAdded = 0;
      let weekendOccurrence = 0;
      
      while (weekendOccurrence < occurrence) {
        date.setDate(date.getDate() + 1);
        weekendDaysAdded++;
        
        const dayOfWeek = date.getDay(); // 0 - воскресенье, 6 - суббота
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Суббота или воскресенье
          weekendOccurrence++;
        }
      }
      break;
      
    case 'custom':
      if (rule.weekDays && rule.weekDays.length > 0) {
        let customDaysAdded = 0;
        let customOccurrence = 0;
        
        while (customOccurrence < occurrence) {
          date.setDate(date.getDate() + 1);
          customDaysAdded++;
          
          const dayOfWeek = date.getDay();
          if (rule.weekDays.includes(dayOfWeek)) {
            customOccurrence++;
          }
        }
      }
      break;
  }
  
  return date;
};

/**
 * Проверяет, нужно ли создать следующую повторяющуюся задачу
 */
export const shouldGenerateNextRecurringTask = (
  task: Task,
  completedDate: Date = new Date()
): boolean => {
  if (!task.isRecurring || !task.recurringPattern) return false;
  
  try {
    const rule: RecurringRule = JSON.parse(task.recurringPattern);
    const nextDueDate = calculateNextDueDate(
      task.dueDate || task.createdAt,
      rule,
      1
    );
    
    // Создаем новую задачу, если текущая выполнена и следующая дата наступила или наступит скоро
    return completedDate >= nextDueDate;
  } catch (error) {
    console.error('Error parsing recurring pattern:', error);
    return false;
  }
};

/**
 * Возвращает человекочитаемое описание правила повторения
 */
export const getRecurringDescription = (pattern?: string): string => {
  if (!pattern) return 'Не повторяется';
  
  try {
    const rule: RecurringRule = JSON.parse(pattern);
    
    switch (rule.pattern) {
      case 'daily':
        return rule.interval && rule.interval > 1 
          ? `Каждые ${rule.interval} дней`
          : 'Ежедневно';
          
      case 'weekly':
        return rule.interval && rule.interval > 1
          ? `Каждые ${rule.interval} недель`
          : 'Еженедельно';
          
      case 'monthly':
        if (rule.monthDay) {
          return `${rule.monthDay}-го числа каждого месяца`;
        }
        return rule.interval && rule.interval > 1
          ? `Каждые ${rule.interval} месяцев`
          : 'Ежемесячно';
          
      case 'yearly':
        return 'Ежегодно';
        
      case 'weekdays':
        return 'По будням (пн-пт)';
        
      case 'weekends':
        return 'По выходным (сб-вс)';
        
      case 'custom':
        if (rule.weekDays && rule.weekDays.length > 0) {
          const days = rule.weekDays.map(day => {
            const dayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
            return dayNames[day];
          });
          return `По ${days.join(', ')}`;
        }
        return 'По расписанию';
        
      default:
        return 'Повторяется';
    }
  } catch (error) {
    return pattern; // Возвращаем исходную строку если не удалось распарсить
  }
};