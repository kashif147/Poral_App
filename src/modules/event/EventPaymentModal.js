import React, { useEffect, useState } from 'react';
import {
  Modal,
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
  SafeAreaView,
  Pressable,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../common/button';
import { createPaymentIntentRequest } from '../../api/payment.api';

const formatCurrency = (value) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  } catch {
    return `$${(value || 0).toFixed(2)}`;
  }
};

const EventPaymentModal = ({
  visible,
  onClose,
  onSuccess,
  event,
  selectedDays = [],
}) => {
  const { confirmPayment } = useStripe();

  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const totalAmount = (selectedDays || []).reduce((sum, d) => sum + (d.price || 0), 0);
  const amountInCents = Math.round(totalAmount * 100);

  useEffect(() => {
    if (!visible) {
      setClientSecret(null);
      setCardComplete(false);
      setIsLoading(false);
      setError(null);
      setInitLoading(true);
      setRetryKey(0);
      return;
    }
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        setUserDetail(user);
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
  }, [visible]);

  useEffect(() => {
    if (!visible || !event || !selectedDays?.length || amountInCents <= 0) {
      if (visible && event && selectedDays?.length && amountInCents <= 0) {
        setInitLoading(false);
        setError('Invalid event or selection');
      }
      return;
    }
    const initPayment = async () => {
      setInitLoading(true);
      setError(null);
      try {
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const payload = {
          purpose: 'eventRegistration',
          amount: amountInCents,
          currency: 'usd',
          metadata: {
            eventId: event?.id,
            eventTitle: event?.title,
            selectedDayIds: (selectedDays || []).map((d) => d.id).join(','),
            description: `Event: ${event?.title}`,
            tenantId: user?.tenantId || user?.userTenantId,
            userId: user?.id || user?._id,
          },
        };
        const res = await createPaymentIntentRequest(payload);
        const secret =
          res?.data?.data?.clientSecret ||
          res?.data?.client_secret ||
          res?.data?.clientSecret;
        if (secret) {
          setClientSecret(secret);
        } else {
          throw new Error('No client secret in response');
        }
      } catch (err) {
        console.warn('Event payment init failed:', err?.message);
        setError(err?.message || 'Payment initialization failed');
        setClientSecret(null);
      } finally {
        setInitLoading(false);
      }
    };
    initPayment();
  }, [visible, event?.id, event?.title, selectedDays?.length, amountInCents, retryKey]);

  const handlePay = async () => {
    if (!cardholderName || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    if (!clientSecret) {
      Alert.alert('Error', 'Payment not ready. Please wait or try again.');
      return;
    }
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete all card details');
      return;
    }

    setIsLoading(true);
    try {
      const { error: stripeError, paymentIntent } = await confirmPayment(
        clientSecret,
        {
          paymentMethodType: 'Card',
          paymentMethodData: {
            billingDetails: { name: cardholderName, email },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }
      if (paymentIntent?.status === 'Succeeded') {
        onSuccess({
          paymentIntent,
          transactionId: paymentIntent?.id?.replace('pi_', '') || 'GTS-99201-B',
          totalPaid: totalAmount,
        });
      } else {
        throw new Error(`Payment status: ${paymentIntent?.status || 'unknown'}`);
      }
    } catch (err) {
      Alert.alert('Payment Failed', err?.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const daySummary =
    selectedDays?.length > 1
      ? `Day ${selectedDays.map((d, i) => i + 1).join(' & Day ')} Access`
      : selectedDays?.[0]?.title || 'Event Access';

  const renderContent = () => {
    if (initLoading) {
      return (
        <View style={[styles.centered, styles.loadingBox]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Preparing payment...</Text>
        </View>
      );
    }

    const showErrorBanner = error && !clientSecret;

    return (
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showErrorBanner && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerTitle}>Payment setup failed</Text>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>EVENT</Text>
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

          <TouchableOpacity
            onPress={() => {
              const name =
                userDetail?.userFirstName && userDetail?.userLastName
                  ? `${userDetail.userFirstName} ${userDetail.userLastName}`
                  : userDetail?.userName || '';
              const em = userDetail?.userEmail || userDetail?.email || '';
              setCardholderName(name);
              setEmail(em);
            }}
            style={styles.autofillLink}
          >
            <Text style={styles.autofillLinkText}>Auto-fill from profile</Text>
          </TouchableOpacity>

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
        </ScrollView>

        <View style={styles.footer}>
          {showErrorBanner && (
            <TouchableOpacity
              onPress={() => {
                setError(null);
                setRetryKey((k) => k + 1);
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          <Button
            title={isLoading ? 'Processing…' : 'Register & Pay'}
            onPress={handlePay}
            disabled={!clientSecret || !cardComplete || isLoading}
            primary
            style={styles.payButton}
            textStyle={styles.payButtonText}
          />
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Register & Pay</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {renderContent()}
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: hp(75),
    maxHeight: hp(90),
  },
  safe: {
    flex: 1,
    minHeight: hp(70),
    maxHeight: hp(90),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
    minHeight: hp(50),
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
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
  autofillLink: {
    marginBottom: 20,
  },
  autofillLinkText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
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
    paddingBottom: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
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
});

export default EventPaymentModal;
