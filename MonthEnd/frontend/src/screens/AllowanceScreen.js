import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "../constants/theme";
import { addAllowance, getAllowance, deleteAllowance } from "../services/allowanceService";

export default function AllowanceScreen({ navigation }) {
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await getAllowance();
      setHistory(res.data.allowances || []);
    } catch (err) {
      console.log("Fetch Error:", err);
    }
  };

  const handleSetBaseline = async () => {
    if (!amount || !period || !source) return Alert.alert("Error", "Please fill all fields");

    const payload = { amount: Number(amount), period, source, startDate };

    try {
      await addAllowance(payload);
      Alert.alert("Success", "Baseline set successfully 💰");
      setAmount(""); setPeriod(""); setSource("");
      fetchHistory();
    } catch (err) {
      Alert.alert("Error", "Failed to set baseline");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAllowance(id);
      fetchHistory();
    } catch (err) {
      Alert.alert("Error", "Could not remove allowance");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>

      {/* Header — matches Add Expense style */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Set Allowance</Text>

      {/* Form Card */}
      <View style={styles.formCard}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="10,000"
          placeholderTextColor="#555"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Period</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. one month"
          placeholderTextColor="#555"
          value={period}
          onChangeText={setPeriod}
        />

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
          <Text style={{ color: COLORS.textPrimary }}>{startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            onChange={(e, date) => {
              setShowPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        <Text style={styles.label}>Source</Text>
        <TextInput
          style={styles.input}
          placeholder="Parent / Guardian"
          placeholderTextColor="#555"
          value={source}
          onChangeText={setSource}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSetBaseline}>
          <Text style={styles.submitBtnText}>SET BASELINE</Text>
        </TouchableOpacity>
      </View>

      {/* Active Allowances */}
      {history.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Active Allowances</Text>
          {history.map((item) => (
            <View key={item._id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <View style={styles.walletIcon}>
                  <Ionicons name="wallet-outline" size={20} color={COLORS.mutedYellow} />
                </View>
                <View>
                  <Text style={styles.historySource}>{item.source}</Text>
                  <Text style={styles.historySub}>
                    {item.period} · {new Date(item.startDate).toDateString()}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.historyAmount}>₹{item.amount}</Text>
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

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
  formCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: COLORS.input,
    color: COLORS.textPrimary,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: COLORS.accentOrange,
    padding: 16,
    borderRadius: 14,
    marginTop: 4,
    alignItems: "center",
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(236,204,104,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  historySource: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  historySub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  historyAmount: {
    color: COLORS.accentOrange,
    fontWeight: "bold",
    fontSize: 17,
  },
  removeText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 4,
  },
});