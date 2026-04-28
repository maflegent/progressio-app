// app/(tabs)/diary.tsx - улучшенный дневник с задачами
import { Colors } from "@/constants/Colors";
import { GlobalStyles } from "@/constants/Styles";
import { useAppTheme } from "@/contexts/SettingsContext";
import { useTasks } from "@/contexts/TaskContext";
import { DiaryEntry, Mood } from "@/types";
import { diaryStorage } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MOOD_CONFIG = [
  { id: "awful" as Mood, label: "Ужасно", icon: "sad", color: "#DC2626", score: 1 },
  { id: "bad" as Mood, label: "Плохо", icon: "thumbs-down", color: "#F59E0B", score: 2 },
  { id: "neutral" as Mood, label: "Нормально", icon: "remove-circle", color: "#6B7280", score: 3 },
  { id: "good" as Mood, label: "Хорошо", icon: "thumbs-up", color: "#10B981", score: 4 },
  { id: "awesome" as Mood, label: "Отлично", icon: "happy", color: "#3B82F6", score: 5 },
];

const CalendarDay = ({
  date,
  entries,
  colors,
  onPress,
}: {
  date: Date;
  entries: DiaryEntry[];
  colors: any;
  onPress: () => void;
}) => {
  const dayEntry = entries.find((e) => isSameDay(new Date(e.date), date));
  const mood = dayEntry ? MOOD_CONFIG.find((m) => m.id === dayEntry.mood) : null;

  return (
    <TouchableOpacity
      style={[
        styles.calendarDay,
        {
          backgroundColor: isToday(date) ? `${colors.primary}15` : "transparent",
          borderColor: isToday(date) ? colors.primary : "transparent",
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.dayNumber,
          { color: isToday(date) ? colors.primary : colors.foreground },
        ]}
      >
        {format(date, "d")}
      </Text>
      {mood && (
        <View style={[styles.moodDot, { backgroundColor: mood.color }]} />
      )}
    </TouchableOpacity>
  );
};

const CalendarView = ({
  currentDate,
  entries,
  colors,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
}: {
  currentDate: Date;
  entries: DiaryEntry[];
  colors: any;
  onDateSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startPadding = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const days: Date[] = [];
  
  for (let i = 0; i < startPadding; i++) {
    days.push(addDays(monthStart, -startPadding + i));
  }
  
  const current = new Date(monthStart);
  while (current <= monthEnd) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.muted} />
        </TouchableOpacity>
        <Text style={[styles.calendarTitle, { color: colors.foreground }]}>
          {format(currentDate, "LLLL yyyy", { locale: ru })}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.muted} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.dayNamesRow}>
        {dayNames.map((d) => (
          <Text key={d} style={[styles.dayName, { color: colors.muted }]}>
            {d}
          </Text>
        ))}
      </View>
      
      <View style={styles.calendarGrid}>
        {days.map((date, i) => (
          <CalendarDay
            key={i}
            date={date}
            entries={entries}
            colors={colors}
            onPress={() => onDateSelect(date)}
          />
        ))}
      </View>
    </View>
  );
};

// Компонент списка задач за день
const DayTasks = ({
  date,
  tasks,
  colors,
  onTaskPress,
}: {
  date: Date;
  tasks: any[];
  colors: any;
  onTaskPress: (id: string) => void;
}) => {
  const dayTasks = tasks.filter((t) => {
    const taskDate = t.dueDate ? new Date(t.dueDate) : null;
    return taskDate && isSameDay(taskDate, date);
  });

  if (dayTasks.length === 0) return null;

  const priorityColors: Record<string, string> = {
    urgent: "#EF4444",
    high: "#F59E0B",
    medium: "#3B82F6",
    low: "#10B981",
  };

  return (
    <View style={[styles.dayTasksCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.dayTasksTitle, { color: colors.foreground }]}>
        Задачи на {format(date, "d MMM", { locale: ru })}
      </Text>
      {dayTasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={[styles.dayTaskItem, { borderBottomColor: colors.border }]}
          onPress={() => onTaskPress(task.id)}
        >
          <View style={[styles.dayTaskDot, { backgroundColor: priorityColors[task.priority] }]} />
          <Text style={[styles.dayTaskTitle, { color: colors.foreground }]} numberOfLines={1}>
            {task.title}
          </Text>
          {task.isCompleted && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function DiaryScreen() {
  const router = useRouter();
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const { tasks } = useTasks();

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [entryText, setEntryText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedDateEntry, setSelectedDateEntry] = useState<DiaryEntry | null>(null);
  const [showTaskList, setShowTaskList] = useState(false);
  const [tasksForDate, setTasksForDate] = useState<any[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const loaded = await diaryStorage.loadEntries();
      setEntries(loaded);
    } catch (error) {
      console.error("Error loading:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    const entry = entries.find((e) => isSameDay(new Date(e.date), date));
    const dayTasks = tasks.filter((t) => {
      const taskDate = t.dueDate ? new Date(t.dueDate) : null;
      return taskDate && isSameDay(taskDate, date);
    });
    
    setSelectedDate(date);
    setSelectedDateEntry(entry || null);
    setSelectedMood(entry?.mood || null);
    setEntryText(entry?.content || "");
    setTasksForDate(dayTasks);
    setShowTaskList(dayTasks.length > 0);
    setShowEntryModal(true);
  };

  const handleTaskPress = (id: string) => {
    setShowEntryModal(false);
    router.push({ pathname: "/task-edit", params: { id } });
  };

  const handleSaveEntry = async () => {
    if (!selectedMood) return;
    
    const entry = {
      date: selectedDate || new Date(),
      mood: selectedMood,
      content: entryText,
    };

    try {
      if (selectedDateEntry) {
        await diaryStorage.updateEntry(selectedDateEntry.id, entry);
      } else {
        await diaryStorage.addEntry(entry);
      }
      await loadEntries();
      setShowEntryModal(false);
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await diaryStorage.deleteEntry(id);
      await loadEntries();
      setSelectedDateEntry(null);
    } catch (error) {
      console.error("Error deleting:", error);
    }
};
  
  const getMoodStats = () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    const weekEntries = entries.filter((e) => new Date(e.date) >= weekAgo);
    const monthEntries = entries.filter((e) => new Date(e.date) >= monthAgo);

    const calcAverage = (eds: DiaryEntry[]) => {
      if (eds.length === 0) return 0;
      const sum = eds.reduce((acc, e) => {
        const m = MOOD_CONFIG.find((m) => m.id === e.mood);
        return acc + (m?.score || 3);
      }, 0);
      return sum / eds.length;
    };

    const calcStreak = () => {
      let streak = 0;
      const sorted = [...entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      for (let i = 0; i < sorted.length; i++) {
        const curr = new Date(sorted[i].date);
        const prev = i > 0 ? new Date(sorted[i - 1].date) : null;
        
        if (i === 0) {
          if (isToday(curr) || isSameDay(curr, addDays(new Date(), -1))) {
            streak = 1;
          } else {
            break;
          }
        } else if (prev) {
          const diff = Math.abs(curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          if (diff <= 1) {
            streak++;
          } else {
            break;
          }
        }
      }
      return streak;
    };

    return {
      weekCount: weekEntries.length,
      monthCount: monthEntries.length,
      weekAvg: calcAverage(weekEntries),
      monthAvg: calcAverage(monthEntries),
      streak: calcStreak(),
      total: entries.length,
    };
  };

  const getWeeklyTrend = () => {
    const days: Array<{ day: string; mood: string | null }> = [];
    const dayLabels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    
    for (let i = 6; i >= 0; i--) {
      const date = addDays(new Date(), -i);
      const entry = entries.find((e) => isSameDay(new Date(e.date), date));
      days.push({
        day: dayLabels[date.getDay()],
        mood: entry?.mood || null,
      });
    }
    return days;
  };

  const stats = getMoodStats();
  const weeklyTrend = stats.total > 0 ? getWeeklyTrend() : [];

  const handleOpenNewEntry = () => {
    setSelectedDate(new Date());
    setSelectedDateEntry(null);
    setSelectedMood(null);
    setEntryText("");
    setTasksForDate([]);
    setShowTaskList(false);
    setShowEntryModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, GlobalStyles.section]}>
          <Text style={[GlobalStyles.title, { color: colors.foreground }]}>Дневник</Text>
          <Text style={[GlobalStyles.subtitle, { color: colors.muted }]}>
            {stats.total > 0
              ? `${stats.total} записей • ${stats.streak} дней подряд`
              : "Отслеживайте своё настроение"}
          </Text>
        </View>

        <CalendarView
          currentDate={currentMonth}
          entries={entries}
          colors={colors}
          onDateSelect={handleDateSelect}
          onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
        />

        {showTaskList && selectedDate && (
          <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
            <DayTasks
              date={selectedDate}
              tasks={tasksForDate}
              colors={colors}
              onTaskPress={handleTaskPress}
            />
          </View>
        )}

        {stats.total > 0 && (
          <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="flame" size={24} color="#F59E0B" />
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {stats.streak}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Дней</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Ionicons name="calendar" size={24} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {stats.weekCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>За неделю</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Ionicons name="star" size={24} color="#10B981" />
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {stats.monthAvg > 0 ? stats.monthAvg.toFixed(1) : "-"}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Среднее</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {stats.total > 0 && (
          <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Настроение за неделю
            </Text>
            <View style={[styles.trendCard, { backgroundColor: colors.card }]}>
              <View style={styles.trendRow}>
                {weeklyTrend.map((item, index) => {
                  const mood = item.mood
                    ? MOOD_CONFIG.find((m) => m.id === item.mood)
                    : null;
                  return (
                    <View key={index} style={styles.trendItem}>
                      <View
                        style={[
                          styles.trendDot,
                          {
                            backgroundColor: mood
                              ? `${mood.color}30`
                              : colors.border,
                            borderColor: mood?.color || "transparent",
                          },
                        ]}
                      >
                        {mood && (
                          <Ionicons
                            name={mood.icon as any}
                            size={16}
                            color={mood.color}
                          />
                        )}
                      </View>
                      <Text style={[styles.trendDay, { color: colors.muted }]}>
                        {item.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        <View style={[GlobalStyles.section, { paddingHorizontal: 16, paddingBottom: 32 }]}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenNewEntry}
          >
            <Ionicons name="add" size={24} color={colors.primaryForeground} />
            <Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>
              Записать настроение
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showEntryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEntryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEntryModal(false)}>
                <Text style={{ color: colors.muted }}>Отмена</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {selectedDateEntry ? "Редактировать" : "Новая запись"}
              </Text>
              <TouchableOpacity onPress={handleSaveEntry}>
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Сохранить</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDate}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.modalDateText, { color: colors.foreground }]}>
                {selectedDate
                  ? format(selectedDate, "d MMMM yyyy", { locale: ru })
                  : "Сегодня"}
              </Text>
            </View>

            <Text style={[styles.modalSectionTitle, { color: colors.muted }]}>
              Как вы себя чувствуете?
            </Text>
            <View style={styles.moodSelector}>
              {MOOD_CONFIG.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodOption,
                    {
                      backgroundColor:
                        selectedMood === mood.id
                          ? `${mood.color}20`
                          : colors.card,
                      borderColor:
                        selectedMood === mood.id
                          ? mood.color
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedMood(mood.id)}
                >
                  <Ionicons
                    name={mood.icon as any}
                    size={24}
                    color={selectedMood === mood.id ? mood.color : colors.muted}
                  />
                  <Text
                    style={[
                      styles.moodLabel,
                      {
                        color:
                          selectedMood === mood.id
                            ? mood.color
                            : colors.muted,
                      },
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalSectionTitle, { color: colors.muted }]}>
              Мысли (необязательно)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              value={entryText}
              onChangeText={setEntryText}
              placeholder="О чём вы думаете?"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {selectedDateEntry && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  handleDeleteEntry(selectedDateEntry.id);
                  setShowEntryModal(false);
                }}
              >
                <Ionicons name="trash" size={20} color="#EF4444" />
                <Text style={styles.deleteButtonText}>Удалить запись</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  calendarCard: { marginHorizontal: 16, borderRadius: 16, padding: 16 },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarTitle: { fontSize: 16, fontWeight: "600" },
  navButton: { padding: 8 },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayName: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "500" },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 8,
  },
  dayNumber: { fontSize: 14 },
  moodDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  statsCard: { marginHorizontal: 16, borderRadius: 16, padding: 16 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 40 },
  trendCard: { borderRadius: 16, padding: 16 },
  trendRow: { flexDirection: "row", justifyContent: "space-between" },
  trendItem: { alignItems: "center" },
  trendDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  trendDay: { fontSize: 11, marginTop: 8 },
  addButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: { fontSize: 16, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  modalDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  modalDateText: { fontSize: 16, fontWeight: "500" },
  modalSectionTitle: { fontSize: 14, fontWeight: "500", marginBottom: 12 },
  moodSelector: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  moodOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  moodLabel: { fontSize: 11, marginTop: 4, fontWeight: "500" },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    fontSize: 15,
    marginBottom: 20,
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  deleteButtonText: { color: "#EF4444", fontWeight: "500" },
  dayTasksCard: { borderRadius: 16, padding: 16, marginTop: 16 },
  dayTasksTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  dayTaskItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  dayTaskDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  dayTaskTitle: { flex: 1, fontSize: 14 },
});