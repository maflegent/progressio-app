// app/index.tsx - обновленный экран приветствия
import { Colors } from "@/constants/Colors";
import { useAppTheme } from "@/contexts/SettingsContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function Index() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];

  // Анимации
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Запуск анимаций при монтировании
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const features = [
    {
      icon: "checkbox",
      title: "Умные задачи",
      description: "Матрица Эйзенхауэра, приоритеты и напоминания",
      color: "#6366F1",
    },
    {
      icon: "journal",
      title: "Дневник настроения",
      description: "Отслеживайте эмоции и находите паттерны",
      color: "#8B5CF6",
    },
    {
      icon: "document-text",
      title: "Заметки и идеи",
      description: "Организуйте мысли в удобных папках",
      color: "#EC4899",
    },
    {
      icon: "stats-chart",
      title: "Аналитика прогресса",
      description: "Визуализация ваших достижений",
      color: "#10B981",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Фоновые декоративные элементы */}
      <View style={styles.backgroundDecor}>
        <View
          style={[
            styles.decorCircle,
            styles.decorCircle1,
            { backgroundColor: colors.primary + "10" },
          ]}
        />
        <View
          style={[
            styles.decorCircle,
            styles.decorCircle2,
            { backgroundColor: colors.primary + "15" },
          ]}
        />
        <View
          style={[
            styles.decorCircle,
            styles.decorCircle3,
            { backgroundColor: colors.primary + "05" },
          ]}
        />
      </View>

      {/* Основной контент */}
      <View style={styles.content}>
        {/* Логотип/иконка */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, "#8B5CF6"]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkbox" size={60} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        {/* Заголовок */}
        <Animated.Text
          style={[
            styles.title,
            { color: colors.foreground },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          Progressio
        </Animated.Text>

        {/* Подзаголовок */}
        <Animated.Text
          style={[
            styles.subtitle,
            { color: colors.muted },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          Ваш персональный органайзер для задач, мыслей и прогресса
        </Animated.Text>

        {/* Функции */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {features.map((feature, index) => (
            <View
              key={index}
              style={[styles.featureCard, { backgroundColor: colors.card }]}
            >
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: feature.color + "20" },
                ]}
              >
                <Ionicons
                  name={feature.icon as any}
                  size={28}
                  color={feature.color}
                />
              </View>
              <View style={styles.featureInfo}>
                <Text
                  style={[styles.featureTitle, { color: colors.foreground }]}
                >
                  {feature.title}
                </Text>
                <Text
                  style={[styles.featureDescription, { color: colors.muted }]}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Кнопка начала */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Link href="/(tabs)" asChild>
            <TouchableOpacity activeOpacity={0.8} style={styles.startButton}>
              <LinearGradient
                colors={[colors.primary, "#8B5CF6"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Начать пользоваться</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </Animated.View>

        {/* Версия */}
        <Animated.Text
          style={[
            styles.version,
            { color: colors.muted },
            { opacity: fadeAnim },
          ]}
        >
          Версия 1.0.0
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecor: {
    position: "absolute",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  decorCircle: {
    position: "absolute",
    borderRadius: 1000,
  },
  decorCircle1: {
    width: width * 0.6,
    height: width * 0.6,
    top: -width * 0.2,
    right: -width * 0.2,
  },
  decorCircle2: {
    width: width * 0.4,
    height: width * 0.4,
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  decorCircle3: {
    width: width * 0.3,
    height: width * 0.3,
    top: height * 0.3,
    left: -width * 0.05,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 40,
    gap: 16,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 16,
  },
  startButton: {
    width: "100%",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  version: {
    fontSize: 14,
    opacity: 0.6,
  },
});
