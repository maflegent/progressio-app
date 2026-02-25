// utils/storage.ts - исправленная версия
import { DiaryEntry, Mood } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DIARY_KEY = "@progressio_diary_entries";

export const diaryStorage = {
  // Сохранить все записи
  async saveEntries(entries: DiaryEntry[]): Promise<void> {
    try {
      const serializedEntries = entries.map((entry) => ({
        ...entry,
        date: entry.date.toISOString(),
        createdAt: entry.createdAt.toISOString(),
      }));
      const jsonValue = JSON.stringify(serializedEntries);
      await AsyncStorage.setItem(DIARY_KEY, jsonValue);
    } catch (error) {
      console.error("Error saving diary entries:", error);
    }
  },

  // Загрузить все записи
  async loadEntries(): Promise<DiaryEntry[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(DIARY_KEY);
      if (!jsonValue) return [];

      const parsedData = JSON.parse(jsonValue);
      return parsedData.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
        createdAt: new Date(entry.createdAt),
      }));
    } catch (error) {
      console.error("Error loading diary entries:", error);
      return [];
    }
  },

  // Добавить новую запись
  async addEntry(entry: Omit<DiaryEntry, "id" | "createdAt">): Promise<string> {
    try {
      const entries = await this.loadEntries();
      const newEntry: DiaryEntry = {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date(),
      };

      entries.push(newEntry);
      await this.saveEntries(entries);
      return newEntry.id;
    } catch (error) {
      console.error("Error adding diary entry:", error);
      throw error;
    }
  },

  // Обновить запись
  async updateEntry(
    id: string,
    updates: Partial<DiaryEntry>,
  ): Promise<boolean> {
    try {
      const entries = await this.loadEntries();
      const index = entries.findIndex((entry) => entry.id === id);

      if (index === -1) return false;

      entries[index] = { ...entries[index], ...updates };
      await this.saveEntries(entries);
      return true;
    } catch (error) {
      console.error("Error updating diary entry:", error);
      return false;
    }
  },

  // Удалить запись
  async deleteEntry(id: string): Promise<boolean> {
    try {
      const entries = await this.loadEntries();
      const filteredEntries = entries.filter((entry) => entry.id !== id);

      if (filteredEntries.length === entries.length) return false;

      await this.saveEntries(filteredEntries);
      return true;
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      return false;
    }
  },

  // Очистить все записи (для тестов)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DIARY_KEY);
    } catch (error) {
      console.error("Error clearing diary entries:", error);
    }
  },

  // Добавлен отсутствующий метод getMoodStats
  async getMoodStats(period: "week" | "month" | "year"): Promise<{
    moodCounts: Record<string, number>;
    averageMood: number;
    streak: number;
  }> {
    try {
      const entries = await this.loadEntries();
      const now = new Date();
      let cutoffDate = new Date();

      if (period === "week") {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (period === "month") {
        cutoffDate.setMonth(now.getMonth() - 1);
      } else if (period === "year") {
        cutoffDate.setFullYear(now.getFullYear() - 1);
      }

      const filteredEntries = entries.filter(
        (entry) => new Date(entry.date) >= cutoffDate,
      );

      const moodCounts: Record<string, number> = {
        awful: 0,
        bad: 0,
        neutral: 0,
        good: 0,
        awesome: 0,
      };

      let totalMoodScore = 0;
      filteredEntries.forEach((entry) => {
        moodCounts[entry.mood]++;
        const moodValues: Record<Mood, number> = {
          awful: 1,
          bad: 2,
          neutral: 3,
          good: 4,
          awesome: 5,
        };
        totalMoodScore += moodValues[entry.mood];
      });

      const averageMood =
        filteredEntries.length > 0
          ? totalMoodScore / filteredEntries.length
          : 0;

      let streak = 0;
      const sortedEntries = filteredEntries
        .map((e) => new Date(e.date).toDateString())
        .reverse();

      if (sortedEntries.length > 0) {
        streak = 1;
        for (let i = 0; i < sortedEntries.length - 1; i++) {
          const current = new Date(sortedEntries[i]);
          const prev = new Date(sortedEntries[i + 1]);
          const diffTime = Math.abs(current.getTime() - prev.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }

      return {
        moodCounts,
        averageMood,
        streak,
      };
    } catch (error) {
      console.error("Error getting mood stats:", error);
      return {
        moodCounts: { awful: 0, bad: 0, neutral: 0, good: 0, awesome: 0 },
        averageMood: 0,
        streak: 0,
      };
    }
  },
};
