// utils/dataManager.ts - управление данными
import AsyncStorage from "@react-native-async-storage/async-storage";

const DATA_KEYS = {
  TASKS: "@progressio_tasks",
  DIARY: "@progressio_diary_entries",
  NOTES: "@progressio_notes",
  TAGS: "@progressio_custom_tags",
  FOLDERS: "@progressio_custom_folders",
  SETTINGS: "@progressio_settings",
};

export interface ExportData {
  version: string;
  exportedAt: string;
  tasks: any[];
  diary: any[];
  notes: any[];
  tags: string[];
  folders: any[];
  settings: any;
}

export const dataManager = {
  async exportAllData(): Promise<ExportData | null> {
    try {
      const [tasks, diary, notes, tags, folders, settings] = await Promise.all([
        AsyncStorage.getItem(DATA_KEYS.TASKS),
        AsyncStorage.getItem(DATA_KEYS.DIARY),
        AsyncStorage.getItem(DATA_KEYS.NOTES),
        AsyncStorage.getItem(DATA_KEYS.TAGS),
        AsyncStorage.getItem(DATA_KEYS.FOLDERS),
        AsyncStorage.getItem(DATA_KEYS.SETTINGS),
      ]);

      const exportData: ExportData = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        tasks: tasks ? JSON.parse(tasks) : [],
        diary: diary ? JSON.parse(diary) : [],
        notes: notes ? JSON.parse(notes) : [],
        tags: tags ? JSON.parse(tags) : [],
        folders: folders ? JSON.parse(folders) : [],
        settings: settings ? JSON.parse(settings) : {},
      };

      return exportData;
    } catch (error) {
      console.error("Error exporting data:", error);
      return null;
    }
  },

  async importData(data: ExportData, merge = true): Promise<boolean> {
    try {
      if (merge) {
        const existingTasks = await AsyncStorage.getItem(DATA_KEYS.TASKS);
        const existingDiary = await AsyncStorage.getItem(DATA_KEYS.DIARY);

        let mergedTasks = data.tasks || [];
        let mergedDiary = data.diary || [];

        if (existingTasks) {
          const existing = JSON.parse(existingTasks);
          const existingIds = new Set(existing.map((t: any) => t.id));
          data.tasks?.forEach((t: any) => {
            if (!existingIds.has(t.id)) {
              mergedTasks.push(t);
            }
          });
        }

        if (existingDiary) {
          const existing = JSON.parse(existingDiary);
          const existingIds = new Set(existing.map((d: any) => d.id));
          data.diary?.forEach((d: any) => {
            if (!existingIds.has(d.id)) {
              mergedDiary.push(d);
            }
          });
        }

        await Promise.all([
          AsyncStorage.setItem(DATA_KEYS.TASKS, JSON.stringify(mergedTasks)),
          AsyncStorage.setItem(DATA_KEYS.DIARY, JSON.stringify(mergedDiary)),
          data.tags && AsyncStorage.setItem(DATA_KEYS.TAGS, JSON.stringify(data.tags)),
          data.folders && AsyncStorage.setItem(DATA_KEYS.FOLDERS, JSON.stringify(data.folders)),
        ]);
      } else {
        await Promise.all([
          data.tasks && AsyncStorage.setItem(DATA_KEYS.TASKS, JSON.stringify(data.tasks)),
          data.diary && AsyncStorage.setItem(DATA_KEYS.DIARY, JSON.stringify(data.diary)),
          data.notes && AsyncStorage.setItem(DATA_KEYS.NOTES, JSON.stringify(data.notes)),
          data.tags && AsyncStorage.setItem(DATA_KEYS.TAGS, JSON.stringify(data.tags)),
          data.folders && AsyncStorage.setItem(DATA_KEYS.FOLDERS, JSON.stringify(data.folders)),
          data.settings && AsyncStorage.setItem(DATA_KEYS.SETTINGS, JSON.stringify(data.settings)),
        ]);
      }

      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  },

  async clearAllData(): Promise<boolean> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(DATA_KEYS.TASKS),
        AsyncStorage.removeItem(DATA_KEYS.DIARY),
        AsyncStorage.removeItem(DATA_KEYS.NOTES),
      ]);
      return true;
    } catch (error) {
      console.error("Error clearing data:", error);
      return false;
    }
  },

  async getStorageInfo(): Promise<{
    tasks: number;
    diary: number;
    notes: number;
    tags: number;
    folders: number;
    total: number;
  }> {
    try {
      const [tasks, diary, notes, tags, folders] = await Promise.all([
        AsyncStorage.getItem(DATA_KEYS.TASKS),
        AsyncStorage.getItem(DATA_KEYS.DIARY),
        AsyncStorage.getItem(DATA_KEYS.NOTES),
        AsyncStorage.getItem(DATA_KEYS.TAGS),
        AsyncStorage.getItem(DATA_KEYS.FOLDERS),
      ]);

      const data = {
        tasks: tasks ? JSON.parse(tasks).length : 0,
        diary: diary ? JSON.parse(diary).length : 0,
        notes: notes ? JSON.parse(notes).length : 0,
        tags: tags ? JSON.parse(tags).length : 0,
        folders: folders ? JSON.parse(folders).length : 0,
        total: 0,
      };

      data.total = data.tasks + data.diary + data.notes;
      return data;
    } catch (error) {
      console.error("Error getting storage info:", error);
      return { tasks: 0, diary: 0, notes: 0, tags: 0, folders: 0, total: 0 };
    }
  },
};