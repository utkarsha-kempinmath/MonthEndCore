import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Dimensions,
  TouchableOpacity
} from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { COLORS } from "../constants/theme";
import { getAnalysis } from "../services/homeService";

const screenWidth = Dimensions.get("window").width;

const GREEN = "#2ED573";
const ORANGE = "#FF8C3C";

// Custom grouped bar chart using react-native-svg
function GroupedBarChart({ stats }) {
  if (!stats || stats.length === 0) return null;

  const chartWidth = screenWidth - 72;  // card padding
  const chartHeight = 200;
  const paddingLeft = 44;
  const paddingBottom = 36;
  const paddingTop = 12;

  const plotW = chartWidth - paddingLeft;
  const plotH = chartHeight - paddingBottom - paddingTop;

  const maxVal = Math.max(...stats.map(s => Math.max(s.expected, s.actual)), 1);

  const groupCount = stats.length;
  const groupWidth = plotW / groupCount;
  const barGap = 4;
  const barW = Math.min((groupWidth - barGap * 3) / 2, 22);

  // Y-axis ticks
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((maxVal / tickCount) * i)
  );

  const toY = (val) => paddingTop + plotH - (val / maxVal) * plotH;

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Grid lines + Y labels */}
      {ticks.map((tick, i) => {
        const y = toY(tick);
        return (
          <React.Fragment key={i}>
            <Line
              x1={paddingLeft} y1={y}
              x2={chartWidth} y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
            <SvgText
              x={paddingLeft - 6} y={y + 4}
              fontSize={9} fill="rgba(183,169,154,0.8)"
              textAnchor="end"
            >
              {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Bars */}
      {stats.map((item, i) => {
        const groupX = paddingLeft + i * groupWidth + groupWidth / 2;
        const expX = groupX - barW - barGap / 2;
        const actX = groupX + barGap / 2;

        const expH = Math.max((item.expected / maxVal) * plotH, 2);
        const actH = Math.max((item.actual / maxVal) * plotH, item.actual > 0 ? 2 : 0);

        const expY = paddingTop + plotH - expH;
        const actY = paddingTop + plotH - actH;

        const label = item.category.length > 5
          ? item.category.slice(0, 5) + "…"
          : item.category;

        return (
          <React.Fragment key={i}>
            {/* Expected bar — green */}
            <Rect
              x={expX} y={expY}
              width={barW} height={expH}
              fill={GREEN} rx={3}
            />
            {/* Actual bar — orange */}
            {item.actual > 0 && (
              <Rect
                x={actX} y={actY}
                width={barW} height={actH}
                fill={ORANGE} rx={3}
              />
            )}
            {/* X label */}
            <SvgText
              x={groupX} y={chartHeight - 6}
              fontSize={9} fill="rgba(183,169,154,0.9)"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* X axis line */}
      <Line
        x1={paddingLeft} y1={paddingTop + plotH}
        x2={chartWidth} y2={paddingTop + plotH}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1}
      />
    </Svg>
  );
}

export default function ExpectedVSActualScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [data, setData] = useState({ stats: [], insights: [], month: "" });
  const [showInsight, setShowInsight] = useState(true);

  useEffect(() => {
    if (isFocused) fetchAnalysis();
  }, [isFocused]);

  const fetchAnalysis = async () => {
    try {
      const res = await getAnalysis();
      if (res.data.success) setData(res.data);
    } catch (err) {
      console.log("Analysis Error:", err);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>

      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Expected VS Actual</Text>

      {/* Insight Card */}
      {showInsight && data.insights.length > 0 && (
        <View style={styles.insightBox}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb-outline" size={18} color={COLORS.mutedYellow} />
            <Text style={styles.insightTitle}>Insight</Text>
            <TouchableOpacity onPress={() => setShowInsight(false)}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {data.insights.map((insight, i) => (
            <Text key={i} style={styles.insightText}>• {insight}</Text>
          ))}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
          <Text style={styles.legendLabel}>Expected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ORANGE }]} />
          <Text style={styles.legendLabel}>Actual</Text>
        </View>
      </View>

      {/* Custom Grouped Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionLabel}>Monthly Comparison</Text>
        {data.stats.length > 0 ? (
          <GroupedBarChart stats={data.stats} />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={40} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No data for {data.month}</Text>
          </View>
        )}
      </View>

      {/* Breakdown Table */}
      <Text style={styles.sectionLabel}>Breakdown</Text>
      <View style={styles.statsCard}>
        {/* Header */}
        <View style={[styles.statRow, styles.tableHeader]}>
          <Text style={[styles.colText, { flex: 1.5, color: COLORS.textSecondary }]}>Category</Text>
          <Text style={[styles.colText, { color: COLORS.textSecondary }]}>Plan</Text>
          <Text style={[styles.colText, { color: COLORS.textSecondary }]}>Spent</Text>
          <Text style={[styles.colText, { color: COLORS.textSecondary }]}>Diff</Text>
        </View>

        {data.stats.map((item, index) => {
          const isOver = item.diff > 0;
          const diffColor = isOver ? "#FF6B6B" : GREEN;
          const diffPrefix = isOver ? "+" : "";

          return (
            <View
              key={index}
              style={[styles.statRow, index % 2 === 0 && styles.statRowAlt]}
            >
              <View style={{ flex: 1.5, flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.stripDot, { backgroundColor: isOver ? "#FF6B6B" : GREEN }]} />
                <Text style={styles.catName} numberOfLines={1}>{item.category}</Text>
              </View>
              <Text style={styles.valText}>₹{item.expected}</Text>
              <Text style={[styles.valText, { color: isOver ? ORANGE : COLORS.textPrimary }]}>
                ₹{item.actual}
              </Text>
              <Text style={[styles.valText, { color: diffColor, fontWeight: "700" }]}>
                {diffPrefix}{item.diff}
              </Text>
            </View>
          );
        })}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backBtn: { marginBottom: 6 },
  pageTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  insightBox: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(236,204,104,0.3)",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  insightTitle: {
    color: COLORS.mutedYellow,
    fontWeight: "700",
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  insightText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 19,
    opacity: 0.85,
  },
  legendRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 10,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 10,
  },
  tableHeader: {
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 10,
  },
  statRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statRowAlt: {
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  stripDot: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginRight: 10,
  },
  catName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  colText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  valText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12,
    textAlign: "center",
  },
});