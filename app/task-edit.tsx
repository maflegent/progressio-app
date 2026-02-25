// app/task-edit.tsx - обновленная версия с кнопками быстрого доступа
import { RecurringPicker } from "@/components/RecurringPicker";
import { Colors } from "@/constants/Colors";
import { useTags } from "@/contexts/TagsContext";
import { useTasks } from "@/contexts/TaskContext";
import { EisenhowerMatrix, TaskPriority } from "@/types";
import {
  cancelTaskReminder,
  scheduleTaskReminder,
} from "@/utils/notifications";
import { RecurringRule } from "@/utils/recurringTasks";
import { taskStorage } from "@/utils/taskStorage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function TaskEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { updateTask, getTask, refreshTasks } = useTasks();
  const { customTags, addCustomTag } = useTags();

  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    eisenhower: undefined as EisenhowerMatrix | undefined,
    tags: [] as string[],
    currentTag: "",
    recurringRule: null as RecurringRule | null,
    dueDate: undefined as Date | undefined,
    reminderMinutesBefore: 15 as number | null, // null = без напоминания
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<string>("");

  // Загружаем задачу при редактировании
  useEffect(() => {
    if (isEditing && id) {
      const task = getTask(id);
      if (task) {
        let recurringRule = null;
        if (task.recurringPattern) {
          try {
            recurringRule = JSON.parse(task.recurringPattern);
          } catch (error) {
            console.error("Error parsing recurring pattern:", error);
          }
        }

        // Вычисляем время напоминания
        let reminderMinutesBefore: number | null = 15; // по умолчанию
        if (task.reminderDate && task.dueDate) {
          const diffMs = task.dueDate.getTime() - task.reminderDate.getTime();
          const diffMinutes = Math.floor(diffMs / (60 * 1000));
          reminderMinutesBefore = diffMinutes;
        } else if (!task.reminderDate) {
          reminderMinutesBefore = null;
        }

        setFormData({
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          eisenhower: task.eisenhower,
          tags: task.tags || [],
          currentTag: "",
          recurringRule,
          dueDate: task.dueDate,
          reminderMinutesBefore,
        });
      }
    }
  }, [id, isEditing, getTask]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Ошибка", "Название задачи обязательно");
      return;
    }

    setIsLoading(true);
    try {
      // Ограничиваем описание до 300 символов
      const description = formData.description.trim();
      const truncatedDescription =
        description.length > 300
          ? description.substring(0, 300) + "..."
          : description || undefined;

      // Рассчитываем дату напоминания
      let reminderDate: Date | undefined;
      if (formData.dueDate && formData.reminderMinutesBefore) {
        reminderDate = new Date(
          formData.dueDate.getTime() -
            formData.reminderMinutesBefore * 60 * 1000,
        );
      }

      const taskData = {
        title: formData.title.trim(),
        description: truncatedDescription,
        priority: formData.priority,
        eisenhower: formData.eisenhower,
        tags: formData.tags,
        isCompleted: false,
        isRecurring: !!formData.recurringRule,
        recurringPattern: formData.recurringRule
          ? JSON.stringify(formData.recurringRule)
          : undefined,
        dueDate: formData.dueDate,
        reminderDate,
      };

      let taskId: string;
      if (isEditing && id) {
        // Отменяем старое напоминание
        await cancelTaskReminder(id);
        await updateTask(id, taskData);
        taskId = id;
        Alert.alert("Успех", "Задача обновлена");
      } else {
        taskId = await taskStorage.createTask(taskData);
        await refreshTasks();
        Alert.alert("Успех", "Задача создана");
      }

      // Планируем новое напоминание
      if (formData.dueDate && formData.reminderMinutesBefore && reminderDate) {
        try {
          const identifier = await scheduleTaskReminder(
            taskId,
            formData.title,
            formData.dueDate,
            formData.reminderMinutesBefore,
          );
          if (!identifier) {
            console.warn(
              "Напоминание не запланировано (может быть ограничение Expo Go)",
            );
          }
        } catch (error) {
          console.warn(
            "Ошибка планирования напоминания (может быть ограничение Expo Go):",
            error,
          );
        }
      }

      router.back();
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Ошибка", "Не удалось сохранить задачу");
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = async () => {
    const trimmedTag = formData.currentTag.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag],
        currentTag: "",
      });
      // Сохраняем тег в контекст для быстрого доступа
      try {
        await addCustomTag(trimmedTag);
      } catch (error) {
        console.error("Error saving tag:", error);
      }
    }
  };

  const handleQuickTagSelect = async (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
      // Сохраняем тег в контекст (перемещаем в начало списка)
      try {
        await addCustomTag(tag);
      } catch (error) {
        console.error("Error saving tag:", error);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleRecurringChange = (rule: RecurringRule | null) => {
    setFormData({
      ...formData,
      recurringRule: rule,
    });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "#EF4444";
      case "high":
        return "#F59E0B";
      case "medium":
        return "#3B82F6";
      case "low":
        return "#10B981";
      default:
        return colors.muted;
    }
  };

  const getEisenhowerColor = (quadrant?: EisenhowerMatrix) => {
    switch (quadrant) {
      case "do":
        return "#10B981";
      case "decide":
        return "#3B82F6";
      case "delegate":
        return "#F59E0B";
      case "delete":
        return "#EF4444";
      default:
        return colors.muted;
    }
  };

  // Быстрые действия для матрицы Эйзенхауэра
  const quickEisenhowerActions = [
    {
      type: "do" as EisenhowerMatrix,
      label: "Сделать",
      icon: "flash",
      color: "#10B981",
    },
    {
      type: "decide" as EisenhowerMatrix,
      label: "Решить",
      icon: "calendar",
      color: "#3B82F6",
    },
    {
      type: "delegate" as EisenhowerMatrix,
      label: "Делегировать",
      icon: "people",
      color: "#F59E0B",
    },
    {
      type: "delete" as EisenhowerMatrix,
      label: "Удалить",
      icon: "trash",
      color: "#EF4444",
    },
  ];

  // Быстрые действия для приоритета
  const quickPriorityActions = [
    {
      type: "urgent" as TaskPriority,
      label: "Срочно",
      icon: "alert-circle",
      color: "#EF4444",
    },
    {
      type: "high" as TaskPriority,
      label: "Высокий",
      icon: "trending-up",
      color: "#F59E0B",
    },
    {
      type: "medium" as TaskPriority,
      label: "Средний",
      icon: "remove",
      color: "#3B82F6",
    },
    {
      type: "low" as TaskPriority,
      label: "Низкий",
      icon: "trending-down",
      color: "#10B981",
    },
  ];

  // Быстрые даты
  const quickDates = [
    { label: "Сегодня", days: 0 },
    { label: "Завтра", days: 1 },
    { label: "Через 3 дня", days: 3 },
    { label: "Через неделю", days: 7 },
  ];

  const handleQuickDateSelect = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(18, 0, 0, 0); // На 18:00
    setFormData({ ...formData, dueDate: date });
    setShowDatePicker(false);
  };

  const handleDateInput = () => {
    if (tempDate) {
      try {
        // Пробуем разные форматы дат
        const formats = [
          tempDate, // Как есть
          tempDate.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1"), // ДД.ММ.ГГГГ → ГГГГ-ММ-ДД
          tempDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1"), // ДД/ММ/ГГГГ → ГГГГ-ММ-ДД
        ];

        let parsedDate: Date | null = null;
        for (const format of formats) {
          const date = new Date(format);
          if (!isNaN(date.getTime())) {
            parsedDate = date;
            break;
          }
        }

        if (parsedDate) {
          setFormData({ ...formData, dueDate: parsedDate });
          setShowDatePicker(false);
          setTempDate("");
        } else {
          Alert.alert(
            "Ошибка",
            "Неверный формат даты. Используйте ГГГГ-ММ-ДД или ДД.ММ.ГГГГ",
          );
        }
      } catch (error) {
        Alert.alert("Ошибка", "Неверный формат даты");
      }
    } else {
      setFormData({ ...formData, dueDate: undefined });
      setShowDatePicker(false);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Не указана";

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Сегодня";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Завтра";
    } else {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  const clearDueDate = () => {
    setFormData({ ...formData, dueDate: undefined });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? "Редактировать задачу" : "Новая задача",
          headerRight: () => (
            <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>
                {isLoading ? "Сохранение..." : "Сохранить"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Заголовок задачи */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Название задачи *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.cardForeground,
                  borderColor: colors.border,
                },
              ]}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Что нужно сделать?"
              placeholderTextColor={colors.muted}
              autoFocus={!isEditing}
            />
          </View>

          {/* Быстрые действия - кнопки для приоритета и матрицы */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Быстрые настройки
            </Text>

            {/* Кнопка для быстрого выбора приоритета */}
            <View style={styles.quickActionsRow}>
              <Text style={[styles.subLabel, { color: colors.muted }]}>
                Приоритет:
              </Text>
              <View style={styles.quickActions}>
                {quickPriorityActions.map((action) => (
                  <TouchableOpacity
                    key={action.type}
                    style={[
                      styles.quickActionButton,
                      {
                        backgroundColor:
                          formData.priority === action.type
                            ? action.color
                            : colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, priority: action.type })
                    }
                  >
                    <Ionicons
                      name={action.icon as any}
                      size={16}
                      color={
                        formData.priority === action.type
                          ? "#FFFFFF"
                          : action.color
                      }
                    />
                    <Text
                      style={[
                        styles.quickActionText,
                        {
                          color:
                            formData.priority === action.type
                              ? "#FFFFFF"
                              : colors.cardForeground,
                        },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Кнопка для матрицы Эйзенхауэра */}
            <View style={styles.quickActionsRow}>
              <Text style={[styles.subLabel, { color: colors.muted }]}>
                Матрица Эйзенхауэра:
              </Text>
              <View style={styles.quickActions}>
                {quickEisenhowerActions.map((action) => (
                  <TouchableOpacity
                    key={action.type}
                    style={[
                      styles.quickActionButton,
                      {
                        backgroundColor:
                          formData.eisenhower === action.type
                            ? action.color
                            : colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        eisenhower:
                          formData.eisenhower === action.type
                            ? undefined
                            : action.type,
                      })
                    }
                  >
                    <Ionicons
                      name={action.icon as any}
                      size={16}
                      color={
                        formData.eisenhower === action.type
                          ? "#FFFFFF"
                          : action.color
                      }
                    />
                    <Text
                      style={[
                        styles.quickActionText,
                        {
                          color:
                            formData.eisenhower === action.type
                              ? "#FFFFFF"
                              : colors.cardForeground,
                        },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Кнопка для даты выполнения */}
            <View style={styles.quickActionsRow}>
              <Text style={[styles.subLabel, { color: colors.muted }]}>
                Дата выполнения:
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: formData.dueDate
                      ? getPriorityColor(formData.priority) + "20"
                      : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar"
                  size={16}
                  color={
                    formData.dueDate
                      ? getPriorityColor(formData.priority)
                      : colors.muted
                  }
                />
                <Text
                  style={[
                    styles.dateButtonText,
                    {
                      color: formData.dueDate
                        ? getPriorityColor(formData.priority)
                        : colors.muted,
                    },
                  ]}
                >
                  {formatDate(formData.dueDate)}
                </Text>
                {formData.dueDate && (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={clearDueDate}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Напоминание */}
            {formData.dueDate && (
              <View style={styles.quickActionsRow}>
                <Text style={[styles.subLabel, { color: colors.muted }]}>
                  Напоминание:
                </Text>
                <View style={styles.quickActions}>
                  {[
                    { value: null, label: "Без" },
                    { value: 15, label: "15 мин" },
                    { value: 60, label: "1 час" },
                    { value: 1440, label: "1 день" },
                    { value: 10080, label: "1 неделя" },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.reminderChip,
                        {
                          backgroundColor:
                            formData.reminderMinutesBefore === option.value
                              ? colors.primary
                              : colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          reminderMinutesBefore: option.value,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.reminderChipText,
                          {
                            color:
                              formData.reminderMinutesBefore === option.value
                                ? colors.primaryForeground
                                : colors.cardForeground,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Описание задачи */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Описание (необязательно)
              </Text>
              <Text style={[styles.charCount, { color: colors.muted }]}>
                {formData.description.length}/300
              </Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  color: colors.cardForeground,
                  borderColor:
                    formData.description.length > 300
                      ? "#EF4444"
                      : colors.border,
                },
              ]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  description: text.substring(0, 300),
                })
              }
              placeholder="Дополнительные детали, комментарии, ссылки..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
            {formData.description.length > 280 && (
              <Text style={[styles.charWarning, { color: "#F59E0B" }]}>
                {formData.description.length > 300
                  ? "Превышен лимит символов"
                  : `Осталось ${300 - formData.description.length} символов`}
              </Text>
            )}
          </View>

          {/* Повторение задачи */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Повторение задачи
              </Text>
              <TouchableOpacity
                onPress={() => setShowQuickActions(!showQuickActions)}
              >
                <Ionicons
                  name={showQuickActions ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <RecurringPicker
              value={
                formData.recurringRule
                  ? JSON.stringify(formData.recurringRule)
                  : undefined
              }
              onChange={handleRecurringChange}
            />

            {showQuickActions && (
              <View style={styles.quickRecurringActions}>
                <Text style={[styles.hint, { color: colors.muted }]}>
                  Быстрые шаблоны:
                </Text>
                <View style={styles.recurringChips}>
                  <TouchableOpacity
                    style={[
                      styles.recurringChip,
                      { backgroundColor: colors.card },
                    ]}
                    onPress={() => handleRecurringChange({ pattern: "daily" })}
                  >
                    <Ionicons name="repeat" size={14} color={colors.primary} />
                    <Text
                      style={[
                        styles.recurringChipText,
                        { color: colors.cardForeground },
                      ]}
                    >
                      Ежедневно
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.recurringChip,
                      { backgroundColor: colors.card },
                    ]}
                    onPress={() => handleRecurringChange({ pattern: "weekly" })}
                  >
                    <Ionicons
                      name="calendar"
                      size={14}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.recurringChipText,
                        { color: colors.cardForeground },
                      ]}
                    >
                      Еженедельно
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.recurringChip,
                      { backgroundColor: colors.card },
                    ]}
                    onPress={() =>
                      handleRecurringChange({ pattern: "weekdays" })
                    }
                  >
                    <Ionicons
                      name="business"
                      size={14}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.recurringChipText,
                        { color: colors.cardForeground },
                      ]}
                    >
                      По будням
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.recurringChip,
                      { backgroundColor: "#EF444420" },
                    ]}
                    onPress={() => handleRecurringChange(null)}
                  >
                    <Ionicons name="close-circle" size={14} color="#EF4444" />
                    <Text
                      style={[styles.recurringChipText, { color: "#EF4444" }]}
                    >
                      Без повторения
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Теги */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Теги
            </Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[
                  styles.tagInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.cardForeground,
                    borderColor: colors.border,
                  },
                ]}
                value={formData.currentTag}
                onChangeText={(text) =>
                  setFormData({ ...formData, currentTag: text })
                }
                placeholder="Добавить тег..."
                placeholderTextColor={colors.muted}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity
                style={[
                  styles.addTagButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={addTag}
              >
                <Text style={{ color: colors.primaryForeground }}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Список тегов */}
            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      {tag} ×
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Быстрые теги */}
            <View style={styles.quickTags}>
              <Text style={[styles.hint, { color: colors.muted }]}>
                Популярные теги:
              </Text>
              <View style={styles.quickTagsRow}>
                {customTags.slice(0, 8).map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.quickTag,
                      { backgroundColor: colors.card },
                      formData.tags.includes(tag) && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleQuickTagSelect(tag)}
                  >
                    <Text
                      style={[
                        styles.quickTagText,
                        {
                          color: formData.tags.includes(tag)
                            ? colors.primaryForeground
                            : colors.cardForeground,
                        },
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Модальное окно выбора даты */}
        <Modal
          visible={showDatePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Выберите дату выполнения
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Быстрый выбор даты */}
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                Быстрые варианты:
              </Text>
              <View style={styles.quickDatesGrid}>
                {quickDates.map((date) => (
                  <TouchableOpacity
                    key={date.label}
                    style={[
                      styles.quickDateButton,
                      { backgroundColor: colors.card },
                    ]}
                    onPress={() => handleQuickDateSelect(date.days)}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        { color: colors.cardForeground },
                      ]}
                    >
                      {date.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ручной ввод даты */}
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                Или введите дату вручную:
              </Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.card,
                      color: colors.cardForeground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={tempDate}
                  onChangeText={setTempDate}
                  placeholder="ГГГГ-ММ-ДД или ДД.ММ.ГГГГ"
                  placeholderTextColor={colors.muted}
                />
                <TouchableOpacity
                  style={[
                    styles.dateInputButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleDateInput}
                >
                  <Text
                    style={[
                      styles.dateInputButtonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    OK
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.dateHint, { color: colors.muted }]}>
                Примеры: 2024-12-25, 25.12.2024, 25/12/2024
              </Text>

              <TouchableOpacity
                style={[
                  styles.clearDateModalButton,
                  { borderColor: colors.border },
                ]}
                onPress={clearDueDate}
              >
                <Text
                  style={[styles.clearDateModalText, { color: colors.muted }]}
                >
                  Удалить дату выполнения
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Для кнопки сохранения
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginRight: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  charWarning: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  quickActionsRow: {
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  reminderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  reminderChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateButtonText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  clearDateButton: {
    marginLeft: 8,
  },
  quickRecurringActions: {
    marginTop: 12,
  },
  recurringChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  recurringChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  recurringChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  quickTags: {
    marginTop: 8,
  },
  quickTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  quickTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  quickTagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  hint: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 16,
  },
  quickDatesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickDateButton: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  quickDateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dateInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateInputButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateInputButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dateHint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
    textAlign: "center",
  },
  clearDateModalButton: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  clearDateModalText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
