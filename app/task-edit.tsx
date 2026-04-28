// app/task-edit.tsx - улучшенный редактор задач
import { Colors } from "@/constants/Colors";
import { useAppTheme } from "@/contexts/SettingsContext";
import { useTags } from "@/contexts/TagsContext";
import { useTasks } from "@/contexts/TaskContext";
import { TaskPriority } from "@/types";
import { scheduleTaskReminder, cancelTaskReminder } from "@/utils/notifications";
import { RecurringPattern, RecurringRule } from "@/utils/recurringTasks";
import { taskStorage } from "@/utils/taskStorage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { format, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PRIORITIES: { type: TaskPriority; label: string; icon: string; color: string }[] = [
  { type: "urgent", label: "Срочно", icon: "alert-circle", color: "#EF4444" },
  { type: "high", label: "Высокий", icon: "trending-up", color: "#F59E0B" },
  { type: "medium", label: "Средний", icon: "remove", color: "#3B82F6" },
  { type: "low", label: "Низкий", icon: "trending-down", color: "#10B981" },
];

const recurringPatterns = ["daily", "weekly", "monthly", "weekdays"] as const;

const QUICK_DATES = [
  { label: "Сегодня", days: 0 },
  { label: "Завтра", days: 1 },
  { label: "Через 3 дня", days: 3 },
  { label: "На неделю", days: 7 },
];

export default function TaskEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const { updateTask, getTask, refreshTasks, addTask } = useTasks();
  const { customTags, addCustomTag } = useTags();

  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [recurringRule, setRecurringRule] = useState<RecurringRule | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      const task = getTask(id);
      if (task) {
        setTitle(task.title);
        setDescription(task.description || "");
        setPriority(task.priority);
        setTags(task.tags || []);
        
        if (task.dueDate) {
          setDueDate(new Date(task.dueDate));
        }
        
        if (task.recurringPattern) {
          try {
            setRecurringRule(JSON.parse(task.recurringPattern));
          } catch {}
        }
      }
    }
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Ошибка", "Введите название задачи");
      return;
    }

    setIsLoading(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim().substring(0, 300),
        priority,
        tags,
        folder: "other",
        isCompleted: false,
        dueDate,
        isRecurring: !!recurringRule,
        recurringPattern: recurringRule ? JSON.stringify(recurringRule) : undefined,
      };

      if (isEditing && id) {
        await cancelTaskReminder(id);
        await updateTask(id, taskData);
        
        if (dueDate) {
          await scheduleTaskReminder(id, title, dueDate, 15);
        }
        
        Alert.alert("Готово", "Задача обновлена");
      } else {
        await addTask(taskData);
        Alert.alert("Готово", "Задача создана");
      }

      router.back();
    } catch (error) {
      console.error("Error saving:", error);
      Alert.alert("Ошибка", "Не удалось сохранить");
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = async () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
      try {
        await addCustomTag(tag);
      } catch {}
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(18, 0, 0, 0);
    setDueDate(date);
  };

  const getRecurringLabel = () => {
    if (!recurringRule) return null;
    const labels: Record<string, string> = {
      daily: "Ежедневно",
      weekly: "Еженедельно",
      monthly: "Ежемесячно",
      weekdays: "По будням",
      weekends: "По выходным",
    };
    return labels[recurringRule.pattern] || "Повторяется";
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return "Сегодня";
    if (isTomorrow(date)) return "Завтра";
    return format(date, "d MMM", { locale: ru });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? "Редактировать" : "Новая задача",
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={isLoading}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {isLoading ? "..." : "Сохранить"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Название */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Название *</Text>
              <TextInput
                style={[
                  styles.titleInput,
                  { backgroundColor: colors.card, color: colors.foreground },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Что нужно сделать?"
                placeholderTextColor={colors.muted}
                autoFocus={!isEditing}
              />
            </View>

            {/* Приоритет */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Приоритет</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.type}
                    style={[
                      styles.priorityBtn,
                      {
                        backgroundColor: priority === p.type ? p.color : colors.card,
                        borderColor: priority === p.type ? p.color : colors.border,
                      },
                    ]}
                    onPress={() => setPriority(p.type)}
                  >
                    <Ionicons
                      name={p.icon as any}
                      size={16}
                      color={priority === p.type ? "#FFF" : p.color}
                    />
                    <Text
                      style={[
                        styles.priorityLabel,
                        { color: priority === p.type ? "#FFF" : colors.muted },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Срок */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Срок</Text>
              <View style={styles.dateRow}>
                {QUICK_DATES.map((qd) => (
                  <TouchableOpacity
                    key={qd.label}
                    style={[
                      styles.dateBtn,
                      {
                        backgroundColor: dueDate && 
                          Math.floor((dueDate.getTime() - new Date().getTime()) / (1000*60*60*24)) === qd.days
                          ? colors.primary : colors.card,
                      },
                    ]}
                    onPress={() => setQuickDate(qd.days)}
                  >
                    <Text
                      style={[
                        styles.dateBtnText,
                        {
                          color: dueDate && 
                            Math.floor((dueDate.getTime() - new Date().getTime()) / (1000*60*60*24)) === qd.days
                            ? "#FFF" : colors.foreground,
                        },
                      ]}
                    >
                      {qd.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.dateBtn, { backgroundColor: colors.card }]}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setDueDate(undefined);
                  }}
                >
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Очистить</Text>
                </TouchableOpacity>
              </View>
              {dueDate && (
                <View style={[styles.selectedDate, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name="calendar" size={16} color={colors.primary} />
                  <Text style={[styles.selectedDateText, { color: colors.primary }]}>
                    {formatDate(dueDate)}
                  </Text>
                </View>
              )}
            </View>

            {/* Повторение */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Повторение</Text>
              <View style={styles.recurringRow}>
                {["daily", "weekly", "monthly", "weekdays"].map((pattern) => (
                  <TouchableOpacity
                    key={pattern}
                    style={[
                      styles.recurringBtn,
                      {
                        backgroundColor: recurringRule?.pattern === pattern 
                          ? "#8B5CF6" : colors.card,
                      },
                    ]}
                    onPress={() => setRecurringRule(
                      recurringRule?.pattern === pattern ? null : { pattern: pattern as RecurringPattern }
                    )}
                  >
                    <Text style={{ color: recurringRule?.pattern === pattern ? "#FFF" : colors.muted, fontSize: 12 }}>
                      {pattern === "daily" && "Ежедневно"}
                      {pattern === "weekly" && "Еженедельно"}
                      {pattern === "monthly" && "Ежемесячно"}
                      {pattern === "weekdays" && "По будням"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Теги */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Теги</Text>
              <View style={styles.tagsRow}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, { backgroundColor: colors.primary + "20" }]}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={{ color: colors.primary }}>#{tag}</Text>
                    <Ionicons name="close" size={12} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={[
                    styles.tagInput,
                    { backgroundColor: colors.card, color: colors.foreground },
                  ]}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Добавить тег..."
                  placeholderTextColor={colors.muted}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={[styles.addTagBtn, { backgroundColor: colors.primary }]} onPress={addTag}>
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              {customTags.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedTags}>
                  {customTags.slice(0, 8).filter(t => !tags.includes(t)).map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.suggestedTag, { borderColor: colors.border }]}
                      onPress={() => {
                        setTags([...tags, tag]);
                        addCustomTag(tag);
                      }}
                    >
                      <Text style={{ color: colors.muted }}>#{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Описание */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Text style={[styles.label, { color: colors.muted }]}>Описание</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {description.length}/300
                </Text>
              </View>
              <TextInput
                style={[
                  styles.descriptionInput,
                  { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Дополнительные детали..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                maxLength={300}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 8 },
  fieldHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    padding: 16,
    borderRadius: 12,
  },
  priorityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  priorityBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  priorityLabel: { fontSize: 12, fontWeight: "500" },
  dateRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dateBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  dateBtnText: { fontSize: 13, fontWeight: "500" },
  selectedDate: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  selectedDateText: { fontSize: 14, fontWeight: "600" },
  recurringRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  recurringBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  tag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  tagInputRow: { flexDirection: "row", gap: 8 },
  tagInput: { flex: 1, padding: 12, borderRadius: 8 },
  addTagBtn: { width: 44, height: 44, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  suggestedTags: { marginTop: 8 },
  suggestedTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  descriptionInput: { minHeight: 100, padding: 12, borderRadius: 12, fontSize: 15, borderWidth: 1, textAlignVertical: "top" },
});