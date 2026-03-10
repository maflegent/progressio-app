// components/TasksScreen.tsx - экран задач с папками и тегами
import { TaskCreator, TaskFormData } from "@/components/TaskCreator";
import { Colors } from "@/constants/Colors";
import { SHADOWS } from "@/constants/Styles";
import { useAppTheme } from "@/contexts/SettingsContext";
import { useTasks } from "@/contexts/TaskContext";
import { Task, TaskPriority } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIORITY_COLORS = {
  urgent: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#10B981",
} as const;

const FOLDER_CONFIG = {
  all: { label: "Все", icon: "list", color: "#6B7280" },
  work: { label: "Работа", icon: "briefcase", color: "#3B82F6" },
  personal: { label: "Личное", icon: "heart", color: "#EC4899" },
  study: { label: "Учеба", icon: "school", color: "#8B5CF6" },
  shopping: { label: "Покупки", icon: "cart", color: "#10B981" },
  health: { label: "Здоровье", icon: "fitness", color: "#EF4444" },
  ideas: { label: "Идеи", icon: "bulb", color: "#F59E0B" },
  other: { label: "Другое", icon: "folder", color: "#6B7280" },
} as const;

type FolderKey = keyof typeof FOLDER_CONFIG;

const TaskCard: React.FC<{
  task: Task;
  colors: any;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ task, colors, onToggle, onEdit, onDelete }) => {
  const isOverdue =
    task.dueDate && isPast(new Date(task.dueDate)) && !task.isCompleted;

  const formatDueDate = (date: Date) => {
    const d = new Date(date);
    if (isToday(d)) return "сегодня";
    if (isTomorrow(d)) return "завтра";
    const now = new Date();
    const diffDays = Math.ceil(
      (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > 0 && diffDays <= 7)
      return format(d, "EEEE", { locale: ru }).toLowerCase();
    return format(d, "d MMM", { locale: ru }).toLowerCase();
  };

  const formatDueTime = (date: Date) => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    if (hours === 0 && minutes === 0) return "";
    return ` в ${format(d, "HH:mm")}`;
  };

  const folder = task.folder || "other";
  const folderConfig =
    FOLDER_CONFIG[folder as FolderKey] || FOLDER_CONFIG.other;

  return (
    <TouchableOpacity
      style={[styles.taskCard, { backgroundColor: colors.card }, SHADOWS.sm]}
      onPress={onToggle}
      onLongPress={() => {
        Alert.alert("Действия", "Выберите действие", [
          { text: "Редактировать", onPress: onEdit },
          { text: "Удалить", onPress: onDelete, style: "destructive" },
          { text: "Отмена", style: "cancel" },
        ]);
      }}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.taskContent}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: PRIORITY_COLORS[task.priority] || colors.muted,
              backgroundColor: task.isCompleted
                ? PRIORITY_COLORS[task.priority] || colors.primary
                : "transparent",
            },
          ]}
          onPress={onToggle}
        >
          {task.isCompleted && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <View style={styles.taskInfo}>
          <View style={styles.taskHeader}>
            <Text
              style={[
                styles.taskTitle,
                {
                  color: colors.foreground,
                  textDecorationLine: task.isCompleted
                    ? "line-through"
                    : "none",
                  opacity: task.isCompleted ? 0.6 : 1,
                },
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <TouchableOpacity
              onPress={onEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.taskMeta}>
            <View
              style={[
                styles.badge,
                { backgroundColor: folderConfig.color + "20" },
              ]}
            >
              <Ionicons
                name={folderConfig.icon as any}
                size={12}
                color={folderConfig.color}
              />
            </View>

            {task.isRecurring && (
              <View style={[styles.badge, { backgroundColor: "#8B5CF620" }]}>
                <Ionicons name="repeat" size={12} color="#8B5CF6" />
              </View>
            )}

            {task.tags?.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>

          {task.dueDate ? (
            <View style={styles.dueDateContainer}>
              <Ionicons
                name={isOverdue ? "warning" : "calendar-outline"}
                size={14}
                color={isOverdue ? "#EF4444" : colors.muted}
              />
              <Text
                style={[
                  styles.dueDateText,
                  { color: isOverdue ? "#EF4444" : colors.muted },
                ]}
              >
                {isOverdue ? "Просрочено: " : "Выполнить до "}
                {formatDueDate(task.dueDate)}
                {formatDueTime(task.dueDate)}
              </Text>
            </View>
          ) : (
            <View style={styles.dueDateContainer}>
              <Ionicons name="infinite" size={14} color={colors.muted} />
              <Text style={[styles.dueDateText, { color: colors.muted }]}>
                Без срока
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const TasksScreen: React.FC = () => {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const {
    tasks,
    isLoading,
    addTask,
    deleteTask,
    toggleTaskCompletion,
    refreshTasks,
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "overdue"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [selectedFolder, setSelectedFolder] = useState<FolderKey>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set(tasks.flatMap((t) => t.tags || []))),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter === "pending" && task.isCompleted) return false;
      if (statusFilter === "completed" && !task.isCompleted) return false;
      if (statusFilter === "overdue") {
        if (!task.dueDate || task.isCompleted) return false;
        if (!isPast(new Date(task.dueDate))) return false;
      }
      if (priorityFilter !== "all" && task.priority !== priorityFilter)
        return false;
      if (selectedFolder !== "all" && task.folder !== selectedFolder)
        return false;
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every((tag) =>
          task.tags?.includes(tag),
        );
        if (!hasAllTags) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(q) ||
          task.description?.toLowerCase().includes(q) ||
          task.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [
    tasks,
    statusFilter,
    priorityFilter,
    selectedFolder,
    selectedTags,
    searchQuery,
  ]);

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      await addTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        folder: data.folder,
        tags: data.tags,
        dueDate: data.dueDate,
        isRecurring: !!data.recurringRule,
        recurringPattern: data.recurringRule
          ? JSON.stringify(data.recurringRule)
          : undefined,
        isCompleted: false,
      });
      await refreshTasks();
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось создать задачу");
      throw error;
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowCreator(true);
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert("Удалить задачу", "Вы уверены?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTask(taskId);
          } catch (error) {
            Alert.alert("Ошибка", "Не удалось удалить задачу");
          }
        },
      },
    ]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSelectedFolder("all");
    setSelectedTags([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    selectedFolder !== "all" ||
    selectedTags.length > 0;

  if (isLoading && tasks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color={colors.muted} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Загрузка...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Задачи
          </Text>
          <Text style={[styles.taskCount, { color: colors.muted }]}>
            {filteredTasks.length} из {tasks.length}
          </Text>
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Поиск задач..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor:
                statusFilter === "all" ? colors.primary : colors.card,
              borderColor:
                statusFilter === "all" ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setStatusFilter("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  statusFilter === "all" ? "#FFFFFF" : colors.cardForeground,
              },
            ]}
          >
            Все
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor:
                statusFilter === "pending" ? "#3B82F6" : colors.card,
              borderColor:
                statusFilter === "pending" ? "#3B82F6" : colors.border,
            },
          ]}
          onPress={() => setStatusFilter("pending")}
        >
          <Ionicons
            name="ellipse"
            size={14}
            color={statusFilter === "pending" ? "#FFFFFF" : "#3B82F6"}
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  statusFilter === "pending"
                    ? "#FFFFFF"
                    : colors.cardForeground,
              },
            ]}
          >
            В работе
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor:
                statusFilter === "overdue" ? "#EF4444" : colors.card,
              borderColor:
                statusFilter === "overdue" ? "#EF4444" : colors.border,
            },
          ]}
          onPress={() => setStatusFilter("overdue")}
        >
          <Ionicons
            name="alert-circle"
            size={14}
            color={statusFilter === "overdue" ? "#FFFFFF" : "#EF4444"}
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  statusFilter === "overdue"
                    ? "#FFFFFF"
                    : colors.cardForeground,
              },
            ]}
          >
            Просроченные
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor:
                statusFilter === "completed" ? "#10B981" : colors.card,
              borderColor:
                statusFilter === "completed" ? "#10B981" : colors.border,
            },
          ]}
          onPress={() => setStatusFilter("completed")}
        >
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={statusFilter === "completed" ? "#FFFFFF" : "#10B981"}
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  statusFilter === "completed"
                    ? "#FFFFFF"
                    : colors.cardForeground,
              },
            ]}
          >
            Готово
          </Text>
        </TouchableOpacity>

        <View style={styles.filterDivider} />

        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor:
                selectedFolder !== "all"
                  ? FOLDER_CONFIG[selectedFolder].color
                  : colors.card,
              borderColor:
                selectedFolder !== "all"
                  ? FOLDER_CONFIG[selectedFolder].color
                  : colors.border,
            },
          ]}
          onPress={() => setShowFolderModal(true)}
        >
          <Ionicons
            name={FOLDER_CONFIG[selectedFolder].icon as any}
            size={14}
            color={
              selectedFolder !== "all"
                ? "#FFFFFF"
                : FOLDER_CONFIG[selectedFolder].color
            }
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  selectedFolder !== "all" ? "#FFFFFF" : colors.cardForeground,
              },
            ]}
          >
            {FOLDER_CONFIG[selectedFolder].label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor:
                priorityFilter !== "all"
                  ? PRIORITY_COLORS[priorityFilter]
                  : colors.card,
              borderColor:
                priorityFilter !== "all"
                  ? PRIORITY_COLORS[priorityFilter]
                  : colors.border,
            },
          ]}
          onPress={() => setShowPriorityModal(true)}
        >
          <Ionicons
            name="flag"
            size={14}
            color={priorityFilter !== "all" ? "#FFFFFF" : colors.muted}
          />
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  priorityFilter !== "all" ? "#FFFFFF" : colors.cardForeground,
              },
            ]}
          >
            {priorityFilter === "all"
              ? "Приоритет"
              : priorityFilter === "urgent"
                ? "Срочно"
                : priorityFilter === "high"
                  ? "Высокий"
                  : priorityFilter === "medium"
                    ? "Средний"
                    : "Низкий"}
          </Text>
        </TouchableOpacity>

        {allTags.length > 0 && (
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedTags.length > 0 ? colors.primary : colors.card,
                borderColor:
                  selectedTags.length > 0 ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setShowTagModal(true)}
          >
            <Ionicons
              name="pricetags"
              size={14}
              color={selectedTags.length > 0 ? "#FFFFFF" : colors.muted}
            />
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedTags.length > 0 ? "#FFFFFF" : colors.cardForeground,
                },
              ]}
            >
              {selectedTags.length > 0
                ? `${selectedTags.length} тегов`
                : "Теги"}
            </Text>
          </TouchableOpacity>
        )}

        {hasActiveFilters && (
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={clearAllFilters}
          >
            <Ionicons name="close-circle" size={14} color={colors.muted} />
            <Text style={[styles.filterChipText, { color: colors.muted }]}>
              Сбросить
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {selectedTags.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.selectedTagChip,
                  { backgroundColor: colors.primary + "20" },
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[styles.selectedTagText, { color: colors.primary }]}
                >
                  #{tag}
                </Text>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            colors={colors}
            onToggle={() => toggleTaskCompletion(item.id)}
            onEdit={() => handleEditTask(item)}
            onDelete={() => handleDeleteTask(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={64} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.muted }]}>
              {searchQuery ? "Ничего не найдено" : "Задач пока нет"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              {searchQuery
                ? "Попробуйте изменить поиск"
                : "Нажмите + чтобы создать задачу"}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, SHADOWS.lg]}
        onPress={() => {
          setEditingTask(null);
          setShowCreator(true);
        }}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      <TaskCreator
        visible={showCreator}
        onClose={() => {
          setShowCreator(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateTask}
        mode={editingTask ? "edit" : "create"}
        initialData={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description || "",
                priority: editingTask.priority,
                folder: editingTask.folder,
                tags: editingTask.tags || [],
                dueDate: editingTask.dueDate,
                reminderMinutesBefore: 15,
                recurringRule: editingTask.recurringPattern
                  ? JSON.parse(editingTask.recurringPattern)
                  : null,
              }
            : undefined
        }
      />

      {/* Folder Modal */}
      <Modal
        visible={showFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFolderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFolderModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Выберите папку
              </Text>
              <TouchableOpacity onPress={() => setShowFolderModal(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {(
                Object.entries(FOLDER_CONFIG) as [
                  FolderKey,
                  (typeof FOLDER_CONFIG)[FolderKey],
                ][]
              ).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor:
                        selectedFolder === key
                          ? config.color + "20"
                          : "transparent",
                    },
                  ]}
                  onPress={() => {
                    setSelectedFolder(key);
                    setShowFolderModal(false);
                  }}
                >
                  <View
                    style={[
                      styles.folderIconContainer,
                      { backgroundColor: config.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={config.icon as any}
                      size={24}
                      color={config.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: colors.foreground },
                    ]}
                  >
                    {config.label}
                  </Text>
                  {selectedFolder === key && (
                    <Ionicons name="checkmark" size={20} color={config.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Priority Modal */}
      <Modal
        visible={showPriorityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriorityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPriorityModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Выберите приоритет
              </Text>
              <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  {
                    backgroundColor:
                      priorityFilter === "all"
                        ? colors.primary + "20"
                        : "transparent",
                  },
                ]}
                onPress={() => {
                  setPriorityFilter("all");
                  setShowPriorityModal(false);
                }}
              >
                <Ionicons name="list" size={24} color={colors.muted} />
                <Text
                  style={[styles.modalOptionText, { color: colors.foreground }]}
                >
                  Все приоритеты
                </Text>
                {priorityFilter === "all" && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
              {(["urgent", "high", "medium", "low"] as TaskPriority[]).map(
                (priority) => {
                  const labels = {
                    urgent: "Срочно",
                    high: "Высокий",
                    medium: "Средний",
                    low: "Низкий",
                  };
                  return (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.modalOption,
                        {
                          backgroundColor:
                            priorityFilter === priority
                              ? PRIORITY_COLORS[priority] + "20"
                              : "transparent",
                        },
                      ]}
                      onPress={() => {
                        setPriorityFilter(priority);
                        setShowPriorityModal(false);
                      }}
                    >
                      <Ionicons
                        name="flag"
                        size={24}
                        color={PRIORITY_COLORS[priority]}
                      />
                      <Text
                        style={[
                          styles.modalOptionText,
                          { color: colors.foreground },
                        ]}
                      >
                        {labels[priority]}
                      </Text>
                      {priorityFilter === priority && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={PRIORITY_COLORS[priority]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                },
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tags Modal */}
      <Modal
        visible={showTagModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTagModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTagModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Теги ({selectedTags.length} выбрано)
              </Text>
              <TouchableOpacity onPress={() => setShowTagModal(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
              Выберите один или несколько тегов
            </Text>
            <ScrollView>
              <View style={styles.tagsGrid}>
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagOption,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.card,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text
                        style={[
                          styles.tagOptionText,
                          {
                            color: isSelected
                              ? "#FFFFFF"
                              : colors.cardForeground,
                          },
                        ]}
                      >
                        #{tag}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            {selectedTags.length > 0 && (
              <TouchableOpacity
                style={[styles.clearTagsButton, { backgroundColor: "#EF4444" }]}
                onPress={() => {
                  setSelectedTags([]);
                  setShowTagModal(false);
                }}
              >
                <Text style={styles.clearTagsButtonText}>
                  Сбросить все теги
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16 },
  header: { padding: 16, paddingTop: 24 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "700" },
  taskCount: { fontSize: 14, fontWeight: "500" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  filtersScroll: { marginBottom: 12 },
  filtersContent: { paddingHorizontal: 16 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 8,
    gap: 5,
    minHeight: 32,
  },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E4E4E7",
    marginHorizontal: 4,
  },
  selectedTagsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
  },
  selectedTagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 4,
  },
  selectedTagText: { fontSize: 13, fontWeight: "500" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  taskCard: { borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  taskContent: { flexDirection: "row", alignItems: "flex-start", padding: 16 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  taskInfo: { flex: 1 },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitle: { fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "500" },
  tag: { paddingHorizontal: 4, paddingVertical: 2 },
  tagText: { fontSize: 11, fontWeight: "500" },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  dueDateText: { fontSize: 13, fontWeight: "400" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "70%",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSubtitle: { fontSize: 14, marginBottom: 12 },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  modalOptionText: { fontSize: 16, flex: 1 },
  folderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tagsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tagOptionText: { fontSize: 14, fontWeight: "500" },
  clearTagsButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  clearTagsButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
