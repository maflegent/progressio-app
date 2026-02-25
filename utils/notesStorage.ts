// utils/notesStorage.ts - хранилище для заметок
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@/types';

const NOTES_KEY = '@progressio_notes';

export const notesStorage = {
  // Сохранить все заметки
  async saveNotes(notes: Note[]): Promise<void> {
    try {
      const serializedNotes = notes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      }));
      const jsonValue = JSON.stringify(serializedNotes);
      await AsyncStorage.setItem(NOTES_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  },

  // Загрузить все заметки
  async loadNotes(): Promise<Note[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(NOTES_KEY);
      if (!jsonValue) return [];

      const parsedData = JSON.parse(jsonValue);
      return parsedData.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  },

  // Добавить новую заметку
  async addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const notes = await this.loadNotes();
      const now = new Date();
      const newNote: Note = {
        ...note,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };

      notes.unshift(newNote); // Добавляем в начало списка
      await this.saveNotes(notes);
      return newNote.id;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  // Обновить заметку
  async updateNote(id: string, updates: Partial<Note>): Promise<boolean> {
    try {
      const notes = await this.loadNotes();
      const index = notes.findIndex((note) => note.id === id);

      if (index === -1) return false;

      notes[index] = {
        ...notes[index],
        ...updates,
        updatedAt: new Date(),
      };
      await this.saveNotes(notes);
      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      return false;
    }
  },

  // Удалить заметку
  async deleteNote(id: string): Promise<boolean> {
    try {
      const notes = await this.loadNotes();
      const filteredNotes = notes.filter((note) => note.id !== id);

      if (filteredNotes.length === notes.length) return false;

      await this.saveNotes(filteredNotes);
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  },

  // Переключить закрепление
  async togglePin(id: string): Promise<boolean> {
    try {
      const notes = await this.loadNotes();
      const index = notes.findIndex((note) => note.id === id);

      if (index === -1) return false;

      notes[index] = {
        ...notes[index],
        isPinned: !notes[index].isPinned,
        updatedAt: new Date(),
      };
      await this.saveNotes(notes);
      return true;
    } catch (error) {
      console.error('Error toggling pin:', error);
      return false;
    }
  },

  // Получить заметки по папке
  async getNotesByFolder(folder?: string): Promise<Note[]> {
    try {
      const notes = await this.loadNotes();
      if (!folder || folder === 'all') {
        return notes;
      }
      return notes.filter((note) => note.folder === folder);
    } catch (error) {
      console.error('Error getting notes by folder:', error);
      return [];
    }
  },

  // Поиск заметок
  async searchNotes(query: string): Promise<Note[]> {
    try {
      const notes = await this.loadNotes();
      const lowerQuery = query.toLowerCase();
      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerQuery) ||
          note.content.toLowerCase().includes(lowerQuery),
      );
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  },

  // Получить статистику
  async getStats(): Promise<{ total: number; pinned: number; folders: Record<string, number> }> {
    try {
      const notes = await this.loadNotes();
      const folders: Record<string, number> = {};

      notes.forEach((note) => {
        if (note.folder) {
          folders[note.folder] = (folders[note.folder] || 0) + 1;
        }
      });

      return {
        total: notes.length,
        pinned: notes.filter((n) => n.isPinned).length,
        folders,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { total: 0, pinned: 0, folders: {} };
    }
  },

  // Очистить все заметки (для тестов)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTES_KEY);
    } catch (error) {
      console.error('Error clearing notes:', error);
    }
  },
};
