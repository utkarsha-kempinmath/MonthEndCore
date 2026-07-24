import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "../constants/theme";
import { EMOTIONS } from "../constants/emotions";
import { addExpense, getExpenses, deleteExpense } from "../services/expenseService";
import { getPlan } from "../services/planningService";

export default function AddExpenseScreen({ navigation }) {
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [plannedCategories, setPlannedCategories] = useState([]);
  const [note, setNote] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([fetchHistory(), fetchPlannedCategories()]);
      setIsLoading(false);
    };
    initializeData();
  }, []);

  const fetchPlannedCategories = async () => {
    try {
      const res = await getPlan();
      const plan = res.data?.plan || res.data;
      if (plan && plan.categories) {
        setPlannedCategories(plan.categories.map(c => c.name));
      }
    } catch (err) {
      if (err.message === 'Network Error') {
        Alert.alert("No Internet", "Please check your network connection and try again.");
      } else {
        console.log("Planning Fetch Error:", err);
      }
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await getExpenses();
      setHistory(res.data.expenses);
    } catch (err) {
      if (err.message === 'Network Error') {
        Alert.alert("No Internet", "Please check your network connection and try again.");
      } else {
        console.log("Fetch Error:", err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(amount)) return Alert.alert("Error", "Enter valid amount");
    if (!selectedCategory) return Alert.alert("Error", "Please select a category");
    if (!selectedEmotion) return Alert.alert("Error", "Select an emotion");

    const payload = {
      amount: Number(amount),
      category: selectedCategory.toLowerCase().trim(),
      note: note.trim(),
      emotion: { primary: selectedEmotion },
      // date intentionally omitted — backend uses its own new Date()
    };

    try {
      await addExpense(payload);
      Alert.alert("Success", "Expense added 🎉");
      setAmount("");
      setSelectedCategory("");
      setNote("");
      setSelectedEmotion("");
      fetchHistory();
    } catch (err) {
      if (err.message === 'Network Error') {
        Alert.alert("No Internet", "Please check your network connection and try again.");
      } else {
        Alert.alert("Error", "Failed to add expense");
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      fetchHistory();
    } catch (err) {
      if (err.message === 'Network Error') {
        Alert.alert("No Internet", "Please check your network connection and try again.");
      } else {
        Alert.alert("Error", "Could not delete");
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>Add Expense</Text>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="₹ 0"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Category</Text>
      {plannedCategories.length > 0 ? (
        <View style={styles.categoryRow}>
          {plannedCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, selectedCategory === cat && styles.selectedCatChip]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catChipText, selectedCategory === cat && { color: COLORS.white }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : !isLoading ? (
        <View style={styles.emptyPlanContainer}>
          <Text style={styles.emptyPlanText}>
            No categories found. Please plan for the month first.
          </Text>
          <TouchableOpacity style={styles.planLink} onPress={() => navigation.navigate("ExpectedSpend")}>
            <Text style={styles.planLinkText}>Go to Planning →</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={styles.input}
        placeholder="Optional"
        placeholderTextColor="#666"
        value={note}
        onChangeText={setNote}
      />

      <Text style={styles.label}>How did it feel?</Text>
      <View style={styles.emoRow}>
        {EMOTIONS.map((emotion) => (
          <TouchableOpacity
            key={emotion.label}
            style={[styles.emoChip, selectedEmotion === emotion.label && styles.selectedEmo]}
            onPress={() => setSelectedEmotion(emotion.label)}
          >
            <Text style={[styles.emoText, selectedEmotion === emotion.label && { color: COLORS.white }]}>
              {emotion.icon} {emotion.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, plannedCategories.length === 0 && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={plannedCategories.length === 0}
      >
        <Text style={styles.submitText}>ADD EXPENSE</Text>
      </TouchableOpacity>

      <Text style={[styles.label, { marginTop: 40, fontSize: 18 }]}>Recent Expenses</Text>
      {history.map((item) => (
        <View key={item._id} style={styles.historyCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.historyCategory}>{item.category.toUpperCase()}</Text>
            <Text style={styles.historyDate}>{new Date(item.date).toDateString()}</Text>
            <Text style={styles.historyNote}>{item.note && item.note.trim() ? item.note : "No note"}</Text>
            <View style={styles.historyTag}>
              <Text style={styles.historyTagText}>{item.emotion.primary}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={() => handleDelete(item._id)}>
              <Ionicons name="close-outline" size={20} color="#666" />
            </TouchableOpacity>
            <Text style={styles.historyAmount}>₹{item.amount}</Text>
          </View>
        </View>
      ))}
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 60 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 20 },
  label: { color: COLORS.textSecondary, marginBottom: 8, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: COLORS.input, color: COLORS.textPrimary, padding: 15, borderRadius: 12, marginBottom: 20 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  catChip: { backgroundColor: COLORS.card, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: COLORS.input },
  selectedCatChip: { backgroundColor: COLORS.softTeal, borderColor: COLORS.softTeal },
  catChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '500' },
  emptyPlanContainer: { padding: 15, backgroundColor: COLORS.card, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  emptyPlanText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 13 },
  planLink: { marginTop: 10 },
  planLinkText: { color: COLORS.accentOrange, fontWeight: 'bold' },
  emoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emoChip: { backgroundColor: COLORS.card, padding: 10, borderRadius: 20 },
  selectedEmo: { backgroundColor: COLORS.primaryPurple },
  emoText: { color: COLORS.textSecondary, fontSize: 12 },
  submitBtn: { backgroundColor: COLORS.accentOrange, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  submitText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  historyCard: { backgroundColor: COLORS.card, padding: 15, borderRadius: 16, flexDirection: 'row', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 140, 82, 0.2)' },
  historyCategory: { color: COLORS.accentOrange, fontWeight: 'bold', fontSize: 16 },
  historyDate: { color: COLORS.textSecondary, fontSize: 12, marginVertical: 4 },
  historyNote: { color: COLORS.textSecondary, fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  historyAmount: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 18, marginTop: 10 },
  historyTag: { borderWidth: 1, borderColor: COLORS.accentOrange, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start', marginTop: 5 },
  historyTagText: { color: COLORS.accentOrange, fontSize: 10, fontWeight: '600' }
});