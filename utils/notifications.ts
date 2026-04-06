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
