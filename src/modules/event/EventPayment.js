import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, wp, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../../common/screenHeader';
import { Button } from '../../common/button';
import { createPaymentIntentRequest } from '../../api/payment.api';
import { createRegistrationRequest } from '../../api/events.api';
import { buildEventsRegistrationPayload } from '../../helpers/events.helper';
import {
  buildRegistrationIntentCacheKey,
  clearRegistrationPaymentIntentCache,
  getOrCreateRegistrationPaymentIntent,
} from '../../helpers/paymentIntent.helper';
import { STACKS } from '../../enums/ScreenEnums';

const MOCK_EVENT_PAYMENTS = false;

const formatCurrency = (value) => {
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  } catch {
    return `€${(value || 0).toFixed(2)}`;
  }
};

const EventPayment = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { confirmPayment } = useStripe();

  const {
    event: routeEvent,
    course: routeCourse,
    selectedDays = [],
    source = 'event-registration',
    eventId,
    courseId,
    eventTitle,
    courseTitle,
    totalCost: routeTotalCost,
    lineItems = [],
    registrationProfile,
  } = route.params || {};

  const event = routeEvent || routeCourse || {
    id: eventId || courseId,
    title: eventTitle || courseTitle || 'Registration',
  };

  const registrationLabel =
    source === 'course-registration' ? 'Course Enrollment' : 'Event Registration';
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const stripePaymentIntentIdRef = useRef(null);
  const intentCacheKeyRef = useRef(null);

  const totalAmount =
    routeTotalCost ??
    (selectedDays || []).reduce((sum, d) => sum + (d.price || 0), 0);
  const amountInCents = Math.round(totalAmount * 100);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const name =
          user?.userFirstName && user?.userLastName
            ? `${user.userFirstName} ${user.userLastName}`
            : user?.userName || '';
        const em = user?.userEmail || user?.email || '';
        setCardholderName(name);
        setEmail(em);
      } catch (e) {
        // ignore
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const initPayment = async () => {
      const hasSelection =
        (selectedDays && selectedDays.length > 0) ||
        (lineItems && lineItems.length > 0);

      if (!event || !hasSelection) {
        setInitLoading(false);
        setError('Invalid event or selection');
        return;
      }

      if (amountInCents <= 0) {
        setInitLoading(false);
        setError(null);
        setClientSecret(null);
        return;
      }

      if (MOCK_EVENT_PAYMENTS) {
        setInitLoading(false);
        setError(null);
        setClientSecret('mock_client_secret');
        return;
      }

      setInitLoading(true);
      setError(null);
      try {
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const isCourse = source === 'course-registration';
        const purpose = isCourse ? 'courseRegistration' : 'eventRegistration';
        const registrationEntityId =
          courseId || event?.courseId || event?.id;
        const cacheKey = buildRegistrationIntentCacheKey({
          purpose,
          eventId: registrationEntityId,
          amountInCents,
        });
        intentCacheKeyRef.current = cacheKey;

        const payload = {
          purpose,
          amount: amountInCents,
          currency: 'eur',
          metadata: {
            ...(isCourse
              ? { courseId: registrationEntityId }
              : { eventId: registrationEntityId }),
            eventTitle: event?.title,
            registrationType: isCourse ? 'course' : 'event',
            selectedDayIds: (selectedDays || []).map((d) => d.id).join(','),
            description: isCourse
              ? `Course: ${event?.title}`
              : `Event: ${event?.title}`,
            tenantId: user?.tenantId || user?.userTenantId,
            userId: user?.id || user?._id,
            lineItems: JSON.stringify(lineItems || []),
          },
        };

        const { clientSecret: secret, stripePaymentIntentId } =
          await getOrCreateRegistrationPaymentIntent({
            cacheKey,
            paymentData: payload,
            createIntentRequest: createPaymentIntentRequest,
          });

        stripePaymentIntentIdRef.current = stripePaymentIntentId;
        setClientSecret(secret);
      } catch (err) {
        console.warn('Event payment init failed:', err?.message);
        stripePaymentIntentIdRef.current = null;
        setError(err?.message || 'Payment initialization failed');
        setClientSecret(null);
      } finally {
        setInitLoading(false);
      }
    };
    initPayment();
  }, [
    event?.id,
    event?.title,
    selectedDays?.length,
    lineItems?.length,
    amountInCents,
    retryKey,
    source,
  ]);

  const submitEventsRegistration = async (stripePaymentIntentId) => {
    const registrationPayload = buildEventsRegistrationPayload({
      source,
      eventId: eventId || event?.id,
      courseId,
      event,
      lineItems,
      selectedDays,
      profile: registrationProfile,
      paymentMethod: 'stripe',
      registeredVia: 'portal',
      stripePaymentIntentId,
    });

    if (!registrationPayload.profile?.email) {
      throw new Error('Missing registration profile details.');
    }

    if (registrationPayload.registrationType === 'course') {
      if (!registrationPayload.courseId) {
        throw new Error('Missing course id for registration.');
      }
    } else if (!registrationPayload.lineItems?.length) {
      throw new Error('Missing registration line items.');
    }

    const res = await createRegistrationRequest(registrationPayload);
    if (res?.status !== 200 && res?.status !== 201) {
      throw new Error(
        res?.data?.message ||
          res?.data?.error?.message ||
          'Unable to create registration.',
      );
    }
    return res;
  };

  const handlePay = async () => {
    if (!cardholderName || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    const isFree = amountInCents <= 0;

    if (!isFree && !cardComplete) {
      Alert.alert('Error', 'Please complete all card details');
      return;
    }

    setIsLoading(true);
    try {
      let paymentIntent = null;

      if (MOCK_EVENT_PAYMENTS) {
        await submitEventsRegistration();
        const fakePaymentIntentId = `pi_mock_${Date.now()}`;
        paymentIntent = {
          id: fakePaymentIntentId,
          status: 'Succeeded',
          amount: amountInCents,
          currency: 'eur',
        };

        navigation.replace(STACKS.EVENT_CONFIRMATION, {
          event,
          selectedDays,
          paymentIntent,
          transactionId: fakePaymentIntentId.replace('pi_', '') || 'GTS-99201-B',
          totalPaid: totalAmount,
        });
        return;
      }

      if (!isFree) {
        if (!clientSecret) {
          Alert.alert('Error', 'Payment not ready. Please wait or try again.');
          return;
        }

        const { error: stripeError, paymentIntent: confirmedIntent } =
          await confirmPayment(clientSecret, {
            paymentMethodType: 'Card',
            paymentMethodData: {
              billingDetails: { name: cardholderName, email },
            },
          });

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        const status = String(confirmedIntent?.status || '');
        const succeeded =
          status === 'Succeeded' ||
          status === 'succeeded' ||
          status === 'RequiresCapture' ||
          status === 'requires_capture';

        if (!succeeded) {
          throw new Error(`Payment status: ${status || 'unknown'}`);
        }

        paymentIntent = confirmedIntent;
      } else {
        paymentIntent = {
          id: `pi_free_${Date.now()}`,
          status: 'Succeeded',
          amount: 0,
          currency: 'eur',
        };
      }

      const stripePaymentIntentId =
        paymentIntent?.id || stripePaymentIntentIdRef.current;

      await submitEventsRegistration(stripePaymentIntentId);
      navigation.replace(STACKS.EVENT_CONFIRMATION, {
        event,
        selectedDays,
        paymentIntent,
        transactionId:
          paymentIntent?.id?.replace('pi_', '') || 'GTS-99201-B',
        totalPaid: totalAmount,
      });
    } catch (err) {
      Alert.alert('Payment Failed', err?.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const daySummary =
    selectedDays?.length > 1
      ? `Day ${selectedDays.map((d, i) => i + 1).join(' & Day ')} Access`
      : selectedDays?.[0]?.title || registrationLabel;

  const isFree = amountInCents <= 0;
  const canSubmit =
    Boolean(cardholderName) &&
    Boolean(email) &&
    !isLoading &&
    (isFree || Boolean(cardComplete));

  if (initLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Preparing payment...</Text>
      </View>
    );
  }

  if (error && !clientSecret && !isFree) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Payment" showBack />
        <View style={[styles.centered, styles.errorBox]}>
          <Text style={styles.errorTitle}>Payment setup failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              onPress={() => {
                if (intentCacheKeyRef.current) {
                  clearRegistrationPaymentIntentCache(intentCacheKeyRef.current);
                }
                stripePaymentIntentIdRef.current = null;
                setClientSecret(null);
                setError(null);
                setRetryKey((k) => k + 1);
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Register & Pay" showBack />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {source === 'course-registration' ? 'COURSE' : 'EVENT'}
            </Text>
            <Text style={styles.summaryTitle}>{event?.title}</Text>
            <Text style={styles.summaryDays}>{daySummary}</Text>
            <View style={styles.summaryTotal}>
              <Text style={styles.summaryTotalLabel}>TOTAL</Text>
              <Text style={styles.summaryTotalAmount}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name on Card *</Text>
            <TextInput
              value={cardholderName}
              onChangeText={setCardholderName}
              placeholder="Full name"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          {isFree ? (
            <View style={styles.inputGroup}>
              <Text style={styles.freeNote}>
                No payment required for this registration.
              </Text>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Details *</Text>
              <View style={styles.cardFieldWrapper}>
                <CardField
                  postalCodeEnabled={false}
                  placeholders={{
                    number: '4242 4242 4242 4242',
                    cvc: 'CVC',
                    expiration: 'MM/YY',
                  }}
                  cardStyle={{
                    backgroundColor: Colors.surface,
                    textColor: Colors.textPrimary,
                    placeholderColor: Colors.textSecondary,
                    borderWidth: 0,
                  }}
                  style={styles.cardField}
                  onCardChange={(details) => setCardComplete(details?.complete)}
                />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
          <Button
            title={
              isLoading
                ? 'Processing…'
                : isFree
                  ? 'Complete Registration'
                  : 'Register & Pay'
            }
            onPress={handlePay}
            disabled={!canSubmit}
            primary
            style={styles.payButton}
            textStyle={styles.payButtonText}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  summaryDays: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  summaryTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  summaryTotalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  freeNote: {
    fontSize: 14,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  cardFieldWrapper: {
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    minHeight: 52,
    justifyContent: 'center',
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.background,
  },
  payButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  errorBox: {
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default EventPayment;
