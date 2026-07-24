import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

export const CardTile = ({ title, icon, onPress, color }) => (
  <TouchableOpacity style={[styles.card, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.label}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: (width - 60) / 2,
    height: 110,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  icon: { fontSize: 30, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
});