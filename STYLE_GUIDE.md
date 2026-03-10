# Документация по стилю и компонентам

## Единая система стилей

### Файл: `constants/Styles.ts`

Содержит унифицированные константы и стили для всего приложения.

#### Константы

```typescript
// Отступы
SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32
}

// Радиусы скругления
RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999
}

// Размеры шрифтов
FONTSIZE = {
  xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 20, xxxl: 24, display: 28
}

// Толщина шрифта
FONTWEIGHT = {
  normal: '400', medium: '500', semibold: '600', bold: '700'
}

// Тени
SHADOWS = { sm, md, lg }
```

#### Общие стили

```typescript
CommonStyles.container        // Основной контейнер
CommonStyles.card             // Карточка
CommonStyles.button           // Кнопка
CommonStyles.input            // Поле ввода
CommonStyles.chip             // Чип/тег
CommonStyles.badge            // Бейдж
CommonStyles.fab              // Плавающая кнопка
CommonStyles.modalOverlay     // Оверлей модального окна
CommonStyles.emptyState       // Пустое состояние
```

## Новый компонент создания задач

### Файл: `components/TaskCreator.tsx`

Улучшенное модальное меню для создания и редактирования задач.

#### Возможности:

1. **Быстрые настройки**
   - Выбор приоритета (4 уровня с цветовой индикацией)
   - Матрица Эйзенхауэра (4 квадранта)
   - Быстрый выбор даты (Сегодня, Завтра, 3 дня, Неделя, Месяц)
   - Настраиваемые напоминания (5 мин, 15 мин, 30 мин, 1 час, 1 день, 1 неделя)

2. **Повторяющиеся задачи**
   - Предустановленные шаблоны: Ежедневно, Еженедельно, Ежемесячно
   - Специальные режимы: По будням, По выходным
   - Возможность настройки интервала

3. **Теги**
   - Автодополнение
   - Быстрый выбор популярных тегов
   - Сохранение часто используемых тегов

4. **Описание**
   - Лимит 300 символов
   - Счетчик символов
   - Предупреждение при приближении к лимиту

#### Использование:

```tsx
import { TaskCreator, TaskFormData } from '@/components/TaskCreator';

const [showCreator, setShowCreator] = useState(false);

// Создание новой задачи
<TaskCreator
  visible={showCreator}
  onClose={() => setShowCreator(false)}
  onSubmit={async (data: TaskFormData) => {
    await addTask({
      title: data.title,
      description: data.description,
      priority: data.priority,
      eisenhower: data.eisenhower,
      tags: data.tags,
      dueDate: data.dueDate,
      isRecurring: !!data.recurringRule,
      recurringPattern: data.recurringRule 
        ? JSON.stringify(data.recurringRule) 
        : undefined,
      isCompleted: false,
    });
  }}
  mode="create"
/>

// Редактирование задачи
<TaskCreator
  visible={showCreator}
  onClose={() => setShowCreator(false)}
  onSubmit={handleUpdateTask}
  mode="edit"
  initialData={{
    title: task.title,
    description: task.description,
    priority: task.priority,
    eisenhower: task.eisenhower,
    tags: task.tags,
    dueDate: task.dueDate,
    reminderMinutesBefore: 15,
    recurringRule: task.recurringPattern 
      ? JSON.parse(task.recurringPattern) 
      : null,
  }}
/>
```

### Типы данных:

```typescript
interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority; // 'urgent' | 'high' | 'medium' | 'low'
  eisenhower?: EisenhowerMatrix; // 'do' | 'decide' | 'delegate' | 'delete'
  tags: string[];
  dueDate?: Date;
  reminderMinutesBefore: number | null; // null = без напоминания
  recurringRule: RecurringRule | null;
}

interface RecurringRule {
  pattern: RecurringPattern;
  interval?: number;
  weekDays?: number[];
  monthDay?: number;
  endDate?: Date;
  occurrences?: number;
}
```

## Улучшенный экран задач

### Файл: `components/TasksScreen.tsx`

Новый компонент главного экрана с использованием TaskCreator.

#### Особенности:

- Компактные фильтры с бейджами количества
- Цветовая индикация приоритетов и категорий
- Быстрый доступ к редактированию (долгое нажатие)
- Плавающая кнопка создания задачи
- Интеграция с TaskCreator

#### Использование:

```tsx
import { TasksScreen } from '@/components/TasksScreen';

export default TasksScreen;
```

## Рекомендации по стилю

### 1. Используйте константы

```tsx
// ❌ Плохо
<View style={{ padding: 16, borderRadius: 12 }}>

// ✅ Хорошо
<View style={[styles.card, { padding: SPACING.lg, borderRadius: RADIUS.md }]}>
```

### 2. Используйте CommonStyles

```tsx
// ❌ Плохо
const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  }
});

// ✅ Хорошо
<TouchableOpacity style={CommonStyles.button}>
```

### 3. Используйте SHADOWS

```tsx
// ❌ Плохо
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,

// ✅ Хорошо
<View style={[styles.card, SHADOWS.md]}>
```

### 4. Цветовая схема

```tsx
// Приоритеты
urgent: '#EF4444'  // Красный
high: '#F59E0B'    // Оранжевый
medium: '#3B82F6'  // Синий
low: '#10B981'     // Зеленый

// Матрица Эйзенхауэра
do: '#10B981'      // Зеленый - Сделать
decide: '#3B82F6'  // Синий - Запланировать
delegate: '#F59E0B' // Оранжевый - Делегировать
delete: '#EF4444'  // Красный - Убрать

// Повторяющиеся задачи
recurring: '#8B5CF6' // Фиолетовый
```

## Миграция

Для миграции существующих компонентов:

1. Замените хардкод на константы из `Styles.ts`
2. Используйте `CommonStyles` для типовых элементов
3. Добавьте типизацию через TypeScript
4. Используйте новый `TaskCreator` для создания задач

## Преимущества нового подхода

1. **Единообразие** - все компоненты используют одни и те же стили
2. **Поддерживаемость** - изменение в одном месте влияет на всё приложение
3. **Гибкость** - новый TaskCreator поддерживает все функции задач
4. **UX** - интуитивное меню с быстрыми настройками
5. **Типобезопасность** - полная типизация через TypeScript
