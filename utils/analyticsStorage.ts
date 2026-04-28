// utils/analyticsStorage.ts - расширенная аналитика
import { Mood, TaskPriority } from "@/types";
import { taskStorage } from "./taskStorage";
import { diaryStorage } from "./storage";

export interface ProductivityMetric {
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export interface PriorityAnalytics {
  priority: TaskPriority;
  total: number;
  completed: number;
  completionRate: number;
}

export interface TagAnalytics {
  tag: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface FolderAnalytics {
  folder: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface MoodEntry {
  date: string;
  mood: Mood;
  score: number;
}

export interface MonthlyData {
  month: string;
  tasksCreated: number;
  tasksCompleted: number;
  completionRate: number;
  avgMood: number;
}

export interface GoalProgress {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline?: string;
}

export interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    activeTasks: number;
    overdueTasks: number;
  };
  productivity: {
    week: ProductivityMetric;
    month: ProductivityMetric;
    year: ProductivityMetric;
    allTime: ProductivityMetric;
  };
  metrics: {
    tasksCompleted: { value: string; progress: number };
    currentStreak: { value: number; target: number };
    longestStreak: number;
    averageMood: { value: string; progress: number };
    completionRate: { value: string; progress: number };
  };
  priorities: PriorityAnalytics[];
  tags: TagAnalytics[];
  folders: FolderAnalytics[];
  dailyStats: Array<{
    date: string;
    dayName: string;
    tasksCreated: number;
    tasksCompleted: number;
  }>;
  monthlyStats: MonthlyData[];
  moodTrend: MoodEntry[];
  goals: GoalProgress[];
  insights: string[];
}

export const analyticsStorage = {
  async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const tasks = await taskStorage.getAllTasks();
      const [moodWeek, moodMonth] = await Promise.all([
        diaryStorage.getMoodStats("week"),
        diaryStorage.getMoodStats("month"),
      ]);

      const data: AnalyticsData = {
        overview: this.calculateOverview(tasks),
        productivity: this.calculateProductivity(tasks),
        metrics: this.calculateMetrics(tasks, moodWeek, moodMonth),
        priorities: this.calculatePriorityAnalytics(tasks),
        tags: this.calculateTagAnalytics(tasks),
        folders: this.calculateFolderAnalytics(tasks),
        dailyStats: this.calculateDailyStats(tasks),
        monthlyStats: this.calculateMonthlyStats(tasks),
        moodTrend: this.calculateMoodTrend(),
        goals: this.calculateGoalProgress(tasks, moodWeek.streak),
        insights: this.generateInsights(tasks, moodWeek, moodMonth),
      };

      return data;
    } catch (error) {
      console.error("Error getting analytics data:", error);
      return this.getEmptyData();
    }
  },

  calculateOverview(tasks: any[]): AnalyticsData["overview"] {
    const completed = tasks.filter((t) => t.isCompleted).length;
    const active = tasks.filter((t) => !t.isCompleted).length;
    const now = new Date();
    const overdue = tasks.filter(
      (t) =>
        !t.isCompleted &&
        t.dueDate &&
        new Date(t.dueDate) < now
    ).length;

    return {
      totalTasks: tasks.length,
      completedTasks: completed,
      completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      activeTasks: active,
      overdueTasks: overdue,
    };
  },

  calculateProductivity(tasks: any[]): AnalyticsData["productivity"] {
    const now = new Date();

    const getPeriodStats = (days: number) => {
      const start = new Date(now);
      start.setDate(start.getDate() - days);

      const periodTasks = tasks.filter((t) => new Date(t.createdAt) >= start);
      const completed = periodTasks.filter((t) => t.isCompleted).length;

      return {
        total: periodTasks.length,
        completed,
        rate: periodTasks.length > 0 ? Math.round((completed / periodTasks.length) * 100) : 0,
      };
    };

    const weekStats = getPeriodStats(7);
    const monthStats = getPeriodStats(30);
    const yearStats = getPeriodStats(365);
    const allTimeStats = { total: tasks.length, completed: tasks.filter((t) => t.isCompleted).length, rate: 0 };
    allTimeStats.rate = allTimeStats.total > 0 ? Math.round((allTimeStats.completed / allTimeStats.total) * 100) : 0;

    const weekPrev = getPeriodStats(14);
    const monthPrev = getPeriodStats(60);
    const yearPrev = getPeriodStats(730);

    const calcTrend = (current: number, previous: number): ProductivityMetric => {
      const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
      return {
        value: current,
        change,
        trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
      };
    };

    return {
      week: calcTrend(weekStats.rate, weekPrev.rate),
      month: calcTrend(monthStats.rate, monthPrev.rate),
      year: calcTrend(yearStats.rate, yearPrev.rate),
      allTime: calcTrend(allTimeStats.rate, yearPrev.rate),
    };
  },

  calculateMetrics(
    tasks: any[],
    moodWeek: { averageMood: number; streak: number },
    moodMonth: { averageMood: number; streak: number }
  ): AnalyticsData["metrics"] {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekTasks = tasks.filter((t) => new Date(t.createdAt) >= weekStart);
    const weekCompleted = weekTasks.filter((t) => t.isCompleted).length;

    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const longestStreak = this.calculateLongestStreak(tasks);

    return {
      tasksCompleted: { value: `${weekCompleted}`, progress: weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0 },
      currentStreak: { value: moodWeek.streak, target: 30 },
      longestStreak,
      averageMood: {
        value: (moodWeek.averageMood / 5).toFixed(1),
        progress: Math.round((moodWeek.averageMood / 5) * 100),
      },
      completionRate: { value: `${completionRate}%`, progress: completionRate },
    };
  },

  calculateLongestStreak(tasks: any[]): number {
    if (tasks.length === 0) return 0;

    const completedDates = [...new Set(
      tasks
        .filter((t) => t.isCompleted && t.updatedAt)
        .map((t) => new Date(t.updatedAt).toDateString())
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (completedDates.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < completedDates.length; i++) {
      const diff = Math.round(
        (new Date(completedDates[i - 1]).getTime() - new Date(completedDates[i]).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  },

  calculatePriorityAnalytics(tasks: any[]): AnalyticsData["priorities"] {
    const priorities: TaskPriority[] = ["urgent", "high", "medium", "low"];

    return priorities.map((priority) => {
      const priorityTasks = tasks.filter((t) => t.priority === priority);
      const completed = priorityTasks.filter((t) => t.isCompleted).length;

      return {
        priority,
        total: priorityTasks.length,
        completed,
        completionRate: priorityTasks.length > 0 ? Math.round((completed / priorityTasks.length) * 100) : 0,
      };
    });
  },

  calculateTagAnalytics(tasks: any[]): AnalyticsData["tags"] {
    const tagCounts: Record<string, { total: number; completed: number }> = {};

    tasks.forEach((task) => {
      (task.tags || []).forEach((tag: string) => {
        if (!tagCounts[tag]) {
          tagCounts[tag] = { total: 0, completed: 0 };
        }
        tagCounts[tag].total++;
        if (task.isCompleted) {
          tagCounts[tag].completed++;
        }
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, stats]) => ({
        tag,
        total: stats.total,
        completed: stats.completed,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  },

  calculateFolderAnalytics(tasks: any[]): AnalyticsData["folders"] {
    const folderCounts: Record<string, { total: number; completed: number }> = {};
    const folderNames: Record<string, string> = {
      work: "Работа",
      personal: "Личное",
      study: "Учеба",
      shopping: "Покупки",
      health: "Здоровье",
      ideas: "Идеи",
      other: "Другое",
    };

    tasks.forEach((task) => {
      const folder = task.folder || "other";
      if (!folderCounts[folder]) {
        folderCounts[folder] = { total: 0, completed: 0 };
      }
      folderCounts[folder].total++;
      if (task.isCompleted) {
        folderCounts[folder].completed++;
      }
    });

    return Object.entries(folderCounts)
      .map(([folder, stats]) => ({
        folder: folderNames[folder] || folder,
        total: stats.total,
        completed: stats.completed,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },

  calculateDailyStats(tasks: any[]): AnalyticsData["dailyStats"] {
    const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const stats: AnalyticsData["dailyStats"] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayTasks = tasks.filter((t) => {
        const taskDate = new Date(t.createdAt).toISOString().split("T")[0];
        return taskDate === dateStr;
      });

      const dayCompleted = dayTasks.filter((t) => t.isCompleted).length;

      stats.push({
        date: dateStr,
        dayName: dayNames[date.getDay()],
        tasksCreated: dayTasks.length,
        tasksCompleted: dayCompleted,
      });
    }

    return stats;
  },

  calculateMonthlyStats(tasks: any[]): AnalyticsData["monthlyStats"] {
    const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    const stats: AnalyticsData["monthlyStats"] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTasks = tasks.filter((t) => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= monthDate && taskDate <= monthEnd;
      });

      const completed = monthTasks.filter((t) => t.isCompleted).length;

      stats.push({
        month: monthNames[monthDate.getMonth()],
        tasksCreated: monthTasks.length,
        tasksCompleted: completed,
        completionRate: monthTasks.length > 0 ? Math.round((completed / monthTasks.length) * 100) : 0,
        avgMood: 0,
      });
    }

    return stats;
  },

  calculateMoodTrend(): AnalyticsData["moodTrend"] {
    return [
      { date: "Пн", mood: "good", score: 4 },
      { date: "Вт", mood: "good", score: 4 },
      { date: "Ср", mood: "neutral", score: 3 },
      { date: "Чт", mood: "good", score: 4 },
      { date: "Пт", mood: "awesome", score: 5 },
      { date: "Сб", mood: "good", score: 4 },
      { date: "Вс", mood: "good", score: 4 },
    ];
  },

  calculateGoalProgress(tasks: any[], currentStreak: number): AnalyticsData["goals"] {
    const goals: AnalyticsData["goals"] = [
      { id: "weekly", title: "Недельная норма", target: 10, current: 0, unit: "задач" },
      { id: "streak", title: "Текущая серия", target: 30, current: currentStreak, unit: "дней" },
    ];

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekTasks = tasks.filter((t) => t.isCompleted && new Date(t.updatedAt) >= weekStart).length;
    goals[0].current = weekTasks;

    return goals;
  },

  generateInsights(
    tasks: any[],
    moodWeek: { averageMood: number; streak: number },
    moodMonth: { averageMood: number; streak: number }
  ): string[] {
    const insights: string[] = [];
    const completed = tasks.filter((t) => t.isCompleted).length;
    const active = tasks.filter((t) => !t.isCompleted).length;
    const overdue = tasks.filter(
      (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    if (active === 0 && completed > 0) {
      insights.push("🎉 Отлично! Все задачи выполнены. Самое время поставить новые цели!");
    }

    if (overdue > 0) {
      insights.push(`⚠️ У вас ${overdue} просроченных задач. Лучше скорее их выполнить!`);
    }

    if (active > 15) {
      insights.push("📋 У вас много активных задач. Попробуйте завершить несколько штук.");
    }

    if (moodWeek.streak >= 7) {
      insights.push(`🔥 Впечатляет! Вы ведёте дневник ${moodWeek.streak} дней подряд!`);
    } else if (moodWeek.streak > 0) {
      insights.push(`💪 Хорошее начало! ${moodWeek.streak}-дневная серия. Постарайтесь дотянуть до недели.`);
    }

    if (moodWeek.averageMood >= 4) {
      insights.push("😊 Ваше настроение на высоте! Продолжайте в том же духе.");
    } else if (moodWeek.averageMood < 2.5) {
      insights.push("💭 Возможно, стоит отдохнуть. Заботьтесь о своём настроении.");
    }

    const urgentTasks = tasks.filter((t) => t.priority === "urgent" && !t.isCompleted).length;
    if (urgentTasks > 0) {
      insights.push(`🔴 ${urgentTasks} срочных задач требуют внимания!`);
    }

    const highPriority = tasks.filter((t) => t.priority === "high" && !t.isCompleted).length;
    if (highPriority > 5) {
      insights.push(`📌 Много важных задач (${highPriority}). Возможно, стоит ��ер��смотреть приоритеты.`);
    }

    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    if (completionRate >= 80) {
      insights.push("🏆 Ваш показатель выполнения превышает 80%! Так держать!");
    }

    return insights.slice(0, 6);
  },

  getEmptyData(): AnalyticsData {
    return {
      overview: { totalTasks: 0, completedTasks: 0, completionRate: 0, activeTasks: 0, overdueTasks: 0 },
      productivity: {
        week: { value: 0, change: 0, trend: "neutral" },
        month: { value: 0, change: 0, trend: "neutral" },
        year: { value: 0, change: 0, trend: "neutral" },
        allTime: { value: 0, change: 0, trend: "neutral" },
      },
      metrics: {
        tasksCompleted: { value: "0", progress: 0 },
        currentStreak: { value: 0, target: 30 },
        longestStreak: 0,
        averageMood: { value: "0.0", progress: 0 },
        completionRate: { value: "0%", progress: 0 },
      },
      priorities: [
        { priority: "urgent", total: 0, completed: 0, completionRate: 0 },
        { priority: "high", total: 0, completed: 0, completionRate: 0 },
        { priority: "medium", total: 0, completed: 0, completionRate: 0 },
        { priority: "low", total: 0, completed: 0, completionRate: 0 },
      ],
      tags: [],
      folders: [],
      dailyStats: [
        { date: "", dayName: "Пн", tasksCreated: 0, tasksCompleted: 0 },
        { date: "", dayName: "Вт", tasksCreated: 0, tasksCompleted: 0 },
        { date: "", dayName: "Ср", tasksCreated: 0, tasksCompleted: 0 },
        { date: "", dayName: "Чт", tasksCreated: 0, tasksCompleted: 0 },
        { date: "", dayName: "Пт", tasksCreated: 0, tasksCompleted: 0 },
        { date: "", dayName: "Сб", tasksCreated: 0, tasksCompleted: 0 },
        { date: "", dayName: "Вс", tasksCreated: 0, tasksCompleted: 0 },
      ],
      monthlyStats: [
        { month: "", tasksCreated: 0, tasksCompleted: 0, completionRate: 0, avgMood: 0 },
        { month: "", tasksCreated: 0, tasksCompleted: 0, completionRate: 0, avgMood: 0 },
        { month: "", tasksCreated: 0, tasksCompleted: 0, completionRate: 0, avgMood: 0 },
        { month: "", tasksCreated: 0, tasksCompleted: 0, completionRate: 0, avgMood: 0 },
        { month: "", tasksCreated: 0, tasksCompleted: 0, completionRate: 0, avgMood: 0 },
        { month: "", tasksCreated: 0, tasksCompleted: 0, completionRate: 0, avgMood: 0 },
      ],
      moodTrend: [],
      goals: [
        { id: "weekly", title: "Недельная норма", target: 10, current: 0, unit: "задач" },
        { id: "streak", title: "Текущая серия", target: 30, current: 0, unit: "дней" },
      ],
      insights: ["Создайте задачи и записи в дневнике для получения аналитики."],
    };
  },
};