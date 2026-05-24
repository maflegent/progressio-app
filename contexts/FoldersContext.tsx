import React, { createContext, useContext, useEffect, useState } from "react";
import { FolderRepository, CustomFolderRow } from "@/utils/repositories/FolderRepository";

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

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export const FoldersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const folders = await FolderRepository.getAll();
      setCustomFolders(folders);
    } catch (error) {
      console.error("Error loading folders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomFolder = async (folder: Omit<CustomFolder, "id">) => {
    try {
      const id = await FolderRepository.insert(folder);
      setCustomFolders((prev) => [...prev, { id, ...folder }]);
    } catch (error) {
      console.error("Error adding folder:", error);
      throw error;
    }
  };

  const removeCustomFolder = async (id: string) => {
    try {
      await FolderRepository.delete(id);
      setCustomFolders((prev) => prev.filter((f) => f.id !== id));
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
