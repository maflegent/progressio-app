import { getDatabase } from "../sqlite";

export interface CustomFolderRow {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const FolderRepository = {
  async getAll(): Promise<CustomFolderRow[]> {
    const db = await getDatabase();
    return await db.getAllAsync<CustomFolderRow>(
      "SELECT * FROM custom_folders ORDER BY label"
    );
  },

  async insert(folder: Omit<CustomFolderRow, "id">): Promise<string> {
    const db = await getDatabase();
    const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    await db.runAsync(
      "INSERT INTO custom_folders (id, label, icon, color) VALUES (?, ?, ?, ?)",
      [id, folder.label, folder.icon, folder.color]
    );
    return id;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync("DELETE FROM custom_folders WHERE id = ?", [id]);
    return (result.changes ?? 0) > 0;
  },

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM custom_folders");
  },
};
