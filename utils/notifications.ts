// utils/notifications.ts - расширенная система уведомлений
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Task } from "@/types";

export type NotificationCategory =
  | "task-reminder"
  | "morning-reminder"
  | "evening-reminder"
  | "overdue-alert"
  | "diary-reminder";

export interface NotificationPreferences {
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  banner: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  sound: true,
  vibration: true,
  badge: true,
  banner: true,
};

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as any;
    
    switch (data?.type) {
      case "task-reminder":
        return {
          shouldShowAlert: true,
          shouldPlaySound: DEFAULT_PREFS.sound,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      case "overdue-alert":
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      default:
        return {
          shouldShowAlert: true,
          shouldPlaySound: DEFAULT_PREFS.sound,
          shouldSetBadge: DEFAULT_PREFS.badge,
          shouldShowBanner: DEFAULT_PREFS.banner,
          shouldShowList: true,
        };
    }
  },
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Разрешение на уведомления не получено");
      return false;
    }

    if (Platform.OS === "android") {
      await setupNotificationChannels();
    }

    return true;
  } catch (error) {
    console.warn("Ошибка запроса разрешений:", error);
    return false;
  }
}

async function setupNotificationChannels() {
  try {
    await Notifications.setNotificationChannelAsync("task-reminders", {
      name: "Напоминания о задачах",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3B82F6",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("morning-reminders", {
      name: "Утренние напоминания",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F59E0B",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("evening-reminders", {
      name: "Вечерние напоминания",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#8B5CF6",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("overdue-alerts", {
      name: "Просроченные задачи",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#EF4444",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("diary-reminders", {
      name: "Напоминания о дневнике",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#10B981",
      sound: "default",
    });
  } catch (error) {
    console.warn("Ошибка настройки каналов:", error);
  }
}

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  dueDate: Date | undefined,
  reminderMinutesBefore: number = 15,
): Promise<string | null> {
  if (!dueDate) return null;

  try {
    await cancelTaskReminder(taskId);

    const reminderDate = new Date(dueDate.getTime() - reminderMinutesBefore * 60 * 1000);

    if (reminderDate <= new Date()) {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Напоминание о задаче",
        body: `${title} через ${reminderMinutesBefore} мин`,
        data: { taskId, type: "task-reminder" },
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    return identifier;
  } catch (error) {
    console.warn("Ошибка планирования напоминания:", error);
    return null;
  }
}

export async function scheduleOverdueAlert(taskId: string, title: string): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ Задача просрочена!",
        body: `${title} - пора выполнить!`,
        data: { taskId, type: "overdue-alert" },
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });

    return identifier;
  } catch (error) {
    console.warn("Ошибка отправки уведомления:", error);
    return null;
  }
}

export async function scheduleMorningReminder(
  hour: number,
  minute: number,
  activeTasksCount: number = 0,
) {
  try {
    await cancelMorningReminder();

    const bodyText = getMorningMessage(activeTasksCount);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "☀️ Доброе утро!",
        body: bodyText,
        data: { type: "morning-reminder" },
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  } catch (error) {
    console.warn("Ошибка утреннего напоминания:", error);
  }
}

export async function scheduleEveningReminder(
  hour: number,
  minute: number,
  activeTasksCount: number = 0,
) {
  try {
    await cancelEveningReminder();

    const bodyText = getEveningMessage(activeTasksCount);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌙 Вечерний чек-лист",
        body: bodyText,
        data: { type: "evening-reminder" },
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  } catch (error) {
    console.warn("Ошибка вечернего напоминания:", error);
  }
}

export async function scheduleDiaryReminder(
  hour: number,
  minute: number,
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📝 Как прошёл день?",
        body: "Запишите своё настроение в дневнике",
        data: { type: "diary-reminder" },
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  } catch (error) {
    console.warn("Ошибка напоминания о дневнике:", error);
  }
}

function getMorningMessage(taskCount: number): string {
  if (taskCount === 0) {
    return "У вас нет активных задач. Отличный день для планирования!";
  } else if (taskCount === 1) {
    return "У вас 1 активная задача. Начните день продуктивно!";
  } else if (taskCount <= 4) {
    return `У вас ${taskCount} активные задачи. Начните день продуктивно!`;
  } else {
    return `У вас ${taskCount} активных задач. Начните день продуктивно!`;
  }
}

function getEveningMessage(taskCount: number): string {
  if (taskCount === 0) {
    return "Отлично! Все задачи выполнены. Хорошего вечера!";
  } else if (taskCount === 1) {
    return "Осталась 1 задача. Проверьте, всё ли готово?";
  } else if (taskCount <= 4) {
    return `Осталось ${taskCount} задачи. Проверьте, всё ли готово?`;
  } else {
    return `Осталось ${taskCount} задач. Проверьте, всё ли готово?`;
  }
}

export async function cancelTaskReminder(taskId: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduled.filter(
      (n) => n.content.data?.taskId === taskId,
    );

    await Promise.all(
      taskNotifications.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
    );
  } catch (error) {
    console.warn("Ошибка отмены:", error);
  }
}

export async function cancelMorningReminder() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const morningReminders = scheduled.filter(
      (n) => n.content.data?.type === "morning-reminder",
    );

    await Promise.all(
      morningReminders.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
    );
  } catch (error) {
    console.warn("Ошибка отмены:", error);
  }
}

export async function cancelEveningReminder() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const eveningReminders = scheduled.filter(
      (n) => n.content.data?.type === "evening-reminder",
    );

    await Promise.all(
      eveningReminders.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
    );
  } catch (error) {
    console.warn("Ошибка отмены:", error);
  }
}

export async function cancelAllReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const appReminders = scheduled.filter(
      (n) =>
        n.content.data?.type === "morning-reminder" ||
        n.content.data?.type === "evening-reminder" ||
        n.content.data?.type === "diary-reminder",
    );

    await Promise.all(
      appReminders.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
    );
  } catch (error) {
    console.warn("Ошибка отмены:", error);
  }
}

export async function scheduleNotificationsForTasks(tasks: Task[]): Promise<void> {
  try {
    const activeTasks = tasks.filter((t) => !t.isCompleted && t.dueDate);

    for (const task of activeTasks) {
      if (task.dueDate && task.reminderDate) {
        await scheduleTaskReminder(
          task.id,
          task.title,
          new Date(task.dueDate),
          15,
        );
      }
    }
  } catch (error) {
    console.warn("Ошибка планирования уведомлений:", error);
  }
}

export async function checkAndNotifyOverdue(tasks: Task[]): Promise<void> {
  try {
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now,
    );

    if (overdueTasks.length > 0 && overdueTasks.length <= 3) {
      for (const task of overdueTasks) {
        await scheduleOverdueAlert(task.id, task.title);
      }
    }
  } catch (error) {
    console.warn("Ошибка проверки просроченных:", error);
  }
}

export async function getNotificationStatus(): Promise<{
  permissions: string;
  scheduled: number;
}> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    return {
      permissions: status,
      scheduled: scheduled.length,
    };
  } catch (error) {
    return { permissions: "unknown", scheduled: 0 };
  }
}