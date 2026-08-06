import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../utils/Styles';
import {
  clampOptionQuantity,
  formatRegistrationPrice,
  getOptionQuantity,
} from '../helpers/events.helper';

const QuantityStepper = ({ value, min = 0, onChange, disabled = false }) => {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled;

  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={[styles.stepperBtn, !canDecrement && styles.stepperBtnDisabled]}
        disabled={!canDecrement}
        onPress={() => onChange(Math.max(min, value - 1))}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.stepperBtnText,
            !canDecrement && styles.stepperBtnTextDisabled,
          ]}
        >
          −
        </Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}</Text>
      <TouchableOpacity
        style={[styles.stepperBtn, !canIncrement && styles.stepperBtnDisabled]}
        disabled={!canIncrement}
        onPress={() => onChange(value + 1)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.stepperBtnText,
            !canIncrement && styles.stepperBtnTextDisabled,
          ]}
        >
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const RegistrationPricingOptions = ({
  options = [],
  quantities = {},
  onQuantityChange,
}) => {
  if (!options.length) {
    return (
      <Text style={styles.emptyText}>No pricing options available.</Text>
    );
  }

  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const selectable = option.selectable !== false;
        const quantity = selectable ? getOptionQuantity(quantities, option) : 0;

        return (
          <View
            key={option.id}
            style={[
              styles.row,
              !selectable && styles.rowDisabled,
              index < options.length - 1 && styles.rowBorder,
            ]}
          >
            <View style={styles.rowLeft}>
              <Text
                style={[
                  styles.optionTitle,
                  !selectable && styles.optionTitleDisabled,
                ]}
              >
                {option.title}
              </Text>
              <Text style={styles.optionPrice}>
                {formatRegistrationPrice(option.unitPrice)}
                {option.isGroup ? ' per student' : ''}
              </Text>
              {option.subtitle ? (
                <Text style={styles.optionHint}>{option.subtitle}</Text>
              ) : null}
              {option.isGroup && option.minGroupSize ? (
                <Text style={styles.optionHint}>
                  Min {option.minGroupSize} students
                </Text>
              ) : null}
            </View>

            {selectable ? (
              <QuantityStepper
                value={quantity}
                min={0}
                onChange={next => {
                  let resolved = next;
                  if (
                    option.isGroup &&
                    next > 0 &&
                    next < (option.minGroupSize || 1)
                  ) {
                    resolved = quantity === 0 ? option.minGroupSize || 1 : 0;
                  }
                  onQuantityChange?.(
                    option.id,
                    clampOptionQuantity(option, resolved),
                  );
                }}
              />
            ) : (
              <View style={styles.membersOnlyBadge}>
                <Text style={styles.membersOnlyText}>Members only</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    backgroundColor: Colors.surface || Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowDisabled: {
    backgroundColor: '#F9FAFB',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rowLeft: {
    flex: 1,
    paddingRight: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  optionTitleDisabled: {
    color: '#6B7280',
  },
  optionPrice: {
    marginTop: 2,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  optionHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },
  membersOnlyBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  membersOnlyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  stepperBtnTextDisabled: {
    color: '#D1D5DB',
  },
  stepperValue: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default RegistrationPricingOptions;
