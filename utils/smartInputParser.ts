// utils/smartInputParser.ts
import { EisenhowerMatrix, TaskPriority } from '@/types';

interface ParsedTask {
  title: string;
  description?: string;
  priority?: TaskPriority;
  eisenhower?: EisenhowerMatrix;
  dueDate?: Date;
  tags: string[];
}

export const parseNaturalLanguage = (input: string): ParsedTask => {
  const result: ParsedTask = {
    title: '',
    tags: [],
  };

  let text = input.trim();
  
  // Извлечение тегов
  const tagMatches = text.match(/#(\w+)/g);
  if (tagMatches) {
    result.tags = tagMatches.map(tag => tag.substring(1));
    text = text.replace(/#(\w+)/g, '').trim();
  }

  // Извлечение приоритета
  const priorityKeywords: Record<string, TaskPriority> = {
    'urgent': 'urgent',
    'важно': 'urgent',
    'срочно': 'urgent',
    'high': 'high',
    'высокий': 'high',
    'medium': 'medium',
    'средний': 'medium',
    'низкий': 'low',
    'low': 'low',
  };

  for (const [keyword, priority] of Object.entries(priorityKeywords)) {
    if (text.toLowerCase().includes(keyword)) {
      result.priority = priority;
      text = text.replace(new RegExp(keyword, 'gi'), '').trim();
      break;
    }
  }

  // Извлечение даты
  const datePatterns = [
    { pattern: /(\d{1,2})\.(\d{1,2})\.(\d{4})/, group: [1, 2, 3] }, // ДД.ММ.ГГГГ
    { pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, group: [1, 2, 3] }, // ДД/ММ/ГГГГ
    { pattern: /сегодня/gi }, // сегодня
    { pattern: /завтра/gi }, // завтра
    { pattern: /послезавтра/gi }, // послезавтра
    { pattern: /через (\d+) дней?/i }, // через N дней
    { pattern: /(\d{1,2}):(\d{2})/, group: [1, 2] }, // время ЧЧ:ММ
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern.pattern);
    if (match) {
      const now = new Date();
      
      if (pattern.pattern.toString().includes('сегодня')) {
        result.dueDate = new Date(now.setHours(18, 0, 0, 0)); // Сегодня к 18:00
      } else if (pattern.pattern.toString().includes('завтра')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        result.dueDate = tomorrow;
      } else if (pattern.pattern.toString().includes('послезавтра')) {
        const dayAfterTomorrow = new Date(now);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        dayAfterTomorrow.setHours(18, 0, 0, 0);
        result.dueDate = dayAfterTomorrow;
      } else if (pattern.pattern.toString().includes('через')) {
        const days = parseInt(match[1]);
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + days);
        futureDate.setHours(18, 0, 0, 0);
        result.dueDate = futureDate;
      } else if (pattern.group) {
        // Обработка форматов дат
        if (pattern.group.length === 3) {
          const [day, month, year] = pattern.group.map(i => parseInt(match[i]));
          result.dueDate = new Date(year, month - 1, day, 18, 0, 0, 0);
        }
      }
      
      text = text.replace(pattern.pattern, '').trim();
      break;
    }
  }

  // Извлечение матрицы Эйзенхауэра
  const eisenhowerKeywords: Record<string, EisenhowerMatrix> = {
    'важно и срочно': 'do',
    'важно не срочно': 'decide',
    'не важно срочно': 'delegate',
    'не важно не срочно': 'delete',
    'сделать': 'do',
    'решить': 'decide',
    'делегировать': 'delegate',
    'удалить': 'delete',
  };

  for (const [keyword, quadrant] of Object.entries(eisenhowerKeywords)) {
    if (text.toLowerCase().includes(keyword)) {
      result.eisenhower = quadrant;
      text = text.replace(new RegExp(keyword, 'gi'), '').trim();
      break;
    }
  }

  // Оставшийся текст - заголовок задачи
  result.title = text.trim();

  // Установка значений по умолчанию
  if (!result.priority) {
    result.priority = 'medium';
  }

  return result;
};