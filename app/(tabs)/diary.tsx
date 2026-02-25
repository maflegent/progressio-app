// app/(tabs)/diary.tsx - улучшенная версия с календарём эмоций
import { Colors } from "@/constants/Colors";
import { FeatureIcons } from "@/constants/Icons";
import { GlobalStyles } from "@/constants/Styles";
import { useAppTheme } from "@/contexts/SettingsContext";
import { DiaryEntry, Mood } from "@/types";
import { diaryStorage } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import {
  addMonths,
  eachDayOfInterval,
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
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Компонент ячейки календаря с эмоцией
const CalendarDay = ({
  date,
  entries,
  moodOptions,
  colors,
  onPress,
}: {
  date: Date;
  entries: DiaryEntry[];
  moodOptions: any[];
  colors: any;
  onPress: () => void;
}) => {
  const dayEntry = entries.find((entry) =>
    isSameDay(new Date(entry.date), date),
  );

  const mood = dayEntry
    ? moodOptions.find((m) => m.id === dayEntry.mood)
    : null;
  const dayNumber = format(date, "d");

  return (
    <TouchableOpacity
      style={[
        styles.calendarDay,
        {
          backgroundColor: isToday(date)
            ? `${colors.primary}15`
            : "transparent",
          borderColor: isToday(date) ? colors.primary : "transparent",
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.dayNumber,
          {
            color: isToday(date) ? colors.primary : colors.foreground,
            fontWeight: isToday(date) ? "700" : "400",
          },
        ]}
      >
        {dayNumber}
      </Text>
      {mood && (
        <View
          style={[styles.moodIndicator, { backgroundColor: mood.color + "30" }]}
        >
          <Ionicons name={mood.icon} size={12} color={mood.color} />
        </View>
      )}
    </TouchableOpacity>
  );
};

// Компонент календаря
const CalendarView = ({
  currentDate,
  entries,
  moodOptions,
  colors,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
}: {
  currentDate: Date;
  entries: DiaryEntry[];
  moodOptions: any[];
  colors: any;
  onDateSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Добавляем пустые ячейки для выравнивания по дням недели
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Понедельник = 0

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={onPrevMonth}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.calendarTitle, { color: colors.foreground }]}>
          {format(currentDate, "LLLL yyyy", { locale: ru })}
        </Text>
        <TouchableOpacity onPress={onNextMonth}>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {weekDays.map((day) => (
          <Text key={day} style={[styles.weekDay, { color: colors.muted }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {/* Пустые ячейки */}
        {Array.from({ length: emptyDays }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.calendarDay} />
        ))}

        {/* Дни месяца */}
        {calendarDays.map((date) => (
          <CalendarDay
            key={date.getTime()}
            date={date}
            entries={entries}
            moodOptions={moodOptions}
            colors={colors}
            onPress={() => onDateSelect(date)}
          />
        ))}
      </View>
    </View>
  );
};

export default function DiaryScreen() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [entryText, setEntryText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Календарь
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedDateEntry, setSelectedDateEntry] = useState<DiaryEntry | null>(
    null,
  );

  const moodOptions = [
    {
      id: "awful" as Mood,
      label: "Ужасно",
      icon: FeatureIcons.mood.awful,
      color: "#DC2626",
    },
    {
      id: "bad" as Mood,
      label: "Плохо",
      icon: FeatureIcons.mood.bad,
      color: "#F59E0B",
    },
    {
      id: "neutral" as Mood,
      label: "Нормально",
      icon: FeatureIcons.mood.neutral,
      color: "#6B7280",
    },
    {
      id: "good" as Mood,
      label: "Хорошо",
      icon: FeatureIcons.mood.good,
      color: "#10B981",
    },
    {
      id: "awesome" as Mood,
      label: "Отлично",
      icon: FeatureIcons.mood.awesome,
      color: "#3B82F6",
    },
  ];

  // Загружаем записи при монтировании
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const loadedEntries = await diaryStorage.loadEntries();
      setEntries(loadedEntries);
    } catch (error) {
      console.error("Error loading entries:", error);
      Alert.alert("Ошибка", "Не удалось загрузить записи");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!selectedMood || !entryText.trim()) {
      Alert.alert("Ошибка", "Выберите настроение и введите текст записи");
      return;
    }

    try {
      setIsLoading(true);

      const newEntry: Omit<DiaryEntry, "id" | "createdAt"> = {
        date: selectedDate || new Date(),
        content: entryText.trim(),
        mood: selectedMood,
        linkedTasks: [],
      };

      await diaryStorage.addEntry(newEntry);

      // Очищаем форму
      setSelectedMood(null);
      setEntryText("");
      setShowEntryModal(false);
      setSelectedDate(null);
      setSelectedDateEntry(null);

      // Обновляем список
      await loadEntries();

      Alert.alert("Успех", "Запись сохранена");
    } catch (error) {
      console.error("Error saving entry:", error);
      Alert.alert("Ошибка", "Не удалось сохранить запись");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    Alert.alert(
      "Удалить запись",
      "Вы уверены, что хотите удалить эту запись?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await diaryStorage.deleteEntry(id);
              if (success) {
                await loadEntries();
                setSelectedDateEntry(null);
                Alert.alert("Успех", "Запись удалена");
              }
            } catch (error) {
              console.error("Error deleting entry:", error);
              Alert.alert("Ошибка", "Не удалось удалить запись");
            }
          },
        },
      ],
    );
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const entry = entries.find((e) => isSameDay(new Date(e.date), date));
    setSelectedDateEntry(entry || null);

    if (entry) {
      setEntryText(entry.content);
      setSelectedMood(entry.mood);
    } else {
      setEntryText("");
      setSelectedMood(null);
    }

    setShowEntryModal(true);
  };

  const getRecentEntries = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return entries
      .filter((entry) => new Date(entry.date) >= weekAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getMoodColor = (mood: Mood) => {
    const moodOption = moodOptions.find((m) => m.id === mood);
    return moodOption ? moodOption.color : colors.muted;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) {
      return "Сегодня";
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return "Вчера";
    } else {
      return dateObj.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      });
    }
  };

  // Получаем статистику за месяц
  const getMonthlyStats = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const moodCounts: Record<Mood, number> = {
      awful: 0,
      bad: 0,
      neutral: 0,
      good: 0,
      awesome: 0,
    };

    monthEntries.forEach((entry) => {
      moodCounts[entry.mood]++;
    });

    const mostCommonMood = Object.entries(moodCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )[0] as Mood;

    return {
      total: monthEntries.length,
      moodCounts,
      mostCommonMood,
    };
  };

  const monthlyStats = getMonthlyStats();

  if (isLoading && entries.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Загрузка...</Text>
      </View>
    );
  }

  const recentEntries = getRecentEntries();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Заголовок */}
        <View style={[styles.header, GlobalStyles.section]}>
          <View>
            <Text style={[GlobalStyles.title, { color: colors.foreground }]}>
              Дневник настроения
            </Text>
            <Text style={[GlobalStyles.subtitle, { color: colors.muted }]}>
              {entries.length > 0
                ? `${entries.length} записей, ${recentEntries.length} за неделю`
                : "Начните отслеживать свои мысли и эмоции"}
            </Text>
          </View>
        </View>

        {/* Календарь */}
        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <CalendarView
            currentDate={currentMonth}
            entries={entries}
            moodOptions={moodOptions}
            colors={colors}
            onDateSelect={handleDateSelect}
            onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
            onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
          />
        </View>

        {/* Статистика за месяц */}
        {monthlyStats.total > 0 && (
          <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
            <View
              style={[
                styles.statsCard,
                GlobalStyles.shadow,
                { backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[styles.statsTitle, { color: colors.cardForeground }]}
              >
                Статистика за {format(currentMonth, "LLLL", { locale: ru })}
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {monthlyStats.total}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>
                    записей
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View
                    style={[
                      styles.moodIcon,
                      {
                        backgroundColor: `${getMoodColor(monthlyStats.mostCommonMood)}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        moodOptions.find(
                          (m) => m.id === monthlyStats.mostCommonMood,
                        )?.icon || "help-circle"
                      }
                      size={24}
                      color={getMoodColor(monthlyStats.mostCommonMood)}
                    />
                  </View>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>
                    Основное настроение
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Быстрая запись */}
        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <TouchableOpacity
            style={[
              styles.quickAddButton,
              GlobalStyles.shadow,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              setSelectedDate(new Date());
              setSelectedDateEntry(null);
              setEntryText("");
              setSelectedMood(null);
              setShowEntryModal(true);
            }}
          >
            <Ionicons name="add" size={24} color={colors.primaryForeground} />
            <Text
              style={[styles.quickAddText, { color: colors.primaryForeground }]}
            >
              Записать сегодняшний день
            </Text>
          </TouchableOpacity>
        </View>

        {/* Недавние записи */}
        <View
          style={[
            GlobalStyles.section,
            { paddingHorizontal: 16, paddingBottom: 32 },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Недавние записи
          </Text>

          {recentEntries.length > 0 ? (
            recentEntries.map((entry, index) => (
              <TouchableOpacity
                key={entry.id}
                style={[
                  styles.entryCard,
                  GlobalStyles.shadow,
                  { backgroundColor: colors.card },
                ]}
                onPress={() => handleDateSelect(new Date(entry.date))}
                onLongPress={() => handleDeleteEntry(entry.id)}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.entryMood}>
                    <Ionicons
                      name={
                        moodOptions.find((m) => m.id === entry.mood)?.icon ||
                        "help-circle"
                      }
                      size={16}
                      color={getMoodColor(entry.mood)}
                    />
                    <Text style={[styles.entryDate, { color: colors.muted }]}>
                      {formatDate(entry.date)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    styles.entryPreview,
                    { color: colors.cardForeground },
                  ]}
                  numberOfLines={3}
                >
                  {entry.content}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="journal-outline" size={64} color={colors.muted} />
              <Text style={[styles.emptyStateText, { color: colors.muted }]}>
                Записей пока нет
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.muted }]}>
                Нажмите на дату в календаре или кнопку ниже, чтобы создать
                запись
              </Text>
            </View>
          )}
        </View>

        {/* Модальное окно записи */}
        <Modal
          visible={showEntryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEntryModal(false)}
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
                  {selectedDateEntry ? "Редактировать запись" : "Новая запись"}
                  {selectedDate && (
                    <Text style={[styles.modalDate, { color: colors.muted }]}>
                      {format(selectedDate, "d MMMM yyyy", { locale: ru })}
                    </Text>
                  )}
                </Text>
                <TouchableOpacity onPress={() => setShowEntryModal(false)}>
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Как вы себя чувствуете?
                </Text>
                <View style={styles.moodContainer}>
                  {moodOptions.map((mood) => (
                    <TouchableOpacity
                      key={mood.id}
                      style={[
                        styles.moodOption,
                        selectedMood === mood.id && styles.moodSelected,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => setSelectedMood(mood.id)}
                    >
                      <View
                        style={[
                          styles.moodIconContainer,
                          { backgroundColor: `${mood.color}15` },
                        ]}
                      >
                        <Ionicons
                          name={mood.icon}
                          size={24}
                          color={mood.color}
                        />
                      </View>
                      <Text
                        style={[styles.moodLabel, { color: colors.foreground }]}
                      >
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Ваши мысли и чувства
                </Text>
                <TextInput
                  style={[
                    styles.entryInput,
                    {
                      backgroundColor: colors.card,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Как прошел ваш день? Что чувствуете?.."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={8}
                  value={entryText}
                  onChangeText={setEntryText}
                />

                {selectedDateEntry && (
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      { backgroundColor: "#EF4444" },
                    ]}
                    onPress={() => handleDeleteEntry(selectedDateEntry.id)}
                  >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Удалить запись</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    GlobalStyles.button,
                    { backgroundColor: colors.primary },
                    (!selectedMood || !entryText.trim()) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleSaveEntry}
                  disabled={!selectedMood || !entryText.trim() || isLoading}
                >
                  <Text
                    style={[
                      GlobalStyles.buttonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {isLoading
                      ? "Сохранение..."
                      : selectedDateEntry
                        ? "Обновить"
                        : "Сохранить"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },

  // Календарь
  calendarContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 14,
    marginBottom: 2,
  },
  moodIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  // Статистика
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 20,
  },
  moodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  // Быстрое добавление
  quickAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  quickAddText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Настроения
  moodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  moodOption: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: "18%",
    minWidth: 70,
  },
  moodSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  moodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Записи
  entryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entryMood: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  entryPreview: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },

  // Модальное окно
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  modalContent: {
    margin: 20,
    borderRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  modalDate: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 4,
  },
  modalBody: {
    padding: 20,
  },
  entryInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 120,
    maxHeight: 200,
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  saveButton: {
    minWidth: 160,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
