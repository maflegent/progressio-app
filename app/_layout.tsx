import { ThemedStatusBar } from "@/components/StatusBar";
import { Colors } from "@/constants/Colors";
import { DiaryProvider } from "@/contexts/DiaryContext";
import { FoldersProvider } from "@/contexts/FoldersContext";
import { SettingsProvider, useAppTheme } from "@/contexts/SettingsContext";
import { TagsProvider } from "@/contexts/TagsContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { taskStorage } from "@/utils/taskStorage";
import { migrateFromAsyncStorage } from "@/utils/migration";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";

function ThemedStack() {
  const colorScheme = useAppTheme();
  const [isReady, setIsReady] = useState(false);

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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await migrateFromAsyncStorage();
        await taskStorage.checkAndGenerateRecurringTasks();
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return null;
  }

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
