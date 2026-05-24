import React, { createContext, useContext, useEffect, useState } from "react";
import { TagRepository } from "@/utils/repositories/TagRepository";

interface TagsContextType {
  customTags: string[];
  addCustomTag: (tag: string) => Promise<void>;
  removeCustomTag: (tag: string) => Promise<void>;
}

const DEFAULT_TAGS = ["работа", "личное", "покупки", "здоровье", "обучение"];

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export const TagsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customTags, setCustomTags] = useState<string[]>(DEFAULT_TAGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setIsLoading(true);
      const tags = await TagRepository.getAll();
      const merged = [...new Set([...tags, ...DEFAULT_TAGS])];
      setCustomTags(merged);
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

      await TagRepository.insert(trimmedTag);
      setCustomTags((prev) => {
        if (prev.includes(trimmedTag)) {
          return [trimmedTag, ...prev.filter((t) => t !== trimmedTag)];
        }
        return [trimmedTag, ...prev];
      });
    } catch (error) {
      console.error("Error adding tag:", error);
      throw error;
    }
  };

  const removeCustomTag = async (tag: string) => {
    try {
      await TagRepository.delete(tag);
      setCustomTags((prev) => prev.filter((t) => t !== tag));
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
