import { DiaryEntry, Mood } from "@/types";
import { getDatabase } from "../sqlite";

function rowToEntry(row: Record<string, unknown>): DiaryEntry {
  return {
    id: row.id as string,
    date: new Date(row.date as string),
    content: row.content as string,
    mood: row.mood as Mood,
    linkedTasks: JSON.parse((row.linked_tasks as string) || "[]"),
    photoUri: row.photo_uri as string | undefined,
    location: row.location as string | undefined,
    createdAt: new Date(row.created_at as string),
    weather: row.weather as string | undefined,
    sleepHours: row.sleep_hours as number | undefined,
    energyLevel: row.energy_level as number | undefined,
    tags: JSON.parse((row.tags as string) || "[]"),
  };
}

export const DiaryRepository = {
  async getAll(): Promise<DiaryEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM diary_entries ORDER BY date DESC"
    );
    return rows.map(rowToEntry);
  },

  async getById(id: string): Promise<DiaryEntry | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM diary_entries WHERE id = ?",
      [id]
    );
    return row ? rowToEntry(row) : null;
  },

  async getByDateRange(from: Date, to: Date): Promise<DiaryEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM diary_entries WHERE date >= ? AND date <= ? ORDER BY date DESC",
      [from.toISOString(), to.toISOString()]
    );
    return rows.map(rowToEntry);
  },

  async insert(entry: Omit<DiaryEntry, "id" | "createdAt">): Promise<string> {
    const db = await getDatabase();
    const id = Date.now().toString();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO diary_entries (
        id, date, content, mood, linked_tasks, photo_uri,
        location, created_at, weather, sleep_hours,
        energy_level, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entry.date.toISOString(),
        entry.content,
        entry.mood,
        JSON.stringify(entry.linkedTasks || []),
        entry.photoUri || null,
        entry.location || null,
        now,
        entry.weather || null,
        entry.sleepHours || null,
        entry.energyLevel || null,
        JSON.stringify(entry.tags || []),
      ]
    );
    return id;
  },

  async update(id: string, updates: Partial<DiaryEntry>): Promise<boolean> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.date !== undefined) {
      fields.push("date = ?");
      values.push(updates.date.toISOString());
    }
    if (updates.content !== undefined) {
      fields.push("content = ?");
      values.push(updates.content);
    }
    if (updates.mood !== undefined) {
      fields.push("mood = ?");
      values.push(updates.mood);
    }
    if (updates.linkedTasks !== undefined) {
      fields.push("linked_tasks = ?");
      values.push(JSON.stringify(updates.linkedTasks));
    }
    if (updates.photoUri !== undefined) {
      fields.push("photo_uri = ?");
      values.push(updates.photoUri);
    }
    if (updates.location !== undefined) {
      fields.push("location = ?");
      values.push(updates.location);
    }
    if (updates.weather !== undefined) {
      fields.push("weather = ?");
      values.push(updates.weather);
    }
    if (updates.sleepHours !== undefined) {
      fields.push("sleep_hours = ?");
      values.push(updates.sleepHours);
    }
    if (updates.energyLevel !== undefined) {
      fields.push("energy_level = ?");
      values.push(updates.energyLevel);
    }
    if (updates.tags !== undefined) {
      fields.push("tags = ?");
      values.push(JSON.stringify(updates.tags));
    }

    if (fields.length === 0) return false;
    values.push(id);

    await db.runAsync(
      `UPDATE diary_entries SET ${fields.join(", ")} WHERE id = ?`,
      values as any[]
    );
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync("DELETE FROM diary_entries WHERE id = ?", [id]);
    return (result.changes ?? 0) > 0;
  },

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM diary_entries");
  },

  async getMoodStats(period: "week" | "month" | "year"): Promise<{
    moodCounts: Record<string, number>;
    averageMood: number;
    streak: number;
  }> {
    const db = await getDatabase();
    const now = new Date();
    let cutoffDate = new Date();

    if (period === "week") cutoffDate.setDate(now.getDate() - 7);
    else if (period === "month") cutoffDate.setMonth(now.getMonth() - 1);
    else if (period === "year") cutoffDate.setFullYear(now.getFullYear() - 1);

    const rows = await db.getAllAsync<{ mood: string; date: string }>(
      "SELECT mood, date FROM diary_entries WHERE date >= ? ORDER BY date DESC",
      [cutoffDate.toISOString()]
    );

    const moodValues: Record<string, number> = {
      awful: 1,
      bad: 2,
      neutral: 3,
      good: 4,
      awesome: 5,
    };

    const moodCounts: Record<string, number> = {
      awful: 0,
      bad: 0,
      neutral: 0,
      good: 0,
      awesome: 0,
    };

    let totalMoodScore = 0;
    rows.forEach((r) => {
      moodCounts[r.mood]++;
      totalMoodScore += moodValues[r.mood] || 0;
    });

    const averageMood = rows.length > 0 ? totalMoodScore / rows.length : 0;

    let streak = 0;
    const uniqueDates = [...new Set(rows.map((r) => new Date(r.date).toDateString()))];
    if (uniqueDates.length > 0) {
      streak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const prev = new Date(uniqueDates[i + 1]);
        const diffDays = Math.ceil(Math.abs(current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streak++;
        else break;
      }
    }

    return { moodCounts, averageMood, streak };
  },
};
