import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  StyleSheet 
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "../constants/theme";
import { addEvent, getEvents, deleteEvent } from "../services/calendarService";

export default function CalendarScreen({ navigation }) {
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState("academic");
  const [expectedImpact, setExpectedImpact] = useState("medium");
  const [showPicker, setShowPicker] = useState({ show: false, mode: 'start' });
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await getEvents();
      setEvents(res.data.events);
    } catch (err) {
      console.log("Fetch Error:", err);
    }
  };

  const handleAddEvent = async () => {
    if (!eventName) return Alert.alert("Error", "Please name the event");

    const payload = {
      eventName,
      startDate,
      endDate,
      eventType: selectedType,
      expectedImpact
    };

    try {
      await addEvent(payload);
      Alert.alert("Success", "Event synced 📅");
      setEventName("");
      setExpectedImpact("medium");
      fetchEvents();
    } catch (err) {
      Alert.alert("Error", "Failed to sync event");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Remove Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await deleteEvent(id);
            fetchEvents();
          } catch (err) {
            Alert.alert("Error", "Could not delete event");
          }
        } 
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: COLORS.mutedYellow }]}>
            Sync Your Calendar
          </Text>
          <Text style={styles.heroSub}>
            Help MonthEnd understand your schedule to provide better insights on spending patterns.
          </Text>
        </View>
        <Ionicons name="calendar-outline" size={45} color={COLORS.mutedYellow} />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Event Name</Text>
        <TextInput
          placeholder="e.g., Mid-term Exams"
          placeholderTextColor="#666"
          style={styles.input}
          value={eventName}
          onChangeText={setEventName}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity 
              style={styles.dateSelector} 
              onPress={() => setShowPicker({ show: true, mode: 'start' })}
            >
              <Text style={{ color: COLORS.textPrimary }}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity 
              style={styles.dateSelector} 
              onPress={() => setShowPicker({ show: true, mode: 'end' })}
            >
              <Text style={{ color: COLORS.textPrimary }}>{endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showPicker.show && (
          <DateTimePicker
            value={showPicker.mode === 'start' ? startDate : endDate}
            mode="date"
            onChange={(e, date) => {
              setShowPicker({ ...showPicker, show: false });
              if (date) showPicker.mode === 'start' ? setStartDate(date) : setEndDate(date);
            }}
          />
        )}

        <Text style={[styles.label, { marginTop: 20 }]}>Event Type</Text>
        <View style={styles.typeGrid}>
          {['academic', 'social', 'personal', 'financial', 'other'].map((type) => (
            <TouchableOpacity 
              key={type}
              style={[styles.typeButton, selectedType === type && styles.typeSelected]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.typeText, selectedType === type && { color: COLORS.accentOrange }]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Event Intensity</Text>
        <Text style={styles.helperText}>Helps predict the financial impact and spending spikes of this event.</Text>
        <View style={styles.typeGrid}>
          {['low', 'medium', 'high'].map((impact) => (
            <TouchableOpacity 
              key={impact}
              style={[styles.typeButton, expectedImpact === impact && styles.typeSelected]}
              onPress={() => setExpectedImpact(impact)}
            >
              <Text style={[styles.typeText, expectedImpact === impact && { color: COLORS.accentOrange }]}>
                {impact}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleAddEvent}>
          <Text style={styles.submitBtnText}>Add Event</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { marginTop: 30, fontSize: 18 }]}>Upcoming Schedule</Text>
      {events.map((item) => (
        <View key={item._id} style={styles.historyCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.historyTitle}>{item.eventName}</Text>
            <Text style={styles.historyDate}>
              {new Date(item.startDate).toLocaleDateString()} - 
              {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Ongoing'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: COLORS.primaryPurple, fontSize: 10, marginBottom: 5, textTransform: 'capitalize' }}>
              {item.eventType} • {item.expectedImpact}
            </Text>
            <TouchableOpacity onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20 },
  navHeader: { paddingTop: 60, marginBottom: 10 },
  heroSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, marginBottom: 10 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  heroSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  formCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 20, elevation: 4 },
  label: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: COLORS.input, color: COLORS.textPrimary, padding: 15, borderRadius: 12, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  dateSelector: { backgroundColor: COLORS.input, padding: 12, borderRadius: 10, alignItems: 'center' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  typeButton: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.input, borderRadius: 10, marginRight: 8, marginBottom: 8, alignItems: 'center' },
  typeSelected: { borderColor: COLORS.accentOrange, backgroundColor: COLORS.input },
  typeText: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'capitalize' },
  helperText: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 10 },
  submitBtn: { backgroundColor: COLORS.softTeal, padding: 16, borderRadius: 15, marginTop: 15, alignItems: 'center' },
  submitBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  historyCard: { backgroundColor: COLORS.card, padding: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  historyTitle: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  historyDate: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }
});