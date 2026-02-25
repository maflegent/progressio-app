import { useAppTheme } from "@/contexts/SettingsContext";

// Экспортируем хук, который использует настройки приложения вместо системной темы
export function useColorScheme() {
  return useAppTheme();
}
