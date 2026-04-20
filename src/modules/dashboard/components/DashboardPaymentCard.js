import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Label } from '../../../common/text/label';
import { Colors } from '../../../utils/Styles';

export const DashboardPaymentCard = ({
  accountNetBalance,
  accountNetBalanceLoading,
  membershipNumber,
  formatCurrency,
  onPayNowPress,
  canPay = true,
}) => {
  const netAmount = accountNetBalance?.net ?? 0;
  const isNegativeBalance = typeof netAmount === 'number' && netAmount < 0;

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
              isNegativeBalance && styles.paymentAmountNegative,
            ]}
          >
            {formatCurrency(isNegativeBalance ? Math.abs(netAmount) : netAmount)}
          </Text>
        )}
      </View>

      <View style={styles.membershipContainer}>
        <Label style={styles.membershipLabel}>MEMBERSHIP NO</Label>
        <Text style={styles.membershipValue}>
          {membershipNumber || 'N/A'}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.payNowButton,
          !canPay && { backgroundColor: '#E5E7EB' },
        ]}
        onPress={canPay ? onPayNowPress : undefined}
        activeOpacity={canPay ? 0.8 : 1}
        disabled={!canPay}
      >
        <Text
          style={[
            styles.payNowButtonText,
            !canPay && { color: Colors.textSecondary },
          ]}
        >
          Pay Now
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentCardTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  paymentCardContent: {},
  paymentLabel: {
    color: '#616161',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  paymentAmount: {
    color: Colors.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  paymentAmountNegative: {
    color: '#DC2626',
  },
  membershipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  membershipLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginRight: 8,
    textTransform: 'uppercase',
  },
  membershipValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  payNowButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  payNowButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
