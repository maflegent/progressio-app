// constants/Styles.ts - единая система стилей для всего приложения
import { Dimensions, Platform, StyleSheet } from "react-native";

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

// Размеры и отступы
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Радиусы скругления
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// Размеры шрифтов
export const FONTSIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
} as const;

// Толщина шрифта
export const FONTWEIGHT = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
} as const;

// Тени
export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// Общие стили компонентов
export const CommonStyles = StyleSheet.create({
  // Контейнеры
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Карточки
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardElevated: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },

  // Кнопки
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonSmall: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  buttonIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },

  // Поля ввода
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONTSIZE.lg,
    minHeight: 48,
  },
  inputMultiline: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONTSIZE.lg,
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Текст
  title: {
    fontSize: FONTSIZE.display,
    fontWeight: FONTWEIGHT.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTSIZE.lg,
    fontWeight: FONTWEIGHT.medium,
  },
  body: {
    fontSize: FONTSIZE.md,
    lineHeight: 20,
  },
  caption: {
    fontSize: FONTSIZE.sm,
    lineHeight: 16,
  },
  buttonText: {
    fontSize: FONTSIZE.lg,
    fontWeight: FONTWEIGHT.semibold,
  },

  // Секции
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONTSIZE.lg,
    fontWeight: FONTWEIGHT.semibold,
    marginBottom: SPACING.md,
  },

  // Тени
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Чипы/теги
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  chipText: {
    fontSize: FONTSIZE.sm,
    fontWeight: FONTWEIGHT.medium,
  },

  // Разделители
  divider: {
    height: 1,
    width: "100%",
  },
  dividerVertical: {
    width: 1,
    height: "100%",
  },

  // Аватары
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  // Бейджи
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
  },
  badgeText: {
    fontSize: FONTSIZE.xs,
    fontWeight: FONTWEIGHT.bold,
  },

  // FAB (Floating Action Button)
  fab: {
    position: "absolute",
    bottom: SPACING.xxl,
    right: SPACING.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.lg,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xxxl,
  },

  // Модальные окна
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
});

// Платформо-зависимые стили
export const PlatformStyles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 0,
    },
    android: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 3,
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  }),
  card: Platform.select({
    ios: {
      borderRadius: RADIUS.lg,
      backgroundColor: "#FFFFFF",
      elevation: 0,
    },
    android: {
      borderRadius: RADIUS.lg,
      backgroundColor: "#FFFFFF",
      elevation: 2,
    },
    default: {
      borderRadius: RADIUS.lg,
      backgroundColor: "#FFFFFF",
      elevation: 2,
    },
  }),
});

// Утилиты для создания стилей
export const createShadow = (opacity: number = 0.1, radius: number = 4) => ({
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: Math.round(opacity * 10),
});

export const createSpacing = (value: number) => ({
  padding: value,
  margin: value,
});

// Экспорт для обратной совместимости
export const GlobalStyles = CommonStyles;
