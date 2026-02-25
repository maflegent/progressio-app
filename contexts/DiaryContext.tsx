// contexts/DiaryContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DiaryEntry, Mood } from '@/types';
import { diaryStorage } from '@/utils/storage';

interface DiaryContextType {
  entries: DiaryEntry[];
  isLoading: boolean;
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryById: (id: string) => DiaryEntry | undefined;
  getRecentEntries: (days?: number) => DiaryEntry[];
  getMoodStats: (period: 'week' | 'month' | 'year') => Promise<{
    moodCounts: Record<string, number>;
    averageMood: number;
    streak: number;
  }>;
  refreshEntries: () => Promise<void>;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export const useDiary = () => {
  const context = useContext(DiaryContext);
  if (!context) {
    throw new Error('useDiary must be used within a DiaryProvider');
  }
  return context;
};

interface DiaryProviderProps {
  children: ReactNode;
}

export const DiaryProvider: React.FC<DiaryProviderProps> = ({ children }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const loadedEntries = await diaryStorage.loadEntries();
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Error loading diary entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (entryData: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
    try {
      await diaryStorage.addEntry(entryData);
      await loadEntries();
    } catch (error) {
      console.error('Error adding diary entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<DiaryEntry>) => {
    try {
      await diaryStorage.updateEntry(id, updates);
      await loadEntries();
    } catch (error) {
      console.error('Error updating diary entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await diaryStorage.deleteEntry(id);
      await loadEntries();
    } catch (error) {
      console.error('Error deleting diary entry:', error);
      throw error;
    }
  };

  const getEntryById = (id: string): DiaryEntry | undefined => {
    return entries.find(entry => entry.id === id);
  };

  const getRecentEntries = (days: number = 7): DiaryEntry[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return entries
      .filter(entry => new Date(entry.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getMoodStats = diaryStorage.getMoodStats;
  const refreshEntries = loadEntries;

  const value = {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryById,
    getRecentEntries,
    getMoodStats,
    refreshEntries,
  };

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
};