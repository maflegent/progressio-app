import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface CustomFolder {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface FoldersContextType {
  customFolders: CustomFolder[];
  addCustomFolder: (folder: Omit<CustomFolder, "id">) => Promise<void>;
  removeCustomFolder: (id: string) => Promise<void>;
}

const CUSTOM_FOLDERS_KEY = "@progressio_custom_folders";

const DEFAULT_CUSTOM_FOLDERS: CustomFolder[] = [];

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export const FoldersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>(
    DEFAULT_CUSTOM_FOLDERS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const savedFolders = await AsyncStorage.getItem(CUSTOM_FOLDERS_KEY);
      if (savedFolders) {
        setCustomFolders(JSON.parse(savedFolders));
      }
    } catch (error) {
      console.error("Error loading folders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomFolder = async (folder: Omit<CustomFolder, "id">) => {
    try {
      const newFolder: CustomFolder = {
        ...folder,
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      };
      const updatedFolders = [...customFolders, newFolder];
      setCustomFolders(updatedFolders);
      await AsyncStorage.setItem(
        CUSTOM_FOLDERS_KEY,
        JSON.stringify(updatedFolders),
      );
    } catch (error) {
      console.error("Error adding folder:", error);
      throw error;
    }
  };

  const removeCustomFolder = async (id: string) => {
    try {
      const updatedFolders = customFolders.filter((f) => f.id !== id);
      setCustomFolders(updatedFolders);
      await AsyncStorage.setItem(
        CUSTOM_FOLDERS_KEY,
        JSON.stringify(updatedFolders),
      );
    } catch (error) {
      console.error("Error removing folder:", error);
      throw error;
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <FoldersContext.Provider
      value={{
        customFolders,
        addCustomFolder,
        removeCustomFolder,
      }}
    >
      {children}
    </FoldersContext.Provider>
  );
};

export const useFolders = () => {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error("useFolders must be used within a FoldersProvider");
  }
  return context;
};
