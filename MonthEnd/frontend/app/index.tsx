import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from "../src/navigation/AuthNavigator";
import MainNavigator from "../src/navigation/MainNavigator";
import { getToken } from "../src/services/tokenService";
import { ThemeProvider } from "../src/context/ThemeContext";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      const newUserFlag = await AsyncStorage.getItem('isNewUser');
      
      setIsAuthenticated(!!token);
      setIsNewUser(newUserFlag === 'true');
    };
    
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isAuthenticated === null) return null;

  return (
    <ThemeProvider> 
      
        {isAuthenticated ? <MainNavigator isNewUser={isNewUser} /> : <AuthNavigator />}
      
    </ThemeProvider>
  );
}