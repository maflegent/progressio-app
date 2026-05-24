import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task, DiaryEntry, Note } from "@/types";
import { TaskRepository } from "./repositories/TaskRepository";
import { DiaryRepository } from "./repositories/DiaryRepository";
import { NoteRepository } from "./repositories/NoteRepository";
import { FolderRepository } from "./repositories/FolderRepository";
import { TagRepository } from "./repositories/TagRepository";
import { PreferencesRepository } from "./repositories/PreferencesRepository";

const TASKS_KEY = "@progressio_tasks";
const DIARY_KEY = "@progressio_diary_entries";
const NOTES_KEY = "@progressio_notes";
const FOLDERS_KEY = "@progressio_custom_folders";
const TAGS_KEY = "@progressio_custom_tags";
const SETTINGS_KEY = "@progressio_settings";
const MIGRATION_KEY = "@progressio_sqlite_migrated";

async function readJson<T>(key: string): Promise<T | null> {
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function parseDate(val: any): Date | undefined {
  if (!val) return undefined;
  return new Date(val);
}

export async function migrateFromAsyncStorage(): Promise<{ migrated: boolean; counts: Record<string, number> }> {
  const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_KEY);
  if (alreadyMigrated) {
    return { migrated: false, counts: {} };
  }

  const counts: Record<string, number> = {};

  try {
    const tasks = await readJson<Task[]>(TASKS_KEY);
    if (tasks?.length) {
      for (const task of tasks) {
        await TaskRepository.insert({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          eisenhower: task.eisenhower,
          folder: task.folder,
          isCompleted: task.isCompleted,
          dueDate: parseDate(task.dueDate),
          isRecurring: task.isRecurring,
          recurringPattern: task.recurringPattern,
          tags: task.tags || [],
          estimatedDuration: task.estimatedDuration,
          actualDuration: task.actualDuration,
          location: task.location,
          reminderDate: parseDate(task.reminderDate),
          attachments: task.attachments || [],
          subtasks: task.subtasks || [],
        });
      }
      counts.tasks = tasks.length;
    }

    const diaryEntries = await readJson<DiaryEntry[]>(DIARY_KEY);
    if (diaryEntries?.length) {
      for (const entry of diaryEntries) {
        await DiaryRepository.insert({
          date: parseDate(entry.date) || new Date(),
          content: entry.content,
          mood: entry.mood,
          linkedTasks: entry.linkedTasks,
          photoUri: entry.photoUri,
          location: entry.location,
          weather: entry.weather,
          sleepHours: entry.sleepHours,
          energyLevel: entry.energyLevel,
          tags: entry.tags,
        });
      }
      counts.diary = diaryEntries.length;
    }

    const notes = await readJson<Note[]>(NOTES_KEY);
    if (notes?.length) {
      for (const note of notes) {
        await NoteRepository.insert({
          id: note.id,
          title: note.title,
          content: note.content,
          linkedTasks: note.linkedTasks,
          files: note.files,
          folder: note.folder,
          isPinned: note.isPinned,
          color: note.color,
        });
      }
      counts.notes = notes.length;
    }

    const folders = await readJson<Array<{ id: string; label: string; icon: string; color: string }>>(FOLDERS_KEY);
    if (folders?.length) {
      for (const folder of folders) {
        await FolderRepository.insert(folder);
      }
      counts.folders = folders.length;
    }

    const tags = await readJson<string[]>(TAGS_KEY);
    if (tags?.length) {
      for (const tag of tags) {
        await TagRepository.insert(tag);
      }
      counts.tags = tags.length;
    }

    const settings = await readJson<Record<string, any>>(SETTINGS_KEY);
    if (settings) {
      await PreferencesRepository.update({
        theme: settings.theme || "system",
        language: settings.language || "ru",
        task_reminders: settings.notifications?.taskReminders !== false ? 1 : 0,
        daily_digest: settings.notifications?.dailyDigest ? 1 : 0,
        weekly_review: settings.notifications?.weeklyReview ? 1 : 0,
        default_task_priority: settings.defaultTaskPriority || "medium",
        working_hours_start: settings.workingHours?.start || "09:00",
        working_hours_end: settings.workingHours?.end || "18:00",
      });
    }

    await AsyncStorage.setItem(MIGRATION_KEY, new Date().toISOString());
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }

  return { migrated: true, counts };
}

export async function isMigrated(): Promise<boolean> {
  return !!(await AsyncStorage.getItem(MIGRATION_KEY));
}
