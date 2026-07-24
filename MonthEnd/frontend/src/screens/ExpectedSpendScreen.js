import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Dimensions, Alert
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "../constants/theme";
import { savePlan, getPlan } from "../services/planningService";

const screenWidth = Dimensions.get("window").width;

export default function ExpectedSpendScreen({ navigation }) {
  const chartColors = [
    "#FF4757", "#2ED573", "#1E90FF", "#FFA502",
    "#FF6EB4", "#ECCC68", "#7BED9F", "#70A1FF",
    "#FF6348", "#5352ED",
  ];

  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    fetchExistingPlan();
  }, []);

  const fetchExistingPlan = async () => {
    try {
      const res = await getPlan();
      const planData = res.data?.plan || res.data;
      if (planData && planData.categories && planData.categories.length > 0) {
        const mapped = planData.categories.map((c, index) => ({
          name: c.name,
          amount: Number(c.amount) || 0,
          color: chartColors[index % chartColors.length],
        }));
        setCategories(mapped);
      } else {
        setCategories([{ name: "Food", amount: 0, color: chartColors[0] }]);
      }
    } catch (err) {
      console.log("Fetch error:", err.response?.data || err.message);
      setCategories([{ name: "Food", amount: 0, color: chartColors[0] }]);
    }
  };

  const addCategory = () => {
    if (!newCatName.trim()) return Alert.alert("Error", "Enter a category name");
    if (categories.some(c => c.name.toLowerCase() === newCatName.toLowerCase().trim())) {
      return Alert.alert("Error", "Category already exists");
    }
    setCategories([...categories, {
      name: newCatName.trim(),
      amount: 0,
      color: chartColors[categories.length % chartColors.length],
    }]);
    setNewCatName("");
  };

  const removeCategory = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleUpdateAmount = (index, val) => {
    const updated = [...categories];
    updated[index].amount = Number(val) || 0;
    setCategories(updated);
  };

  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

  const chartData = categories
    .filter(cat => cat.amount > 0)
    .map(cat => ({
      name: cat.name,
      population: cat.amount,
      color: cat.color,
      legendFontColor: "#AAAAAA",
      legendFontSize: 11,
    }));

  const handleSave = async () => {
    if (categories.length === 0 || total === 0) {
      return Alert.alert("Error", "Please add categories and amounts before saving.");
    }
    const payload = {
      month: new Date().toISOString().slice(0, 7),
      categories: categories.map(c => ({ name: c.name, amount: c.amount })),
      total,
    };
    try {
      const response = await savePlan(payload);
      if (response.data) {
        Alert.alert("Success", "Spending expectations saved!");
        await fetchExistingPlan();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save plan");
      console.log("Save error:", err.response?.data || err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>

      {/* Header — matches Add Expense style */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Expected Spending</Text>

      {/* Add Category */}
      <Text style={styles.label}>New Category</Text>
      <View style={styles.addSection}>
        <TextInput
          style={styles.mainInput}
          placeholder="e.g. Rent"
          placeholderTextColor="#555"
          value={newCatName}
          onChangeText={setNewCatName}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addCategory}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Category List */}
      <Text style={styles.label}>Categories</Text>
      <View style={styles.categoriesCard}>
        {categories.map((cat, index) => (
          <View
            key={index}
            style={[
              styles.inputWrapper,
              index < categories.length - 1 && styles.inputWrapperBorder,
            ]}
          >
            <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
            <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType="numeric"
              placeholder="₹ 0"
              placeholderTextColor="#555"
              onChangeText={(val) => handleUpdateAmount(index, val)}
              value={cat.amount > 0 ? cat.amount.toString() : ""}
            />
            <TouchableOpacity onPress={() => removeCategory(index)} style={styles.removeBtn}>
              <Ionicons name="remove-circle-outline" size={20} color="#FF4757" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Pie Chart */}
      {total > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.label}>Distribution</Text>
          <PieChart
            data={chartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            hasLegend={true}
            absolute={false}
          />
        </View>
      )}

      {/* Total + Save */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Expected</Text>
        <Text style={styles.totalAmount}>₹ {total}</Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>SAVE SPENDING</Text>
      </TouchableOpacity>

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
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  addSection: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 10,
  },
  mainInput: {
    flex: 1,
    backgroundColor: COLORS.input,
    color: COLORS.textPrimary,
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: COLORS.primaryPurple,
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 4,
    marginBottom: 20,
    overflow: "hidden",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWrapperBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  catName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  smallInput: {
    backgroundColor: COLORS.input,
    color: COLORS.textPrimary,
    padding: 8,
    borderRadius: 8,
    width: 85,
    textAlign: "center",
    fontSize: 13,
    marginRight: 10,
  },
  removeBtn: { padding: 2 },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  totalLabel: {
    color: COLORS.textSecondary,
    fontWeight: "700",
    fontSize: 15,
  },
  totalAmount: {
    color: COLORS.accentOrange,
    fontWeight: "bold",
    fontSize: 22,
  },
  saveBtn: {
    backgroundColor: COLORS.accentOrange,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});