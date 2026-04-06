import {
  cancelDailyReminder,
  requestNotificationPermissions,
  scheduleDailyReminder,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type AppTheme = "light" | "dark" | "system";

interface Settings {
  theme: AppTheme;
  notificationsEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // HH:mm format
  soundEnabled: boolean;
  hapticFeedback: boolean;
  showCompletedTasks: boolean;
  defaultPriority: "low" | "medium" | "high" | "urgent";
  language: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SETTINGS_KEY = "@progressio_settings";

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  notificationsEnabled: true,
  dailyReminderEnabled: false,
  dailyReminderTime: "09:00",
  soundEnabled: true,
  hapticFeedback: true,
  showCompletedTasks: true,
  defaultPriority: "medium",
  language: "ru",
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const systemScheme = useColorScheme();

  // Загрузка настроек при запуске
  useEffect(() => {
    loadSettings();
  }, []);

  // Управление ежедневным напоминанием
  useEffect(() => {
    if (!isLoading) {
      manageDailyReminder();
    }
  }, [
    settings.dailyReminderEnabled,
    settings.dailyReminderTime,
    settings.notificationsEnabled,
    isLoading,
  ]);

  const manageDailyReminder = async () => {
    try {
      if (settings.dailyReminderEnabled && settings.notificationsEnabled) {
        const [hour, minute] = settings.dailyReminderTime
          .split(":")
          .map(Number);
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await scheduleDailyReminder(hour, minute);
        }
      } else {
        await cancelDailyReminder();
      }
    } catch (error) {
      console.warn(
        "Ошибка управления ежедневным напоминанием (может быть в Expo Go):",
        error,
      );
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      // Запрос разрешения при включении уведомлений
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
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  };

  const resetSettings = async () => {
    try {
      await cancelDailyReminder();
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(DEFAULT_SETTINGS),
      );
    } catch (error) {
      console.error("Error resetting settings:", error);
      throw error;
    }
  };

  if (isLoading) {
    return null; // Или можно вернуть загрузочный индикатор
  }

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings }}
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

// Хук для получения активной темы с учётом настроек
export function useAppTheme() {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();

  const getActiveTheme = (): "light" | "dark" => {
    if (settings.theme === "system") {
      return systemScheme || "light";
    }
    return settings.theme;
  };

  return getActiveTheme();
}
