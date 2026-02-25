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

// Проверка поддержки уведомлений
export function areNotificationsSupported(): boolean {
  return true;
}

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
      await Notifications.setNotificationChannelAsync("task-reminders", {
        name: "Напоминания о задачах",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3B82F6",
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
        title: "Напоминание о задаче",
        body: `Задача "${title}" должна быть выполнена через ${reminderMinutesBefore} минут`,
        data: { taskId },
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

// Запланировать ежедневное напоминание
export async function scheduleDailyReminder(hour: number, minute: number) {
  try {
    await cancelDailyReminder();

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Ежедневное напоминание",
        body: "Проверьте свои задачи на сегодня!",
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

    return identifier;
  } catch (error) {
    console.warn(
      "Не удалось запланировать ежедневное напоминание (может быть в Expo Go):",
      error,
    );
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

// Отменить ежедневное напоминание
export async function cancelDailyReminder() {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const dailyReminders = scheduledNotifications.filter(
      (notif) => notif.content.title === "Ежедневное напоминание",
    );

    await Promise.all(
      dailyReminders.map((notif) =>
        Notifications.cancelScheduledNotificationAsync(notif.identifier),
      ),
    );
  } catch (error) {
    console.warn("Ошибка отмены ежедневного напоминания:", error);
  }
}

// Отменить все напоминания
export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("Ошибка отмены всех напоминаний:", error);
  }
}

// Получить все запланированные уведомления
export async function getScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("Ошибка получения запланированных уведомлений:", error);
    return [];
  }
}

// Добавить слушатель уведомлений
export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void,
) {
  try {
    return Notifications.addNotificationReceivedListener(callback);
  } catch (error) {
    console.warn("Ошибка добавления слушателя уведомлений:", error);
    return { remove: () => {} };
  }
}

// Добавить слушатель ответа на уведомление
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  try {
    return Notifications.addNotificationResponseReceivedListener(callback);
  } catch (error) {
    console.warn("Ошибка добавления слушателя ответов:", error);
    return { remove: () => {} };
  }
}
