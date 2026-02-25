// app/(tabs)/_layout.tsx
import { Colors } from "@/constants/Colors";
import { useAppTheme } from "@/contexts/SettingsContext";
import { Tabs } from "expo-router";
// Для иконок (нужно установить @expo/vector-icons)
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerShown: false, // Скрываем заголовки на всех экранах
      }}
    >
      <Tabs.Screen
        name="index" // Переименуем в tasks позже
        options={{
          title: "Задачи",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "checkbox" : "checkbox-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: "Дневник",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "journal" : "journal-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Заметки",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Аналитика",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Настройки",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
