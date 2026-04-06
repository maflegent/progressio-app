// utils/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Настройка поведения уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Запрос разрешения на уведомления
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
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
      // Канал для напоминаний о задачах
      await Notifications.setNotificationChannelAsync("task-reminders", {
        name: "Напоминания о задачах",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3B82F6",
      });
      // Канал для утренних напоминаний
      await Notifications.setNotificationChannelAsync("morning-reminders", {
        name: "Утренние напоминания",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#F59E0B",
      });
      // Канал для вечерних напоминаний
      await Notifications.setNotificationChannelAsync("evening-reminders", {
        name: "Вечерние напоминания",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#8B5CF6",
      });
    }

    return true;
  } catch (error) {
    console.warn(
      "Ошибка запроса разрешений уведомлений (может быть в Expo Go):",
      error,
    );
    return false;
  }
}

// Запланировать напоминание о задаче
export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  dueDate: Date,
  reminderMinutesBefore: number = 15,
) {
  try {
    await cancelTaskReminder(taskId);

    const reminderDate = new Date(
      dueDate.getTime() - reminderMinutesBefore * 60 * 1000,
    );

    if (reminderDate < new Date()) {
      return;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Напоминание",
        body: `Задача "${title}" через ${reminderMinutesBefore} мин`,
        data: { taskId, type: "task-reminder" },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    return identifier;
  } catch (error) {
    console.warn(
      "Не удалось запланировать напоминание (может быть в Expo Go):",
      error,
    );
  }
}

// Запланировать утреннее напоминание
export async function scheduleMorningReminder(
  hour: number,
  minute: number,
  activeTasksCount: number = 0,
) {
  try {
    await cancelMorningReminder();

    let bodyText: string;
    if (activeTasksCount === 0) {
      bodyText = "У вас нет активных задач. Отличный день для планирования!";
    } else if (activeTasksCount === 1) {
      bodyText = "У вас 1 активная задача. Начните день продуктивно!";
    } else if (activeTasksCount <= 4) {
      bodyText = `У вас ${activeTasksCount} активные задачи. Начните день продуктивно!`;
    } else {
      bodyText = `У вас ${activeTasksCount} активных задач. Начните день продуктивно!`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "☀️ Доброе утро!",
        body: bodyText,
        data: { type: "morning-reminder" },
        sound: true,
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
    console.warn("Не удалось запланировать утреннее напоминание:", error);
  }
}

// Запланировать вечернее напоминание
export async function scheduleEveningReminder(
  hour: number,
  minute: number,
  activeTasksCount: number = 0,
) {
  try {
    await cancelEveningReminder();

    let bodyText: string;
    if (activeTasksCount === 0) {
      bodyText = "Отлично! Все задачи выполнены. Хорошего вечера!";
    } else if (activeTasksCount === 1) {
      bodyText = "Осталась 1 задача. Проверьте, всё ли готово?";
    } else if (activeTasksCount <= 4) {
      bodyText = `Осталось ${activeTasksCount} задачи. Проверьте, всё ли готово?`;
    } else {
      bodyText = `Осталось ${activeTasksCount} задач. Проверьте, всё ли готово?`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌙 Вечерний чек-лист",
        body: bodyText,
        data: { type: "evening-reminder" },
        sound: true,
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
    console.warn("Не удалось запланировать вечернее напоминание:", error);
  }
}

// Отменить напоминание о задаче
export async function cancelTaskReminder(taskId: string) {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduledNotifications.filter(
      (notif) => notif.content.data?.taskId === taskId,
    );

    await Promise.all(
      taskNotifications.map((notif) =>
        Notifications.cancelScheduledNotificationAsync(notif.identifier),
      ),
    );
  } catch (error) {
    console.warn("Ошибка отмены напоминания о задаче:", error);
  }
}

// Отменить утреннее напоминание
export async function cancelMorningReminder() {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const morningReminders = scheduledNotifications.filter(
      (notif) => notif.content.data?.type === "morning-reminder",
    );

    await Promise.all(
      morningReminders.map((notif) =>
        Notifications.cancelScheduledNotificationAsync(notif.identifier),
      ),
    );
  } catch (error) {
    console.warn("Ошибка отмены утреннего напоминания:", error);
  }
}

// Отменить вечернее напоминание
export async function cancelEveningReminder() {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const eveningReminders = scheduledNotifications.filter(
      (notif) => notif.content.data?.type === "evening-reminder",
    );

    await Promise.all(
      eveningReminders.map((notif) =>
        Notifications.cancelScheduledNotificationAsync(notif.identifier),
      ),
    );
  } catch (error) {
    console.warn("Ошибка отмены вечернего напоминания:", error);
  }
}

// Отменить все напоминания (кроме задач)
export async function cancelAllReminders() {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const appReminders = scheduledNotifications.filter(
      (notif) =>
        notif.content.data?.type === "morning-reminder" ||
        notif.content.data?.type === "evening-reminder",
    );

    await Promise.all(
      appReminders.map((notif) =>
        Notifications.cancelScheduledNotificationAsync(notif.identifier),
      ),
    );
  } catch (error) {
    console.warn("Ошибка отмены всех напоминаний:", error);
  }
}
