import { getDatabase } from "../sqlite";

export interface UserPrefsRow {
  theme: string;
  language: string;
  task_reminders: number;
  daily_digest: number;
  weekly_review: number;
  default_task_priority: string;
  working_hours_start: string;
  working_hours_end: string;
  app_state: string;
}

export const PreferencesRepository = {
  async get(): Promise<UserPrefsRow> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<UserPrefsRow>(
      "SELECT * FROM user_preferences WHERE id = 'default'"
    );
    if (!row) {
      await this.reset();
      return this.get();
    }
    return row;
  },

  async update(updates: Partial<UserPrefsRow>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, val] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }

    if (fields.length === 0) return;
    values.push("default");

    await db.runAsync(
      `UPDATE user_preferences SET ${fields.join(", ")} WHERE id = ?`,
      values as any[]
    );
  },

  async reset(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO user_preferences (
        id, theme, language, task_reminders, daily_digest,
        weekly_review, default_task_priority,
        working_hours_start, working_hours_end, app_state
      ) VALUES ('default', 'system', 'ru', 1, 0, 0, 'medium', '09:00', '18:00', '{}')`
    );
  },
};
