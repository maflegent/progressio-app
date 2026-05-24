// app/(tabs)/settings.tsx - улучшенные настройки
import { Colors } from "@/constants/Colors";
import { GlobalStyles } from "@/constants/Styles";
import { AppTheme, useAppTheme, useSettings } from "@/contexts/SettingsContext";
import { useTasks } from "@/contexts/TaskContext";
import { dataManager } from "@/utils/dataManager";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// SafeAreaView перенесён из react-native в react-native-safe-area-context для устранения warning о deprecated
import { SafeAreaView } from "react-native-safe-area-context";

const SettingsSection: React.FC<{ title: string; children: React.ReactNode; colors: any }> = ({
  title,
  children,
  colors,
}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.muted }]}>{title}</Text>
    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>{children}</View>
  </View>
);

const SettingItem: React.FC<{
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showChevron?: boolean;
  colors: any;
}> = ({ icon, iconColor, title, subtitle, onPress, rightComponent, showChevron = true, colors }) => (
  <TouchableOpacity
    style={[styles.settingItem, { borderBottomColor: colors.border }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.settingIcon, { backgroundColor: (iconColor || colors.primary) + "20" }]}>
      <Ionicons name={icon as any} size={20} color={iconColor || colors.primary} />
    </View>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle && <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{subtitle}</Text>}
    </View>
    <View style={styles.settingRight}>
      {rightComponent}
      {showChevron && onPress && <Ionicons name="chevron-forward" size={20} color={colors.muted} />}
    </View>
  </TouchableOpacity>
);

const ToggleSwitch: React.FC<{ value: boolean; onValueChange: (value: boolean) => void; colors: any }> = ({
  value,
  onValueChange,
  colors,
}) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    trackColor={{ false: colors.border, true: colors.primary }}
    thumbColor={value ? "#FFFFFF" : colors.muted}
    ios_backgroundColor={colors.border}
  />
);

const DaySelector: React.FC<{
  value: number;
  onChange: (day: number) => void;
  colors: any;
}> = ({ value, onChange, colors }) => {
  const days = [
    { value: 0, label: "Вс" },
    { value: 1, label: "Пн" },
    { value: 2, label: "Вт" },
    { value: 3, label: "Ср" },
    { value: 4, label: "Чт" },
    { value: 5, label: "Пт" },
    { value: 6, label: "Сб" },
  ];

  return (
    <View style={styles.daySelector}>
      {days.map((day) => (
        <TouchableOpacity
          key={day.label}
          style={[
            styles.dayButton,
            {
              backgroundColor: value === day.value ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onChange(day.value)}
        >
          <Text
            style={[
              styles.dayText,
              { color: value === day.value ? "#FFFFFF" : colors.muted },
            ]}
          >
            {day.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function SettingsScreen() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const { settings, updateSettings, resetSettings } = useSettings();
  const { tasks, clearAllTasks } = useTasks();

  const [storageInfo, setStorageInfo] = useState({ tasks: 0, diary: 0, notes: 0, total: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTimeType, setSelectedTimeType] = useState<"morning" | "evening" | null>(null);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const info = await dataManager.getStorageInfo();
    setStorageInfo(info);
  };

  const getTimeFromString = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleOpenTimePicker = (type: "morning" | "evening") => {
    setSelectedTimeType(type);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && selectedTimeType) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      if (selectedTimeType === "morning") {
        updateSettings({ morningReminderTime: timeString });
      } else {
        updateSettings({ eveningReminderTime: timeString });
      }
    }
    setSelectedTimeType(null);
  };

  const getThemeLabel = (theme: AppTheme): string => {
    const labels: Record<AppTheme, string> = { system: "Системная", light: "Светлая", dark: "Тёмная" };
    return labels[theme];
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      urgent: "🔴 Срочно",
      high: "🟠 Высокий",
      medium: "🔵 Средний",
      low: "🟢 Низкий",
    };
    return labels[priority] || priority;
  };

  const getFirstDayLabel = (): string => {
    const days = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    return days[settings.firstDayOfWeek];
  };

  const handleExport = async () => {
    Alert.alert("Экспорт данных", "Функция экспорта скоро станет доступна", [
      { text: "OK" },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      "Очистить данные",
      "Это удалит все задачи, записи дневника и заметки. Действие необратимо.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            await dataManager.clearAllData();
            await clearAllTasks();
            await loadStorageInfo();
            Alert.alert("Успешно", "Все данные удалены");
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert("Сброс настроек", "Вернуть все настройки к значениям по умолчанию?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Сбросить",
        style: "destructive",
        onPress: async () => {
          await resetSettings();
          Alert.alert("Готово", "Настройки сброшены");
        },
      },
    ]);
  };

  const priorities = ["low", "medium", "high", "urgent"] as const;
  const themes = ["system", "light", "dark"] as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[GlobalStyles.section, styles.header]}>
          <Text style={[GlobalStyles.title, { color: colors.foreground }]}>Настройки</Text>
          <Text style={[GlobalStyles.subtitle, { color: colors.muted }]}>
            Настройте приложение под себя
          </Text>
        </View>

        <SettingsSection title="Внешний вид" colors={colors}>
          <SettingItem
            icon="color-palette"
            title="Тема"
            subtitle={getThemeLabel(settings.theme)}
            onPress={() => setShowThemePicker(true)}
            colors={colors}
          />
          <SettingItem
            icon="list"
            title="Показывать выполненные"
            subtitle="Показывать выполненные задачи в списке"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.showCompletedTasks}
                onValueChange={(v) => updateSettings({ showCompletedTasks: v })}
                colors={colors}
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon="resize"
            title="Компактный режим"
            subtitle="Использовать компактное отображение"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.compactView}
                onValueChange={(v) => updateSettings({ compactView: v })}
                colors={colors}
              />
            }
            showChevron={false}
          />
        </SettingsSection>

        <SettingsSection title="Уведомления" colors={colors}>
          <SettingItem
            icon="notifications"
            title="Уведомления"
            subtitle="Включить push-уведомления"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.notificationsEnabled}
                onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
                colors={colors}
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon="sunny"
            iconColor="#F59E0B"
            title="☀️ Утреннее"
            onPress={() => settings.morningReminderEnabled && handleOpenTimePicker("morning")}
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.morningReminderEnabled}
                onValueChange={(v) => updateSettings({ morningReminderEnabled: v })}
                colors={colors}
              />
            }
          />
          <SettingItem
            icon="moon"
            iconColor="#8B5CF6"
            title="🌙 Вечернее"
            onPress={() => settings.eveningReminderEnabled && handleOpenTimePicker("evening")}
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.eveningReminderEnabled}
                onValueChange={(v) => updateSettings({ eveningReminderEnabled: v })}
                colors={colors}
              />
            }
          />
          <SettingItem
            icon="volume-high"
            title="Звуки"
            subtitle="Звуковые эффекты"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.soundEnabled}
                onValueChange={(v) => updateSettings({ soundEnabled: v })}
                colors={colors}
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon="hand-left"
            title="Вибрация"
            subtitle="Тактильная обратная связь"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.hapticFeedback}
                onValueChange={(v) => updateSettings({ hapticFeedback: v })}
                colors={colors}
              />
            }
            showChevron={false}
          />
        </SettingsSection>

        <SettingsSection title="Задачи" colors={colors}>
          <SettingItem
            icon="flag"
            title="Приоритет по умолчанию"
            subtitle={getPriorityLabel(settings.defaultPriority)}
            onPress={() => setShowPriorityPicker(true)}
            colors={colors}
          />
          <SettingItem
            icon="checkmark-done"
            title="Автозавершение"
            subtitle="Автоматически завершать просроченные"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.autoCompleteTasks}
                onValueChange={(v) => updateSettings({ autoCompleteTasks: v })}
                colors={colors}
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon="albums"
            title="Быстрое добавление"
            subtitle="Кнопка быстрого добавления задач"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.quickAddEnabled}
                onValueChange={(v) => updateSettings({ quickAddEnabled: v })}
                colors={colors}
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon="calendar"
            title="Первый день недели"
            subtitle={getFirstDayLabel()}
            onPress={() => {}}
            colors={colors}
          />
        </SettingsSection>

        <SettingsSection title="Подсказки" colors={colors}>
          <SettingItem
            icon="bulb"
            title="Показывать подсказки"
            subtitle="Советы при создании задач"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.showTaskHints}
                onValueChange={(v) => updateSettings({ showTaskHints: v })}
                colors={colors}
              />
            }
            showChevron={false}
          />
        </SettingsSection>

        <SettingsSection title="Данные" colors={colors}>
          <SettingItem
            icon="download"
            title="Экспорт"
            subtitle="Сохранить все данные в файл"
            onPress={handleExport}
            colors={colors}
          />
          <SettingItem
            icon="cloud"
            title="Импорт"
            subtitle="Загрузить данные из файла"
            onPress={() => Alert.alert("Импорт", "Скоро появится")}
            colors={colors}
          />
          <SettingItem
            icon="trash"
            iconColor="#EF4444"
            title="Очистить все данные"
            subtitle="Удалить все задачи и записи"
            onPress={handleClearData}
            colors={colors}
          />
        </SettingsSection>

        <SettingsSection title="О приложении" colors={colors}>
          <SettingItem
            icon="information-circle"
            title="О приложении"
            subtitle="Версия 1.0.0"
            onPress={() =>
              Alert.alert(
                "Progressio",
                "📱 Приложение для управления задачами\n\nВерсия: 1.0.0\n\n© 2024 Progressio",
                [{ text: "OK" }]
              )
            }
            colors={colors}
          />
          <SettingItem
            icon="heart"
            title="Оценка приложения"
            onPress={() => Alert.alert("Спасибо!", "Мы рады, что вам нравится!")}
            colors={colors}
          />
          <SettingItem
            icon="help-circle"
            title="Справка"
            onPress={() => Alert.alert("Справка", "Посетите наш сайт для получения справки")}
            colors={colors}
          />
        </SettingsSection>

        <SettingsSection title="Сброс" colors={colors}>
          <SettingItem
            icon="refresh"
            iconColor="#EF4444"
            title="Сбросить настройки"
            onPress={handleResetSettings}
            colors={colors}
          />
        </SettingsSection>

        <View style={[GlobalStyles.section, styles.statsSection]}>
          <Text style={[styles.sectionTitleText, { color: colors.muted }]}>СТАТИСТИКА</Text>
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="list" size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {storageInfo.tasks}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Задач</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="book" size={24} color="#10B981" />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {storageInfo.diary}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Записей</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="document-text" size={24} color="#F59E0B" />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {storageInfo.notes}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Заметок</Text>
              </View>
            </View>
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.muted }]}>Всего элементов</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {storageInfo.total}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />

        {showTimePicker && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {selectedTimeType === "morning" ? "☀️ Утреннее напоминание" : "🌙 Вечернее напоминание"}
                </Text>
                <DateTimePicker
                  value={getTimeFromString(
                    selectedTimeType === "morning"
                      ? settings.morningReminderTime
                      : settings.eveningReminderTime
                  )}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                  minuteInterval={5}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.border }]}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>Готово</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {showPriorityPicker && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setShowPriorityPicker(false)}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Приоритет по умолчанию</Text>
                {priorities.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityOption, { borderColor: colors.border }]}
                    onPress={() => {
                      updateSettings({ defaultPriority: p });
                      setShowPriorityPicker(false);
                    }}
                  >
                    <Text style={[styles.priorityText, { color: colors.foreground }]}>
                      {getPriorityLabel(p)}
                    </Text>
                    {settings.defaultPriority === p && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border, marginTop: 12 }]}
                  onPress={() => setShowPriorityPicker(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {showThemePicker && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setShowThemePicker(false)}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Тема оформления</Text>
                {themes.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.priorityOption, { borderColor: colors.border }]}
                    onPress={() => {
                      updateSettings({ theme: t });
                      setShowThemePicker(false);
                    }}
                  >
                    <Text style={[styles.priorityText, { color: colors.foreground }]}>
                      {getThemeLabel(t)}
                    </Text>
                    {settings.theme === t && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border, marginTop: 12 }]}
                  onPress={() => setShowThemePicker(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", marginLeft: 16, marginBottom: 8 },
  sectionContent: { marginHorizontal: 16, borderRadius: 16, overflow: "hidden" },
  sectionTitleText: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", marginLeft: 16, marginBottom: 8 },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 12 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: "500" },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statsSection: { paddingHorizontal: 16 },
  statsCard: { borderRadius: 16, padding: 16 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 16, fontWeight: "700" },
  bottomSpacer: { height: 100 },
  daySelector: { flexDirection: "row", gap: 4 },
  dayButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 12, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 20, textAlign: "center" },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 20, width: "100%" },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalButtonText: { fontSize: 16, fontWeight: "600" },
  priorityOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  priorityText: { fontSize: 15, fontWeight: "500" },
});