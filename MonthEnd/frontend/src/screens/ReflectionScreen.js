import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Dimensions, 
    ActivityIndicator, 
    TouchableOpacity,
    Alert 
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getReflection } from '../services/homeService';

const screenWidth = Dimensions.get("window").width;

export default function ReflectionScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState([]);
    const [insights, setInsights] = useState([]);

    useEffect(() => {
        fetchReflection();
    }, []);

    // DYNAMIC FORMATTER: Solves the "one-word underscore" issue forever.
    // If ML sends "emotionally_volatile", this turns it into "Emotionally volatile"
    // If ML sends a normal sentence, it just capitalizes it and leaves it alone.
    const formatPattern = (str) => {
        if (!str) return "";
        let cleaned = str.replace(/_/g, ' ').trim();
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    };

    const fetchReflection = async () => {
        try {
            const res = await getReflection();
            
            if (res.data.success) {
                const dailyData = res.data.dailyTrend || [];
                setTrendData(dailyData.length > 0 ? dailyData : [0]);

                const mlOut = res.data.mlOutput;
                let combinedList = [];
                
                if (mlOut) {
                    // 1. Extract Summary & Strip out repetitive AI boilerplate
                    if (mlOut.insights?.summary) {
                        let cleanSummary = mlOut.insights.summary
                            .replace(/Based on your (comprehensive )?financial profile:?\s*/i, "")
                            .replace(/Here is your insight:?\s*/i, "");
                        
                        cleanSummary = cleanSummary.charAt(0).toUpperCase() + cleanSummary.slice(1);
                        combinedList.push(cleanSummary);
                    }
                    
                    // 2. Extract Tags and run them through the dynamic formatter
                    if (mlOut.insights?.tags?.length > 0) {
                        mlOut.insights.tags.forEach(tag => {
                            combinedList.push(formatPattern(tag));
                        });
                    } else if (mlOut.behavioral?.dominantPattern) {
                        combinedList.push(formatPattern(mlOut.behavioral.dominantPattern));
                    }
                }

                // Fallback
                if (combinedList.length === 0) {
                    combinedList = [
                        "Maintaining stable routine", 
                        "No severe anomalies detected in your spending"
                    ];
                }
                
                setInsights(combinedList);
            }
        } catch (err) {
            console.log("Reflection Fetch Error:", err);
            Alert.alert("Error", "Could not load your monthly reflection.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#8ABEB7" />
            </View>
        );
    }

    const chartLabels = trendData.map((_, i) => (i % 4 === 0 || i === 0 ? String(i + 1) : ""));

    return (
        <View style={styles.container}>
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Month Track</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.chartWrapper}>
                    <Text style={styles.chartTitle}>Spending variability this month</Text>
                    <LineChart
                        data={{
                            labels: chartLabels,
                            datasets: [{ data: trendData }]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        withVerticalLines={false}
                        withHorizontalLines={true}
                        yAxisLabel="₹"
                        formatYLabel={(value) => {
                            const num = Number(value);
                            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
                            return num.toFixed(0);
                        }}
                        chartConfig={{
                            backgroundColor: COLORS.card,
                            backgroundGradientFrom: COLORS.card,
                            backgroundGradientTo: COLORS.card,
                            decimalPlaces: 0,
                            color: (opacity = 1) => '#8ABEB7',
                            labelColor: (opacity = 1) => COLORS.textSecondary,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "3", strokeWidth: "2", stroke: '#8ABEB7' },
                            propsForBackgroundLines: { strokeDasharray: "", stroke: "rgba(255,255,255,0.05)" },
                            propsForLabels: { fontSize: 11 }
                        }}
                        bezier
                        style={styles.chart}
                    />
                </View>

                {/* Unified Key Patterns List */}
                <View style={styles.patternsSection}>
                    <Text style={styles.sectionTitle}>Key Patterns</Text>
                    
                    {insights.map((item, index) => (
                        <View key={index} style={styles.insightCard}>
                            <View style={styles.bulletPoint} />
                            <Text style={styles.insightText}>{item}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.footerSection}>
                    <Text style={styles.quoteText}>Patterns don't judge. They inform.</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: COLORS.background 
    },
    navHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: 60, 
        marginBottom: 10,
        paddingHorizontal: 20
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    chartWrapper: {
        marginTop: 10,
        marginBottom: 30,
    },
    chartTitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 15,
        fontWeight: '600'
    },
    chart: {
        borderRadius: 16,
    },
    patternsSection: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 15,
    },
    insightCard: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.input,
    },
    bulletPoint: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#8ABEB7',
        marginRight: 12,
        marginTop: 6, 
        alignSelf: 'flex-start'
    },
    insightText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        lineHeight: 22,
        flex: 1,
    },
    footerSection: {
        alignItems: 'center',
        marginTop: 10,
    },
    quoteText: {
        color: '#8ABEB7', 
        fontSize: 14,
        fontWeight: 'bold',
        fontStyle: 'italic'
    }
});