import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getGoals, createGoal } from '../services/goalService';

export default function GoalListScreen({ navigation }) {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', timelineMonths: '' });

    useFocusEffect(
        useCallback(() => {
            fetchGoals();
        }, [])
    );

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const res = await getGoals();
            setGoals(res.data.goals || []);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async () => {
        if (!newGoal.name || !newGoal.targetAmount || !newGoal.timelineMonths) {
            return Alert.alert("Hold up", "Please fill all fields to create a goal.");
        }

        try {
            const payload = {
                name: newGoal.name,
                targetAmount: Number(newGoal.targetAmount),
                timelineMonths: Number(newGoal.timelineMonths)
            };
            await createGoal(payload);
            setModalVisible(false);
            setNewGoal({ name: '', targetAmount: '', timelineMonths: '' });
            fetchGoals(); // Refresh the list
        } catch (err) {
            Alert.alert("Error", "Could not create goal.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.navigate("Home")}>
                    <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Goals</Text>
                <View style={{ width: 28 }} /> 
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.accentOrange} style={{ marginTop: 50 }} />
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    {goals.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="flag-outline" size={60} color={COLORS.textSecondary} />
                            <Text style={styles.emptyText}>You haven't set any goals yet.</Text>
                            <Text style={styles.emptySubtext}>Start planning for a new laptop, a trip, or just general savings!</Text>
                        </View>
                    ) : (
                        goals.map((goal) => (
                            <TouchableOpacity 
                                key={goal._id} 
                                style={styles.goalCard}
                                onPress={() => navigation.navigate("GoalDetail", { goalId: goal._id })}
                            >
                                <View>
                                    <Text style={styles.goalName}>{goal.name}</Text>
                                    <Text style={styles.goalTarget}>Target: ₹{goal.targetAmount}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Floating Add Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={30} color={COLORS.white} />
            </TouchableOpacity>

            {/* Add Goal Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Goal</Text>
                        
                        <TextInput 
                            style={styles.input} 
                            placeholder="Goal Name (e.g. New Laptop)" 
                            placeholderTextColor="#888"
                            value={newGoal.name}
                            onChangeText={(val) => setNewGoal({...newGoal, name: val})}
                        />
                        <TextInput 
                            style={styles.input} 
                            placeholder="Target Amount (₹)" 
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={newGoal.targetAmount}
                            onChangeText={(val) => setNewGoal({...newGoal, targetAmount: val})}
                        />
                        <TextInput 
                            style={styles.input} 
                            placeholder="Timeline (Months)" 
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={newGoal.timelineMonths}
                            onChangeText={(val) => setNewGoal({...newGoal, timelineMonths: val})}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleAddGoal}>
                                <Text style={styles.btnText}>Save Goal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20 },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
    emptyState: { alignItems: 'center', marginTop: 80, padding: 20 },
    emptyText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 15 },
    emptySubtext: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
    goalCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, elevation: 3 },
    goalName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    goalTarget: { color: COLORS.accentOrange, fontSize: 14, fontWeight: '600' },
    fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: COLORS.primaryPurple, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.background, padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 20 },
    input: { backgroundColor: COLORS.input, color: COLORS.textPrimary, padding: 15, borderRadius: 12, marginBottom: 15 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    btn: { flex: 0.48, padding: 15, borderRadius: 12, alignItems: 'center' },
    cancelBtn: { backgroundColor: COLORS.card },
    saveBtn: { backgroundColor: COLORS.accentOrange },
    btnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});