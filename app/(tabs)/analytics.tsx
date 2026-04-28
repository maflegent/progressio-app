// app/(tabs)/analytics.tsx - улучшенная аналитика
import { Colors } from "@/constants/Colors";
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

type TimeRange = "day" | "week" | "month" | "year";

export default function AnalyticsScreen() {
  const colorScheme = useAppTheme();
  const colors = Colors[colorScheme];
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "priorities" | "folders" | "tags">("overview");

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
    { id: "day" as TimeRange, label: "День" },
    { id: "week" as TimeRange, label: "Неделя" },
    { id: "month" as TimeRange, label: "Месяц" },
    { id: "year" as TimeRange, label: "Год" },
  ];

  const tabs = [
    { id: "overview" as const, label: "Обзор", icon: "grid" },
    { id: "priorities" as const, label: "Приоритеты", icon: "flag" },
    { id: "folders" as const, label: "Папки", icon: "folder" },
    { id: "tags" as const, label: "Теги", icon: "pricetag" },
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

  const productivityData = data.productivity[timeRange === "day" ? "week" : timeRange] || data.productivity.week;
  const maxDaily = Math.max(...data.dailyStats.map((d) => d.tasksCreated), 1);
  const maxMonthly = Math.max(...data.monthlyStats.map((m) => m.tasksCreated), 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.header, GlobalStyles.section]}>
          <View>
            <Text style={[GlobalStyles.title, { color: colors.foreground }]}>
              Аналитика
            </Text>
            <Text style={[GlobalStyles.subtitle, { color: colors.muted }]}>
              {data.overview.completedTasks} из {data.overview.totalTasks} задач выполнено
            </Text>
          </View>
        </View>

        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <View style={styles.timeRangeSelector}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.id}
                style={[
                  styles.timeRangeButton,
                  timeRange === range.id && { backgroundColor: colors.primary },
                ]}
                onPress={() => setTimeRange(range.id)}
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

        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
            <View style={styles.overviewRow}>
              <OverviewStat
                label="Всего"
                value={data.overview.totalTasks}
                icon="list"
                color={colors.primary}
                colors={colors}
              />
              <OverviewStat
                label="Выполнено"
                value={data.overview.completedTasks}
                icon="checkmark-circle"
                color="#10B981"
                colors={colors}
              />
              <OverviewStat
                label="В работе"
                value={data.overview.activeTasks}
                icon="time"
                color="#F59E0B"
                colors={colors}
              />
              <OverviewStat
                label="Просрочено"
                value={data.overview.overdueTasks}
                icon="alert-circle"
                color="#EF4444"
                colors={colors}
              />
            </View>
          </View>
        </View>

        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <View style={[styles.mainStatCard, { backgroundColor: colors.card }]}>
            <View style={styles.mainStatHeader}>
              <Text style={[styles.mainStatTitle, { color: colors.cardForeground }]}>
                Продуктивность
              </Text>
              <View
                style={[
                  styles.trendBadge,
                  {
                    backgroundColor:
                      productivityData.trend === "up"
                        ? "rgba(16, 185, 129, 0.1)"
                        : productivityData.trend === "down"
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(156, 163, 175, 0.1)",
                  },
                ]}
              >
                <Ionicons
                  name={
                    productivityData.trend === "up"
                      ? "trending-up"
                      : productivityData.trend === "down"
                      ? "trending-down"
                      : "remove"
                  }
                  size={16}
                  color={
                    productivityData.trend === "up"
                      ? "#10B981"
                      : productivityData.trend === "down"
                      ? "#EF4444"
                      : "#9CA3AF"
                  }
                />
                <Text
                  style={[
                    styles.trendText,
                    {
                      color:
                        productivityData.trend === "up"
                          ? "#10B981"
                          : productivityData.trend === "down"
                          ? "#EF4444"
                          : "#9CA3AF",
                    },
                  ]}
                >
                  {productivityData.change >= 0 ? "+" : ""}{productivityData.change}%
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
                      styles.progressFillBar,
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

        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Прогресс целей
          </Text>
          {data.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} colors={colors} />
          ))}
        </View>

        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <View style={styles.tabSelector}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  activeTab === tab.id && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={activeTab === tab.id ? colors.primaryForeground : colors.muted}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id
                      ? { color: colors.primaryForeground }
                      : { color: colors.muted },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "overview" && (
            <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>
                    Текущая серия
                  </Text>
                  <Text style={[styles.metricValue, { color: "#10B981" }]}>
                    {data.metrics.currentStreak.value} дней
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>
                    Рекорд
                  </Text>
                  <Text style={[styles.metricValue, { color: "#F59E0B" }]}>
                    {data.metrics.longestStreak} дней
                  </Text>
                </View>
              </View>
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>
                    Среднее настроение
                  </Text>
                  <Text style={[styles.metricValue, { color: "#8B5CF6" }]}>
                    {data.metrics.averageMood.value}/5
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>
                    Выполнение
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.primary }]}>
                    {data.metrics.completionRate.value}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === "priorities" && (
            <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
              {data.priorities.map((p) => (
                <ProgressBarRow
                  key={p.priority}
                  label={getPriorityLabel(p.priority)}
                  value={p.completed}
                  total={p.total}
                  rate={p.completionRate}
                  color={getPriorityColor(p.priority)}
                  colors={colors}
                />
              ))}
            </View>
          )}

          {activeTab === "folders" && (
            <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
              {data.folders.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Нет данных о папках
                </Text>
              ) : (
                data.folders.map((f, i) => (
                  <ProgressBarRow
                    key={f.folder}
                    label={f.folder}
                    value={f.completed}
                    total={f.total}
                    rate={f.completionRate}
                    color={getFolderColor(i)}
                    colors={colors}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === "tags" && (
            <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
              {data.tags.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Нет данных о тегах
                </Text>
              ) : (
                data.tags.slice(0, 8).map((t) => (
                  <ProgressBarRow
                    key={t.tag}
                    label={`#${t.tag}`}
                    value={t.completed}
                    total={t.total}
                    rate={t.completionRate}
                    color={colors.primary}
                    colors={colors}
                  />
                ))
              )}
            </View>
          )}
        </View>

        <View style={[GlobalStyles.section, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Недельная активность
          </Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <View style={styles.chart}>
              {data.dailyStats.map((stat, index) => (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.chartBar}>
                    <View
                      style={[
                        styles.barCompleted,
                        {
                          height: Math.max(
                            (stat.tasksCompleted / maxDaily) * 60,
                            4
                          ),
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartDay, { color: colors.muted }]}>
                    {stat.dayName}
                  </Text>
                  <Text style={[styles.chartValue, { color: colors.cardForeground }]}>
                    {stat.tasksCompleted}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[GlobalStyles.section, { paddingHorizontal: 16, paddingBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Месячная динамика
          </Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <View style={styles.chart}>
              {data.monthlyStats.map((stat, index) => (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.chartBar}>
                    <View
                      style={[
                        styles.barCompleted,
                        {
                          height: Math.max(
                            (stat.tasksCompleted / maxMonthly) * 60,
                            4
                          ),
                          backgroundColor: "#10B981",
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartDay, { color: colors.muted }]}>
                    {stat.month}
                  </Text>
                  <Text style={[styles.chartValue, { color: colors.cardForeground }]}>
                    {stat.completionRate}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View
          style={[
            GlobalStyles.section,
            { paddingHorizontal: 16, paddingBottom: 100 },
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

          <View style={[styles.insightsCard, { backgroundColor: colors.card }]}>
            {data.insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <View
                  style={[styles.insightBullet, { backgroundColor: colors.primary }]}
                />
                <Text style={[styles.insightText, { color: colors.cardForeground }]}>
                  {insight}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const OverviewStat = ({
  label,
  value,
  icon,
  color,
  colors,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  colors: any;
}) => (
  <View style={styles.overviewStat}>
    <View style={[styles.overviewIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={[styles.overviewValue, { color: colors.cardForeground }]}>
      {value}
    </Text>
    <Text style={[styles.overviewLabel, { color: colors.muted }]}>{label}</Text>
  </View>
);

const GoalCard = ({ goal, colors }: { goal: any; colors: any }) => {
  const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100);

  return (
    <View style={[styles.goalCard, { backgroundColor: colors.card }]}>
      <View style={styles.goalHeader}>
        <Text style={[styles.goalTitle, { color: colors.cardForeground }]}>
          {goal.title}
        </Text>
        <Text style={[styles.goalProgress, { color: colors.primary }]}>
          {goal.current}/{goal.target} {goal.unit}
        </Text>
      </View>
      <View style={[styles.goalProgressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.goalProgressFill,
            { width: `${progress}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
    </View>
  );
};

const ProgressBarRow = ({
  label,
  value,
  total,
  rate,
  color,
  colors,
}: {
  label: string;
  value: number;
  total: number;
  rate: number;
  color: string;
  colors: any;
}) => (
  <View style={styles.progressRow}>
    <View style={styles.progressLabelRow}>
      <Text style={[styles.progressLabel, { color: colors.cardForeground }]}>
        {label}
      </Text>
      <Text style={[styles.progressValue, { color: colors.muted }]}>
        {value}/{total}
      </Text>
    </View>
    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.progressFillBar,
          { width: `${rate}%`, backgroundColor: color },
        ]}
      />
    </View>
  </View>
);

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    urgent: "Срочно",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };
  return labels[priority] || priority;
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    urgent: "#EF4444",
    high: "#F59E0B",
    medium: "#3B82F6",
    low: "#10B981",
  };
  return colors[priority] || "#6B7280";
};

const getFolderColor = (index: number): string => {
  const colors = ["#3B82F6", "#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 16, fontSize: 16 },
  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  timeRangeSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  timeRangeText: { fontSize: 14, fontWeight: "500" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  overviewCard: { borderRadius: 16, padding: 16 },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewStat: { alignItems: "center", flex: 1 },
  overviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  overviewValue: { fontSize: 20, fontWeight: "700" },
  overviewLabel: { fontSize: 12, marginTop: 4 },
  mainStatCard: { borderRadius: 16, padding: 20 },
  mainStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mainStatTitle: { fontSize: 16, fontWeight: "600" },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: { fontSize: 12, fontWeight: "600" },
  mainStatContent: { alignItems: "center" },
  mainStatValue: { fontSize: 48, fontWeight: "700", marginBottom: 12 },
  progressContainer: { width: "100%" },
  progressBackground: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  tabText: { fontSize: 12, fontWeight: "500" },
  dataCard: { borderRadius: 16, padding: 16, gap: 12 },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItem: { flex: 1, alignItems: "center" },
  metricLabel: { fontSize: 12, marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: "700" },
  emptyText: { textAlign: "center", fontSize: 14 },
  chartCard: { borderRadius: 16, padding: 16 },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
  },
  chartColumn: { alignItems: "center", flex: 1 },
  chartBar: { height: 60, justifyContent: "flex-end" },
  barCompleted: {
    width: 20,
    borderRadius: 4,
  },
  chartDay: { fontSize: 11, marginTop: 8 },
  chartValue: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  progressRow: { marginBottom: 12 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: { fontSize: 14, fontWeight: "500" },
  progressValue: { fontSize: 12 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFillBar: { height: "100%", borderRadius: 3 },
  goalCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  goalTitle: { fontSize: 14, fontWeight: "600" },
  goalProgress: { fontSize: 14, fontWeight: "600" },
  goalProgressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  goalProgressFill: { height: "100%", borderRadius: 3 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  insightsCard: { borderRadius: 16, padding: 16, gap: 12 },
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
});