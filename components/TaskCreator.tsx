import { Colors } from "@/constants/Colors";
import { useFolders } from "@/contexts/FoldersContext";
import { useTags } from "@/contexts/TagsContext";
import { TaskPriority } from "@/types";
import {
  getRecurringDescription,
  RecurringPattern,
  RecurringRule,
} from "@/utils/recurringTasks";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import React, { useEffect, useMemo, useState } from "react";
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
  View,
} from "react-native";

// --- Типы ---

interface TaskCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskFormData) => Promise<void>;
  initialData?: Partial<TaskFormData>;
  mode?: "create" | "edit";
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  folder?: string; // Заменили eisenhower на folder
  tags: string[];
  dueDate?: Date;
  reminderMinutesBefore: number | null;
  recurringRule: RecurringRule | null;
}

// --- Константы ---

const PRIORITY_CONFIG = {
  urgent: { label: "Срочно", icon: "alert-circle", color: "#EF4444" },
  high: { label: "Высокий", icon: "trending-up", color: "#F59E0B" },
  medium: { label: "Средний", icon: "remove", color: "#3B82F6" },
  low: { label: "Низкий", icon: "trending-down", color: "#10B981" },
} as const;

const DEFAULT_FOLDER_CONFIG = {
  work: { label: "Работа", icon: "briefcase", color: "#3B82F6" },
  personal: { label: "Личное", icon: "heart", color: "#EC4899" },
  study: { label: "Учеба", icon: "school", color: "#8B5CF6" },
  shopping: { label: "Покупки", icon: "cart", color: "#10B981" },
  health: { label: "Здоровье", icon: "fitness", color: "#EF4444" },
  ideas: { label: "Идеи", icon: "bulb", color: "#F59E0B" },
  other: { label: "Другое", icon: "folder", color: "#6B7280" },
} as const;

type FolderConfigKey = keyof typeof DEFAULT_FOLDER_CONFIG;

const REMINDER_OPTIONS = [
  { value: null, label: "Без напоминания" },
  { value: 5, label: "5 мин" },
  { value: 15, label: "15 мин" },
  { value: 30, label: "30 мин" },
  { value: 60, label: "1 час" },
  { value: 1440, label: "1 день" },
  { value: 10080, label: "1 неделя" },
];

const QUICK_DATES = [
  { label: "Сегодня", days: 0, icon: "today" },
  { label: "Завтра", days: 1, icon: "calendar" },
  { label: "Через 3 дня", days: 3, icon: "calendar-outline" },
  { label: "Через неделю", days: 7, icon: "calendar" },
  { label: "Через месяц", days: 30, icon: "calendar-outline" },
];

const RECURRING_PRESETS = [
  { pattern: "daily" as RecurringPattern, label: "Ежедневно", icon: "repeat" },
  {
    pattern: "weekly" as RecurringPattern,
    label: "Еженедельно",
    icon: "calendar",
  },
  {
    pattern: "monthly" as RecurringPattern,
    label: "Ежемесячно",
    icon: "calendar-outline",
  },
  {
    pattern: "weekdays" as RecurringPattern,
    label: "По будням",
    icon: "business",
  },
  {
    pattern: "weekends" as RecurringPattern,
    label: "По выходным",
    icon: "cafe",
  },
];

// --- Основной компонент ---

export const TaskCreator: React.FC<TaskCreatorProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}) => {
  const { customTags, addCustomTag } = useTags();
  const { customFolders } = useFolders();
  const colorScheme = "light";
  const colors = Colors[colorScheme];

  // Объединяем дефолтные и пользовательские папки
  const allFolders: Record<
    string,
    { label: string; icon: string; color: string }
  > = {
    ...DEFAULT_FOLDER_CONFIG,
    ...customFolders.reduce<
      Record<string, { label: string; icon: string; color: string }>
    >((acc, folder) => {
      acc[folder.id] = {
        label: folder.label,
        icon: folder.icon,
        color: folder.color,
      };
      return acc;
    }, {}),
  };

  // Состояние формы
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    folder: "other",
    tags: [],
    dueDate: undefined,
    reminderMinutesBefore: 15,
    recurringRule: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("main");
  const [newTag, setNewTag] = useState("");
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [selectedReminderDate, setSelectedReminderDate] = useState<Date | null>(
    null,
  );

  // Инициализация данных
  useEffect(() => {
    if (visible && initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        priority: initialData.priority || "medium",
        folder: initialData.folder || "other",
        tags: initialData.tags || [],
        dueDate: initialData.dueDate,
        reminderMinutesBefore: initialData.reminderMinutesBefore ?? 15,
        recurringRule: initialData.recurringRule || null,
      });
    } else if (visible) {
      // Сброс формы при открытии
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        folder: "other",
        tags: [],
        dueDate: undefined,
        reminderMinutesBefore: 15,
        recurringRule: null,
      });
    }
    setActiveSection("main");
  }, [visible, initialData]);

  // Обработчики
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Ошибка", "Введите название задачи");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim().substring(0, 300),
      });
      onClose();
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось сохранить задачу");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = async () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      await addCustomTag(tag);
      setNewTag("");
    }
  };

  const handleQuickTag = async (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      await addCustomTag(tag);
    } else {
      setFormData((prev) => ({
        ...prev,
        tags: prev.tags.filter((t) => t !== tag),
      }));
    }
  };

  const handleQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(18, 0, 0, 0);
    setFormData((prev) => ({ ...prev, dueDate: date }));
    setActiveSection("main");
  };

  // Обработчик DateTimePicker для dueDate
  const handleDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (formData.dueDate) {
        // Сохраняем время из предыдущей даты
        newDate.setHours(formData.dueDate.getHours());
        newDate.setMinutes(formData.dueDate.getMinutes());
      } else {
        newDate.setHours(18, 0, 0, 0);
      }
      setFormData((prev) => ({ ...prev, dueDate: newDate }));
      setShowDueTimePicker(true);
    }
  };

  const handleDueTimeChange = (event: any, selectedTime?: Date) => {
    setShowDueTimePicker(false);
    if (selectedTime && formData.dueDate) {
      const newDate = new Date(formData.dueDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setFormData((prev) => ({ ...prev, dueDate: newDate }));
    }
  };

  const handleRecurringSelect = (pattern: RecurringPattern) => {
    if (formData.recurringRule?.pattern === pattern) {
      setFormData((prev) => ({ ...prev, recurringRule: null }));
    } else {
      setFormData((prev) => ({ ...prev, recurringRule: { pattern } }));
    }
  };

  // Форматирование
  const formatDateDisplay = (date?: Date): string => {
    if (!date) return "Не указана";
    if (isToday(date)) return "Сегодня";
    if (isTomorrow(date)) return "Завтра";
    return format(date, "d MMM, EEEE", { locale: ru });
  };

  // Мемоизация
  const suggestedTags = useMemo(() => {
    const recentTags = customTags.slice(0, 10);
    const allTags = [
      ...new Set([
        ...recentTags,
        "работа",
        "личное",
        "учеба",
        "покупки",
        "здоровье",
      ]),
    ];
    return allTags.filter((tag) => !formData.tags.includes(tag)).slice(0, 8);
  }, [customTags, formData.tags]);

  // Рендер секций
  const renderMainSection = () => (
    <ScrollView style={styles.section} showsVerticalScrollIndicator={false}>
      {/* Название */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Название задачи *
        </Text>
        <TextInput
          style={[
            styles.titleInput,
            {
              backgroundColor: colors.card,
              color: colors.cardForeground,
              borderColor: colors.border,
            },
          ]}
          value={formData.title}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, title: text }))
          }
          placeholder="Что нужно сделать?"
          placeholderTextColor={colors.muted}
          autoFocus
          maxLength={200}
        />
        <Text style={[styles.charCounter, { color: colors.muted }]}>
          {formData.title.length}/200
        </Text>
      </View>

      {/* Быстрые настройки - приоритет */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Приоритет
        </Text>
        <View style={styles.optionsGrid}>
          {(
            Object.entries(PRIORITY_CONFIG) as [
              TaskPriority,
              (typeof PRIORITY_CONFIG)[TaskPriority],
            ][]
          ).map(([key, config]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    formData.priority === key ? config.color : colors.card,
                  borderColor:
                    formData.priority === key ? config.color : colors.border,
                },
              ]}
              onPress={() =>
                setFormData((prev) => ({ ...prev, priority: key }))
              }
            >
              <Ionicons
                name={config.icon as any}
                size={18}
                color={formData.priority === key ? "#FFFFFF" : config.color}
              />
              <Text
                style={[
                  styles.optionLabel,
                  {
                    color:
                      formData.priority === key
                        ? "#FFFFFF"
                        : colors.cardForeground,
                  },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Папка */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Папка
        </Text>
        <View style={styles.folderGrid}>
          {(
            Object.entries(allFolders) as [
              string,
              { label: string; icon: string; color: string },
            ][]
          ).map(([key, config]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.folderButton,
                {
                  backgroundColor:
                    formData.folder === key ? config.color + "30" : colors.card,
                  borderColor:
                    formData.folder === key ? config.color : colors.border,
                  borderLeftWidth: 4,
                  borderLeftColor: config.color,
                },
              ]}
              onPress={() =>
                setFormData((prev) => ({ ...prev, folder: String(key) }))
              }
            >
              <View style={styles.folderContent}>
                <Ionicons
                  name={config.icon as any}
                  size={20}
                  color={config.color}
                />
                <Text
                  style={[styles.folderLabel, { color: colors.foreground }]}
                >
                  {config.label}
                </Text>
              </View>
              {formData.folder === key && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={config.color}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Дата выполнения */}
      <View style={styles.fieldGroup}>
        <TouchableOpacity
          style={[
            styles.expandableField,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() =>
            setActiveSection(activeSection === "date" ? "main" : "date")
          }
        >
          <View style={styles.expandableHeader}>
            <Ionicons
              name="calendar"
              size={20}
              color={formData.dueDate ? colors.primary : colors.muted}
            />
            <Text
              style={[styles.expandableLabel, { color: colors.foreground }]}
            >
              Дата выполнения
            </Text>
            <Text
              style={[
                styles.expandableValue,
                { color: formData.dueDate ? colors.primary : colors.muted },
              ]}
            >
              {formatDateDisplay(formData.dueDate)}
            </Text>
          </View>
          <Ionicons
            name={activeSection === "date" ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.muted}
          />
        </TouchableOpacity>

        {activeSection === "date" && (
          <View style={styles.expandedContent}>
            {/* Кнопка открытия пикера даты */}
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setShowDueDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.datePickerText,
                  { color: colors.cardForeground },
                ]}
              >
                {formData.dueDate
                  ? format(formData.dueDate, "d MMMM yyyy", { locale: ru })
                  : "Выбрать дату"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>

            {/* Время */}
            {formData.dueDate && (
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setShowDueTimePicker(true)}
              >
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text
                  style={[
                    styles.datePickerText,
                    { color: colors.cardForeground },
                  ]}
                >
                  {format(formData.dueDate, "HH:mm")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            )}

            {/* Быстрые даты */}
            <Text style={[styles.quickDatesLabel, { color: colors.muted }]}>
              Быстро:
            </Text>
            <View style={styles.quickDatesGrid}>
              {QUICK_DATES.map((date) => (
                <TouchableOpacity
                  key={date.label}
                  style={[
                    styles.quickDateButton,
                    {
                      backgroundColor:
                        formData.dueDate &&
                        isToday(formData.dueDate) &&
                        date.days === 0
                          ? colors.primary
                          : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickDate(date.days)}
                >
                  <Ionicons
                    name={date.icon as any}
                    size={16}
                    color={
                      formData.dueDate &&
                      isToday(formData.dueDate) &&
                      date.days === 0
                        ? "#FFFFFF"
                        : colors.muted
                    }
                  />
                  <Text
                    style={[
                      styles.quickDateLabel,
                      {
                        color:
                          formData.dueDate &&
                          isToday(formData.dueDate) &&
                          date.days === 0
                            ? "#FFFFFF"
                            : colors.cardForeground,
                      },
                    ]}
                  >
                    {date.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Убрать дату */}
            {formData.dueDate && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() =>
                  setFormData((prev) => ({ ...prev, dueDate: undefined }))
                }
              >
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={[styles.clearButtonText, { color: "#EF4444" }]}>
                  Убрать дату
                </Text>
              </TouchableOpacity>
            )}

            {/* Date Picker для dueDate */}
            {showDueDatePicker && (
              <DateTimePicker
                value={formData.dueDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={new Date()}
                onChange={handleDueDateChange}
              />
            )}

            {/* Time Picker для dueDate */}
            {showDueTimePicker && (
              <DateTimePicker
                value={formData.dueDate || new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDueTimeChange}
              />
            )}
          </View>
        )}
      </View>

      {/* Напоминание (временно отключено) */}
      {false && (
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Напоминание
          </Text>

          {/* Быстрые опции */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            <View style={styles.reminderOptions}>
              {REMINDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.reminderChip,
                    {
                      backgroundColor:
                        formData.reminderMinutesBefore === option.value &&
                        !selectedReminderDate
                          ? colors.primary
                          : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedReminderDate(null);
                    setFormData((prev) => ({
                      ...prev,
                      reminderMinutesBefore: option.value,
                    }));
                  }}
                >
                  <Text
                    style={[
                      styles.reminderChipText,
                      {
                        color:
                          formData.reminderMinutesBefore === option.value &&
                          !selectedReminderDate
                            ? "#FFFFFF"
                            : colors.cardForeground,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Кастомная дата и время */}
          <TouchableOpacity
            style={[
              styles.customReminderButton,
              {
                backgroundColor: colors.card,
                borderColor: selectedReminderDate
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={() => setShowReminderDatePicker(true)}
          >
            <Ionicons
              name="alarm"
              size={20}
              color={selectedReminderDate ? colors.primary : colors.muted}
            />
            <Text
              style={[
                styles.customReminderText,
                { color: selectedReminderDate ? colors.primary : colors.muted },
              ]}
            >
              {selectedReminderDate
                ? `Напомнить ${format(selectedReminderDate!, "d MMM 'в' HH:mm", { locale: ru })}`
                : "Выбрать дату и время напоминания"}
            </Text>
            {selectedReminderDate && (
              <TouchableOpacity
                onPress={() => setSelectedReminderDate(null)}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Date Picker для напоминания */}
          {showReminderDatePicker && selectedReminderDate && (
            <DateTimePicker
              value={selectedReminderDate as any}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowReminderDatePicker(false);
                if (date) {
                  const newDate = new Date(date);
                  if (selectedReminderDate) {
                    newDate.setHours(selectedReminderDate.getHours());
                    newDate.setMinutes(selectedReminderDate.getMinutes());
                  } else {
                    newDate.setHours(9);
                    newDate.setMinutes(0);
                  }
                  setSelectedReminderDate(newDate);
                  setShowReminderTimePicker(true);
                }
              }}
            />
          )}

          {/* Time Picker для напоминания */}
          {showReminderTimePicker && selectedReminderDate && (
            <DateTimePicker
              value={selectedReminderDate as any}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, date) => {
                setShowReminderTimePicker(false);
                if (date && selectedReminderDate) {
                  const newDate = new Date(selectedReminderDate);
                  newDate.setHours(date.getHours());
                  newDate.setMinutes(date.getMinutes());
                  setSelectedReminderDate(newDate);
                  setFormData((prev) => ({
                    ...prev,
                    reminderMinutesBefore: null,
                  }));
                }
              }}
            />
          )}
        </View>
      )}

      {/* Повторение */}
      <View style={styles.fieldGroup}>
        <TouchableOpacity
          style={[
            styles.expandableField,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() =>
            setActiveSection(
              activeSection === "recurring" ? "main" : "recurring",
            )
          }
        >
          <View style={styles.expandableHeader}>
            <Ionicons
              name="repeat"
              size={20}
              color={formData.recurringRule ? "#8B5CF6" : colors.muted}
            />
            <Text
              style={[styles.expandableLabel, { color: colors.foreground }]}
            >
              Повторение
            </Text>
            <Text
              style={[
                styles.expandableValue,
                { color: formData.recurringRule ? "#8B5CF6" : colors.muted },
              ]}
            >
              {formData.recurringRule
                ? getRecurringDescription(
                    JSON.stringify(formData.recurringRule),
                  )
                : "Не повторяется"}
            </Text>
          </View>
          <Ionicons
            name={activeSection === "recurring" ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.muted}
          />
        </TouchableOpacity>

        {activeSection === "recurring" && (
          <View style={styles.expandedContent}>
            <View style={styles.recurringGrid}>
              {RECURRING_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.pattern}
                  style={[
                    styles.recurringButton,
                    {
                      backgroundColor:
                        formData.recurringRule?.pattern === preset.pattern
                          ? "#8B5CF6"
                          : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleRecurringSelect(preset.pattern)}
                >
                  <Ionicons
                    name={preset.icon as any}
                    size={18}
                    color={
                      formData.recurringRule?.pattern === preset.pattern
                        ? "#FFFFFF"
                        : "#8B5CF6"
                    }
                  />
                  <Text
                    style={[
                      styles.recurringLabel,
                      {
                        color:
                          formData.recurringRule?.pattern === preset.pattern
                            ? "#FFFFFF"
                            : colors.cardForeground,
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.recurringRule && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() =>
                  setFormData((prev) => ({ ...prev, recurringRule: null }))
                }
              >
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={[styles.clearButtonText, { color: "#EF4444" }]}>
                  Без повторения
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Теги */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Теги
        </Text>

        {/* Выбранные теги */}
        {formData.tags.length > 0 && (
          <View style={styles.selectedTags}>
            {formData.tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.selectedTag,
                  { backgroundColor: colors.primary + "20" },
                ]}
                onPress={() =>
                  setFormData((prev) => ({
                    ...prev,
                    tags: prev.tags.filter((t) => t !== tag),
                  }))
                }
              >
                <Text
                  style={[styles.selectedTagText, { color: colors.primary }]}
                >
                  #{tag}
                </Text>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Добавление тега */}
        <View style={styles.tagInputRow}>
          <TextInput
            style={[
              styles.tagInput,
              {
                backgroundColor: colors.card,
                color: colors.cardForeground,
                borderColor: colors.border,
              },
            ]}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Добавить тег..."
            placeholderTextColor={colors.muted}
            onSubmitEditing={handleAddTag}
          />
          <TouchableOpacity
            style={[styles.addTagButton, { backgroundColor: colors.primary }]}
            onPress={handleAddTag}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Предложенные теги */}
        {suggestedTags.length > 0 && (
          <View style={styles.suggestedTags}>
            <Text style={[styles.suggestedLabel, { color: colors.muted }]}>
              Быстрый выбор:
            </Text>
            <View style={styles.suggestedTagsRow}>
              {suggestedTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.suggestedTag,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickTag(tag)}
                >
                  <Text
                    style={[
                      styles.suggestedTagText,
                      { color: colors.cardForeground },
                    ]}
                  >
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Описание */}
      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabelRow}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Описание
          </Text>
          <Text style={[styles.charCounter, { color: colors.muted }]}>
            {formData.description.length}/300
          </Text>
        </View>
        <TextInput
          style={[
            styles.descriptionInput,
            {
              backgroundColor: colors.card,
              color: colors.cardForeground,
              borderColor:
                formData.description.length > 280 ? "#F59E0B" : colors.border,
            },
          ]}
          value={formData.description}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              description: text.substring(0, 300),
            }))
          }
          placeholder="Дополнительные детали..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={300}
        />
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouch} onPress={onClose} />
        </View>

        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {mode === "create" ? "Новая задача" : "Редактировать"}
            </Text>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? "Сохранение..." : "Готово"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {renderMainSection()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- Стили ---

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  backdropTouch: {
    flex: 1,
  },
  container: {
    maxHeight: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  charCounter: {
    fontSize: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  folderGrid: {
    gap: 8,
  },
  folderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  folderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  folderLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  expandableField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  expandableHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  expandableLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  expandableValue: {
    fontSize: 14,
    marginLeft: "auto",
    marginRight: 8,
  },
  expandedContent: {
    marginTop: 12,
    gap: 12,
  },
  quickDatesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickDateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  quickDateLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  quickDatesLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  customDateRow: {
    flexDirection: "row",
    gap: 8,
  },
  customDateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  customDateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  reminderOptions: {
    flexDirection: "row",
    gap: 8,
  },
  reminderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  reminderChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  customReminderButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  customReminderText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  recurringGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recurringButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  recurringLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectedTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  selectedTagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  tagInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestedTags: {
    marginTop: 12,
  },
  suggestedLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  suggestedTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestedTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestedTagText: {
    fontSize: 13,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
  },
});
