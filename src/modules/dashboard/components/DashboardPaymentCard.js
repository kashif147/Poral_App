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

      <View style={styles.bottomRow}>
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
  paymentAmountNegative: {
    color: '#DC2626',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  membershipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexShrink: 1,
    marginRight: 10,
  },
  membershipLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    marginRight: 6,
    textTransform: 'uppercase',
  },
  membershipValue: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  payNowButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  payNowButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
