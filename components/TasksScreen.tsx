import { TaskCreator, TaskFormData } from "@/components/TaskCreator";
import { Colors } from "@/constants/Colors";
import { SHADOWS } from "@/constants/Styles";
import { useFolders } from "@/contexts/FoldersContext";
import { useAppTheme } from "@/contexts/SettingsContext";
import { useTags } from "@/contexts/TagsContext";
import { useTasks } from "@/contexts/TaskContext";
import { Task, TaskPriority } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { addDays, format, isPast, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Animated,
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

const PRIORITY_LABELS = {
  urgent: "Срочно",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
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

type DefaultFolderKey = keyof typeof DEFAULT_FOLDER_CONFIG;

type TaskGroup = {
  title: string;
  icon: string;
  color: string;
  tasks: Task[];
};

const TaskCard: React.FC<{
  task: Task;
  colors: any;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}> = ({ task, colors, onToggle, onEdit, onDelete, index }) => {
  const [expanded, setExpanded] = useState(false);
  const priorityColor = PRIORITY_COLORS[task.priority] || colors.muted;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !task.isCompleted;

  const formatDueDate = (date: Date) => {
    const d = new Date(date);
    if (isToday(d)) return "Сегодня";
    if (isTomorrow(d)) return "Завтра";
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays <= 7) return format(d, "EEEE", { locale: ru });
    return format(d, "d MMM", { locale: ru });
  };

  const formatDueTime = (date: Date) => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    if (hours === 0 && minutes === 0) return "";
    return ` в ${format(d, "HH:mm")}`;
  };

  const folder = task.folder || "other";
  const folderConfig = DEFAULT_FOLDER_CONFIG[folder as DefaultFolderKey] || {
    label: "Другое",
    icon: "folder",
    color: "#6B7280",
  };

  const hasDescription = task.description && task.description.length > 0;

  return (
    <Animated.View
      style={{
        opacity: 1,
        transform: [{ translateY: 0 }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.taskCard,
          {
            backgroundColor: colors.card,
            borderLeftColor: priorityColor,
            opacity: task.isCompleted ? 0.7 : 1,
          },
          SHADOWS.sm,
        ]}
        onPress={() => {
          if (hasDescription) setExpanded(!expanded);
        }}
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
        <View style={styles.priorityBar} />

        <View style={styles.taskContent}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                borderColor: priorityColor,
                backgroundColor: task.isCompleted ? priorityColor : "transparent",
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
                    textDecorationLine: task.isCompleted ? "line-through" : "none",
                  },
                ]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.card }]}
                onPress={onEdit}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="create-outline" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.taskMeta}>
              <View style={[styles.badge, { backgroundColor: folderConfig.color + "20" }]}>
                <Ionicons name={folderConfig.icon as any} size={12} color={folderConfig.color} />
                <Text style={[styles.badgeText, { color: folderConfig.color }]}>
                  {folderConfig.label}
                </Text>
              </View>

              {task.isRecurring && (
                <View style={[styles.badge, { backgroundColor: "#8B5CF620" }]}>
                  <Ionicons name="repeat" size={12} color="#8B5CF6" />
                </View>
              )}

              <View style={[styles.badge, { backgroundColor: priorityColor + "20" }]}>
                <Ionicons name="flag" size={12} color={priorityColor} />
                <Text style={[styles.badgeText, { color: priorityColor }]}>
                  {PRIORITY_LABELS[task.priority]}
                </Text>
              </View>

              {task.tags?.slice(0, 2).map((tag, i) => (
                <Text key={i} style={[styles.tagText, { color: colors.primary }]}>
                  #{tag}
                </Text>
              ))}
            </View>

            {task.dueDate && (
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
            )}

            {hasDescription && expanded && (
              <View style={[styles.descriptionContainer, { borderTopColor: colors.border }]}>
                <Text style={[styles.descriptionText, { color: colors.muted }]} numberOfLines={6}>
                  {task.description}
                </Text>
              </View>
            )}
            {hasDescription && !expanded && (
              <View style={styles.expandHint}>
                <Ionicons name="chevron-down-outline" size={14} color={colors.muted} />
                <Text style={[styles.expandHintText, { color: colors.muted }]}>
                  Подробнее
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const GroupHeader: React.FC<{ title: string; icon: string; color: string; count: number; colors: any }> = ({
  title,
  icon,
  color,
  count,
  colors,
}) => (
  <View style={styles.groupHeader}>
    <View style={[styles.groupIcon, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon as any} size={16} color={color} />
    </View>
    <Text style={[styles.groupTitle, { color: colors.foreground }]}>
      {title}
    </Text>
    <View style={[styles.groupCount, { backgroundColor: color + "20" }]}>
      <Text style={[styles.groupCountText, { color }]}>{count}</Text>
    </View>
  </View>
);

export const TasksScreen: React.FC = () => {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const { tasks, isLoading, addTask, deleteTask, toggleTaskCompletion, refreshTasks } = useTasks();
  const { customFolders, addCustomFolder, removeCustomFolder } = useFolders();
  const { customTags, removeCustomTag } = useTags();

  const FOLDER_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    all: { label: "Все", icon: "list", color: "#6B7280" },
    ...DEFAULT_FOLDER_CONFIG,
    ...customFolders.reduce<Record<string, { label: string; icon: string; color: string }>>(
      (acc, folder) => {
        acc[folder.id] = { label: folder.label, icon: folder.icon, color: folder.color };
        return acc;
      },
      {},
    ),
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("folder");
  const [newFolderColor, setNewFolderColor] = useState("#6B7280");
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");

  const FOLDER_ICONS = ["folder", "briefcase", "heart", "school", "cart", "fitness", "bulb", "star", "bookmark", "cloud"];
  const FOLDER_COLORS = ["#6B7280", "#3B82F6", "#EC4899", "#8B5CF6", "#10B981", "#EF4444", "#F59E0B", "#06B6D4", "#84CC16"];

  const allTags = useMemo(() => Array.from(new Set(tasks.flatMap((t) => t.tags || []))), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter === "pending" && task.isCompleted) return false;
      if (statusFilter === "completed" && !task.isCompleted) return false;
      if (statusFilter === "overdue") {
        if (!task.dueDate || task.isCompleted) return false;
        if (!isPast(new Date(task.dueDate))) return false;
      }
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (selectedFolder !== "all" && task.folder !== selectedFolder) return false;
      if (selectedTags.length > 0) {
        if (!selectedTags.every((tag) => task.tags?.includes(tag))) return false;
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
  }, [tasks, statusFilter, priorityFilter, selectedFolder, selectedTags, searchQuery]);

  const groupedTasks = useMemo((): TaskGroup[] => {
    if (viewMode !== "grouped") return [];
    const groups: TaskGroup[] = [];

    const todayTasks = filteredTasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate)));
    if (todayTasks.length > 0) groups.push({ title: "Сегодня", icon: "today", color: "#3B82F6", tasks: todayTasks });

    const tomorrowTasks = filteredTasks.filter((t) => t.dueDate && isTomorrow(new Date(t.dueDate)));
    if (tomorrowTasks.length > 0) groups.push({ title: "Завтра", icon: "calendar", color: "#8B5CF6", tasks: tomorrowTasks });

    const overdueTasks = filteredTasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && !t.isCompleted && !isToday(new Date(t.dueDate)));
    if (overdueTasks.length > 0) groups.push({ title: "Просроченные", icon: "alert-circle", color: "#EF4444", tasks: overdueTasks });

    const upcomingTasks = filteredTasks.filter((t) => {
      if (!t.dueDate || t.isCompleted) return false;
      const d = new Date(t.dueDate);
      return !isToday(d) && !isTomorrow(d) && !isPast(d);
    });
    if (upcomingTasks.length > 0) groups.push({ title: "Предстоящие", icon: "time", color: "#10B981", tasks: upcomingTasks });

    const noDateTasks = filteredTasks.filter((t) => !t.dueDate);
    if (noDateTasks.length > 0) groups.push({ title: "Без срока", icon: "infinite", color: "#6B7280", tasks: noDateTasks });

    const completedTasks = filteredTasks.filter((t) => t.isCompleted);
    if (completedTasks.length > 0) groups.push({ title: "Выполнено", icon: "checkmark-done", color: "#10B981", tasks: completedTasks });

    return groups;
  }, [filteredTasks, viewMode]);

  const pendingCount = useMemo(() => tasks.filter((t) => !t.isCompleted).length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t.isCompleted).length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && !t.isCompleted).length, [tasks]);
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

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
        recurringPattern: data.recurringRule ? JSON.stringify(data.recurringRule) : undefined,
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
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
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
          <Text style={[styles.loadingText, { color: colors.muted }]}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Задачи</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {pendingCount} осталось · {completedCount} выполнено
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setViewMode(viewMode === "list" ? "grouped" : "list")}
          >
            <Ionicons name={viewMode === "list" ? "grid" : "list"} size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {totalTasks > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent === 100 ? "#10B981" : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.muted }]}>{progressPercent}%</Text>
          </View>
        )}

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
        {[
          { key: "all", label: "Все", icon: "list", color: colors.primary },
          { key: "pending", label: "В работе", icon: "ellipse", color: "#3B82F6" },
          { key: "overdue", label: `Просроч.`, icon: "alert-circle", color: "#EF4444" },
          { key: "completed", label: "Готово", icon: "checkmark-circle", color: "#10B981" },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: statusFilter === filter.key ? filter.color : colors.card,
                borderColor: statusFilter === filter.key ? filter.color : colors.border,
              },
            ]}
            onPress={() => setStatusFilter(filter.key as typeof statusFilter)}
          >
            <Ionicons name={filter.icon as any} size={14} color={statusFilter === filter.key ? "#FFFFFF" : filter.color} />
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === filter.key ? "#FFFFFF" : colors.cardForeground },
              ]}
            >
              {filter.label}
              {filter.key === "overdue" && overdueCount > 0 ? ` ${overdueCount}` : ""}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.filterDivider} />

        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedFolder !== "all" ? FOLDER_CONFIG[selectedFolder].color : colors.card,
              borderColor: selectedFolder !== "all" ? FOLDER_CONFIG[selectedFolder].color : colors.border,
            },
          ]}
          onPress={() => setShowFolderModal(true)}
        >
          <Ionicons name={FOLDER_CONFIG[selectedFolder].icon as any} size={14} color={selectedFolder !== "all" ? "#FFFFFF" : FOLDER_CONFIG[selectedFolder].color} />
          <Text style={[styles.filterChipText, { color: selectedFolder !== "all" ? "#FFFFFF" : colors.cardForeground }]}>
            {FOLDER_CONFIG[selectedFolder].label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: priorityFilter !== "all" ? PRIORITY_COLORS[priorityFilter] : colors.card,
              borderColor: priorityFilter !== "all" ? PRIORITY_COLORS[priorityFilter] : colors.border,
            },
          ]}
          onPress={() => setShowPriorityModal(true)}
        >
          <Ionicons name="flag" size={14} color={priorityFilter !== "all" ? "#FFFFFF" : colors.muted} />
          <Text style={[styles.filterChipText, { color: priorityFilter !== "all" ? "#FFFFFF" : colors.cardForeground }]}>
            {priorityFilter === "all" ? "Приоритет" : PRIORITY_LABELS[priorityFilter as TaskPriority]}
          </Text>
        </TouchableOpacity>

        {allTags.length > 0 && (
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedTags.length > 0 ? colors.primary : colors.card,
                borderColor: selectedTags.length > 0 ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setShowTagModal(true)}
          >
            <Ionicons name="pricetags" size={14} color={selectedTags.length > 0 ? "#FFFFFF" : colors.muted} />
            <Text style={[styles.filterChipText, { color: selectedTags.length > 0 ? "#FFFFFF" : colors.cardForeground }]}>
              {selectedTags.length > 0 ? `${selectedTags.length}` : "Теги"}
            </Text>
          </TouchableOpacity>
        )}

        {hasActiveFilters && (
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={clearAllFilters}
          >
            <Ionicons name="close-circle" size={14} color={colors.muted} />
            <Text style={[styles.filterChipText, { color: colors.muted }]}>Сброс</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {selectedTags.length > 0 && (
        <View style={[styles.selectedTagsContainer, { borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.selectedTagChip, { backgroundColor: colors.primary + "20" }]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.selectedTagText, { color: colors.primary }]}>#{tag}</Text>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {viewMode === "grouped" && groupedTasks.length > 0 ? (
        <ScrollView style={styles.groupedList} showsVerticalScrollIndicator={false}>
          {groupedTasks.map((group, gi) => (
            <View key={gi}>
              <GroupHeader title={group.title} icon={group.icon} color={group.color} count={group.tasks.length} colors={colors} />
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  colors={colors}
                  onToggle={() => toggleTaskCompletion(task.id)}
                  onEdit={() => handleEditTask(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                  index={0}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TaskCard
              task={item}
              colors={colors}
              onToggle={() => toggleTaskCompletion(item.id)}
              onEdit={() => handleEditTask(item)}
              onDelete={() => handleDeleteTask(item.id)}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="checkbox-outline" size={48} color={colors.muted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {searchQuery ? "Ничего не найдено" : "Задач пока нет"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                {searchQuery ? "Попробуйте изменить параметры поиска" : "Создайте свою первую задачу"}
              </Text>
            </View>
          }
        />
      )}

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
                recurringRule: editingTask.recurringPattern ? JSON.parse(editingTask.recurringPattern) : null,
              }
            : undefined
        }
      />

      <Modal visible={showFolderModal} transparent animationType="fade" onRequestClose={() => setShowFolderModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFolderModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Выберите папку</Text>
              <TouchableOpacity onPress={() => setShowFolderModal(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.addNewFolderButton, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
              onPress={() => {
                setShowFolderModal(false);
                setShowNewFolderModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
              <Text style={[styles.addNewFolderText, { color: colors.primary }]}>Создать новую папку</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                key="all"
                style={[styles.modalOption, { backgroundColor: selectedFolder === "all" ? FOLDER_CONFIG.all.color + "20" : "transparent" }]}
                onPress={() => {
                  setSelectedFolder("all");
                  setShowFolderModal(false);
                }}
              >
                <View style={[styles.folderIconContainer, { backgroundColor: FOLDER_CONFIG.all.color + "20" }]}>
                  <Ionicons name={FOLDER_CONFIG.all.icon as any} size={24} color={FOLDER_CONFIG.all.color} />
                </View>
                <Text style={[styles.modalOptionText, { color: colors.foreground }]}>Все папки</Text>
                {selectedFolder === "all" && <Ionicons name="checkmark" size={20} color={FOLDER_CONFIG.all.color} />}
              </TouchableOpacity>

              {(Object.entries(DEFAULT_FOLDER_CONFIG) as [DefaultFolderKey, (typeof DEFAULT_FOLDER_CONFIG)[DefaultFolderKey]][]).map(
                ([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.modalOption, { backgroundColor: selectedFolder === key ? config.color + "20" : "transparent" }]}
                    onPress={() => {
                      setSelectedFolder(key);
                      setShowFolderModal(false);
                    }}
                  >
                    <View style={[styles.folderIconContainer, { backgroundColor: config.color + "20" }]}>
                      <Ionicons name={config.icon as any} size={24} color={config.color} />
                    </View>
                    <Text style={[styles.modalOptionText, { color: colors.foreground }]}>{config.label}</Text>
                    {selectedFolder === key && <Ionicons name="checkmark" size={20} color={config.color} />}
                  </TouchableOpacity>
                ),
              )}

              {customFolders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={[styles.modalOption, { backgroundColor: selectedFolder === folder.id ? folder.color + "20" : "transparent" }]}
                  onPress={() => {
                    setSelectedFolder(folder.id);
                    setShowFolderModal(false);
                  }}
                >
                  <View style={[styles.folderIconContainer, { backgroundColor: folder.color + "20" }]}>
                    <Ionicons name={folder.icon as any} size={24} color={folder.color} />
                  </View>
                  <Text style={[styles.modalOptionText, { color: colors.foreground, flex: 1 }]}>{folder.label}</Text>
                  {selectedFolder === folder.id && <Ionicons name="checkmark" size={20} color={folder.color} />}
                  <TouchableOpacity
                    onPress={() => removeCustomFolder(folder.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showNewFolderModal} transparent animationType="fade" onRequestClose={() => setShowNewFolderModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNewFolderModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Новая папка</Text>
              <TouchableOpacity onPress={() => setShowNewFolderModal(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.foreground, marginBottom: 8 }]}>Название</Text>
            <TextInput
              style={[styles.newFolderInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Введите название папки"
              placeholderTextColor={colors.muted}
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 16, marginBottom: 8 }]}>Иконка</Text>
            <View style={styles.iconPicker}>
              {FOLDER_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconPickerItem,
                    {
                      backgroundColor: newFolderIcon === icon ? colors.primary : colors.card,
                      borderColor: newFolderIcon === icon ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setNewFolderIcon(icon)}
                >
                  <Ionicons name={icon as any} size={20} color={newFolderIcon === icon ? "#FFFFFF" : colors.muted} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 16, marginBottom: 8 }]}>Цвет</Text>
            <View style={styles.colorPicker}>
              {FOLDER_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorPickerItem,
                    { backgroundColor: color, borderColor: newFolderColor === color ? colors.foreground : "transparent" },
                  ]}
                  onPress={() => setNewFolderColor(color)}
                >
                  {newFolderColor === color && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createFolderButton, { backgroundColor: newFolderName.trim() ? colors.primary : colors.muted }]}
              onPress={async () => {
                if (newFolderName.trim()) {
                  await addCustomFolder({ label: newFolderName.trim(), icon: newFolderIcon, color: newFolderColor });
                  setNewFolderName("");
                  setNewFolderIcon("folder");
                  setNewFolderColor("#6B7280");
                  setShowNewFolderModal(false);
                }
              }}
              disabled={!newFolderName.trim()}
            >
              <Text style={styles.createFolderButtonText}>Создать папку</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showPriorityModal} transparent animationType="fade" onRequestClose={() => setShowPriorityModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPriorityModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Выберите приоритет</Text>
              <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: priorityFilter === "all" ? colors.primary + "20" : "transparent" }]}
                onPress={() => {
                  setPriorityFilter("all");
                  setShowPriorityModal(false);
                }}
              >
                <Ionicons name="list" size={24} color={colors.muted} />
                <Text style={[styles.modalOptionText, { color: colors.foreground }]}>Все приоритеты</Text>
                {priorityFilter === "all" && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
              {(["urgent", "high", "medium", "low"] as TaskPriority[]).map((priority) => {
                const labels = { urgent: "Срочно", high: "Высокий", medium: "Средний", low: "Низкий" };
                return (
                  <TouchableOpacity
                    key={priority}
                    style={[styles.modalOption, { backgroundColor: priorityFilter === priority ? PRIORITY_COLORS[priority] + "20" : "transparent" }]}
                    onPress={() => {
                      setPriorityFilter(priority);
                      setShowPriorityModal(false);
                    }}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[priority] }]} />
                    <Text style={[styles.modalOptionText, { color: colors.foreground }]}>{labels[priority]}</Text>
                    {priorityFilter === priority && <Ionicons name="checkmark" size={20} color={PRIORITY_COLORS[priority]} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTagModal} transparent animationType="fade" onRequestClose={() => setShowTagModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTagModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Теги ({selectedTags.length} выбрано)
              </Text>
              <TouchableOpacity onPress={() => setShowTagModal(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
              Выберите один или несколько тегов. Долгое нажатие - удалить тег.
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
                          backgroundColor: isSelected ? colors.primary : colors.card,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => toggleTag(tag)}
                      onLongPress={() => {
                        Alert.alert("Удалить тег", `Вы уверены, что хотите удалить тег "${tag}"?`, [
                          { text: "Отмена", style: "cancel" },
                          {
                            text: "Удалить",
                            style: "destructive",
                            onPress: async () => {
                              await removeCustomTag(tag);
                              setSelectedTags((prev) => prev.filter((t) => t !== tag));
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={[styles.tagOptionText, { color: isSelected ? "#FFFFFF" : colors.cardForeground }]}>
                        #{tag}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
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
                <Text style={styles.clearTagsButtonText}>Сбросить все теги</Text>
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
  header: { padding: 16, paddingTop: 24, gap: 16 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, fontWeight: "500", marginTop: 4 },
  viewToggle: { padding: 10, borderRadius: 12, borderWidth: 1 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBar: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: "600", minWidth: 36, textAlign: "right" },
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
  filtersScroll: { marginBottom: 8, maxHeight: 48 },
  filtersContent: { paddingHorizontal: 16, alignItems: "center", minHeight: 40 },
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
  filterDivider: { width: 1, height: 24, backgroundColor: "#E4E4E7", marginHorizontal: 4 },
  selectedTagsContainer: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  selectedTagChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, gap: 4 },
  selectedTagText: { fontSize: 13, fontWeight: "500" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  groupedList: { flex: 1, paddingHorizontal: 16 },
  groupHeader: { flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 8, gap: 10 },
  groupIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  groupTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
  groupCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  groupCountText: { fontSize: 12, fontWeight: "600" },
  taskCard: { borderRadius: 16, marginBottom: 10, overflow: "hidden", borderLeftWidth: 4 },
  priorityBar: { height: 0 },
  taskContent: { flexDirection: "row", alignItems: "flex-start", padding: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, marginRight: 14, marginTop: 2, justifyContent: "center", alignItems: "center" },
  taskInfo: { flex: 1 },
  taskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  taskTitle: { fontSize: 15, fontWeight: "600", flex: 1, marginRight: 8, lineHeight: 20 },
  editButton: { padding: 4, borderRadius: 8 },
  taskMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  tagText: { fontSize: 11, fontWeight: "500" },
  dueDateContainer: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 },
  dueDateText: { fontSize: 12, fontWeight: "500" },
  descriptionContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  descriptionText: { fontSize: 13, lineHeight: 20 },
  expandHint: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  expandHintText: { fontSize: 12 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8, textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  fab: { position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", maxHeight: "70%", borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSubtitle: { fontSize: 14, marginBottom: 12 },
  modalOption: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
  modalOptionText: { fontSize: 16, flex: 1 },
  folderIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  tagsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagOption: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, gap: 6 },
  tagOptionText: { fontSize: 14, fontWeight: "500" },
  clearTagsButton: { marginTop: 16, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  clearTagsButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  addNewFolderButton: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", marginBottom: 12, gap: 10 },
  addNewFolderText: { fontSize: 16, fontWeight: "600" },
  newFolderInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  iconPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  iconPickerItem: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  colorPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  colorPickerItem: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", borderWidth: 2 },
  createFolderButton: { marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  createFolderButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  fieldLabel: { fontSize: 14, fontWeight: "600" },
  priorityDot: { width: 16, height: 16, borderRadius: 8 },
});
