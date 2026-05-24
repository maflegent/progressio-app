// app/(tabs)/notes.tsx - улучшенные заметки
import { Colors } from "@/constants/Colors";
import { GlobalStyles } from "@/constants/Styles";
import { useAppTheme } from "@/contexts/SettingsContext";
import { Note } from "@/types";
import { NoteRepository } from "@/utils/repositories/NoteRepository";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// SafeAreaView перенесён из react-native в react-native-safe-area-context для устранения warning о deprecated
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FOLDER_CONFIG = [
  { id: "work", label: "Работа", icon: "briefcase", color: "#3B82F6" },
  { id: "personal", label: "Личное", icon: "heart", color: "#EC4899" },
  { id: "ideas", label: "Идеи", icon: "bulb", color: "#8B5CF6" },
  { id: "learning", label: "Учёба", icon: "school", color: "#F59E0B" },
  { id: "other", label: "Другое", icon: "folder", color: "#6B7280" },
];

const NOTE_COLORS = [
  "#FFFFFF",
  "#FEF3C7",
  "#DBEAFE",
  "#FCE7F3",
  "#D1FAE5",
  "#E0E7FF",
  "#FEE2E2",
];

const NoteCard = ({
  note,
  colors,
  onPress,
  onLongPress,
}: {
  note: Note;
  colors: any;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  const folder = FOLDER_CONFIG.find((f) => f.id === note.folder) || FOLDER_CONFIG[4];

  return (
    <TouchableOpacity
      style={[
        styles.noteCard,
        {
          backgroundColor: note.color || colors.card,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {note.isPinned && (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={12} color="#F59E0B" />
        </View>
      )}
      
      <View style={[styles.noteFolderTag, { backgroundColor: `${folder.color}20` }]}>
        <Ionicons name={folder.icon as any} size={12} color={folder.color} />
        <Text style={[styles.noteFolderText, { color: folder.color }]}>
          {folder.label}
        </Text>
      </View>

      <Text style={[styles.noteTitle, { color: colors.foreground }]} numberOfLines={2}>
        {note.title}
      </Text>
      
      {note.content && (
        <Text style={[styles.notePreview, { color: colors.muted }]} numberOfLines={3}>
          {note.content}
        </Text>
      )}

      <View style={styles.noteFooter}>
        <Text style={[styles.noteDate, { color: colors.muted }]}>
          {format(new Date(note.updatedAt), "d MMM", { locale: ru })}
        </Text>
        {note.isPinned && (
          <Ionicons name="pin" size={14} color="#F59E0B" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function NotesScreen() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteFolder, setNoteFolder] = useState("other");
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const loaded = await NoteRepository.getAll();
      setNotes(loaded);
    } catch (error) {
      console.error("Error loading:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotes = selectedFolder === "all"
    ? notes
    : notes.filter((n) => n.folder === selectedFolder);

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      Alert.alert("Ошибка", "Введите заголовок");
      return;
    }

    try {
      if (editingNote) {
        await NoteRepository.update(editingNote.id, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
          folder: noteFolder,
          color: noteColor,
          isPinned: editingNote.isPinned,
        });
      } else {
        await NoteRepository.insert({
          id: Date.now().toString(),
          title: noteTitle.trim(),
          content: noteContent.trim(),
          folder: noteFolder,
          color: noteColor,
          isPinned: false,
          linkedTasks: [],
          files: [],
        });
      }

      resetForm();
      await loadNotes();
      Alert.alert("Успех", "Заметка сохранена");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось сохранить");
    }
  };

  const handleDeleteNote = async (id: string) => {
    Alert.alert("Удалить заметку?", "Это действие необратимо", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          await NoteRepository.delete(id);
          await loadNotes();
        },
      },
    ]);
  };

  const handleTogglePin = async (note: Note) => {
    await NoteRepository.update(note.id, { isPinned: !note.isPinned });
    await loadNotes();
  };

  const openNewNote = () => {
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteFolder("other");
    setNoteColor(NOTE_COLORS[0]);
    setShowModal(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteFolder(note.folder || "other");
    setNoteColor(note.color || NOTE_COLORS[0]);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteFolder("other");
    setNoteColor(NOTE_COLORS[0]);
    setShowModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, GlobalStyles.section]}>
          <Text style={[GlobalStyles.title, { color: colors.foreground }]}>Заметки</Text>
          <Text style={[GlobalStyles.subtitle, { color: colors.muted }]}>
            {notes.length > 0
              ? `${notes.length} заметок${selectedFolder !== "all" ? " в папке" : ""}`
              : "Создайте свою первую заметку"}
          </Text>
        </View>

        <View style={[styles.folderTabs, { paddingHorizontal: 16 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.folderTab,
                {
                  backgroundColor:
                    selectedFolder === "all" ? colors.primary : colors.card,
                },
              ]}
              onPress={() => setSelectedFolder("all")}
            >
              <Text
                style={[
                  styles.folderTabText,
                  {
                    color:
                      selectedFolder === "all"
                        ? colors.primaryForeground
                        : colors.muted,
                  },
                ]}
              >
                Все
              </Text>
            </TouchableOpacity>
            {FOLDER_CONFIG.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={[
                  styles.folderTab,
                  {
                    backgroundColor:
                      selectedFolder === folder.id ? folder.color : colors.card,
                  },
                ]}
                onPress={() => setSelectedFolder(folder.id)}
              >
                <Ionicons
                  name={folder.icon as any}
                  size={14}
                  color={
                    selectedFolder === folder.id
                      ? "#FFFFFF"
                      : colors.muted
                  }
                />
                <Text
                  style={[
                    styles.folderTabText,
                    {
                      color:
                        selectedFolder === folder.id
                          ? "#FFFFFF"
                          : colors.muted,
                    },
                  ]}
                >
                  {folder.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.notesGrid, { paddingHorizontal: 16 }]}>
          {filteredNotes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {selectedFolder === "all"
                  ? "Нет заметок"
                  : "В этой папке пусто"}
              </Text>
            </View>
          ) : (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                colors={colors}
                onPress={() => openEditNote(note)}
                onLongPress={() => {
                  Alert.alert(note.title, "Выберите действие", [
                    {
                      text: note.isPinned ? "Открепить" : "Закрепить",
                      onPress: () => handleTogglePin(note),
                    },
                    {
                      text: "Удалить",
                      style: "destructive",
                      onPress: () => handleDeleteNote(note.id),
                    },
                    { text: "Отмена", style: "cancel" },
                  ]);
                }}
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openNewNote}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={resetForm}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetForm}>
              <Text style={{ color: colors.muted }}>Отмена</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingNote ? "Редактировать" : "Новая заметка"}
            </Text>
            <TouchableOpacity onPress={handleSaveNote}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Сохранить</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={[
                styles.titleInput,
                { color: colors.foreground },
              ]}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Заголовок"
              placeholderTextColor={colors.muted}
            />

            <View style={styles.folderSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {FOLDER_CONFIG.map((folder) => (
                  <TouchableOpacity
                    key={folder.id}
                    style={[
                      styles.folderOption,
                      {
                        backgroundColor:
                          noteFolder === folder.id
                            ? folder.color
                            : colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setNoteFolder(folder.id)}
                  >
                    <Ionicons
                      name={folder.icon as any}
                      size={16}
                      color={
                        noteFolder === folder.id
                          ? "#FFFFFF"
                          : colors.muted
                      }
                    />
                    <Text
                      style={[
                        styles.folderOptionText,
                        {
                          color:
                            noteFolder === folder.id
                              ? "#FFFFFF"
                              : colors.muted,
                        },
                      ]}
                    >
                      {folder.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.colorSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {NOTE_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: c,
                        borderColor:
                          c === "#FFFFFF"
                            ? colors.border
                            : "transparent",
                        borderWidth: c === "#FFFFFF" ? 1 : 0,
                      },
                    ]}
                    onPress={() => setNoteColor(c)}
                  >
                    {noteColor === c && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.foreground}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TextInput
              style={[
                styles.contentInput,
                {
                  backgroundColor: noteColor,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="Запишите свои мысли..."
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  folderTabs: { marginBottom: 16 },
  folderTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  folderTabText: { fontSize: 13, fontWeight: "500" },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  noteCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    minHeight: 140,
    borderRadius: 12,
    padding: 12,
  },
  pinnedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  noteFolderTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  noteFolderText: { fontSize: 10, fontWeight: "500" },
  noteTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  notePreview: { fontSize: 12, flex: 1 },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  noteDate: { fontSize: 11 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyText: { marginTop: 12, fontSize: 14 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: { flex: 1, paddingTop: 20 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  modalContent: { padding: 16 },
  titleInput: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  folderSelector: { marginBottom: 16 },
  folderOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  folderOptionText: { fontSize: 13, fontWeight: "500" },
  colorSelector: { marginBottom: 16 },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  contentInput: {
    minHeight: 200,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
  },
});