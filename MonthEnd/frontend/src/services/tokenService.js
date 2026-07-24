import AsyncStorage from "@react-native-async-storage/async-storage";
import { EventEmitter } from "eventemitter3";

export const authEvents = new EventEmitter();

export const saveToken = async (token) => {
  await AsyncStorage.setItem("token", token);
  authEvents.emit("authChanged");
};

export const removeToken = async () => {
  await AsyncStorage.removeItem("token");
  authEvents.emit("authChanged");
};

export const getToken = async () => {
  return await AsyncStorage.getItem("token");
};