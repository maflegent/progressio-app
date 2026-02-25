# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-01-?? (Initial Release)

### Added
- **Задачи**
  - Главный экран задач с списком
  - Редактирование задач (task-edit.tsx)
  - Матрица Эйзенхауэра для приоритизации
  - Выбор повторяющихся задач (RecurringPicker)
  - Умный ввод задач (SmartTaskInput)
  - Уведомления о задачах

- **Аналитика**
  - Экран аналитики (analytics.tsx)
  - Хранение аналитики (analyticsStorage.ts)
  - Отслеживание прогресса

- **Дневник**
  - Экран дневника (diary.tsx)
  - Контекст дневника (DiaryContext.tsx)
  - Записи за каждый день

- **Заметки**
  - Экран заметок (notes.tsx)
  - Хранение заметок (notesStorage.ts)
  - Поиск заметок

- **Настройки**
  - Экран настроек (settings.tsx)
  - Контекст настроек (SettingsContext.tsx)

- **Теги**
  - Система тегов
  - Контекст тегов (TagsContext.tsx)

- **UI компоненты**
  - StatusBar.tsx - кастомный статус-бар
  - EditScreenInfo.tsx - информация об экране
  - Themed.tsx - темизация

### Modified
- Настроена цветовая схема (constants/Colors.ts)
- Настроены стили (constants/Styles.ts)
- Настроены иконки (constants/Icons.ts)
- Обновлена конфигурация Expo (app.json, eas.json)

### Technical
- Expo SDK 54
- Expo Router для навигации
- TypeScript
- SQLite для базы данных
- AsyncStorage для простого хранилища
- 53 файла в проекте
