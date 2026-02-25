// app/(tabs)/analytics.tsx - улучшенная версия без заглушек
import { Colors } from "@/constants/Colors";
import { FeatureIcons } from "@/constants/Icons";
import { GlobalStyles } from "@/constants/Styles";
import { useAppTheme } from "@/contexts/SettingsContext";
import { AnalyticsData, analyticsStorage } from "@/utils/analyticsStorage";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AnalyticsScreen() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const analyticsData = await analyticsStorage.getAnalyticsData();
      setData(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const timeRanges = [
    { id: "week", label: "Неделя" },
    { id: "month", label: "Месяц" },
    { id: "year", label: "Год" },
  ];

  if (isLoading || !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="stats-chart-outline" size={64} color={colors.muted} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Загрузка аналитики...
          </Text>
        </View>
      </View>
    );
  }

  const productivityData = data.productivity[timeRange];
  const maxTasks = Math.max(...data.weeklyStats.map((stat) => stat.tasks), 1);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Заголовок и селектор периода */}
        <View style={[styles.header, GlobalStyles.section]}>
          <View>
            <Text style={[GlobalStyles.title, { color: colors.foreground }]}>
              Аналитика
            </Text>
            <Text style={[GlobalStyles.subtitle, { color: colors.muted }]}>
              Отслеживайте свой прогресс и улучшения
            </Text>
          </View>

          {/* Селектор периода */}
          <View style={styles.timeRangeSelector}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.id}
                style={[
                  styles.timeRangeButton,
                  timeRange === range.id && { backgroundColor: colors.primary },
                ]}
                onPress={() => setTimeRange(range.id as any)}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    timeRange === range.id
                      ? { color: colors.primaryForeground }
                      : { color: colors.muted },
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Основная статистика */}
        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <View
            style={[
              styles.mainStatCard,
              GlobalStyles.shadow,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={styles.mainStatHeader}>
              <Text
                style={[styles.mainStatTitle, { color: colors.cardForeground }]}
              >
                Продуктивность
              </Text>
              <View
                style={[
                  styles.trendBadge,
                  {
                    backgroundColor:
                      productivityData.trend === "up"
                        ? "rgba(16, 185, 129, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                  },
                ]}
              >
                <Ionicons
                  name={
                    productivityData.trend === "up"
                      ? "trending-up"
                      : "trending-down"
                  }
                  size={16}
                  color={
                    productivityData.trend === "up" ? "#10B981" : "#EF4444"
                  }
                />
                <Text
                  style={[
                    styles.trendText,
                    {
                      color:
                        productivityData.trend === "up" ? "#10B981" : "#EF4444",
                    },
                  ]}
                >
                  {productivityData.change}
                </Text>
              </View>
            </View>

            <View style={styles.mainStatContent}>
              <Text style={[styles.mainStatValue, { color: colors.primary }]}>
                {productivityData.value}%
              </Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBackground,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${productivityData.value}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Ключевые метрики */}
        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Ключевые метрики
          </Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Задачи выполнено"
              value={data.metrics.tasksCompleted.value}
              progress={data.metrics.tasksCompleted.progress}
              icon={FeatureIcons.analytics.productivity}
              color="#3B82F6"
              colors={colors}
            />

            <MetricCard
              title="Дней подряд"
              value={data.metrics.streak.value}
              progress={data.metrics.streak.progress}
              icon={FeatureIcons.analytics.consistency}
              color="#10B981"
              colors={colors}
            />

            <MetricCard
              title="Средняя оценка"
              value={data.metrics.averageMood.value}
              progress={data.metrics.averageMood.progress}
              icon="star"
              color="#F59E0B"
              colors={colors}
            />
          </View>
        </View>

        {/* Еженедельная статистика */}
        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Недельная активность
          </Text>
          <View
            style={[
              styles.weeklyCard,
              GlobalStyles.shadow,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={styles.weeklyChart}>
              {data.weeklyStats.map((stat, index) => (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.chartBars}>
                    <View
                      style={[
                        styles.totalBar,
                        {
                          height: (stat.tasks / maxTasks) * 80,
                          backgroundColor: `${colors.primary}20`,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.completedBar,
                        {
                          height: (stat.completed / maxTasks) * 80,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartDay, { color: colors.muted }]}>
                    {stat.day}
                  </Text>
                  <Text
                    style={[
                      styles.chartValue,
                      { color: colors.cardForeground },
                    ]}
                  >
                    {stat.completed}/{stat.tasks}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Рекомендации */}
        <View
          style={[
            GlobalStyles.section,
            { paddingHorizontal: 16, paddingBottom: 32 },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Рекомендации
            </Text>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.insightsCard,
              GlobalStyles.shadow,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={styles.insightsHeader}>
              <Ionicons
                name={FeatureIcons.analytics.insights}
                size={24}
                color={colors.primary}
              />
              <Text
                style={[styles.insightsTitle, { color: colors.cardForeground }]}
              >
                Персональные рекомендации
              </Text>
            </View>

            <View style={styles.insightsList}>
              {data.insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View
                    style={[
                      styles.insightBullet,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.insightText,
                      { color: colors.cardForeground },
                    ]}
                  >
                    {insight}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.insightsButton} onPress={onRefresh}>
              <Text
                style={[styles.insightsButtonText, { color: colors.primary }]}
              >
                Обновить рекомендации
              </Text>
              <Ionicons name="refresh" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Компонент карточки метрики
const MetricCard = ({
  title,
  value,
  progress,
  icon,
  color,
  colors,
}: {
  title: string;
  value: string;
  progress: number;
  icon: any;
  color: string;
  colors: any;
}) => (
  <View
    style={[
      styles.metricCard,
      GlobalStyles.shadow,
      { backgroundColor: colors.card },
    ]}
  >
    <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.metricTitle, { color: colors.cardForeground }]}>
      {title}
    </Text>
    <Text style={[styles.metricValue, { color: color }]}>{value}</Text>
    <View style={styles.metricProgress}>
      <View
        style={[styles.metricProgressBar, { backgroundColor: colors.border }]}
      >
        <View
          style={[
            styles.metricProgressFill,
            {
              width: `${progress}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[styles.metricProgressText, { color: colors.muted }]}>
        {progress}%
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  mainStatCard: {
    borderRadius: 20,
    padding: 24,
  },
  mainStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  mainStatTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  mainStatContent: {
    alignItems: "center",
  },
  mainStatValue: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 16,
  },
  progressContainer: {
    width: "100%",
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  metricIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  metricProgress: {
    width: "100%",
  },
  metricProgressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    overflow: "hidden",
  },
  metricProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  metricProgressText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  weeklyCard: {
    borderRadius: 16,
    padding: 20,
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
  },
  chartColumn: {
    alignItems: "center",
    flex: 1,
  },
  chartBars: {
    position: "relative",
    height: 80,
    width: 16,
    marginBottom: 8,
  },
  totalBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderRadius: 8,
  },
  completedBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderRadius: 8,
  },
  chartDay: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 10,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  insightsCard: {
    borderRadius: 16,
    padding: 20,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  insightsList: {
    gap: 12,
    marginBottom: 20,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  insightBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  insightsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  insightsButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
