import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CheckboxWithLabel = ({
  label,
  checked = false,
  onPress,
  required = false,
  showValidation = false,
  disabled = false,
  style,
  labelStyle,
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
          <Text
            style={[
              styles.labelText,
              isEmpty && styles.labelTextError,
              labelStyle,
            ]}>
            {label}
            {required && <Text style={styles.requiredStar}> *</Text>}
            {isEmpty && showValidation && (
              <Text style={styles.requiredText}> (Required)</Text>
            )}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 2,
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
    paddingTop: 2,
  },
  labelText: {
    fontSize: hp(1.6),
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  labelTextError: {
    color: Colors.red,
  },
  requiredStar: {
    color: Colors.red,
  },
  requiredText: {
    color: Colors.red,
    fontSize: hp(1.4),
  },
});

export default CheckboxWithLabel;
