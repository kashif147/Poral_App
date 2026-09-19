import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Label } from '../text/label';
import { Colors, Radius, Shadows, Spacing } from '../../utils/Styles';

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
    activeOpacity={disabled ? 1 : 0.75}
    disabled={disabled}
  >
    <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
      <Ionicons name={icon} size={24} color="#FFF" />
    </View>
    <Label style={styles.title}>{title}</Label>
    <Label style={styles.subtitle}>{subtitle}</Label>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...Shadows.soft,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
