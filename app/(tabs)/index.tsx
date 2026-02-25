// app/(tabs)/index.tsx - улучшенная версия с вкладками и улучшенным поиском
import { Colors } from "@/constants/Colors";
import { useAppTheme } from "@/contexts/SettingsContext";
import { useTasks } from "@/contexts/TaskContext";
import { EisenhowerMatrix, Task, TaskPriority } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { format, isPast, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- Вспомогательные функции ---

const getPriorityColor = (priority?: string, _colors?: any): string => {
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
      return "#94A3B8";
  }
};

const getEisenhowerColor = (quadrant?: string, _colors?: any): string => {
  switch (quadrant) {
    case "do":
      return "#EF4444";
    case "schedule":
    case "decide":
      return "#3B82F6";
    case "delegate":
      return "#F59E0B";
    case "delete":
      return "#94A3B8";
    default:
      return "#94A3B8";
  }
};

const getEisenhowerIcon = (quadrant?: string): string | null => {
  switch (quadrant) {
    case "do":
      return "flash";
    case "schedule":
    case "decide":
      return "calendar";
    case "delegate":
      return "people";
    case "delete":
      return "trash";
    default:
      return null;
  }
};

// --- Компоненты ---

const SimpleSmartInput = ({
  onSubmit,
  onCreateFull,
  colors,
}: {
  onSubmit: (title: string) => void;
  onCreateFull: () => void;
  colors: any;
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit(input.trim());
    setInput("");
  };

  return (
    <View
      style={[
        styles.smartInputContainer,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <TextInput
        style={[
          styles.smartInput,
          { color: colors.foreground, backgroundColor: "transparent" },
        ]}
        placeholder="Быстро добавить задачу..."
        placeholderTextColor={colors.muted}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
      <TouchableOpacity
        style={[
          styles.advancedCreateButton,
          { backgroundColor: colors.primary },
        ]}
        onPress={onCreateFull}
      >
        <Ionicons
          name="ellipsis-horizontal"
          size={20}
          color={colors.primaryForeground}
        />
      </TouchableOpacity>
    </View>
  );
};

const TaskItem = ({
  task,
  onPress,
  onLongPress,
  onEdit,
  colors,
}: {
  task: Task;
  onPress: () => void;
  onLongPress: () => void;
  onEdit: () => void;
  colors: any;
}) => {
  const formatDueDate = (date?: Date) => {
    if (!date) return null;
    const taskDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isToday(taskDate)) {
      return "Сегодня";
    } else if (taskDate.toDateString() === tomorrow.toDateString()) {
      return "Завтра";
    } else {
      return format(taskDate, "dd MMM", { locale: ru });
    }
  };

  const isOverdue =
    task.dueDate && isPast(new Date(task.dueDate)) && !task.isCompleted;

  return (
    <TouchableOpacity
      style={[styles.taskItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <View style={styles.taskContent}>
        <View
          style={[
            styles.checkbox,
            { borderColor: getPriorityColor(task.priority) },
            task.isCompleted && {
              backgroundColor: getPriorityColor(task.priority),
            },
          ]}
        >
          {task.isCompleted && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>

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

          {task.description ? (
            <Text
              style={[styles.taskDescription, { color: colors.muted }]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          ) : null}

          <View style={styles.taskMeta}>
            {task.eisenhower && (
              <View
                style={[
                  styles.eisenhowerBadge,
                  {
                    backgroundColor: getEisenhowerColor(task.eisenhower) + "20",
                  },
                ]}
              >
                <Ionicons
                  name={getEisenhowerIcon(task.eisenhower) as any}
                  size={12}
                  color={getEisenhowerColor(task.eisenhower)}
                />
              </View>
            )}

            {task.dueDate && (
              <View
                style={[
                  styles.dateBadge,
                  {
                    backgroundColor: isOverdue
                      ? "#EF444420"
                      : colors.primary + "20",
                  },
                ]}
              >
                <Ionicons
                  name="time"
                  size={12}
                  color={isOverdue ? "#EF4444" : colors.primary}
                />
                <Text
                  style={[
                    styles.dateText,
                    { color: isOverdue ? "#EF4444" : colors.primary },
                  ]}
                >
                  {formatDueDate(task.dueDate)}
                </Text>
              </View>
            )}

            {task.isRecurring && (
              <View
                style={[
                  styles.recurringBadge,
                  { backgroundColor: "#8B5CF620" },
                ]}
              >
                <Ionicons name="repeat" size={12} color="#8B5CF6" />
              </View>
            )}

            {task.tags && task.tags.length > 0 && (
              <View style={styles.tags}>
                {task.tags.slice(0, 2).map((tag: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
                {task.tags.length > 2 && (
                  <Text style={[styles.tagText, { color: colors.muted }]}>
                    +{task.tags.length - 2}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MatrixQuadrant = ({
  title,
  subtitle,
  color,
  tasks,
  onPressTask,
  colors,
}: {
  title: string;
  subtitle: string;
  color: string;
  tasks: Task[];
  onPressTask: (task: Task) => void;
  colors: any;
}) => (
  <View
    style={[
      styles.matrixQuadrant,
      { backgroundColor: color + "15", borderColor: color },
    ]}
  >
    <View style={styles.quadrantHeader}>
      <Text style={[styles.quadrantTitle, { color }]}>{title}</Text>
      <Text style={[styles.quadrantCount, { color }]}>{tasks.length}</Text>
    </View>
    <Text style={[styles.quadrantSubtitle, { color: colors.muted }]}>
      {subtitle}
    </Text>

    <ScrollView
      style={styles.quadrantTasks}
      showsVerticalScrollIndicator={false}
    >
      {tasks.length === 0 ? (
        <Text style={[styles.emptyQuadrant, { color: colors.muted }]}>
          Пусто
        </Text>
      ) : (
        tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.quadrantTask, { backgroundColor: colors.card }]}
            onPress={() => onPressTask(task)}
          >
            <Text
              style={[styles.quadrantTaskText, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  </View>
);

// --- Основной компонент ---

export default function TasksScreen() {
  const router = useRouter();
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const { tasks, isLoading, addTask, deleteTask, toggleTaskCompletion } =
    useTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<
    "all" | "pending" | "completed" | "overdue"
  >("all");
  const [selectedPriority, setSelectedPriority] = useState<
    TaskPriority | "all"
  >("all");
  const [selectedEisenhower, setSelectedEisenhower] = useState<
    EisenhowerMatrix | "all"
  >("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [showMatrix, setShowMatrix] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);

  const allTags = Array.from(new Set(tasks.flatMap((task) => task.tags || [])));

  const filteredTasks = tasks.filter((task: Task) => {
    if (selectedTab === "pending" && task.isCompleted) return false;
    if (selectedTab === "completed" && !task.isCompleted) return false;
    if (selectedTab === "overdue") {
      if (!task.dueDate) return false;
      if (task.isCompleted) return false;
      if (!isPast(new Date(task.dueDate))) return false;
    }

    if (selectedPriority !== "all" && task.priority !== selectedPriority)
      return false;

    if (selectedEisenhower !== "all" && task.eisenhower !== selectedEisenhower)
      return false;

    if (selectedTag !== "all" && !task.tags?.includes(selectedTag))
      return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        false ||
        (task.tags || []).some((tag: string) =>
          tag.toLowerCase().includes(query),
        )
      );
    }

    return true;
  });

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const matrixTasks = {
    do: pendingTasks.filter((t) => t.eisenhower === "do"),
    decide: pendingTasks.filter((t) => t.eisenhower === "decide"),
    delegate: pendingTasks.filter((t) => t.eisenhower === "delegate"),
    delete: pendingTasks.filter((t) => t.eisenhower === "delete"),
  };

  const tabCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => !t.isCompleted).length,
    completed: tasks.filter((t) => t.isCompleted).length,
    overdue: tasks.filter(
      (t) => t.dueDate && isPast(new Date(t.dueDate)) && !t.isCompleted,
    ).length,
  };

  const handleQuickAddTask = async (title: string) => {
    try {
      await addTask({
        title,
        description: "",
        priority: "medium",
        isCompleted: false,
        isRecurring: false,
        tags: [],
      });
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось создать задачу");
    }
  };

  const handleCreateFullTask = () => {
    setShowCreateMenu(false);
    router.push("/task-edit");
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      "Удалить задачу",
      "Вы уверены, что хотите удалить эту задачу?",
      [
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
      ],
    );
  };

  const handleEditTask = (taskId: string) => {
    router.push(`/task-edit?id=${taskId}`);
  };

  const handleMatrixTaskPress = (task: Task) => {
    router.push(`/task-edit?id=${task.id}`);
  };

  const createMenuOptions = [
    {
      icon: "create-outline",
      title: "Полная форма",
      description: "Создать задачу с настройками",
      color: "#3B82F6",
      onPress: handleCreateFullTask,
    },
    {
      icon: "flash-outline",
      title: "Быстрая задача",
      description: "Добавить задачу одним кликом",
      color: "#10B981",
      onPress: () => {
        setShowCreateMenu(false);
        // Логика быстрого добавления через инпут
      },
    },
    {
      icon: "calendar-outline",
      title: "Задача на сегодня",
      description: "С задачей на сегодня",
      color: "#F59E0B",
      onPress: () => {
        setShowCreateMenu(false);
        router.push("/task-edit?dueDate=today");
      },
    },
    {
      icon: "repeat-outline",
      title: "Повторяющаяся",
      description: "Создать повторяющуюся задачу",
      color: "#8B5CF6",
      onPress: () => {
        setShowCreateMenu(false);
        router.push("/task-edit?recurring=true");
      },
    },
  ];

  if (isLoading && tasks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color={colors.muted} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Загрузка задач...
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

        <View style={styles.searchContainer}>
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

      <SimpleSmartInput
        onSubmit={handleQuickAddTask}
        onCreateFull={() => setShowCreateMenu(true)}
        colors={colors}
      />

      {/* Компактные фильтры */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* Фильтр по статусу */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedTab === "all" && styles.filterChipActive,
              {
                borderColor:
                  selectedTab === "all" ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedTab("all")}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedTab === "all" && { color: colors.primaryForeground },
              ]}
            >
              Все
            </Text>
            <View
              style={[
                styles.filterChipBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.filterChipBadgeText}>{tabCounts.all}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedTab === "pending" && styles.filterChipActive,
              {
                borderColor:
                  selectedTab === "pending" ? "#3B82F6" : colors.border,
              },
            ]}
            onPress={() => setSelectedTab("pending")}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedTab === "pending" && { color: "#FFFFFF" },
              ]}
            >
              В работе
            </Text>
            <View
              style={[
                styles.filterChipBadge,
                {
                  backgroundColor:
                    selectedTab === "pending" ? "#FFFFFF" : "#3B82F6",
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipBadgeText,
                  { color: selectedTab === "pending" ? "#3B82F6" : "#FFFFFF" },
                ]}
              >
                {tabCounts.pending}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedTab === "overdue" && styles.filterChipActive,
              {
                borderColor:
                  selectedTab === "overdue" ? "#EF4444" : colors.border,
              },
            ]}
            onPress={() => setSelectedTab("overdue")}
          >
            <Ionicons
              name="alert-circle"
              size={14}
              color={selectedTab === "overdue" ? "#FFFFFF" : "#EF4444"}
            />
            <Text
              style={[
                styles.filterChipText,
                selectedTab === "overdue" && { color: "#FFFFFF" },
              ]}
            >
              Просроченные
            </Text>
            <View
              style={[
                styles.filterChipBadge,
                {
                  backgroundColor:
                    selectedTab === "overdue" ? "#FFFFFF" : "#EF4444",
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipBadgeText,
                  { color: selectedTab === "overdue" ? "#EF4444" : "#FFFFFF" },
                ]}
              >
                {tabCounts.overdue}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedTab === "completed" && styles.filterChipActive,
              {
                borderColor:
                  selectedTab === "completed" ? "#10B981" : colors.border,
              },
            ]}
            onPress={() => setSelectedTab("completed")}
          >
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={selectedTab === "completed" ? "#FFFFFF" : "#10B981"}
            />
            <Text
              style={[
                styles.filterChipText,
                selectedTab === "completed" && { color: "#FFFFFF" },
              ]}
            >
              Готово
            </Text>
            <View
              style={[
                styles.filterChipBadge,
                {
                  backgroundColor:
                    selectedTab === "completed" ? "#FFFFFF" : "#10B981",
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipBadgeText,
                  {
                    color: selectedTab === "completed" ? "#10B981" : "#FFFFFF",
                  },
                ]}
              >
                {tabCounts.completed}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Разделитель */}
          <View style={styles.filterDivider} />

          {/* Кнопка выбора приоритета - всегда видна */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedPriority !== "all" && styles.filterChipActive,
              {
                borderColor:
                  selectedPriority !== "all"
                    ? getPriorityColor(selectedPriority)
                    : colors.border,
                backgroundColor:
                  selectedPriority !== "all"
                    ? getPriorityColor(selectedPriority)
                    : undefined,
              },
            ]}
            onPress={() => setShowPriorityMenu(true)}
          >
            <Ionicons
              name="flag"
              size={14}
              color={
                selectedPriority !== "all"
                  ? "#FFFFFF"
                  : getPriorityColor(selectedPriority)
              }
            />
            <Text
              style={[
                styles.filterChipText,
                selectedPriority !== "all" && { color: "#FFFFFF" },
              ]}
            >
              {selectedPriority === "all" && "Приоритет"}
              {selectedPriority === "urgent" && "Срочно"}
              {selectedPriority === "high" && "Высокий"}
              {selectedPriority === "medium" && "Средний"}
              {selectedPriority === "low" && "Низкий"}
            </Text>
            {selectedPriority !== "all" && (
              <Ionicons name="close" size={14} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Кнопка выбора категории - всегда видна */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedEisenhower !== "all" && styles.filterChipActive,
              {
                borderColor:
                  selectedEisenhower !== "all"
                    ? getEisenhowerColor(selectedEisenhower)
                    : colors.border,
                backgroundColor:
                  selectedEisenhower !== "all"
                    ? getEisenhowerColor(selectedEisenhower)
                    : undefined,
              },
            ]}
            onPress={() => setShowCategoryMenu(true)}
          >
            <Ionicons
              name={getEisenhowerIcon(selectedEisenhower) as any}
              size={14}
              color={
                selectedEisenhower !== "all"
                  ? "#FFFFFF"
                  : getEisenhowerColor(selectedEisenhower)
              }
            />
            <Text
              style={[
                styles.filterChipText,
                selectedEisenhower !== "all" && { color: "#FFFFFF" },
              ]}
            >
              {selectedEisenhower === "all" && "Категория"}
              {selectedEisenhower === "do" && "Сделать"}
              {selectedEisenhower === "decide" && "Запланировать"}
              {selectedEisenhower === "delegate" && "Делегировать"}
              {selectedEisenhower === "delete" && "Убрать"}
            </Text>
            {selectedEisenhower !== "all" && (
              <Ionicons name="close" size={14} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Фильтр по тегу */}
          {allTags.length > 0 && (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedTag !== "all" && styles.filterChipActive,
                {
                  borderColor:
                    selectedTag !== "all" ? colors.primary : colors.border,
                  backgroundColor:
                    selectedTag !== "all" ? colors.primary : undefined,
                },
              ]}
              onPress={() => setShowTagMenu(true)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedTag !== "all" && { color: colors.primaryForeground },
                ]}
              >
                {selectedTag === "all" ? "Тег" : `#${selectedTag}`}
              </Text>
              {selectedTag !== "all" && (
                <Ionicons
                  name="close"
                  size={14}
                  color={colors.primaryForeground}
                />
              )}
            </TouchableOpacity>
          )}

          {/* Кнопка сброса всех фильтров */}
          {(selectedPriority !== "all" ||
            selectedEisenhower !== "all" ||
            selectedTag !== "all" ||
            selectedTab !== "all") && (
            <TouchableOpacity
              style={[
                styles.filterChip,
                styles.filterReset,
                { borderColor: colors.border },
              ]}
              onPress={() => {
                setSelectedTab("all");
                setSelectedPriority("all");
                setSelectedEisenhower("all");
                setSelectedTag("all");
              }}
            >
              <Ionicons name="refresh" size={14} color={colors.muted} />
              <Text style={[styles.filterChipText, { color: colors.muted }]}>
                Сбросить
              </Text>
            </TouchableOpacity>
          )}

          {/* Кнопка матрицы */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.filterMatrix,
              { backgroundColor: "#8B5CF6" },
            ]}
            onPress={() => setShowMatrix(true)}
          >
            <Ionicons name="grid" size={14} color="#FFFFFF" />
            <Text style={[styles.filterChipText, { color: "#FFFFFF" }]}>
              Матрица
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onPress={() => toggleTaskCompletion(item.id)}
            onLongPress={() => handleDeleteTask(item.id)}
            onEdit={() => handleEditTask(item.id)}
            colors={colors}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={64} color={colors.muted} />
            <Text style={[styles.emptyStateTitle, { color: colors.muted }]}>
              {searchQuery ? "Ничего не найдено" : "Задач пока нет"}
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.muted }]}>
              {searchQuery
                ? "Попробуйте изменить параметры поиска"
                : "Нажмите + чтобы создать первую задачу"}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreateMenu(true)}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      <Modal
        visible={showCreateMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateMenu(false)}
        >
          <View style={styles.menuContent}>
            <View style={[styles.menuHeader, { backgroundColor: colors.card }]}>
              <Text style={[styles.menuTitle, { color: colors.foreground }]}>
                Создать задачу
              </Text>
              <TouchableOpacity onPress={() => setShowCreateMenu(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.menuOptions, { backgroundColor: colors.card }]}
            >
              {createMenuOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuOption,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={option.onPress}
                >
                  <View
                    style={[
                      styles.menuOptionIcon,
                      { backgroundColor: option.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={option.color}
                    />
                  </View>
                  <View style={styles.menuOptionInfo}>
                    <Text
                      style={[
                        styles.menuOptionTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={[styles.menuOptionDesc, { color: colors.muted }]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showMatrix}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMatrix(false)}
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
                Матрица приоритетов
              </Text>
              <TouchableOpacity onPress={() => setShowMatrix(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.matrixScroll}>
              <View style={styles.matrixGrid}>
                <MatrixQuadrant
                  title="Сделать"
                  subtitle="Срочно и важно — сделайте немедленно"
                  color="#EF4444"
                  tasks={matrixTasks.do}
                  onPressTask={handleMatrixTaskPress}
                  colors={colors}
                />

                <MatrixQuadrant
                  title="Запланировать"
                  subtitle="Важно, но не срочно — определите сроки"
                  color="#3B82F6"
                  tasks={matrixTasks.decide}
                  onPressTask={handleMatrixTaskPress}
                  colors={colors}
                />

                <MatrixQuadrant
                  title="Делегировать"
                  subtitle="Срочно, но не важно — передайте другим"
                  color="#F59E0B"
                  tasks={matrixTasks.delegate}
                  onPressTask={handleMatrixTaskPress}
                  colors={colors}
                />

                <MatrixQuadrant
                  title="Убрать"
                  subtitle="Не срочно и не важно — удалите или игнорируйте"
                  color="#94A3B8"
                  tasks={matrixTasks.delete}
                  onPressTask={handleMatrixTaskPress}
                  colors={colors}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowMatrix(false)}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                Закрыть
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальное меню выбора приоритета */}
      <Modal
        visible={showPriorityMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPriorityMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowPriorityMenu(false)}
        >
          <View style={styles.filterMenuContent}>
            <View style={[styles.menuHeader, { backgroundColor: colors.card }]}>
              <Text style={[styles.menuTitle, { color: colors.foreground }]}>
                Выберите приоритет
              </Text>
              <TouchableOpacity onPress={() => setShowPriorityMenu(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.menuOptions, { backgroundColor: colors.card }]}
            >
              {(
                ["all", "urgent", "high", "medium", "low"] as (
                  | TaskPriority
                  | "all"
                )[]
              ).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.menuOption,
                    { borderBottomColor: colors.border },
                    selectedPriority === priority && {
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() => {
                    setSelectedPriority(priority);
                    setShowPriorityMenu(false);
                  }}
                >
                  <Ionicons
                    name="flag"
                    size={24}
                    color={
                      priority === "all"
                        ? colors.muted
                        : getPriorityColor(priority)
                    }
                  />
                  <View style={styles.menuOptionInfo}>
                    <Text
                      style={[
                        styles.menuOptionTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      {priority === "all" && "Все приоритеты"}
                      {priority === "urgent" && "Срочно"}
                      {priority === "high" && "Высокий"}
                      {priority === "medium" && "Средний"}
                      {priority === "low" && "Низкий"}
                    </Text>
                  </View>
                  {selectedPriority === priority && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Модальное меню выбора категории */}
      <Modal
        visible={showCategoryMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryMenu(false)}
        >
          <View style={styles.filterMenuContent}>
            <View style={[styles.menuHeader, { backgroundColor: colors.card }]}>
              <Text style={[styles.menuTitle, { color: colors.foreground }]}>
                Выберите категорию
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryMenu(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.menuOptions, { backgroundColor: colors.card }]}
            >
              {(
                ["all", "do", "decide", "delegate", "delete"] as (
                  | EisenhowerMatrix
                  | "all"
                )[]
              ).map((quadrant) => (
                <TouchableOpacity
                  key={quadrant}
                  style={[
                    styles.menuOption,
                    { borderBottomColor: colors.border },
                    selectedEisenhower === quadrant && {
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() => {
                    setSelectedEisenhower(quadrant);
                    setShowCategoryMenu(false);
                  }}
                >
                  <Ionicons
                    name={getEisenhowerIcon(quadrant) as any}
                    size={24}
                    color={
                      quadrant === "all"
                        ? colors.muted
                        : getEisenhowerColor(quadrant)
                    }
                  />
                  <View style={styles.menuOptionInfo}>
                    <Text
                      style={[
                        styles.menuOptionTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      {quadrant === "all" && "Все категории"}
                      {quadrant === "do" && "Сделать"}
                      {quadrant === "decide" && "Запланировать"}
                      {quadrant === "delegate" && "Делегировать"}
                      {quadrant === "delete" && "Убрать"}
                    </Text>
                  </View>
                  {selectedEisenhower === quadrant && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Модальное меню выбора тега */}
      <Modal
        visible={showTagMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTagMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowTagMenu(false)}
        >
          <View style={styles.filterMenuContent}>
            <View style={[styles.menuHeader, { backgroundColor: colors.card }]}>
              <Text style={[styles.menuTitle, { color: colors.foreground }]}>
                Выберите тег
              </Text>
              <TouchableOpacity onPress={() => setShowTagMenu(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.menuOptions, { backgroundColor: colors.card }]}
            >
              <TouchableOpacity
                style={[
                  styles.menuOption,
                  { borderBottomColor: colors.border },
                  selectedTag === "all" && {
                    backgroundColor: colors.primary + "10",
                  },
                ]}
                onPress={() => {
                  setSelectedTag("all");
                  setShowTagMenu(false);
                }}
              >
                <Ionicons name="pricetags" size={24} color={colors.muted} />
                <View style={styles.menuOptionInfo}>
                  <Text
                    style={[
                      styles.menuOptionTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Все теги
                  </Text>
                  <Text
                    style={[styles.menuOptionDesc, { color: colors.muted }]}
                  >
                    Показать задачи с любыми тегами
                  </Text>
                </View>
                {selectedTag === "all" && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {allTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.menuOption,
                    { borderBottomColor: colors.border },
                    selectedTag === tag && {
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() => {
                    setSelectedTag(tag);
                    setShowTagMenu(false);
                  }}
                >
                  <View
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: colors.primary + "20",
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.tagChipText, { color: colors.primary }]}
                    >
                      #{tag}
                    </Text>
                  </View>
                  <View style={styles.menuOptionInfo}>
                    <Text
                      style={[
                        styles.menuOptionTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      #{tag}
                    </Text>
                    <Text
                      style={[styles.menuOptionDesc, { color: colors.muted }]}
                    >
                      {tasks.filter((t) => t.tags?.includes(tag)).length} задач
                    </Text>
                  </View>
                  {selectedTag === tag && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
      android: {
        paddingTop: 0,
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  taskCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  smartInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  smartInput: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 0,
  },
  advancedCreateButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  // Новые стили для компактных фильтров
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: undefined,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  filterChipBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  filterChipWithClose: {
    paddingHorizontal: 8,
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E4E4E7",
    marginHorizontal: 4,
  },
  filterReset: {
    borderColor: "#E4E4E7",
  },
  filterMatrix: {
    borderWidth: 0,
  },
  // Старые стили для совместимости
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    gap: 4,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  taskItem: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
  },
  taskContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
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
  taskInfo: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    flex: 1,
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.7,
    lineHeight: 18,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  eisenhowerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
  },
  recurringBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tags: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  filterMenuContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: "80%",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  menuOptions: {
    paddingBottom: 20,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  menuOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuOptionInfo: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  menuOptionDesc: {
    fontSize: 14,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  modalContent: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: "90%",
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
  matrixScroll: {
    maxHeight: "70%",
  },
  matrixGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  matrixQuadrant: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    minHeight: 200,
  },
  quadrantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  quadrantTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  quadrantCount: {
    fontSize: 18,
    fontWeight: "700",
  },
  quadrantSubtitle: {
    fontSize: 11,
    marginBottom: 12,
  },
  quadrantTasks: {
    flex: 1,
  },
  quadrantTask: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  quadrantTaskText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyQuadrant: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
