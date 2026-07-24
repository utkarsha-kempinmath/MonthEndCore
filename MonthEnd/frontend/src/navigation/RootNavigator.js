import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, authEvents } from '../services/tokenService';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { COLORS } from '../constants/theme';

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      const newUserFlag = await AsyncStorage.getItem('isNewUser');
      setIsLoggedIn(!!token);
      setIsNewUser(newUserFlag === 'true');
    } catch {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth(); // run once on mount
    authEvents.on("authChanged", checkAuth); // run when token saved/removed
    return () => authEvents.off("authChanged", checkAuth);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.accentOrange} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator isNewUser={isNewUser} /> : <AuthNavigator />}
    </NavigationContainer>
  );
}