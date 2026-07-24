import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Dimensions, ScrollView } from 'react-native';
import { COLORS } from '../constants/theme';
import API from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const QUIZ_QUESTIONS = [
  { id: 'q1', text: "A sudden 50% sale starts on your favorite brand. What do you do?", opts: [{ l: "Buy it immediately", v: "A" }, { l: "Check if I need it", v: "B" }, { l: "Stick to my budget", v: "C" }] },
  { id: 'q2', text: "How often do you plan your expenses for the month?", opts: [{ l: "Never", v: "A" }, { l: "Sometimes", v: "B" }, { l: "Always", v: "C" }] },
  { id: 'q3', text: "How do you feel after a stressful day?", opts: [{ l: "I want to treat myself", v: "A" }, { l: "I prefer to stay in", v: "B" }] },
  { id: 'q4', text: "Your friends are going on an unplanned trip. You...", opts: [{ l: "Join them anyway", v: "A" }, { l: "Check my savings first", v: "B" }] },
  { id: 'q5', text: "How do you track your daily spending?", opts: [{ l: "I don't track it", v: "A" }, { l: "I track sometimes", v: "B" }, { l: "I track everything", v: "C" }] },
  { id: 'q6', text: "When you receive your allowance, you...", opts: [{ l: "Spend first, save later", v: "A" }, { l: "Save a little, spend the rest", v: "B" }, { l: "Save first, spend the rest", v: "C" }] },
];

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState('quiz');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [events, setEvents] = useState([]);
  
  const [showPicker, setShowPicker] = useState(false);
  const [activeEventIndex, setActiveEventIndex] = useState(null);
  const [activeDateType, setActiveDateType] = useState('startDate'); 

  const [goalData, setGoalData] = useState({ name: "", targetAmount: "", timelineMonths: "" });

  const handleQuizSelect = (val) => {
    const newAnswers = { ...answers, [QUIZ_QUESTIONS[currentQ].id]: val };
    setAnswers(newAnswers);
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep('events');
    }
  };

  const addEvent = () => {
    setEvents([...events, { 
      eventName: "", 
      startDate: new Date(), 
      endDate: new Date(), 
      eventType: "academic",
      expectedImpact: "medium"
    }]);
  };

  const updateEvent = (index, field, value) => {
    const newEvents = [...events];
    newEvents[index][field] = value;
    setEvents(newEvents);
  };

  const openDatePicker = (index, type) => {
    setActiveEventIndex(index);
    setActiveDateType(type);
    setShowPicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate && activeEventIndex !== null) {
      updateEvent(activeEventIndex, activeDateType, selectedDate);
    }
  };

  const handleComplete = async () => {
    try {
      let formattedGoalData = null;
      
      if (goalData.name && goalData.name.trim() !== "") {
          formattedGoalData = {
              name: goalData.name,
              targetAmount: Number(goalData.targetAmount) || 0,
              timelineMonths: Number(goalData.timelineMonths) || 0
          };
      }

      const payload = { 
        profileAnswers: answers, 
        eventAnswers: events,
        goalData: formattedGoalData 
      };
      
      const res = await API.post('/onboarding/complete', payload); 
      
      if (res.data.success){ 
          await AsyncStorage.removeItem('isNewUser');
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      const backendError = err.response?.data?.error || err.message;
      console.log("ONBOARDING BACKEND ERROR:", backendError);
      Alert.alert("Failed", backendError || "Could not complete onboarding");
    }
  };

  return (
    <View style={styles.container}>
      {step === 'quiz' && (
        <View style={styles.card}>
          <Text style={styles.progressText}>Question {currentQ + 1} of {QUIZ_QUESTIONS.length}</Text>
          <Text style={styles.qText}>{QUIZ_QUESTIONS[currentQ].text}</Text>
          {QUIZ_QUESTIONS[currentQ].opts.map((opt) => (
            <TouchableOpacity 
              key={opt.v} 
              style={[styles.opt, answers[QUIZ_QUESTIONS[currentQ].id] === opt.v && styles.optSelected]} 
              onPress={() => handleQuizSelect(opt.v)}
            >
              <Text style={styles.optText}>{opt.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 'events' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>Monthly Events</Text>
            {events.map((item, index) => (
              <View key={index} style={styles.eventItem}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Event Name (e.g. Exam, Trip)" 
                  placeholderTextColor="#888"
                  value={item.eventName}
                  onChangeText={(v) => updateEvent(index, 'eventName', v)}
                />
                
                <View style={styles.row}>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => openDatePicker(index, 'startDate')}>
                    <Text style={styles.smallLabel}>Start</Text>
                    <Text style={styles.dateText}>{item.startDate.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => openDatePicker(index, 'endDate')}>
                    <Text style={styles.smallLabel}>End</Text>
                    <Text style={styles.dateText}>{item.endDate.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.smallLabel, { marginTop: 15 }]}>Event Type</Text>
                <View style={styles.typeGrid}>
                  {['academic', 'social', 'personal', 'financial', 'other'].map((type) => (
                    <TouchableOpacity 
                      key={type}
                      style={[styles.typeButton, item.eventType === type && styles.typeSelected]}
                      onPress={() => updateEvent(index, 'eventType', type)}
                    >
                      <Text style={[styles.typeText, item.eventType === type && { color: COLORS.accentOrange }]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.smallLabel, { marginTop: 10 }]}>Event Intensity</Text>
                <Text style={styles.helperText}>Helps predict the financial impact and spending spikes of this event.</Text>
                <View style={styles.typeGrid}>
                  {['low', 'medium', 'high'].map((impact) => (
                    <TouchableOpacity 
                      key={impact}
                      style={[styles.typeButton, item.expectedImpact === impact && styles.typeSelected]}
                      onPress={() => updateEvent(index, 'expectedImpact', impact)}
                    >
                      <Text style={[styles.typeText, item.expectedImpact === impact && { color: COLORS.accentOrange }]}>
                        {impact}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            
            <TouchableOpacity style={styles.addBtn} onPress={addEvent}>
              <Text style={styles.btnText}>+ Add Event</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('goals')}>
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 'goals' && (
        <View style={styles.card}>
          <Text style={styles.title}>Financial Goal</Text>
          <TextInput style={styles.inputSpacing} placeholder="Goal Name (e.g., Savings)" placeholderTextColor="#888" onChangeText={(v)=>setGoalData({...goalData, name: v})} />
          <TextInput style={styles.inputSpacing} placeholder="Target Amount" placeholderTextColor="#888" keyboardType="numeric" onChangeText={(v)=>setGoalData({...goalData, targetAmount: v})} />
          <TextInput style={styles.inputSpacing} placeholder="Timeline (Months)" placeholderTextColor="#888" keyboardType="numeric" onChangeText={(v)=>setGoalData({...goalData, timelineMonths: v})} />
          <TouchableOpacity style={[styles.nextBtn, { marginTop: 10 }]} onPress={handleComplete}>
            <Text style={styles.btnText}>Finish 🎉</Text>
          </TouchableOpacity>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          value={activeEventIndex !== null ? events[activeEventIndex][activeDateType] : new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 20, paddingTop: 60 },
  card: { backgroundColor: COLORS.card, padding: 25, borderRadius: 24, elevation: 10 },
  progressText: { color: COLORS.accentOrange, fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  qText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  opt: { backgroundColor: COLORS.input, padding: 16, borderRadius: 12, marginBottom: 10 },
  optSelected: { backgroundColor: COLORS.primaryPurple, borderWidth: 1, borderColor: COLORS.white },
  optText: { color: COLORS.textPrimary, fontWeight: '500' },
  nextBtn: { backgroundColor: COLORS.accentOrange, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  btnText: { color: COLORS.white, fontWeight: 'bold' },
  input: { backgroundColor: COLORS.input, color: COLORS.textPrimary, padding: 15, borderRadius: 12 },
  inputSpacing: { backgroundColor: COLORS.input, color: COLORS.textPrimary, padding: 15, borderRadius: 12, marginBottom: 15 },
  title: { fontSize: 22, color: COLORS.textPrimary, fontWeight: 'bold', marginBottom: 20 },
  eventItem: { marginBottom: 20, padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dateBtn: { flex: 0.48, padding: 10, backgroundColor: COLORS.input, borderRadius: 10, alignItems: 'center' },
  smallLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600' },
  dateText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  addBtn: { padding: 15, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.accentOrange, borderRadius: 12, marginVertical: 15 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  typeButton: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.input, borderRadius: 10, marginRight: 8, marginBottom: 8, alignItems: 'center' },
  typeSelected: { borderColor: COLORS.accentOrange, backgroundColor: COLORS.input },
  typeText: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'capitalize' },
  helperText: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 8 }
});  