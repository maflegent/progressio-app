import { Colors } from "@/constants/Colors";
import { AppTheme, useAppTheme, useSettings } from "@/contexts/SettingsContext";
import { useTasks } from "@/contexts/TaskContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Компонент для секции настроек
const SettingsSection: React.FC<{
  title: string;
  children: React.ReactNode;
  colors: any;
}> = ({ title, children, colors }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.muted }]}>{title}</Text>
    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
      {children}
    </View>
  </View>
);

// Компонент для элемента настройки
const SettingItem: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showChevron?: boolean;
  colors: any;
}> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
  showChevron = true,
  colors,
}) => {
  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[styles.settingIcon, { backgroundColor: colors.primary + "20" }]}
      >
        <Ionicons name={icon as any} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        )}
      </View>
    </TouchableOpacity>
  );
};

// Компонент переключателя
const ToggleSwitch: React.FC<{
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: any;
}> = ({ value, onValueChange, colors }) => {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={value ? "#FFFFFF" : colors.muted}
      ios_backgroundColor={colors.border}
    />
  );
};

export default function SettingsScreen() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const { settings, updateSettings, resetSettings } = useSettings();
  const { tasks, clearAllTasks } = useTasks();

  // Получить отображаемое название темы
  const getThemeName = () => {
    switch (settings.theme) {
      case "light":
        return "Светлая";
      case "dark":
        return "Тёмная";
      case "system":
        return "Системная";
      default:
        return "Системная";
    }
  };

  // Получить отображаемое название приоритета
  const getPriorityName = () => {
    switch (settings.defaultPriority) {
      case "urgent":
        return "Срочно";
      case "high":
        return "Высокий";
      case "medium":
        return "Средний";
      case "low":
        return "Низкий";
      default:
        return "Средний";
    }
  };

  // Обработка смены темы
  const handleThemeChange = () => {
    const themes: AppTheme[] = ["system", "light", "dark"];
    const currentIndex = themes.indexOf(settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updateSettings({ theme: nextTheme });
  };

  // Обработка смены приоритета
  const handlePriorityChange = () => {
    const priorities: ("low" | "medium" | "high" | "urgent")[] = [
      "low",
      "medium",
      "high",
      "urgent",
    ];
    const currentIndex = priorities.indexOf(settings.defaultPriority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    updateSettings({ defaultPriority: nextPriority });
  };

  // Сброс настроек
  const handleResetSettings = () => {
    Alert.alert(
      "Сбросить настройки",
      "Вы уверены, что хотите сбросить все настройки до значений по умолчанию?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Сбросить",
          style: "destructive",
          onPress: async () => {
            try {
              await resetSettings();
              Alert.alert("Успешно", "Настройки сброшены");
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось сбросить настройки");
            }
          },
        },
      ],
    );
  };

  // Очистка данных
  const handleClearData = () => {
    Alert.alert(
      "Очистить все данные",
      "Это действие удалит все задачи и данные. Его нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllTasks();
              Alert.alert("Успешно", "Все данные удалены");
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось удалить данные");
            }
          },
        },
      ],
    );
  };

  // Информация о приложении
  const handleAbout = () => {
    Alert.alert(
      "О приложении",
      "Progressio v1.0.0\n\nПриложение для управления задачами и повышения личной эффективности.\n\n© 2024 Progressio Team",
      [{ text: "OK" }],
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Внешний вид */}
        <SettingsSection title="Внешний вид" colors={colors}>
          <SettingItem
            icon="color-palette"
            title="Тема оформления"
            subtitle={getThemeName()}
            onPress={handleThemeChange}
            colors={colors}
            rightComponent={
              <Ionicons name="sync" size={16} color={colors.muted} />
            }
          />
          <SettingItem
            icon="moon"
            title="Показывать выполненные задачи"
            subtitle="Отображать выполненные задачи в списке"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.showCompletedTasks}
                onValueChange={(value) =>
                  updateSettings({ showCompletedTasks: value })
                }
                colors={colors}
              />
            }
            showChevron={false}
          />
        </SettingsSection>

        {/* Уведомления */}
        <SettingsSection title="Уведомления" colors={colors}>
          <SettingItem
            icon="notifications"
            title="Уведомления"
            subtitle="Включить push-уведомления"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.notificationsEnabled}
                onValueChange={(value) =>
                  updateSettings({ notificationsEnabled: value })
                }
                colors={colors}
              />
            }
            showChevron={false}
          />

          {/* Утреннее напоминание */}
          <SettingItem
            icon="sunny"
            title="☀️ Утреннее напоминание"
            subtitle={
              settings.morningReminderEnabled
                ? `В ${settings.morningReminderTime}`
                : "Отключено"
            }
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.morningReminderEnabled}
                onValueChange={(value) =>
                  updateSettings({ morningReminderEnabled: value })
                }
                colors={colors}
              />
            }
            showChevron={false}
          />

          {/* Вечернее напоминание */}
          <SettingItem
            icon="moon"
            title="🌙 Вечернее напоминание"
            subtitle={
              settings.eveningReminderEnabled
                ? `В ${settings.eveningReminderTime}`
                : "Отключено"
            }
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.eveningReminderEnabled}
                onValueChange={(value) =>
                  updateSettings({ eveningReminderEnabled: value })
                }
                colors={colors}
              />
            }
            showChevron={false}
          />

          <SettingItem
            icon="volume-high"
            title="Звуки"
            subtitle="Звуковые эффекты уведомлений"
            colors={colors}
            rightComponent={
              <ToggleSwitch
                value={settings.soundEnabled}
                onValueChange={(value) =>
                  updateSettings({ soundEnabled: value })
                }
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
                onValueChange={(value) =>
                  updateSettings({ hapticFeedback: value })
                }
                colors={colors}
              />
            }
            showChevron={false}
          />
        </SettingsSection>

        {/* Новые задачи */}
        <SettingsSection title="Новые задачи" colors={colors}>
          <SettingItem
            icon="flag"
            title="Приоритет по умолчанию"
            subtitle={getPriorityName()}
            onPress={handlePriorityChange}
            colors={colors}
            rightComponent={
              <Ionicons name="sync" size={16} color={colors.muted} />
            }
          />
        </SettingsSection>

        {/* Данные */}
        <SettingsSection title="Данные" colors={colors}>
          <SettingItem
            icon="download"
            title="Экспорт данных"
            subtitle="Сохранить все задачи в файл"
            onPress={() => {
              Alert.alert("Экспорт", "Функция экспорта в разработке");
            }}
            colors={colors}
          />
          <SettingItem
            icon="download"
            title="Импорт данных"
            subtitle="Загрузить задачи из файла"
            onPress={() => {
              Alert.alert("Импорт", "Функция импорта в разработке");
            }}
            colors={colors}
          />
          <SettingItem
            icon="trash"
            title="Очистить все данные"
            subtitle="Удалить все задачи и заметки"
            onPress={handleClearData}
            colors={colors}
            rightComponent={
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
            }
          />
        </SettingsSection>

        {/* О приложении */}
        <SettingsSection title="О приложении" colors={colors}>
          <SettingItem
            icon="information-circle"
            title="О приложении"
            subtitle="Версия 1.0.0"
            onPress={handleAbout}
            colors={colors}
          />
          <SettingItem
            icon="document-text"
            title="Политика конфиденциальности"
            onPress={() => {
              Alert.alert("Политика конфиденциальности", "В разработке");
            }}
            colors={colors}
          />
          <SettingItem
            icon="help-circle"
            title="Справка и поддержка"
            onPress={() => {
              Alert.alert("Справка", "В разработке");
            }}
            colors={colors}
          />
        </SettingsSection>

        {/* Сброс настроек */}
        <SettingsSection title="Сброс" colors={colors}>
          <SettingItem
            icon="refresh"
            title="Сбросить настройки"
            subtitle="Вернуть настройки по умолчанию"
            onPress={handleResetSettings}
            colors={colors}
            rightComponent={
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
            }
          />
        </SettingsSection>

        {/* Информация о задачах */}
        <View style={styles.statsContainer}>
          <Text style={[styles.statsTitle, { color: colors.foreground }]}>
            Ваши задачи
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {tasks.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>
                Всего
              </Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: "#10B981" }]}>
                {tasks.filter((t) => t.isCompleted).length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>
                Выполнено
              </Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: "#EF4444" }]}>
                {
                  tasks.filter(
                    (t) =>
                      !t.isCompleted &&
                      t.dueDate &&
                      new Date(t.dueDate) < new Date(),
                  ).length
                }
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>
                Просрочено
              </Text>
            </View>
          </View>
        </View>

        {/* Нижний отступ */}
        <View style={styles.bottomSpacer} />
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
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    // backgroundColor удален - устанавливается динамически
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor удален - устанавливается динамически
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statsContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    // backgroundColor удален - устанавливается динамически
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 32,
  },
});
