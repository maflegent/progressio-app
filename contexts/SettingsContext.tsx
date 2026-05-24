import {
  cancelAllReminders,
  cancelEveningReminder,
  cancelMorningReminder,
  requestNotificationPermissions,
  scheduleEveningReminder,
  scheduleMorningReminder,
} from "@/utils/notifications";
import { PreferencesRepository } from "@/utils/repositories/PreferencesRepository";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type AppTheme = "light" | "dark" | "system";

interface Settings {
  theme: AppTheme;
  notificationsEnabled: boolean;
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;
  soundEnabled: boolean;
  hapticFeedback: boolean;
  showCompletedTasks: boolean;
  defaultPriority: "low" | "medium" | "high" | "urgent";
  language: string;
  autoCompleteTasks: boolean;
  autoDeleteCompletedDays: number;
  quickAddEnabled: boolean;
  showTaskHints: boolean;
  compactView: boolean;
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  updateRemindersWithTaskCount: (activeTasksCount: number) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  notificationsEnabled: true,
  morningReminderEnabled: true,
  morningReminderTime: "08:00",
  eveningReminderEnabled: true,
  eveningReminderTime: "20:00",
  soundEnabled: true,
  hapticFeedback: true,
  showCompletedTasks: true,
  defaultPriority: "medium",
  language: "ru",
  autoCompleteTasks: false,
  autoDeleteCompletedDays: 30,
  quickAddEnabled: true,
  showTaskHints: true,
  compactView: false,
  firstDayOfWeek: 1,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      manageReminders();
    }
  }, [
    settings.morningReminderEnabled,
    settings.morningReminderTime,
    settings.eveningReminderEnabled,
    settings.eveningReminderTime,
    settings.notificationsEnabled,
    isLoading,
  ]);

  const manageReminders = async () => {
    try {
      if (!settings.notificationsEnabled) {
        await cancelAllReminders();
        return;
      }

      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) return;

      if (settings.morningReminderEnabled) {
        const [morningHour, morningMinute] = settings.morningReminderTime
          .split(":")
          .map(Number);
        await scheduleMorningReminder(morningHour, morningMinute);
      } else {
        await cancelMorningReminder();
      }

      if (settings.eveningReminderEnabled) {
        const [eveningHour, eveningMinute] = settings.eveningReminderTime
          .split(":")
          .map(Number);
        await scheduleEveningReminder(eveningHour, eveningMinute);
      } else {
        await cancelEveningReminder();
      }
    } catch (error) {
      console.warn(
        "Ошибка управления напоминаниями (может быть в Expo Go):",
        error,
      );
    }
  };

  const loadSettings = async () => {
    try {
      const row = await PreferencesRepository.get();
      setSettings({
        ...DEFAULT_SETTINGS,
        theme: (row.theme as AppTheme) || "system",
        language: row.language || "ru",
        notificationsEnabled: Boolean(row.task_reminders),
        morningReminderEnabled: Boolean(row.task_reminders),
        eveningReminderEnabled: Boolean(row.weekly_review),
        defaultPriority: (row.default_task_priority as any) || "medium",
      });
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      if (
        updates.notificationsEnabled === true &&
        !settings.notificationsEnabled
      ) {
        try {
          await requestNotificationPermissions();
        } catch (error) {
          console.error("Ошибка запроса разрешения:", error);
        }
      }

      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);

      await PreferencesRepository.update({
        theme: updates.theme || settings.theme,
        language: updates.language || settings.language,
        task_reminders: updates.notificationsEnabled !== undefined ? (updates.notificationsEnabled ? 1 : 0) : settings.notificationsEnabled ? 1 : 0,
        default_task_priority: updates.defaultPriority || settings.defaultPriority,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  };

  const resetSettings = async () => {
    try {
      await cancelAllReminders();
      await PreferencesRepository.reset();
      setSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error("Error resetting settings:", error);
      throw error;
    }
  };

  const updateRemindersWithTaskCount = async (activeTasksCount: number) => {
    try {
      if (!settings.notificationsEnabled) return;

      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) return;

      if (settings.morningReminderEnabled) {
        const [morningHour, morningMinute] = settings.morningReminderTime
          .split(":")
          .map(Number);
        await scheduleMorningReminder(morningHour, morningMinute, activeTasksCount);
      }

      if (settings.eveningReminderEnabled) {
        const [eveningHour, eveningMinute] = settings.eveningReminderTime
          .split(":")
          .map(Number);
        await scheduleEveningReminder(eveningHour, eveningMinute, activeTasksCount);
      }
    } catch (error) {
      console.warn("Ошибка обновления напоминаний:", error);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateRemindersWithTaskCount,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export function useAppTheme() {
  const { settings } = useSettings();
  const systemColorScheme = useColorScheme();

  const getActiveTheme = (): "light" | "dark" => {
    if (settings.theme === "system") {
      return systemColorScheme || "light";
    }
    return settings.theme;
  };

  return getActiveTheme();
}
