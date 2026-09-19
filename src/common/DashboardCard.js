import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Label } from './text/label';
import { Button } from './button';
import { LocalSvg } from 'react-native-svg/css';
import { Colors, Radius, Shadows, Spacing } from '../utils/Styles';

export const DashboardCard = ({
  icon,
  title,
  description,
  button,
  onPress,
  style,
}) => (
  <View style={[styles.card, style]}>
    <View style={styles.iconWrap}>
      <LocalSvg asset={icon} width={40} height={40} />
    </View>
    <Label style={styles.title}>{title}</Label>
    <Label style={styles.description}>{description}</Label>
    <Button
      title={button}
      onPress={onPress}
      primary
      style={styles.button}
      textStyle={styles.buttonText}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  iconWrap: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    borderRadius: Radius.md,
    minWidth: 140,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
