import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useProfile } from '../../contexts/profileContext';
import {
  getMyPortalPaymentForms,
  getPaymentFormPrefill,
} from '../../api/paymentForms.api';
import { getSubscriptionRequest } from '../../api/subscription.api';
import StandingBankersOrder from './StandingBankersOrder';
import DirectDebit from './DirectDebit';
import SalaryDeduction from './SalaryDeduction';
import ScreenHeader from '../../common/screenHeader';
import { Colors, hp, wp } from '../../utils/Styles';
import {
  extractMyPortalPaymentForms,
  extractPaymentFormPrefill,
  formMatchesProfilePaymentType,
  getExistingPaymentFormForProfile,
  getPaymentTypeFromProfileSubscription,
  getPortalFormSeedKey,
  getTabKeyForPortalForm,
  isPaymentApiSuccess,
  isPortalPaymentFormTab,
  isPortalPaymentFormViewOnly,
  mergePaymentFormWithPrefill,
  normalizePaymentType,
} from '../../helpers/paymentForm.helper';

const loadPaymentFormPrefill = async (profileId, paymentTab) => {
  if (!profileId || !paymentTab) return null;
  try {
    const prefillRes = await getPaymentFormPrefill(profileId);
    if (!isPaymentApiSuccess(prefillRes)) return null;
    const prefill = extractPaymentFormPrefill(prefillRes);
    if (!prefill) return null;
    if (formMatchesProfilePaymentType(prefill, paymentTab)) {
      return prefill;
    }
    const tabFromPrefill =
      getTabKeyForPortalForm(prefill) ||
      normalizePaymentType(prefill.memberPaymentType);
    return tabFromPrefill === paymentTab ? prefill : null;
  } catch (error) {
    console.error('Failed to load payment form prefill:', error);
    return null;
  }
};

const PaymentMethod = () => {
  const { profileDetail } = useProfile();
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [activePortalForm, setActivePortalForm] = useState(null);
  const [prefillPortalForm, setPrefillPortalForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const loadInFlightRef = useRef(false);
  const hasInitiallyLoadedRef = useRef(false);

  const loadPaymentMethod = useCallback(
    async ({ showFullLoading = false } = {}) => {
      if (!profileDetail?.profileId) {
        setActivePortalForm(null);
        setPrefillPortalForm(null);
        setSelectedPaymentType(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (loadInFlightRef.current) {
        return;
      }

      loadInFlightRef.current = true;
      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        let profilePaymentTypeTab = null;

        const subRes = await getSubscriptionRequest(profileDetail.profileId);
        if (isPaymentApiSuccess(subRes)) {
          const items = subRes?.data?.data?.data ?? subRes?.data?.data ?? [];
          const subscriptions = Array.isArray(items)
            ? items
            : items
              ? [items]
              : [];
          const activeSubscription =
            subscriptions.find(
              sub =>
                String(sub?.subscriptionStatus || '').toLowerCase() === 'active',
            ) || subscriptions[0];
          const raw = getPaymentTypeFromProfileSubscription(activeSubscription);
          profilePaymentTypeTab = normalizePaymentType(raw);
        }

        let paymentForms = [];
        const mineRes = await getMyPortalPaymentForms();
        if (isPaymentApiSuccess(mineRes)) {
          paymentForms = extractMyPortalPaymentForms(mineRes);

          if (!profilePaymentTypeTab && paymentForms.length > 0) {
            const firstActive = paymentForms.find(
              form => String(form?.status || '').toLowerCase() === 'active',
            );
            profilePaymentTypeTab = getTabKeyForPortalForm(firstActive);
          }
        }

        const existingForm =
          profilePaymentTypeTab && isPortalPaymentFormTab(profilePaymentTypeTab)
            ? getExistingPaymentFormForProfile(
                paymentForms,
                profilePaymentTypeTab,
              )
            : !profilePaymentTypeTab
              ? getExistingPaymentFormForProfile(paymentForms, null)
              : null;

        setActivePortalForm(existingForm);

        const candidateTab =
          profilePaymentTypeTab ||
          (existingForm ? getTabKeyForPortalForm(existingForm) : null);
        const paymentTab = isPortalPaymentFormTab(candidateTab)
          ? candidateTab
          : null;
        setSelectedPaymentType(paymentTab);

        if (paymentTab && isPortalPaymentFormTab(paymentTab)) {
          const prefill = await loadPaymentFormPrefill(
            profileDetail.profileId,
            paymentTab,
          );
          setPrefillPortalForm(prefill);
        } else {
          setPrefillPortalForm(null);
        }

        setRefreshToken(token => token + 1);
        hasInitiallyLoadedRef.current = true;
      } catch (error) {
        console.error('Failed to load payment method:', error);
        setActivePortalForm(null);
        setPrefillPortalForm(null);
        setSelectedPaymentType(null);
      } finally {
        loadInFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profileDetail?.profileId],
  );

  useFocusEffect(
    useCallback(() => {
      loadPaymentMethod({ showFullLoading: !hasInitiallyLoadedRef.current });
    }, [loadPaymentMethod]),
  );

  const handleRefresh = useCallback(() => {
    loadPaymentMethod({ showFullLoading: false });
  }, [loadPaymentMethod]);

  const seedPortalForm = useMemo(() => {
    if (activePortalForm) {
      return mergePaymentFormWithPrefill(activePortalForm, prefillPortalForm);
    }
    return prefillPortalForm;
  }, [activePortalForm, prefillPortalForm]);

  const formRefreshKey = useMemo(() => {
    const seedKey = getPortalFormSeedKey(seedPortalForm);
    return `${refreshToken}|${selectedPaymentType || 'none'}|${seedKey}`;
  }, [refreshToken, selectedPaymentType, seedPortalForm]);

  const isActivePaymentMethod = useMemo(
    () => isPortalPaymentFormViewOnly(activePortalForm),
    [activePortalForm],
  );

  const headerSubtitle = useMemo(() => {
    if (isActivePaymentMethod) {
      return 'View your submitted payment authorization';
    }
    if (selectedPaymentType) {
      return 'Complete and submit your payment authorization';
    }
    return null;
  }, [isActivePaymentMethod, selectedPaymentType]);

  const sharedFormProps = {
    seedPortalForm,
    refreshing,
    onRefresh: handleRefresh,
  };

  const renderPaymentComponent = () => {
    if (!selectedPaymentType || !isPortalPaymentFormTab(selectedPaymentType)) {
      return null;
    }

    switch (selectedPaymentType) {
      case 'Standing Banking Order':
        return (
          <StandingBankersOrder key={formRefreshKey} {...sharedFormProps} />
        );
      case 'Direct Debit':
        return <DirectDebit key={formRefreshKey} {...sharedFormProps} />;
      case 'Salary Deduction':
        return <SalaryDeduction key={formRefreshKey} {...sharedFormProps} />;
      default:
        return null;
    }
  };

  if (loading && !hasInitiallyLoadedRef.current) {
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
      {selectedPaymentType && (
        <View style={styles.headerMeta}>
          {headerSubtitle ? (
            <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
          ) : null}
          {isActivePaymentMethod && activePortalForm?.status ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {String(activePortalForm.status).toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
      )}

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
  headerMeta: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerSubtitle: {
    fontSize: hp(1.5),
    color: Colors.textSecondary,
    marginBottom: hp(0.5),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeText: {
    fontSize: hp(1.2),
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.5,
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
