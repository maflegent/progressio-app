# ProgressIO

Мобильное приложение для управления задачами с аналитикой, дневником и заметками.

## Технологии

- **Expo SDK 54** - фреймворк для React Native
- **Expo Router** - файловый роутинг
- **React Native 0.81** - мобильная платформа
- **TypeScript** - типизация
- **AsyncStorage** - локальное хранилище
- **SQLite** - база данных
- **date-fns** - работа с датами

## Функции

### Задачи
- Создание и редактирование задач
- Матрица Эйзенхауэра (срочно/важно)
- Повторяющиеся задачи
- Умный ввод (парсинг текста)
- Теги и категории
- Уведомления

### Аналитика
- Статистика выполнения задач
- Графики продуктивности

### Дневник
- Ежедневные записи
- История

### Заметки
- Создание заметок
- Поиск и категоризация

## Установка

```bash
npm install
npx expo start
```

## Структура проекта

```
app/                    # Экраны приложения
  (tabs)/              # Табы навигации
    index.tsx          # Главная (задачи)
    analytics.tsx      # Аналитика
    diary.tsx          # Дневник
    notes.tsx          # Заметки
    settings.tsx       # Настройки
  task-edit.tsx        # Редактирование задачи
  modal.tsx            # Модальные окна

components/            # UI компоненты
  EisenhowerMatrix.tsx
  RecurringPicker.tsx
  SmartTaskInput.tsx
  StatusBar.tsx

contexts/              # React контексты
  TaskContext.tsx
  DiaryContext.tsx
  TagsContext.tsx
  SettingsContext.tsx

constants/             # Константы
  Colors.ts
  Icons.ts
  Styles.ts

utils/                 # Утилиты
  storage.ts
  taskStorage.ts
  notifications.ts
  recurringTasks.ts
  smartInputParser.ts

types/                 # TypeScript типы
```

## Лицензия

MIT
