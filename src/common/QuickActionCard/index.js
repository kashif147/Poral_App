import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Label } from '../text/label';
import { Colors } from '../../utils/Styles';

export const QuickActionCard = ({
  title,
  subtitle,
  icon,
  cardBackground,
  iconBackground,
  disabled = false,
  onPress,
}) => (
  <TouchableOpacity
    style={[
      styles.card,
      { backgroundColor: cardBackground, opacity: disabled ? 0.6 : 1 },
    ]}
    onPress={disabled ? undefined : onPress}
    activeOpacity={disabled ? 1 : 0.7}
    disabled={disabled}
  >
    <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
      <Ionicons name={icon} size={26} color="#FFF" />
    </View>
    <Label style={styles.title}>{title}</Label>
    <Label style={styles.subtitle}>{subtitle}</Label>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
