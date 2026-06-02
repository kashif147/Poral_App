import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useApplication } from '../../contexts/applicationContext';
import { useProfile } from '../../contexts/profileContext';
import { getMyPortalPaymentForms } from '../../api/paymentForms.api';
import { getSubscriptionRequest } from '../../api/subscription.api';
import StandingBankersOrder from './StandingBankersOrder';
import DirectDebit from './DirectDebit';
import SalaryDeduction from './SalaryDeduction';
import ScreenHeader from '../../common/screenHeader';
import { Colors, hp, wp } from '../../utils/Styles';

const FORM_TYPE_TO_TAB = {
  DD_MANDATE: 'Direct Debit',
  SALARY_DEDUCTION: 'Salary Deduction',
  STANDING_ORDER: 'Standing Banking Order',
};

const normalizePaymentType = paymentType => {
  if (!paymentType) return null;
  const normalized = paymentType.toString().toLowerCase();
  const compact = normalized.replace(/[^a-z]/g, '');

  // More tolerant matching for typos like "Stanfding Order"
  if (
    (normalized.includes('order') || compact.includes('order')) &&
    (normalized.includes('stand') ||
      compact.includes('stand') ||
      compact.includes('stan') ||
      compact.startsWith('st'))
  ) {
    return 'Standing Banking Order';
  }

  if (
    normalized.includes('standing') &&
    (normalized.includes('banker') ||
      normalized.includes('bank') ||
      normalized.includes('order'))
  ) {
    return 'Standing Banking Order';
  }
  if (normalized.includes('direct') && normalized.includes('debit')) {
    return 'Direct Debit';
  }
  if (
    (normalized.includes('salary') && normalized.includes('deduction')) ||
    normalized === 'deduction' ||
    normalized.includes('payroll') ||
    (normalized.includes('deduction') && normalized.includes('source'))
  ) {
    return 'Salary Deduction';
  }
  return null;
};

const getTabKeyForPortalForm = form => {
  if (!form) return null;
  return (
    FORM_TYPE_TO_TAB[form.formType] ||
    normalizePaymentType(form.formTypeLabel) ||
    normalizePaymentType(form.formType) ||
    null
  );
};

const PaymentMethod = () => {
  const { subscriptionDetail } = useApplication();
  const { profileDetail } = useProfile();
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [loading, setLoading] = useState(true);

  const getPaymentTypeFromProfileSubscription = subscription => {
    if (!subscription) return null;
    return (
      subscription.paymentType ??
      subscription.paymentMethod ??
      subscription.preferredPaymentType ??
      subscription._subscriptionService?.paymentType ??
      subscription.subscriptionService?.paymentType ??
      subscription.subscription?.paymentType ??
      null
    );
  };

  useEffect(() => {
    const loadPaymentMethod = async () => {
      setLoading(true);
      try {
        let selected = null;

        if (profileDetail?.profileId) {
          const subRes = await getSubscriptionRequest(profileDetail.profileId);
          if (subRes?.status >= 200 && subRes?.status < 300) {
            const items = subRes?.data?.data?.data ?? subRes?.data?.data ?? [];
            const subscriptions = Array.isArray(items) ? items : items ? [items] : [];
            const activeSubscription =
              subscriptions.find(
                sub => String(sub?.subscriptionStatus || '').toLowerCase() === 'active',
              ) || subscriptions[0];
            const raw = getPaymentTypeFromProfileSubscription(activeSubscription);
            selected = normalizePaymentType(raw);
          }
        }

        if (!selected) {
          const rootSubscriptionSource = subscriptionDetail || null;
          const nestedSubscriptionSource = subscriptionDetail?.subscriptionDetails || null;
          selected = normalizePaymentType(
            getPaymentTypeFromProfileSubscription(rootSubscriptionSource) ||
              getPaymentTypeFromProfileSubscription(nestedSubscriptionSource) ||
              profileDetail?.paymentType ||
              profileDetail?.preferredPaymentType,
          );
        }

        const mineRes = await getMyPortalPaymentForms();
        if (mineRes?.status >= 200 && mineRes?.status < 300) {
          const formsRaw =
            mineRes?.data?.data?.paymentForms ??
            mineRes?.data?.paymentForms ??
            mineRes?.data?.data ??
            [];
          const forms = Array.isArray(formsRaw)
            ? formsRaw
            : formsRaw
              ? [formsRaw]
              : [];
          const activeForms = forms.filter(
            item => String(item?.status || '').toLowerCase() === 'active',
          );
          const matchedByProfile = selected
            ? activeForms.find(form => getTabKeyForPortalForm(form) === selected)
            : null;
          const fallbackActive = matchedByProfile || activeForms[0] || null;
          const tabFromActive = getTabKeyForPortalForm(fallbackActive) || null;
          if (!selected) {
            selected = tabFromActive;
          }
        }

        setSelectedPaymentType(selected || null);
      } catch (error) {
        console.error('Failed to load payment method:', error);
        setSelectedPaymentType(
          normalizePaymentType(
            getPaymentTypeFromProfileSubscription(subscriptionDetail) ||
              getPaymentTypeFromProfileSubscription(subscriptionDetail?.subscriptionDetails) ||
              profileDetail?.paymentType ||
              profileDetail?.preferredPaymentType,
          ) || null,
        );
      } finally {
        setLoading(false);
      }
    };

    loadPaymentMethod();
  }, [
    profileDetail?.profileId,
    profileDetail?.paymentType,
    profileDetail?.preferredPaymentType,
    subscriptionDetail?.subscriptionDetails?.paymentType,
  ]);

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
                Payment Method Unavailable
              </Text>
              <Text style={styles.emptyStateText}>
                Your profile does not currently have a supported payment method.
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
