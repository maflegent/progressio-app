import { getDatabase } from "../sqlite";

export const TagRepository = {
  async getAll(): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM custom_tags ORDER BY name"
    );
    return rows.map((r) => r.name);
  },

  async insert(name: string): Promise<void> {
    const db = await getDatabase();
    const id = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await db.runAsync(
      "INSERT OR IGNORE INTO custom_tags (id, name) VALUES (?, ?)",
      [id, name]
    );
  },

  async delete(name: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync("DELETE FROM custom_tags WHERE name = ?", [name]);
    return (result.changes ?? 0) > 0;
  },

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM custom_tags");
  },
};
