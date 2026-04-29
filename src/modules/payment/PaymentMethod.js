import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApplication } from '../../contexts/applicationContext';
import { applicationConfirmationRequest } from '../../api/application.api';
import StandingBankersOrder from './StandingBankersOrder';
import DirectDebit from './DirectDebit';
import SalaryDeduction from './SalaryDeduction';
import ScreenHeader from '../../common/screenHeader';
import { Colors, hp, wp } from '../../utils/Styles';

const PaymentMethod = () => {
  const navigation = useNavigation();
  const { personalDetail, subscriptionDetail } = useApplication();
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize payment type to match component mapping
  const normalizePaymentType = (paymentType) => {
    if (!paymentType) return null;

    const normalized = paymentType.toString().toLowerCase();

    // Handle Standing Bankers Order variations
    if (
      normalized.includes('standing') &&
      (normalized.includes('banker') ||
        normalized.includes('bank') ||
        normalized.includes('order'))
    ) {
      return 'Standing Banking Order';
    }

    // Handle Direct Debit
    if (normalized.includes('direct') && normalized.includes('debit')) {
      return 'Direct Debit';
    }

    // Handle Salary Deduction / Deduction at Source
    if (
      (normalized.includes('salary') && normalized.includes('deduction')) ||
      (normalized.includes('deduction') && normalized.includes('source'))
    ) {
      return 'Salary Deduction';
    }

    // Return null for unrecognized payment types (Credit Card, etc.)
    return null;
  };

  // Get default payment type based on application status
  const getDefaultPaymentType = () => {
    if (applicationStatus === 'approved' || applicationStatus === 'submitted') {
      const paymentType =
        subscriptionDetail?.subscriptionDetails?.paymentType;
      if (paymentType) {
        const normalized = normalizePaymentType(paymentType);
        // Only return if it's a valid payment type (Standing Banking Order or Direct Debit)
        if (normalized) {
          return normalized;
        }
      }
    }
    return null; // No default payment type
  };

  // Check application status on mount
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (personalDetail?.applicationId) {
        try {
          const response = await applicationConfirmationRequest(
            personalDetail.applicationId,
          );

          if (
            response?.status === 200 ||
            response?.data?.status === 'success'
          ) {
            const status =
              response?.data?.data?.applicationStatus ||
              response?.data?.applicationStatus;
            setApplicationStatus(status);
          }
        } catch (error) {
          console.error('Failed to fetch application status:', error);
          setApplicationStatus(null);
        }
      }
      setLoading(false);
    };

    checkApplicationStatus();
  }, [personalDetail?.applicationId]);

  // Set default payment type once status is checked
  useEffect(() => {
    if (!loading) {
      const defaultType = getDefaultPaymentType();
      setSelectedPaymentType(defaultType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    applicationStatus,
    subscriptionDetail?.subscriptionDetails?.paymentType,
    loading,
  ]);

  // Payment type options supported in mobile flow
  const paymentTypes = [
    { value: 'Standing Banking Order', label: 'Standing Banking Order' },
    { value: 'Direct Debit', label: 'Direct Debit' },
    { value: 'Salary Deduction', label: 'Salary Deduction' },
  ];

  // Render the appropriate payment component
  const renderPaymentComponent = () => {
    if (!selectedPaymentType) {
      return null;
    }

    switch (selectedPaymentType) {
      case 'Standing Banking Order':
        return <StandingBankersOrder />;
      case 'Direct Debit':
        return <DirectDebit />;
      case 'Salary Deduction':
        return <SalaryDeduction />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading payment options...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Payment Method" />
      
      {/* Payment Type Selector Bar - Sticky at top */}
      <View style={styles.selectorBar}>
        <View style={styles.selectorContent}>
          <Text style={styles.selectorLabel}>Select payment method</Text>
          <View style={styles.tabContainer}>
            {paymentTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setSelectedPaymentType(type.value)}
                style={[
                  styles.tabButton,
                  selectedPaymentType === type.value && styles.tabButtonActive,
                ]}>
                <Text
                  style={[
                    styles.tabButtonText,
                    selectedPaymentType === type.value &&
                      styles.tabButtonTextActive,
                  ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Payment Component Container */}
      <View style={styles.contentContainer}>
        {selectedPaymentType ? (
          renderPaymentComponent()
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIcon}>
                <Text style={styles.emptyStateIconText}>💳</Text>
              </View>
              <Text style={styles.emptyStateTitle}>
                Change Your Payment Method
              </Text>
              <Text style={styles.emptyStateText}>
                Please select a payment method from the options above to
                continue.
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: hp(1.8),
    color: Colors.textSecondary,
  },
  selectorBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorContent: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
  },
  selectorLabel: {
    fontSize: hp(1.4),
    color: Colors.textSecondary,
    marginBottom: hp(1),
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: wp(2),
  },
  tabButton: {
    flex: 1,
    paddingHorizontal: wp(2),
    paddingVertical: hp(1.2),
    borderRadius: 8,
    backgroundColor: Colors.lightgrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(4),
  },
  emptyStateCard: {
    maxWidth: wp(90),
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: wp(8),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  emptyStateIconText: {
    fontSize: 32,
  },
  emptyStateTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: hp(1),
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: hp(1.6),
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default PaymentMethod;
