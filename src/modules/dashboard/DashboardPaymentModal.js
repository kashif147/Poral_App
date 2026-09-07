import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Colors, hp } from '../../utils/Styles';
import { Button } from '../../common/button';
import { Label } from '../../common/text/label';
import { InputField } from '../../common/inputField';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { resolvePaymentIntentOutcome } from '../../helpers/paymentIntent.helper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createPaymentIntentRequest } from '../../api/payment.api';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import { useProfile } from '../../contexts/profileContext';

const DashboardPaymentModal = ({ visible, onClose, onSuccess, netAmountInCents }) => {
  const { confirmPayment } = useStripe();
  const { personalDetail, subscriptionDetail, categoryData, getCategoryData, categoryLoading } = useApplication();
  const { categoryLookups } = useLookup();
  const { profileDetail } = useProfile();

  // Match web: use subscriptionDetails.membershipCategory first, then profile
  const membershipCategory = subscriptionDetail?.subscriptionDetails?.membershipCategory || profileDetail?.membershipCategory;

  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [editablePrice, setEditablePrice] = useState('');
  const [userDetail, setUserDetail] = useState(null);
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');

  const canPay =
    editablePrice &&
    parseFloat(editablePrice) > 0 &&
    cardholderName &&
    email &&
    cardComplete;

  // Load user data and pre-fill form when modal opens
  useEffect(() => {
    if (!visible) return;
    const loadUserData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        setUserDetail(userData);
        const userName =
          userData?.userFirstName && userData?.userLastName
            ? `${userData.userFirstName} ${userData.userLastName}`
            : userData?.userName || '';
        const userEmail = userData?.userEmail || userData?.email || '';
        setCardholderName(userName);
        setEmail(userEmail);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, [visible]);

  // Fetch category data when modal is visible
  useEffect(() => {
    if (visible && membershipCategory) {
      getCategoryData(membershipCategory, categoryLookups || []);
    }
  }, [visible, membershipCategory, categoryLookups, getCategoryData]);

  // Set default price: prefer net balance when available, fallback to category price
  useEffect(() => {
    if (!visible) return;

    if (typeof netAmountInCents === 'number') {
      const netInEuros = (netAmountInCents / 100).toFixed(2);
      setEditablePrice(netInEuros);
    } else if (categoryData?.currentPricing?.price != null) {
      const priceInEuros = (categoryData.currentPricing.price / 100).toFixed(2);
      setEditablePrice(priceInEuros);
    }
  }, [visible, netAmountInCents, categoryData?.currentPricing?.price]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setEditablePrice('');
      setCardComplete(false);
      setCardholderName('');
      setEmail('');
    }
  }, [visible]);

  const formatCurrency = value => {
    const currency = (categoryData?.currentPricing?.currency || 'EUR').toUpperCase();
    try {
      return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency,
      }).format(value || 0);
    } catch {
      return `€${(value || 0).toFixed(2)}`;
    }
  };

  const handlePayNow = async () => {
    if (!cardholderName || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    if (!editablePrice || parseFloat(editablePrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete all card details');
      return;
    }

    setLoading(true);
    try {
      const amountInCents = Math.round(parseFloat(editablePrice) * 100);
      const currency = categoryData?.currentPricing?.currency || 'eur';
      const applicationId = personalDetail?.applicationId;
      const userId = userDetail?.id || userDetail?._id;
      const tenantId = userDetail?.tenantId || userDetail?.userTenantId;

      const paymentData = {
        purpose: 'subscriptionFee',
        amount: amountInCents,
        currency,
        metadata: {
          memberId: applicationId,
          description: 'Membership payment from dashboard',
          tenantId,
          userId,
          membershipCategory,
          paymentType: 'Card Payment',
        },
      };

      const intentResponse = await createPaymentIntentRequest(paymentData);
      const secret =
        intentResponse?.data?.data?.clientSecret ||
        intentResponse?.data?.client_secret ||
        intentResponse?.data?.clientSecret;

      if (!secret) {
        throw new Error('Missing client secret from payment intent response');
      }

      const { error, paymentIntent } = await confirmPayment(secret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: cardholderName,
            email: email,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const outcome = resolvePaymentIntentOutcome(paymentIntent?.status, {
        isApplicationPayment: false,
      });

      if (outcome.success) {
        onSuccess?.();
        onClose?.();
        Alert.alert(outcome.title, outcome.message);
        return;
      }

      throw new Error(outcome.message);
    } catch (err) {
      console.error('Payment Error:', err);
      Alert.alert('Payment Failed', err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Membership Subscription</Text>
                  <Text style={styles.caption}>
                    Review your membership and complete payment
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {categoryLoading ||
              (visible && membershipCategory && !categoryData) ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={{ color: Colors.textPrimary, marginTop: 12 }}>
                    Loading payment details...
                  </Text>
                </View>
              ) : (
                <View>
                  {categoryData && (
                    <View style={styles.categoryCard}>
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Label style={styles.smallLabel}>MEMBERSHIP CATEGORY</Label>
                        <Text style={styles.categoryText}>
                          {categoryData?.name || 'Membership Category'}
                        </Text>
                        {categoryData?.description && (
                          <Text style={styles.categoryDescription}>
                            {categoryData.description}
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Label style={styles.smallLabel}>Net Balance</Label>
                        <Text style={styles.priceText}>
                          {formatCurrency(
                            typeof netAmountInCents === 'number'
                              ? netAmountInCents / 100
                              : (categoryData?.currentPricing?.price || 0) / 100
                          )}
                        </Text>
                        {categoryData?.currentPricing?.frequency && (
                          <Text style={styles.frequencyText}>
                            {categoryData.currentPricing.frequency}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  <View style={{ marginTop: 20 }}>
                    <Label style={styles.requiredLabel}>Amount to Pay *</Label>
                    <View style={styles.inputFieldWrap}>
                      <InputField
                        value={editablePrice}
                        onChange={text => setEditablePrice(text)}
                        placeholder="Enter amount"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <Text style={styles.hintText}>
                      {typeof netAmountInCents === 'number'
                        ? `Net balance: ${formatCurrency(netAmountInCents / 100)}`
                        : categoryData?.currentPricing?.price != null
                          ? `Default price: ${formatCurrency(
                              categoryData.currentPricing.price / 100
                            )}`
                          : categoryLoading
                            ? 'Loading...'
                            : '—'}
                    </Text>
                  </View>

                  <View style={{ marginTop: 20 }}>
                    <View>
                      <Label style={styles.requiredLabel}>Name on Card *</Label>
                      <View style={styles.inputFieldWrap}>
                        <InputField
                          value={cardholderName}
                          onChange={text => setCardholderName(text)}
                          placeholder="Full name"
                        />
                      </View>
                    </View>
                    <View style={{ marginTop: 16 }}>
                      <Label style={styles.requiredLabel}>Email *</Label>
                      <View style={styles.inputFieldWrap}>
                        <InputField
                          value={email}
                          onChange={text => setEmail(text)}
                          placeholder="you@example.com"
                          keyboardType="email-address"
                        />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.autofillText}>
                    ✓ Pre-filled from your profile
                  </Text>

                  <View style={{ marginTop: 20 }}>
                    <Label style={styles.requiredLabel}>Card Details *</Label>
                    <View style={styles.cardFieldWrapper}>
                      <CardField
                        postalCodeEnabled={false}
                        placeholders={{
                          number: '4242 4242 4242 4242',
                          cvc: 'CVC',
                          expiration: 'MM/YY',
                        }}
                        cardStyle={{
                          backgroundColor: '#00000000',
                          textColor: Colors.textPrimary,
                          placeholderColor: Colors.textSecondary,
                          borderWidth: 0,
                          borderColor: '#00000000',
                          borderRadius: 12,
                          fontSize: 15,
                        }}
                        style={{ width: '100%', height: 52 }}
                        onCardChange={details =>
                          setCardComplete(details?.complete)
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.totalSection}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 20,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: Colors.textSecondary,
                          fontWeight: '500',
                        }}
                      >
                        Total Amount
                      </Text>
                      <Text style={styles.totalAmount}>
                        {formatCurrency(parseFloat(editablePrice) || 0)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row' }}>
                      <Button
                        title="Cancel"
                        onPress={onClose}
                        outlined
                        style={{
                          flex: 1,
                          height: 52,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: Colors.divider,
                          backgroundColor: Colors.white,
                          marginRight: 8,
                        }}
                        textStyle={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: Colors.textPrimary,
                        }}
                      />
                      <Button
                        title={loading ? 'Processing…' : 'Pay Now'}
                        onPress={handlePayNow}
                        disabled={!canPay || loading}
                        primary
                        style={{ flex: 1, height: 52, borderRadius: 12, marginLeft: 8 }}
                        textStyle={{ fontSize: 15, fontWeight: '700' }}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '400',
    lineHeight: 18,
  },
  title: {
    fontWeight: '700',
    fontSize: hp(2.8),
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  caption: {
    marginTop: 6,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  smallLabel: {
    fontWeight: '600',
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  requiredLabel: {
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },
  categoryCard: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  categoryText: {
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: 16,
    marginTop: 2,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  priceText: {
    fontWeight: '800',
    color: Colors.primary,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  frequencyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  inputFieldWrap: {
    marginTop: 8,
  },
  hintText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  autofillText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  cardFieldWrapper: {
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  totalSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
});

export default DashboardPaymentModal;
