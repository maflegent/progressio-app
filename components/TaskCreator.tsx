import { Colors } from "@/constants/Colors";
import { useAppTheme } from "@/contexts/SettingsContext";
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
  Dimensions,
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
  folder?: string;
  tags: string[];
  dueDate?: Date;
  reminderMinutesBefore: number | null;
  recurringRule: RecurringRule | null;
}

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

const QUICK_DATES = [
  { label: "Сегодня", days: 0, icon: "today" },
  { label: "Завтра", days: 1, icon: "calendar" },
  { label: "3 дня", days: 3, icon: "calendar-outline" },
  { label: "Неделя", days: 7, icon: "calendar" },
  { label: "Месяц", days: 30, icon: "calendar-outline" },
];

const RECURRING_PRESETS = [
  { pattern: "daily" as RecurringPattern, label: "Ежедневно", icon: "repeat" },
  { pattern: "weekly" as RecurringPattern, label: "Еженедельно", icon: "calendar" },
  { pattern: "monthly" as RecurringPattern, label: "Ежемесячно", icon: "calendar-outline" },
  { pattern: "weekdays" as RecurringPattern, label: "По будням", icon: "business" },
  { pattern: "weekends" as RecurringPattern, label: "По выходным", icon: "cafe" },
];

export const TaskCreator: React.FC<TaskCreatorProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}) => {
  const { customTags, addCustomTag } = useTags();
  const { customFolders } = useFolders();
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];

  const allFolders: Record<string, { label: string; icon: string; color: string }> = {
    ...DEFAULT_FOLDER_CONFIG,
    ...customFolders.reduce<Record<string, { label: string; icon: string; color: string }>>(
      (acc, folder) => {
        acc[folder.id] = { label: folder.label, icon: folder.icon, color: folder.color };
        return acc;
      },
      {},
    ),
  };

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
  const [newTag, setNewTag] = useState("");
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["main"]));

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
    setExpandedSections(new Set(["main"]));
    setShowDueDatePicker(false);
    setShowDueTimePicker(false);
  }, [visible, initialData]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

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
      setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
    }
  };

  const handleQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(18, 0, 0, 0);
    setFormData((prev) => ({ ...prev, dueDate: date }));
  };

  const handleDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (formData.dueDate) {
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

  const formatDateDisplay = (date?: Date): string => {
    if (!date) return "Не указана";
    if (isToday(date)) return "Сегодня";
    if (isTomorrow(date)) return "Завтра";
    return format(date, "d MMM", { locale: ru });
  };

  const suggestedTags = useMemo(() => {
    const recentTags = customTags.slice(0, 10);
    const allTags = [
      ...new Set([...recentTags, "работа", "личное", "учеба", "покупки", "здоровье"]),
    ];
    return allTags.filter((tag) => !formData.tags.includes(tag)).slice(0, 8);
  }, [customTags, formData.tags]);

  const isFormValid = formData.title.trim().length > 0;

  const SectionHeader: React.FC<{
    icon: string;
    label: string;
    value?: string;
    section: string;
    activeColor?: string;
  }> = ({ icon, label, value, section, activeColor }) => (
    <TouchableOpacity
      style={[
        styles.sectionHeader,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionHeaderLeft}>
        <Ionicons
          name={icon as any}
          size={20}
          color={expandedSections.has(section) ? (activeColor || colors.primary) : colors.muted}
        />
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <View style={styles.sectionHeaderRight}>
        {value && (
          <Text
            style={[
              styles.sectionValue,
              { color: expandedSections.has(section) ? activeColor || colors.primary : colors.muted },
            ]}
          >
            {value}
          </Text>
        )}
        <Ionicons
          name={expandedSections.has(section) ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.muted}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouch} onPress={onClose} />
        </View>

        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.modeBadge, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons
                  name={mode === "create" ? "add-circle" : "create"}
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.modeBadgeText, { color: colors.primary }]}>
                  {mode === "create" ? "Создание" : "Редактирование"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.inputSection}>
              <TextInput
                style={[styles.titleInput, { color: colors.foreground }]}
                value={formData.title}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                placeholder="Что нужно сделать?"
                placeholderTextColor={colors.muted}
                autoFocus
                maxLength={200}
              />
              <Text style={[styles.charCounter, { color: colors.muted }]}>
                {formData.title.length}/200
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionGroupTitle, { color: colors.muted }]}>Настройки</Text>

              <SectionHeader
                icon="flag"
                label="Приоритет"
                value={PRIORITY_CONFIG[formData.priority].label}
                section="priority"
                activeColor={PRIORITY_CONFIG[formData.priority].color}
              />
              {expandedSections.has("priority") && (
                <View style={[styles.expandedContent, { backgroundColor: colors.card }]}>
                  <View style={styles.priorityGrid}>
                    {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, (typeof PRIORITY_CONFIG)[TaskPriority]][]).map(
                      ([key, config]) => (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.priorityOption,
                            {
                              backgroundColor: formData.priority === key ? config.color : colors.background,
                              borderColor: formData.priority === key ? config.color : colors.border,
                            },
                          ]}
                          onPress={() => setFormData((prev) => ({ ...prev, priority: key }))}
                        >
                          <Ionicons
                            name={config.icon as any}
                            size={20}
                            color={formData.priority === key ? "#FFFFFF" : config.color}
                          />
                          <Text
                            style={[
                              styles.priorityOptionLabel,
                              { color: formData.priority === key ? "#FFFFFF" : colors.foreground },
                            ]}
                          >
                            {config.label}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                </View>
              )}

              <SectionHeader
                icon="folder"
                label="Папка"
                value={allFolders[formData.folder || "other"]?.label || "Другое"}
                section="folder"
                activeColor={allFolders[formData.folder || "other"]?.color}
              />
              {expandedSections.has("folder") && (
                <View style={[styles.expandedContent, { backgroundColor: colors.card }]}>
                  <View style={styles.folderGrid}>
                    {Object.entries(allFolders).map(([key, config]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.folderOption,
                          {
                            backgroundColor: formData.folder === key ? config.color + "20" : colors.background,
                            borderColor: formData.folder === key ? config.color : colors.border,
                            borderLeftColor: config.color,
                          },
                        ]}
                        onPress={() => setFormData((prev) => ({ ...prev, folder: key }))}
                      >
                        <View style={styles.folderOptionLeft}>
                          <Ionicons name={config.icon as any} size={18} color={config.color} />
                          <Text style={[styles.folderOptionLabel, { color: colors.foreground }]}>
                            {config.label}
                          </Text>
                        </View>
                        {formData.folder === key && (
                          <Ionicons name="checkmark-circle" size={18} color={config.color} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <SectionHeader
                icon="calendar"
                label="Срок"
                value={formatDateDisplay(formData.dueDate)}
                section="date"
                activeColor={formData.dueDate ? colors.primary : undefined}
              />
              {expandedSections.has("date") && (
                <View style={[styles.expandedContent, { backgroundColor: colors.card }]}>
                  <TouchableOpacity
                    style={[styles.pickerButton, { borderColor: colors.border }]}
                    onPress={() => setShowDueDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <Text style={[styles.pickerButtonText, { color: colors.foreground }]}>
                      {formData.dueDate
                        ? format(formData.dueDate, "d MMMM yyyy", { locale: ru })
                        : "Выбрать дату"}
                    </Text>
                  </TouchableOpacity>

                  {formData.dueDate && (
                    <TouchableOpacity
                      style={[styles.pickerButton, { borderColor: colors.border }]}
                      onPress={() => setShowDueTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                      <Text style={[styles.pickerButtonText, { color: colors.foreground }]}>
                        {format(formData.dueDate, "HH:mm")}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <Text style={[styles.quickLabel, { color: colors.muted }]}>Быстро:</Text>
                  <View style={styles.quickDatesGrid}>
                    {QUICK_DATES.map((date) => {
                      const isActive =
                        formData.dueDate &&
                        isToday(formData.dueDate) &&
                        date.days === 0;
                      return (
                        <TouchableOpacity
                          key={date.label}
                          style={[
                            styles.quickDateButton,
                            {
                              backgroundColor: isActive ? colors.primary : colors.background,
                              borderColor: isActive ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => handleQuickDate(date.days)}
                        >
                          <Ionicons
                            name={date.icon as any}
                            size={14}
                            color={isActive ? "#FFFFFF" : colors.muted}
                          />
                          <Text
                            style={[
                              styles.quickDateLabel,
                              { color: isActive ? "#FFFFFF" : colors.foreground },
                            ]}
                          >
                            {date.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {formData.dueDate && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => setFormData((prev) => ({ ...prev, dueDate: undefined }))}
                    >
                      <Ionicons name="close-circle" size={14} color="#EF4444" />
                      <Text style={[styles.clearButtonText, { color: "#EF4444" }]}>
                        Убрать дату
                      </Text>
                    </TouchableOpacity>
                  )}

                  {showDueDatePicker && (
                    <DateTimePicker
                      value={formData.dueDate || new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      minimumDate={new Date()}
                      onChange={handleDueDateChange}
                    />
                  )}

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

              <SectionHeader
                icon="repeat"
                label="Повторение"
                value={
                  formData.recurringRule
                    ? getRecurringDescription(JSON.stringify(formData.recurringRule))
                    : "Не повторяется"
                }
                section="recurring"
                activeColor="#8B5CF6"
              />
              {expandedSections.has("recurring") && (
                <View style={[styles.expandedContent, { backgroundColor: colors.card }]}>
                  <View style={styles.recurringGrid}>
                    {RECURRING_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset.pattern}
                        style={[
                          styles.recurringOption,
                          {
                            backgroundColor:
                              formData.recurringRule?.pattern === preset.pattern
                                ? "#8B5CF6"
                                : colors.background,
                            borderColor:
                              formData.recurringRule?.pattern === preset.pattern ? "#8B5CF6" : colors.border,
                          },
                        ]}
                        onPress={() => handleRecurringSelect(preset.pattern)}
                      >
                        <Ionicons
                          name={preset.icon as any}
                          size={16}
                          color={
                            formData.recurringRule?.pattern === preset.pattern ? "#FFFFFF" : "#8B5CF6"
                          }
                        />
                        <Text
                          style={[
                            styles.recurringOptionLabel,
                            {
                              color:
                                formData.recurringRule?.pattern === preset.pattern
                                  ? "#FFFFFF"
                                  : colors.foreground,
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
                      onPress={() => setFormData((prev) => ({ ...prev, recurringRule: null }))}
                    >
                      <Ionicons name="close-circle" size={14} color="#EF4444" />
                      <Text style={[styles.clearButtonText, { color: "#EF4444" }]}>
                        Без повторения
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <SectionHeader
                icon="pricetags"
                label="Теги"
                value={formData.tags.length > 0 ? `${formData.tags.length} шт.` : undefined}
                section="tags"
                activeColor={colors.primary}
              />
              {expandedSections.has("tags") && (
                <View style={[styles.expandedContent, { backgroundColor: colors.card }]}>
                  {formData.tags.length > 0 && (
                    <View style={styles.selectedTags}>
                      {formData.tags.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.selectedTag, { backgroundColor: colors.primary + "20" }]}
                          onPress={() =>
                            setFormData((prev) => ({
                              ...prev,
                              tags: prev.tags.filter((t) => t !== tag),
                            }))
                          }
                        >
                          <Text style={[styles.selectedTagText, { color: colors.primary }]}>
                            #{tag}
                          </Text>
                          <Ionicons name="close" size={14} color={colors.primary} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.tagInputRow}>
                    <TextInput
                      style={[styles.tagInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
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

                  {suggestedTags.length > 0 && (
                    <View style={styles.suggestedSection}>
                      <Text style={[styles.suggestedLabel, { color: colors.muted }]}>
                        Подсказки:
                      </Text>
                      <View style={styles.suggestedTagsRow}>
                        {suggestedTags.map((tag) => (
                          <TouchableOpacity
                            key={tag}
                            style={[
                              styles.suggestedTag,
                              { backgroundColor: colors.background, borderColor: colors.border },
                            ]}
                            onPress={() => handleQuickTag(tag)}
                          >
                            <Text style={[styles.suggestedTagText, { color: colors.foreground }]}>
                              #{tag}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Text style={[styles.sectionGroupTitle, { color: colors.muted }]}>
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
                    borderColor: formData.description.length > 280 ? "#F59E0B" : colors.border,
                  },
                ]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, description: text.substring(0, 300) }))
                }
                placeholder="Дополнительные детали..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: isFormValid ? colors.primary : colors.muted },
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <Ionicons name="hourglass" size={20} color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>
                    {mode === "create" ? "Создать задачу" : "Сохранить"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const SHEET_HEIGHT = Math.round(Dimensions.get("window").height * 0.92);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  backdropTouch: { flex: 1 },
  container: { height: SHEET_HEIGHT, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerLeft: { flex: 1 },
  modeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6, alignSelf: "flex-start" },
  modeBadgeText: { fontSize: 12, fontWeight: "600" },
  closeButton: { padding: 4 },
  content: { flex: 1 },
  inputSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  titleInput: { fontSize: 20, fontWeight: "600", lineHeight: 28, minHeight: 48 },
  charCounter: { fontSize: 11, marginTop: 4, textAlign: "right" },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionGroupTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  sectionLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginLeft: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 4 },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionLabel: { fontSize: 15, fontWeight: "500" },
  sectionValue: { fontSize: 13, fontWeight: "500", maxWidth: 140 },
  expandedContent: { borderRadius: 14, borderWidth: 1, borderColor: "#E4E4E7", padding: 14, marginTop: 4, marginBottom: 8, gap: 12 },
  priorityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  priorityOption: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, gap: 8 },
  priorityOptionLabel: { fontSize: 14, fontWeight: "600" },
  folderGrid: { gap: 8 },
  folderOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4 },
  folderOptionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  folderOptionLabel: { fontSize: 14, fontWeight: "600" },
  pickerButton: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  pickerButtonText: { fontSize: 15, fontWeight: "500", flex: 1 },
  quickLabel: { fontSize: 12, fontWeight: "500", marginTop: 4 },
  quickDatesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickDateButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 6 },
  quickDateLabel: { fontSize: 12, fontWeight: "500" },
  clearButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 8, gap: 6 },
  clearButtonText: { fontSize: 13, fontWeight: "500" },
  recurringGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  recurringOption: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 6 },
  recurringOptionLabel: { fontSize: 13, fontWeight: "500" },
  selectedTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  selectedTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  selectedTagText: { fontSize: 13, fontWeight: "500" },
  tagInputRow: { flexDirection: "row", gap: 8 },
  tagInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  addTagButton: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  suggestedSection: { marginTop: 4 },
  suggestedLabel: { fontSize: 12, fontWeight: "500", marginBottom: 8 },
  suggestedTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestedTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  suggestedTagText: { fontSize: 12, fontWeight: "500" },
  descriptionInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, minHeight: 110, lineHeight: 22 },
  footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1 },
  submitButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, gap: 8 },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  bottomPadding: { height: 20 },
});
