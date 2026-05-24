import { Note } from "@/types";
import { getDatabase } from "../sqlite";

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    linkedTasks: JSON.parse((row.linked_tasks as string) || "[]"),
    files: JSON.parse((row.files as string) || "[]"),
    folder: row.folder as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    isPinned: Boolean(row.is_pinned),
    color: row.color as string | undefined,
  };
}

export const NoteRepository = {
  async getAll(): Promise<Note[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC"
    );
    return rows.map(rowToNote);
  },

  async getById(id: string): Promise<Note | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM notes WHERE id = ?",
      [id]
    );
    return row ? rowToNote(row) : null;
  },

  async insert(note: Omit<Note, "createdAt" | "updatedAt">): Promise<string> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO notes (
        id, title, content, linked_tasks, files, folder,
        created_at, updated_at, is_pinned, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        note.id,
        note.title,
        note.content,
        JSON.stringify(note.linkedTasks || []),
        JSON.stringify(note.files || []),
        note.folder || null,
        now,
        now,
        note.isPinned ? 1 : 0,
        note.color || null,
      ]
    );
    return note.id;
  },

  async update(id: string, updates: Partial<Note>): Promise<boolean> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push("content = ?");
      values.push(updates.content);
    }
    if (updates.linkedTasks !== undefined) {
      fields.push("linked_tasks = ?");
      values.push(JSON.stringify(updates.linkedTasks));
    }
    if (updates.files !== undefined) {
      fields.push("files = ?");
      values.push(JSON.stringify(updates.files));
    }
    if (updates.folder !== undefined) {
      fields.push("folder = ?");
      values.push(updates.folder);
    }
    if (updates.isPinned !== undefined) {
      fields.push("is_pinned = ?");
      values.push(updates.isPinned ? 1 : 0);
    }
    if (updates.color !== undefined) {
      fields.push("color = ?");
      values.push(updates.color);
    }

    if (fields.length === 0) return false;
    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await db.runAsync(
      `UPDATE notes SET ${fields.join(", ")} WHERE id = ?`,
      values as any[]
    );
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync("DELETE FROM notes WHERE id = ?", [id]);
    return (result.changes ?? 0) > 0;
  },

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM notes");
  },
};
