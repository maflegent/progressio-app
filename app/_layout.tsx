import { ThemedStatusBar } from "@/components/StatusBar";
import { Colors } from "@/constants/Colors";
import { DiaryProvider } from "@/contexts/DiaryContext";
import { FoldersProvider } from "@/contexts/FoldersContext";
import { SettingsProvider, useAppTheme } from "@/contexts/SettingsContext";
import { TagsProvider } from "@/contexts/TagsContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { taskStorage } from "@/utils/taskStorage";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";

function ThemedStack() {
  const colorScheme = useAppTheme();
  const [isReady, setIsReady] = useState(false);

  // Дожидаемся инициализации темы перед рендером
  useEffect(() => {
    setIsReady(true);
  }, [colorScheme]);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <ThemedStatusBar />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerTintColor: Colors[colorScheme].foreground,
          contentStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          animation: "fade",
        }}
      >
        {/* Экран онбординга (приветственный) */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Основные табы приложения */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Экран редактирования задачи (уже добавлен) */}
        <Stack.Screen
          name="task-edit"
          options={{
            title: "Новая задача",
            presentation: "modal",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Проверяем повторяющиеся задачи при запуске приложения
    const initializeApp = async () => {
      try {
        await taskStorage.checkAndGenerateRecurringTasks();
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };

    initializeApp();
  }, []);

  return (
    <SettingsProvider>
      <FoldersProvider>
        <TagsProvider>
          <TaskProvider>
            <DiaryProvider>
              <ThemedStack />
            </DiaryProvider>
          </TaskProvider>
        </TagsProvider>
      </FoldersProvider>
    </SettingsProvider>
  );
}
