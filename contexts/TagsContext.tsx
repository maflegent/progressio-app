import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface TagsContextType {
  customTags: string[];
  addCustomTag: (tag: string) => Promise<void>;
  removeCustomTag: (tag: string) => Promise<void>;
}

const CUSTOM_TAGS_KEY = "@progressio_custom_tags";

const DEFAULT_TAGS = ["работа", "личное", "покупки", "здоровье", "обучение"];

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export const TagsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customTags, setCustomTags] = useState<string[]>(DEFAULT_TAGS);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка тегов при запуске
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const savedTags = await AsyncStorage.getItem(CUSTOM_TAGS_KEY);
      if (savedTags) {
        setCustomTags(JSON.parse(savedTags));
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomTag = async (tag: string) => {
    try {
      const trimmedTag = tag.trim().toLowerCase();
      if (!trimmedTag) return;

      if (customTags.includes(trimmedTag)) {
        // Перемещаем тег в начало списка (последние использованные)
        const updatedTags = [
          trimmedTag,
          ...customTags.filter((t) => t !== trimmedTag),
        ];
        setCustomTags(updatedTags);
        await AsyncStorage.setItem(
          CUSTOM_TAGS_KEY,
          JSON.stringify(updatedTags),
        );
      } else {
        const updatedTags = [trimmedTag, ...customTags];
        setCustomTags(updatedTags);
        await AsyncStorage.setItem(
          CUSTOM_TAGS_KEY,
          JSON.stringify(updatedTags),
        );
      }
    } catch (error) {
      console.error("Error adding tag:", error);
      throw error;
    }
  };

  const removeCustomTag = async (tag: string) => {
    try {
      const updatedTags = customTags.filter((t) => t !== tag);
      setCustomTags(updatedTags);
      await AsyncStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(updatedTags));
    } catch (error) {
      console.error("Error removing tag:", error);
      throw error;
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <TagsContext.Provider value={{ customTags, addCustomTag, removeCustomTag }}>
      {children}
    </TagsContext.Provider>
  );
};

export const useTags = () => {
  const context = useContext(TagsContext);
  if (context === undefined) {
    throw new Error("useTags must be used within a TagsProvider");
  }
  return context;
};
