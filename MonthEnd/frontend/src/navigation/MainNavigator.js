import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AllowanceScreen from '../screens/AllowanceScreen';
import ExpectedSpendScreen from '../screens/ExpectedSpendScreen';
import ExpectedVSActualScreen from '../screens/ExpectedVSActualScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import GoalListScreen from '../screens/GoalListScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import ReflectionScreen from '../screens/ReflectionScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import SharingScreen from '../screens/SharingScreen';

const Stack = createStackNavigator();

export default function MainNavigator({ isNewUser }) {
  return (
    <Stack.Navigator 
        screenOptions={{ headerShown: false }} 
        initialRouteName={isNewUser ? "Onboarding" : "Home"}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Allowance" component={AllowanceScreen} />
      <Stack.Screen name="ExpectedSpend" component={ExpectedSpendScreen} />
      <Stack.Screen name="Analytics" component={ExpectedVSActualScreen} />
      <Stack.Screen name="Goal" component={GoalListScreen} />
      <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
      <Stack.Screen name="MonthTrack" component={ReflectionScreen} />
      <Stack.Screen name="Chat" component={ChatbotScreen} />
      <Stack.Screen name="ShareData" component={SharingScreen} />
    </Stack.Navigator>
  );
}