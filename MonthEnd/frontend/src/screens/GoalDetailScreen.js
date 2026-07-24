import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/theme';
import { getGoalAnalysis, updateGoal, deleteGoal } from '../services/goalService';

const screenWidth = Dimensions.get("window").width;

export default function GoalDetailScreen({ route, navigation }) {
    const { goalId } = route.params;
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [updateModal, setUpdateModal] = useState(false);
    const [addAmount, setAddAmount] = useState('');

    useEffect(() => {
        fetchGoalDetails();
    }, []);

    const fetchGoalDetails = async () => {
        try {
            const res = await getGoalAnalysis(goalId);
            setAnalysis(res.data);
        } catch (err) {
            if (err.message === 'Network Error') {
                Alert.alert("No Internet", "Please check your network connection and try again.");
            } else {
                Alert.alert("Error", "Could not load goal details.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSavings = async () => {
        if (!addAmount) return;
        
        try {
            const newTotal = analysis.goal.savedAmount + Number(addAmount);
            await updateGoal(goalId, { savedAmount: newTotal });
            setUpdateModal(false);
            setAddAmount('');
            fetchGoalDetails(); 
        } catch (err) {
            if (err.message === 'Network Error') {
                Alert.alert("No Internet", "Please check your network connection and try again.");
            } else {
                Alert.alert("Error", "Could not update savings.");
            }
        }
    };

    const handleDeleteGoal = () => {
        Alert.alert(
            "Delete Goal",
            "Are you sure you want to delete this goal? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteGoal(goalId);
                            navigation.goBack();
                        } catch (err) {
                            if (err.message === 'Network Error') {
                                Alert.alert("No Internet", "Please check your network connection and try again.");
                            } else {
                                Alert.alert("Error", "Could not delete goal.");
                            }
                        }
                    }
                }
            ]
        );
    };

    if (loading || !analysis) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.accentOrange} />
            </View>
        );
    }

    const { goal, percentComplete, insights } = analysis;

    const chartData = {
        labels: ["Start", "Now"],
        datasets: [
            {
                data: [0, goal.savedAmount || 0],
                color: (opacity = 1) => COLORS.primaryPurple, 
                strokeWidth: 2 
            }
        ]
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.topHeaderText}>Goal Tracking</Text>
                {/* Delete button in header */}
                <TouchableOpacity onPress={handleDeleteGoal} style={styles.deleteHeaderBtn}>
                    <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.mainGoalTitle}>{goal.name}</Text>
                </View>

                <View style={styles.splitRow}>
                    <View style={[styles.infoBlock, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.smallTitle}>Target</Text>
                        <Text style={styles.smallValue}>₹{goal.targetAmount.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.infoBlock, { flex: 1 }]}>
                        <Text style={styles.smallTitle}>Timeline</Text>
                        <Text style={styles.smallValue}>{goal.timelineMonths} Months</Text>
                    </View>
                </View>

                <View style={styles.infoBlock}>
                    <Text style={styles.smallTitle}>Progress</Text>
                    <Text style={styles.smallValue}>₹{goal.savedAmount.toLocaleString()} Saved</Text>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressTextRow}>
                        <Text style={styles.progressLabel}>Completion</Text>
                        <Text style={styles.progressLabel}>{Math.round(percentComplete)}%</Text>
                    </View>
                    <View style={styles.track}>
                        <View style={[styles.fill, { width: `${percentComplete}%` }]} />
                    </View>
                </View>

                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Savings over time</Text>
                    <LineChart
                        data={chartData}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={{
                            backgroundColor: COLORS.card,
                            backgroundGradientFrom: COLORS.card,
                            backgroundGradientTo: COLORS.card,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            labelColor: (opacity = 1) => COLORS.textSecondary,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.accentOrange }
                        }}
                        bezier
                        style={styles.chartStyle}
                    />
                </View>

                {insights && insights.length > 0 && (
                    <View style={styles.insightsBox}>
                        <Text style={styles.insightsTitle}>MonthEnd Insights</Text>
                        {insights.map((insight, idx) => (
                            <Text key={idx} style={styles.insightText}>• {insight}</Text>
                        ))}
                    </View>
                )}

                <TouchableOpacity style={styles.updateBtn} onPress={() => setUpdateModal(true)}>
                    <Text style={styles.updateBtnText}>Add Savings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteGoal}>
                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteBtnText}>Delete Goal</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </View>

            <Modal visible={updateModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Record Savings</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Amount to add (₹)" 
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={addAmount}
                            onChangeText={setAddAmount}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.card }]} onPress={() => setUpdateModal(false)}>
                                <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.accentOrange }]} onPress={handleUpdateSavings}>
                                <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background }, 
    topHeader: { paddingTop: 60, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { padding: 8 },
    deleteHeaderBtn: { padding: 8 },
    topHeaderText: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
    content: { padding: 20 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    mainGoalTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary },
    
    infoBlock: { backgroundColor: COLORS.card, padding: 18, borderRadius: 16, marginBottom: 15, justifyContent: 'center', elevation: 2 },
    splitRow: { flexDirection: 'row', justifyContent: 'space-between' },
    smallTitle: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 4 },
    smallValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
    
    progressContainer: { marginTop: 10, marginBottom: 30 },
    progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary },
    track: { height: 12, backgroundColor: COLORS.input, borderRadius: 10, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: COLORS.primaryPurple, borderRadius: 10 },
    
    chartContainer: { marginBottom: 30, alignItems: 'center' },
    chartTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, alignSelf: 'flex-start', marginBottom: 15 },
    chartStyle: { borderRadius: 16 },

    insightsBox: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 18, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: COLORS.input },
    insightsTitle: { fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 12, fontSize: 16 },
    insightText: { color: COLORS.textSecondary, marginBottom: 8, fontSize: 14, lineHeight: 22 },

    updateBtn: { backgroundColor: COLORS.softTeal, padding: 18, borderRadius: 16, alignItems: 'center', elevation: 3, marginBottom: 12 },
    updateBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },

    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FF6B6B', padding: 16, borderRadius: 16 },
    deleteBtnText: { color: '#FF6B6B', fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.background, padding: 25, borderRadius: 20, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 20 },
    input: { backgroundColor: COLORS.input, color: COLORS.textPrimary, padding: 15, borderRadius: 12, marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
    btn: { flex: 0.48, padding: 15, borderRadius: 12, alignItems: 'center' }
});