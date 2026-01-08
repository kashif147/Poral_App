import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Checkbox = ({
  label,
  checked = false,
  onPress,
  required = false,
  showValidation = false,
  disabled = false,
  style,
}) => {
  const isEmpty = required && !checked && showValidation;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.7}>
      <View
        style={[
          styles.checkbox,
          checked && styles.checkboxChecked,
          isEmpty && styles.checkboxError,
          disabled && styles.checkboxDisabled,
        ]}>
        {checked && (
          <Ionicons name="checkmark" size={16} color={Colors.white} />
        )}
      </View>
      {label && (
        <View style={styles.labelContainer}>
          <View style={styles.labelTextContainer}>
            <View style={styles.labelRow}>
              {required && <View style={styles.requiredIndicator} />}
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.divider,
    borderRadius: 4,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxError: {
    borderColor: Colors.red,
    borderWidth: 2,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  labelContainer: {
    flex: 1,
  },
  labelTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requiredIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
    marginRight: 4,
  },
});

export default Checkbox;
