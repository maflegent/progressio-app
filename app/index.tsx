import { Colors } from "@/constants/Colors";
import { useAppTheme } from "@/contexts/SettingsContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// SafeAreaView перенесён из react-native в react-native-safe-area-context для устранения warning о deprecated
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "@/utils/sqlite";

const { width, height } = Dimensions.get("window");

const ONBOARDING_KEY = "@progressio_onboarding_done";
const QUOTES_KEY = "@progressio_last_quote_date";

const MOTIVATIONAL_QUOTES = [
  { text: "Маленькие шаги приводят к большим результатам", author: "Прогрессио" },
  { text: "Секрет успеха — начать", author: "Марк Твен" },
  { text: "Дисциплина — мост между целями и достижениями", author: "Джим Рон" },
  { text: "Не откладывай на завтра то, что можно сделать сегодня", author: "Бенджамин Франклин" },
  { text: "Каждый день — это новая возможность изменить свою жизнь", author: "Прогрессио" },
  { text: "Действие — основной ключ к любому успеху", author: "Пабло Пикассо" },
  { text: "Ваше время ограничено. Не тратьте его, живя чужой жизнью", author: "Стив Джобс" },
];

type OnboardingSlide = {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradient: [string, string];
  illustration: string;
};

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "welcome",
    icon: "sparkles",
    title: "Добро пожаловать\nв Progressio",
    description: "Ваш персональный помощник для управления задачами,\nмыслями и прогрессом",
    gradient: ["#6366F1", "#8B5CF6"] as const,
    illustration: "app",
  },
  {
    id: "tasks",
    icon: "checkbox",
    title: "Управляйте\nзадачами",
    description: "Приоритеты, папки, сроки и повторения.\nВсё под контролем с умной сортировкой",
    gradient: ["#3B82F6", "#06B6D4"] as const,
    illustration: "tasks",
  },
  {
    id: "mood",
    icon: "happy",
    title: "Записывайте\nнастроение",
    description: "Дневник эмоций с аналитикой.\nОтслеживайте паттерны и улучшайте жизнь",
    gradient: ["#EC4899", "#F59E0B"] as const,
    illustration: "diary",
  },
  {
    id: "start",
    icon: "rocket",
    title: "Готовы\nначать?",
    description: "Создайте первую задачу и сделайте шаг\nк своей цели прямо сейчас",
    gradient: ["#10B981", "#3B82F6"] as const,
    illustration: "start",
  },
];

export default function Index() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [todayQuote, setTodayQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  useEffect(() => {
    const quoteIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setTodayQuote(MOTIVATIONAL_QUOTES[quoteIndex]);
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const flatListRef = useRef<FlatList>(null);

  const [stats, setStats] = useState({ tasks: 0, completed: 0, diary: 0, notes: 0 });

  useEffect(() => {
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (hasCompletedOnboarding) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start();
      loadStats();
    }
  }, [hasCompletedOnboarding]);

  const checkOnboarding = async () => {
    try {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(!!done);
    } catch (e) {
      console.error("Error checking onboarding:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const db = await getDatabase();

      // Исправлено: используем is_completed вместо isCompleted — в SQLite колонка называется именно так (snake_case)
      const tasksResult = await db.getAllAsync("SELECT COUNT(*) as count FROM tasks WHERE is_completed = 0") as { count: number }[];
      const completedResult = await db.getAllAsync("SELECT COUNT(*) as count FROM tasks WHERE is_completed = 1") as { count: number }[];
      const diaryResult = await db.getAllAsync("SELECT COUNT(*) as count FROM diary_entries") as { count: number }[];
      const notesResult = await db.getAllAsync("SELECT COUNT(*) as count FROM notes") as { count: number }[];

      setStats({
        tasks: tasksResult[0]?.count || 0,
        completed: completedResult[0]?.count || 0,
        diary: diaryResult[0]?.count || 0,
        notes: notesResult[0]?.count || 0,
      });
    } catch (e) {
      console.error("Error loading stats:", e);
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    await AsyncStorage.setItem(QUOTES_KEY, new Date().toDateString());
    router.replace("/(tabs)");
  };

  const scrollToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleNext = () => {
    if (activeSlide < ONBOARDING_SLIDES.length - 1) {
      scrollToSlide(activeSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} />
    );
  }

  if (hasCompletedOnboarding) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.welcomeContent}>
          {/* Приветствие */}
          <Animated.View style={[styles.welcomeHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.welcomeIconContainer, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="hand-left" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.welcomeGreeting, { color: colors.muted }]}>Добрый день!</Text>
            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
              С возвращением в Progressio
            </Text>
          </Animated.View>

          {/* Статистика */}
          <Animated.View style={[styles.statsSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ваш прогресс</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <View style={[styles.statIconBg, { backgroundColor: "#3B82F620" }]}>
                  <Ionicons name="list" size={24} color="#3B82F6" />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.tasks}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Задач</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <View style={[styles.statIconBg, { backgroundColor: "#10B98120" }]}>
                  <Ionicons name="checkmark-done" size={24} color="#10B981" />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.completed}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Выполнено</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <View style={[styles.statIconBg, { backgroundColor: "#EC489920" }]}>
                  <Ionicons name="journal" size={24} color="#EC4899" />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.diary}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Записей</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <View style={[styles.statIconBg, { backgroundColor: "#F59E0B20" }]}>
                  <Ionicons name="document-text" size={24} color="#F59E0B" />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.notes}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Заметок</Text>
              </View>
            </View>
          </Animated.View>

          {/* Мотивационная цитата */}
          <Animated.View style={[styles.quoteSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.quoteCard, { backgroundColor: colors.card }]}>
              <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary} />
              <Text style={[styles.quoteText, { color: colors.foreground }]}>
                "{todayQuote.text}"
              </Text>
              <Text style={[styles.quoteAuthor, { color: colors.muted }]}>
                — {todayQuote.author}
              </Text>
            </View>
          </Animated.View>

          {/* Быстрые действия */}
          <Animated.View style={[styles.quickActions, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Быстрые действия</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }]}
                onPress={() => router.push("/(tabs)")}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.actionText, { color: colors.foreground }]}>Новая задача</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }]}
                onPress={() => router.push("/(tabs)/diary")}
              >
                <View style={[styles.actionIcon, { backgroundColor: "#EC489920" }]}>
                  <Ionicons name="happy" size={24} color="#EC4899" />
                </View>
                <Text style={[styles.actionText, { color: colors.foreground }]}>Запись в дневник</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Кнопка входа */}
          <Animated.View style={[styles.enterButtonContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity style={[styles.enterButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)")}>
              <Text style={styles.enterButtonText}>Перейти к задачам</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Онбординг ---
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.muted }]}>Пропустить</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveSlide(index);
        }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <View style={styles.slide}>
            <LinearGradient colors={item.gradient} style={styles.slideGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              {/* Иллюстрация/иконка */}
              <View style={styles.slideIconContainer}>
                <View style={styles.slideIconBg}>
                  <Ionicons name={item.icon as any} size={80} color="#FFFFFF" />
                </View>
              </View>

              {/* Контент */}
              <View style={styles.slideContent}>
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideDescription}>{item.description}</Text>
              </View>
            </LinearGradient>
          </View>
        )}
      />

      {/* Индикаторы */}
      <View style={styles.dotsContainer}>
        {ONBOARDING_SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            style={styles.dotWrapper}
            onPress={() => scrollToSlide(i)}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeSlide ? colors.primary : colors.border,
                  width: i === activeSlide ? 24 : 8,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Кнопка */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <LinearGradient colors={ONBOARDING_SLIDES[activeSlide].gradient} style={styles.nextButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.nextButtonText}>
              {activeSlide === ONBOARDING_SLIDES.length - 1 ? "Начать" : "Далее"}
            </Text>
            <Ionicons
              name={activeSlide === ONBOARDING_SLIDES.length - 1 ? "rocket" : "arrow-forward"}
              size={20}
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Common
  container: { flex: 1 },

  // Onboarding
  skipContainer: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  skipButton: { paddingVertical: 8, paddingHorizontal: 16 },
  skipText: { fontSize: 16, fontWeight: "500" },
  slide: { width, height: height * 0.85 },
  slideGradient: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  slideIconContainer: { marginBottom: 40 },
  slideIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  slideContent: { alignItems: "center" },
  slideTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 44,
  },
  slideDescription: {
    fontSize: 18,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 26,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  dotWrapper: { padding: 6 },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottomBar: { paddingHorizontal: 24, paddingBottom: 40 },
  nextButton: { borderRadius: 16, overflow: "hidden" },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  nextButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },

  // Welcome back
  welcomeContent: { padding: 24, paddingBottom: 40 },
  welcomeHeader: { alignItems: "center", marginTop: 20, marginBottom: 32 },
  welcomeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeGreeting: { fontSize: 18, marginBottom: 4 },
  welcomeTitle: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  statsSection: { marginBottom: 32 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 28, fontWeight: "800", marginBottom: 2 },
  statLabel: { fontSize: 13, fontWeight: "500" },
  quoteSection: { marginBottom: 32 },
  quoteCard: {
    padding: 20,
    borderRadius: 20,
    gap: 12,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    fontStyle: "italic",
  },
  quoteAuthor: { fontSize: 14, fontWeight: "500" },
  quickActions: { marginBottom: 32 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: { fontSize: 14, fontWeight: "600", flex: 1 },
  enterButtonContainer: { marginTop: 8 },
  enterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  enterButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  bottomPadding: { height: 40 },
});
