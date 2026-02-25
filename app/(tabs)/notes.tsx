// app/(tabs)/notes.tsx - улучшенная версия без заглушек
import { Colors } from "@/constants/Colors";
import { GlobalStyles } from "@/constants/Styles";
import { useAppTheme } from "@/contexts/SettingsContext";
import { Note } from "@/types";
import { notesStorage } from "@/utils/notesStorage";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Компонент карточки заметки
const NoteCard = ({
  note,
  colors,
  onPress,
  onTogglePin,
  onDelete,
}: {
  note: Note;
  colors: any;
  onPress: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) => {
  const folderColors: Record<string, string> = {
    work: "#3B82F6",
    personal: "#10B981",
    ideas: "#8B5CF6",
    learning: "#F59E0B",
  };

  const folderColor = folderColors[note.folder || ""] || colors.muted;
  const folderName = note.folder || "Без папки";

  return (
    <TouchableOpacity
      style={[
        styles.noteCard,
        GlobalStyles.shadow,
        {
          backgroundColor: note.color || colors.card,
          borderLeftWidth: 4,
          borderLeftColor: folderColor,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteInfo}>
          <View
            style={[styles.noteFolder, { backgroundColor: `${folderColor}15` }]}
          >
            <Text style={[styles.noteFolderText, { color: folderColor }]}>
              {folderName}
            </Text>
          </View>
          {note.isPinned && <Ionicons name="pin" size={16} color="#F59E0B" />}
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity onPress={onTogglePin} style={styles.noteAction}>
            <Ionicons
              name={note.isPinned ? "bookmark" : "bookmark-outline"}
              size={18}
              color={note.isPinned ? "#F59E0B" : colors.muted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.noteAction}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.noteTitle, { color: colors.cardForeground }]}>
        {note.title || "Без названия"}
      </Text>

      <Text
        style={[styles.noteContent, { color: colors.muted }]}
        numberOfLines={3}
      >
        {note.content || "Нет содержимого"}
      </Text>

      <View style={styles.noteFooter}>
        <Text style={[styles.noteDate, { color: colors.muted }]}>
          {format(note.updatedAt, "d MMM HH:mm", { locale: ru })}
        </Text>
        {note.linkedTasks && note.linkedTasks.length > 0 && (
          <View style={styles.linkedTasks}>
            <Ionicons name="checkbox" size={14} color={colors.primary} />
            <Text style={[styles.linkedTasksText, { color: colors.primary }]}>
              {note.linkedTasks.length}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Модальное окно создания/редактирования заметки
const NoteModal = ({
  visible,
  note,
  folders,
  colors,
  onClose,
  onSave,
  template,
}: {
  visible: boolean;
  note: Note | null;
  folders: any[];
  colors: any;
  onClose: () => void;
  onSave: (note: Partial<Note>) => void;
  template: { title: string; content: string } | null;
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    undefined,
  );

  const noteColors = [
    undefined, // default
    "#FEE2E2", // red
    "#FEF3C7", // yellow
    "#D1FAE5", // green
    "#DBEAFE", // blue
    "#E9D5FF", // purple
    "#F3E8FF", // pink
  ];

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSelectedFolder(note.folder || "all");
      setSelectedColor(note.color);
    } else if (template) {
      setTitle(template.title);
      setContent(template.content);
      setSelectedFolder("all");
      setSelectedColor(undefined);
    } else {
      setTitle("");
      setContent("");
      setSelectedFolder("all");
      setSelectedColor(undefined);
    }
  }, [note, visible, template]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Ошибка", "Введите название заметки");
      return;
    }
    onSave({
      title: title.trim(),
      content: content.trim(),
      folder: selectedFolder === "all" ? undefined : selectedFolder,
      color: selectedColor,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {note ? "Редактировать заметку" : "Новая заметка"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <TextInput
              style={[
                styles.titleInput,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Название заметки"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.foreground }]}>
              Содержание
            </Text>
            <TextInput
              style={[
                styles.contentInput,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Напишите что-нибудь..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={10}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />

            <Text style={[styles.label, { color: colors.foreground }]}>
              Папка
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.modalFoldersScroll}
            >
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderChip,
                    selectedFolder === folder.id && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedFolder(folder.id)}
                >
                  <Text
                    style={[
                      styles.folderChipText,
                      selectedFolder === folder.id
                        ? { color: colors.primaryForeground }
                        : { color: colors.foreground },
                    ]}
                  >
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.foreground }]}>
              Цвет
            </Text>
            <View style={styles.colorPicker}>
              {noteColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color || colors.card,
                      borderColor:
                        selectedColor === color
                          ? colors.primary
                          : "transparent",
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                {note ? "Сохранить" : "Создать"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function NotesScreen() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [templateNote, setTemplateNote] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const folders = [
    { id: "all", name: "Все", icon: "document-text" },
    { id: "work", name: "Работа", icon: "briefcase" },
    { id: "personal", name: "Личное", icon: "person" },
    { id: "ideas", name: "Идеи", icon: "bulb" },
    { id: "learning", name: "Обучение", icon: "school" },
  ];

  const templates = [
    {
      title: "Встреча",
      icon: "people",
      content: "Дата: \nУчастники: \nПовестка:\n- \n- \n\nРешения:\n- \n- ",
    },
    {
      title: "Идея",
      icon: "bulb",
      content:
        "Название идеи:\n\nОписание:\n\nПреимущества:\n\nСледующие шаги:",
    },
    {
      title: "Чеклист",
      icon: "list",
      content: "Задачи:\n- [ ] \n- [ ] \n- [ ] \n- [ ] ",
    },
    { title: "Код", icon: "code", content: "```language\n// Код здесь\n\n```" },
  ];

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedFolder]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const loadedNotes = await notesStorage.loadNotes();
      setNotes(loadedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      Alert.alert("Ошибка", "Не удалось загрузить заметки");
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = notes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query),
      );
    }

    if (selectedFolder !== "all") {
      filtered = filtered.filter((note) => note.folder === selectedFolder);
    }

    // Сортируем: закрепленные сначала, затем по дате обновления
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    setFilteredNotes(filtered);
  };

  const handleCreateNote = async (noteData: Partial<Note>) => {
    try {
      setIsLoading(true);
      await notesStorage.addNote({
        title: noteData.title || "",
        content: noteData.content || "",
        folder: noteData.folder,
        color: noteData.color,
        isPinned: false,
        linkedTasks: [],
      });
      await loadNotes();
      setShowModal(false);
      setEditingNote(null);
      setTemplateNote(null);
      Alert.alert("Успех", "Заметка создана");
    } catch (error) {
      console.error("Error creating note:", error);
      Alert.alert("Ошибка", "Не удалось создать заметку");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNote = async (noteData: Partial<Note>) => {
    if (!editingNote) return;

    try {
      setIsLoading(true);
      await notesStorage.updateNote(editingNote.id, noteData);
      await loadNotes();
      setShowModal(false);
      setEditingNote(null);
      setTemplateNote(null);
      Alert.alert("Успех", "Заметка обновлена");
    } catch (error) {
      console.error("Error updating note:", error);
      Alert.alert("Ошибка", "Не удалось обновить заметку");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await notesStorage.togglePin(note.id);
      await loadNotes();
    } catch (error) {
      console.error("Error toggling pin:", error);
      Alert.alert("Ошибка", "Не удалось изменить закрепление");
    }
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      "Удалить заметку",
      "Вы уверены, что хотите удалить эту заметку?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await notesStorage.deleteNote(note.id);
              await loadNotes();
              Alert.alert("Успех", "Заметка удалена");
            } catch (error) {
              console.error("Error deleting note:", error);
              Alert.alert("Ошибка", "Не удалось удалить заметку");
            }
          },
        },
      ],
    );
  };

  const handleOpenNote = (note: Note) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleCreateFromTemplate = (template: any) => {
    setEditingNote(null);
    setTemplateNote({ title: template.title, content: template.content });
    setShowModal(true);
  };

  const getStats = () => {
    const total = notes.length;
    const pinned = notes.filter((n) => n.isPinned).length;
    const folders: Record<string, number> = {};
    notes.forEach((note) => {
      if (note.folder) {
        folders[note.folder] = (folders[note.folder] || 0) + 1;
      }
    });
    return { total, pinned, folders };
  };

  const stats = getStats();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Заголовок */}
        <View style={[styles.header, GlobalStyles.section]}>
          <View>
            <Text style={[GlobalStyles.title, { color: colors.foreground }]}>
              Заметки
            </Text>
            <Text style={[GlobalStyles.subtitle, { color: colors.muted }]}>
              {stats.total} заметок, {stats.pinned} закреплено
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setEditingNote(null);
              setShowModal(true);
            }}
          >
            <Ionicons name="add" size={24} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {/* Поиск */}
        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <View
            style={[styles.searchContainer, { backgroundColor: colors.card }]}
          >
            <Ionicons
              name="search"
              size={20}
              color={colors.muted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Поиск заметок..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Папки */}
        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {folders.map((folder) => {
              const count =
                folder.id === "all"
                  ? stats.total
                  : stats.folders[folder.id] || 0;

              return (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderCard,
                    GlobalStyles.shadow,
                    {
                      backgroundColor:
                        selectedFolder === folder.id
                          ? colors.primary
                          : colors.card,
                      borderColor:
                        selectedFolder === folder.id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedFolder(folder.id)}
                >
                  <View
                    style={[
                      styles.folderIcon,
                      {
                        backgroundColor:
                          selectedFolder === folder.id
                            ? colors.primaryForeground
                            : `${colors.primary}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={folder.icon as any}
                      size={24}
                      color={
                        selectedFolder === folder.id
                          ? colors.primary
                          : colors.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.folderName,
                      {
                        color:
                          selectedFolder === folder.id
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {folder.name}
                  </Text>
                  <Text
                    style={[
                      styles.folderCount,
                      {
                        color:
                          selectedFolder === folder.id
                            ? colors.primaryForeground
                            : colors.muted,
                      },
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Шаблоны */}
        {searchQuery.length === 0 && selectedFolder === "all" && (
          <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Быстрые шаблоны
            </Text>
            <View style={styles.templatesGrid}>
              {templates.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.templateCard,
                    GlobalStyles.shadow,
                    { backgroundColor: colors.card },
                  ]}
                  onPress={() => handleCreateFromTemplate(template)}
                >
                  <View
                    style={[
                      styles.templateIcon,
                      { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <Ionicons
                      name={template.icon as any}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <Text
                    style={[styles.templateTitle, { color: colors.foreground }]}
                  >
                    {template.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Заметки */}
        <View
          style={[
            GlobalStyles.section,
            { paddingHorizontal: 16, paddingBottom: 32 },
          ]}
        >
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                colors={colors}
                onPress={() => handleOpenNote(note)}
                onTogglePin={() => handleTogglePin(note)}
                onDelete={() => handleDeleteNote(note)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={colors.muted}
              />
              <Text style={[styles.emptyStateText, { color: colors.muted }]}>
                {searchQuery ? "Ничего не найдено" : "Заметок пока нет"}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.muted }]}>
                {searchQuery
                  ? "Попробуйте изменить параметры поиска"
                  : "Создайте первую заметку, нажав на +"}
              </Text>
            </View>
          )}
        </View>

        {/* Модальное окно заметки */}
        <NoteModal
          visible={showModal}
          note={editingNote}
          folders={folders}
          colors={colors}
          onClose={() => {
            setShowModal(false);
            setEditingNote(null);
            setTemplateNote(null);
          }}
          onSave={editingNote ? handleUpdateNote : handleCreateNote}
          template={templateNote}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },

  // Папки
  foldersScroll: {
    flexDirection: "row",
  },
  folderCard: {
    width: 100,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  folderName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  folderCount: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Шаблоны
  templatesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  templateCard: {
    width: "23%",
    minWidth: 80,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },

  // Заметки
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  noteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteFolder: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  noteFolderText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  noteActions: {
    flexDirection: "row",
    gap: 8,
  },
  noteAction: {
    padding: 4,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  linkedTasks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkedTasksText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Пустое состояние
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },

  // Модальное окно
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    padding: 20,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalFoldersScroll: {
    marginBottom: 20,
  },
  folderChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  folderChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  saveButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
