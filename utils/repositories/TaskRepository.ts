import { Task, TaskPriority, SubTask } from "@/types";
import { getDatabase } from "../sqlite";

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    priority: row.priority as TaskPriority,
    eisenhower: row.eisenhower as any,
    folder: row.folder as string | undefined,
    isCompleted: Boolean(row.is_completed),
    dueDate: row.due_date ? new Date(row.due_date as string) : undefined,
    isRecurring: Boolean(row.is_recurring),
    recurringPattern: row.recurring_pattern as string | undefined,
    tags: JSON.parse((row.tags as string) || "[]"),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    estimatedDuration: row.estimated_duration as number | undefined,
    actualDuration: row.actual_duration as number | undefined,
    location: row.location as string | undefined,
    reminderDate: row.reminder_date ? new Date(row.reminder_date as string) : undefined,
    attachments: JSON.parse((row.attachments as string) || "[]"),
    subtasks: [],
  };
}

export const TaskRepository = {
  async getAll(): Promise<Task[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );
    return rows.map(rowToTask);
  },

  async getById(id: string): Promise<Task | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM tasks WHERE id = ?",
      [id]
    );
    if (!row) return null;
    const task = rowToTask(row);
    task.subtasks = await this.getSubtasks(id);
    return task;
  },

  async insert(task: Omit<Task, "createdAt" | "updatedAt">): Promise<string> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO tasks (
        id, title, description, priority, eisenhower, folder,
        is_completed, due_date, is_recurring, recurring_pattern,
        tags, created_at, updated_at, estimated_duration,
        actual_duration, location, reminder_date, attachments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description || null,
        task.priority,
        task.eisenhower || null,
        task.folder || null,
        task.isCompleted ? 1 : 0,
        task.dueDate ? task.dueDate.toISOString() : null,
        task.isRecurring ? 1 : 0,
        task.recurringPattern || null,
        JSON.stringify(task.tags || []),
        now,
        now,
        task.estimatedDuration || null,
        task.actualDuration || null,
        task.location || null,
        task.reminderDate ? task.reminderDate.toISOString() : null,
        JSON.stringify(task.attachments || []),
      ]
    );

    if (task.subtasks?.length) {
      for (const sub of task.subtasks) {
        await this.insertSubtask(task.id, sub);
      }
    }
    return task.id;
  },

  async update(id: string, updates: Partial<Task>): Promise<boolean> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.priority !== undefined) {
      fields.push("priority = ?");
      values.push(updates.priority);
    }
    if (updates.eisenhower !== undefined) {
      fields.push("eisenhower = ?");
      values.push(updates.eisenhower);
    }
    if (updates.folder !== undefined) {
      fields.push("folder = ?");
      values.push(updates.folder);
    }
    if (updates.isCompleted !== undefined) {
      fields.push("is_completed = ?");
      values.push(updates.isCompleted ? 1 : 0);
    }
    if (updates.dueDate !== undefined) {
      fields.push("due_date = ?");
      values.push(updates.dueDate.toISOString());
    }
    if (updates.isRecurring !== undefined) {
      fields.push("is_recurring = ?");
      values.push(updates.isRecurring ? 1 : 0);
    }
    if (updates.recurringPattern !== undefined) {
      fields.push("recurring_pattern = ?");
      values.push(updates.recurringPattern);
    }
    if (updates.tags !== undefined) {
      fields.push("tags = ?");
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.estimatedDuration !== undefined) {
      fields.push("estimated_duration = ?");
      values.push(updates.estimatedDuration);
    }
    if (updates.actualDuration !== undefined) {
      fields.push("actual_duration = ?");
      values.push(updates.actualDuration);
    }
    if (updates.location !== undefined) {
      fields.push("location = ?");
      values.push(updates.location);
    }
    if (updates.reminderDate !== undefined) {
      fields.push("reminder_date = ?");
      values.push(updates.reminderDate.toISOString());
    }
    if (updates.attachments !== undefined) {
      fields.push("attachments = ?");
      values.push(JSON.stringify(updates.attachments));
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await db.runAsync(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
      values as any[]
    );
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
    return (result.changes ?? 0) > 0;
  },

  async toggleComplete(id: string): Promise<boolean> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE tasks SET is_completed = NOT is_completed, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
    return true;
  },

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM tasks");
  },

  async countByStatus(status: "all" | "pending" | "completed"): Promise<number> {
    const db = await getDatabase();
    if (status === "all") {
      const row = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM tasks");
      return row?.count ?? 0;
    }
    const isCompleted = status === "completed" ? 1 : 0;
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE is_completed = ?",
      [isCompleted]
    );
    return row?.count ?? 0;
  },

  getSubtasks: async (taskId: string): Promise<SubTask[]> => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at",
      [taskId]
    );
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      isCompleted: Boolean(r.is_completed),
      createdAt: new Date(r.created_at as string),
    }));
  },

  insertSubtask: async (taskId: string, subtask: SubTask): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT INTO subtasks (id, task_id, title, is_completed, created_at) VALUES (?, ?, ?, ?, ?)",
      [subtask.id, taskId, subtask.title, subtask.isCompleted ? 1 : 0, subtask.createdAt.toISOString()]
    );
  },

  deleteSubtask: async (id: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM subtasks WHERE id = ?", [id]);
  },

  toggleSubtask: async (id: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync("UPDATE subtasks SET is_completed = NOT is_completed WHERE id = ?", [id]);
  },
};
