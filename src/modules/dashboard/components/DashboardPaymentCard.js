import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Label } from '../../../common/text/label';
import { Colors } from '../../../utils/Styles';

export const DashboardPaymentCard = ({
  accountNetBalance,
  accountNetBalanceLoading,
  formatCurrency,
}) => {
  const netAmount = accountNetBalance?.net ?? 0;
  const isNegativeBalance = typeof netAmount === 'number' && netAmount < 0;
  const isPositiveBalance = typeof netAmount === 'number' && netAmount > 0;

  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentCardHeader}>
        <Label style={styles.paymentCardTitle}>Payments & Billing</Label>
        <TouchableOpacity>
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.paymentCardContent}>
        <Label style={styles.paymentLabel}>
          Net Balance
          {accountNetBalance?.year ? ` (${accountNetBalance.year})` : ''}
        </Label>
        {accountNetBalanceLoading ? (
          <Text style={styles.paymentAmount}>Loading...</Text>
        ) : (
          <Text
            style={[
              styles.paymentAmount,
              isNegativeBalance && styles.paymentAmountNegativeGreen,
              isPositiveBalance && styles.paymentAmountPositiveRed,
            ]}
          >
            {formatCurrency(Math.abs(netAmount))}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 128,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentCardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  paymentCardContent: {
    marginTop: 4,
    marginBottom: 10,
  },
  paymentLabel: {
    color: '#616161',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  paymentAmount: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  paymentAmountNegativeGreen: {
    color: '#16A34A',
  },
  paymentAmountPositiveRed: {
    color: '#DC2626',
  },
});
