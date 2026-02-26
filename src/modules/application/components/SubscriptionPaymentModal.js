import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, SafeAreaView, StatusBar } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Button } from '../../../common/button';
import { hp, Colors } from '../../../utils/Styles';
import { createPaymentIntentRequest } from '../../../api/payment.api';
import { useApplication } from '../../../contexts/applicationContext';
import { useLookup } from '../../../contexts/lookupContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

const SubscriptionPaymentModal = ({
  visible,
  onClose,
  onSuccess,
  onFailure,
  formData,
  membershipCategory,
  applicationId,
}) => {
  const { confirmPayment } = useStripe();
  const userInfo = useSelector(state => state.auth.userDetail);
  const user = useSelector(state => state.auth.user);
  const { categoryData, getCategoryData, categoryLoading } = useApplication();
  const { categoryLookups } = useLookup();
  const [isLoading, setIsLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');

  const priceInfo = useMemo(() => {
    const cents = categoryData?.currentPricing?.price;
    if (typeof cents === 'number' && !Number.isNaN(cents)) {
      const full = cents / 100;
      const monthly = full / 4;
      return { full, monthly };
    }
    return { full: 0, monthly: 0 };
  }, [categoryData]);

  // Format currency (matching web version)
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

  const paymentType = formData?.subscriptionDetails?.paymentType;
  const isCardPayment = paymentType === 'Card Payment' || paymentType === 'Credit Card';
  const isPayrollDeduction = paymentType === 'Payroll Deduction' || paymentType === 'Deduction at Source';

  // Load user data and pre-fill form (matching web version)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userName = user?.userFirstName || user?.firstName && user?.userLastName || user?.lastName
          ? `${user.userFirstName || user?.firstName} ${user.userLastName || user?.lastName}`
          : (user?.userName || user?.fullName) || 
            (formData?.personalInfo?.forename && formData?.personalInfo?.surname
              ? `${formData.personalInfo.forename} ${formData.personalInfo.surname}`
              : '');
        
        // Pre-fill email
        const userEmail = user?.userEmail || user?.email || 
          (formData?.personalInfo?.preferredEmail === 'work'
            ? formData?.personalInfo?.workEmail
            : formData?.personalInfo?.personalEmail) || '';

        setCardholderName(userName);
        setEmail(userEmail);

        console.log('✅ Pre-filled payment form:', { userName, userEmail });
      } catch (error) {
        console.error('❌ Error loading user data:', error);
      }
    };

    if (visible) {
      loadUserData();
    } else {
      // Reset state when modal closes to ensure fresh start next time
      console.log('🔄 Resetting payment modal state');
      setClientSecret(null);
      setCardComplete(false);
      setIsLoading(false);
      setError(null);
      setRetryKey(0); // Reset retry key
    }
  }, [visible, formData]);

  // Fetch category data when modal opens
  useEffect(() => {
    if (visible && membershipCategory) {
      console.log('📦 Fetching category:', membershipCategory);
      getCategoryData(membershipCategory, categoryLookups || []);
    }
  }, [visible, membershipCategory, categoryLookups, getCategoryData]);

  // Initialize payment intent when category data is available (matching web version)
  useEffect(() => {
    const initPayment = async () => {
      if (!visible || !applicationId || !membershipCategory || !categoryData) {
        if (!categoryData && visible && membershipCategory) {
          // Still loading category data
          setProductLoading(true);
        }
        return;
      }

      // Reset client secret and error when modal opens to create fresh payment intent
      setClientSecret(null);
      setError(null);
      console.log('🔄 Starting payment initialization...');
      setProductLoading(true);

      try {
        // ✅ Step 1: Category data is already loaded
        const payload = categoryData;
        const currentPricing = payload?.currentPricing || {};
        const basePrice = currentPricing?.price; // Stripe expects amount in cents
        const currency = currentPricing?.currency || 'eur';

        if (!basePrice) throw new Error('Invalid category price data');

        // Calculate amount based on payment type (matching web version)
        const paymentType = formData?.subscriptionDetails?.paymentType;
        // Retired Associate gets full price regardless of payment type (special offer)
        const isRetiredAssociate = payload?.name === 'Retired Associate';
        const amountInCents = isRetiredAssociate
          ? basePrice // Full price for Retired Associate
          : paymentType === 'Credit Card' 
            ? basePrice 
            : Math.round(basePrice / 4); // Divide by 4 for other payment types

        // ✅ Step 2: Get user data
        const userId = userInfo?.id;
        const tenantId = userInfo?.tenantId;

        // ✅ Step 3: Create Payment Intent
        const paymentData = {
          purpose: 'subscriptionFee',
          amount: amountInCents, // Stripe amount is in smallest currency unit
          currency,
          metadata: {
            applicationId,
            description: paymentType === 'Credit Card' 
              ? 'Annual membership fees' 
              : 'Quarterly membership fees',
            tenantId,
            userId,
            membershipCategory,
            paymentType: formData?.subscriptionDetails?.paymentType,
          },
        };

        console.log('🧾 Creating Payment Intent with:', paymentData);

        const res = await createPaymentIntentRequest(paymentData);
        console.log('💳 Payment Intent Response:', res);
        if(res?.status === 200) {
          const secret =
            res?.data?.data?.clientSecret ||
            res?.data?.client_secret ||
            res?.data?.clientSecret;
            setClientSecret(secret);
          if (!secret) {
            console.error('❌ No client secret in response. Full response:', res);
            throw new Error('Missing client secret from response');
          }
        }
        setError(null); // Clear any previous errors
        console.log('✅ Payment initialized successfully');
      } catch (error) {
        console.log('❌ Payment initialization error:', error);
        console.log('❌ Error stack:', error.stack);
        const errorMessage = error.message || 'Payment initialization failed';
        setError(errorMessage);
        // Alert.alert('Error', errorMessage);
        onFailure?.(errorMessage);
      } finally {
        setProductLoading(false);
      }
    };

    initPayment();
  }, [visible, membershipCategory, applicationId, categoryData, formData?.subscriptionDetails?.paymentType, retryKey]);

  // Display price based on payment type
  const getDisplayPrice = () => {
    return isCardPayment ? priceInfo.full : priceInfo.monthly;
  };

  console.log('💳 Client Secret:', clientSecret);

  // Payment handler (matching web version)
  const handlePayNow = async () => {
    console.log('💳 Pay Now clicked');
    console.log('📋 Validation:', { 
      cardholderName: !!cardholderName, 
      email: !!email, 
      clientSecret: !!clientSecret, 
      cardComplete,
      clientSecretPreview: clientSecret ? clientSecret.substring(0, 20) + '...' : 'null'
    });

    // Validate user data
    if (!cardholderName || !email) {
      console.log('❌ Validation failed: Name or email missing');
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    if (!clientSecret) {
      console.log('❌ Validation failed: No client secret');
      Alert.alert('Error', 'Payment not initialized. Please close and reopen the payment form.');
      return;
    }

    if (!cardComplete) {
      console.log('❌ Validation failed: Card details incomplete');
      Alert.alert('Error', 'Please complete all card details');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Confirming payment with Stripe...');
      console.log('👤 Billing details:', { name: cardholderName, email });
      console.log('💳 Using client secret:', clientSecret.substring(0, 30) + '...');
      
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: cardholderName,
            email: email,
          },
        },
      });

      console.log('📬 Stripe response received');
      console.log('❓ Error:', error);
      console.log('💰 Payment Intent:', paymentIntent);

      if (error) {
        console.error('❌ Stripe error object:', JSON.stringify(error, null, 2));
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error type:', error.type);
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.code === 'payment_intent_unexpected_state') {
          errorMessage = 'This payment has already been processed. Please close and reopen the payment form.';
        } else if (error.message?.includes('No such payment_intent')) {
          errorMessage = 'Payment session expired. Please close and reopen the payment form.';
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Payment Confirmation Response:', JSON.stringify(paymentIntent, null, 2));

      // Check if payment was successful
      if (paymentIntent?.status === 'Succeeded') {
        console.log('🎉 Payment succeeded!');
        onSuccess?.({
          paymentMethod: 'card',
          total: getDisplayPrice(),
          paymentDetails: {
            name: cardholderName,
            email: email,
          },
          paymentIntent: paymentIntent,
        });
      } else {
        console.log('⚠️ Payment status:', paymentIntent?.status);
        console.log('⚠️ Full payment intent:', JSON.stringify(paymentIntent, null, 2));
        throw new Error(`Payment status: ${paymentIntent?.status || 'unknown'}. Please try again.`);
      }
    } catch (err) {
      console.error('❌ Payment Error:', err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      Alert.alert('Payment Failed', err.message || 'Payment failed. Please try again.');
      onFailure?.(err.message || 'Payment failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar
          backgroundColor={Colors.background}
          barStyle="dark-content"
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
        <View style={styles.container}>
          {/* Header */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
          <Text style={styles.title}>Membership Subscription</Text>
          <Text style={styles.caption}>Review your membership and complete payment</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

          {/* Show loading while fetching category data */}
          {productLoading || categoryLoading || (!categoryData && !error) ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{ color: Colors.textPrimary, marginTop: 12 }}>Loading payment details...</Text>
            </View>
          ) : error ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 20 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
                Payment Initialization Failed
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
                {error}
              </Text>
              <Button 
                title="Retry" 
                onPress={() => {
                  setError(null);
                  setRetryKey(prev => prev + 1); // Trigger useEffect to re-run
                }} 
                primary 
                style={{ 
                  minWidth: 120,
                  height: 44, 
                  borderRadius: 12,
                }} 
                textStyle={{ fontSize: 15, fontWeight: '600' }} 
              />
              <TouchableOpacity 
                onPress={onClose} 
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '500' }}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>

          {/* Membership category card */}
          <View style={styles.categoryCard}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.smallLabel}>MEMBERSHIP CATEGORY</Text>
              <Text style={styles.categoryText}>{categoryData?.name || membershipCategory}</Text>
              {categoryData?.description && (
                <Text style={styles.categoryDescription}>{categoryData.description}</Text>
              )}
            </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.smallLabel}>PRICE</Text>
                  <Text style={styles.priceText}>{formatCurrency(getDisplayPrice())}</Text>
              {categoryData?.currentPricing?.frequency && (
                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' }}>{categoryData.currentPricing.frequency}</Text>
              )}
                </View>
          </View>

          {/* Name + Email */}
          <View style={{ marginTop: 20 }}>
            <View>
              <Text style={styles.requiredLabel}>Name on Card *</Text>
              <TextInput 
                value={cardholderName} 
                onChangeText={setCardholderName} 
                placeholder="Full name" 
                placeholderTextColor={Colors.textSecondary} 
                style={styles.input} 
              />
            </View>
            <View style={{ marginTop: 16 }}>
              <Text style={styles.requiredLabel}>Email *</Text>
              <TextInput 
                value={email} 
                onChangeText={setEmail} 
                placeholder="you@example.com" 
                placeholderTextColor={Colors.textSecondary} 
                keyboardType="email-address" 
                style={styles.input} 
              />
            </View>
          </View>
          <TouchableOpacity onPress={() => {
            const userName = user?.userFirstName || user?.firstName && user?.userLastName || user?.lastName
              ? `${user?.userFirstName || user?.firstName} ${user?.userLastName || user?.lastName}`
              : (user?.userName || user?.fullName) || 
                (formData?.personalInfo?.forename && formData?.personalInfo?.surname
                  ? `${formData.personalInfo.forename} ${formData.personalInfo.surname}`
                  : '');
            const userEmail = user?.userEmail || user?.email || 
              (formData?.personalInfo?.preferredEmail === 'work'
                ? formData?.personalInfo?.workEmail
                : formData?.personalInfo?.personalEmail) || '';
            setCardholderName(userName);
            setEmail(userEmail);
            console.log('🔄 Autofilled from profile:', { userName, userEmail });
          }} style={styles.autofillLink}>
            <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>✓ Auto-fill from profile</Text>
          </TouchableOpacity>

          {/* Card details */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.requiredLabel}>Card Details *</Text>
            <View style={styles.cardFieldWrapper}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{ number: '4242 4242 4242 4242', cvc: 'CVC', expiration: 'MM/YY' }}
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
                onCardChange={details => setCardComplete(details?.complete)}
              />
            </View>
          </View>

          {/* Total + Actions */}
          <View style={{ 
            marginTop: 24, 
            paddingTop: 20, 
            borderTopWidth: 1, 
            borderTopColor: Colors.divider
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, color: Colors.textSecondary, fontWeight: '500' }}>Total Amount</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 }}>
                {formatCurrency(getDisplayPrice())}
              </Text>
            </View>
            <Text style={{ color: Colors.textSecondary, fontSize: 12, textAlign: 'right', marginBottom: 20 }}>
              {isCardPayment ? 'Billed once via card' : 'Billed per quarter via payroll deduction'}
            </Text>
            
            {/* Action buttons */}
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
                  marginRight: 8,
                  backgroundColor: Colors.white,
                }} 
                textStyle={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }} 
              />
              <Button 
                title={isLoading ? 'Processing…' : 'Pay Now'} 
                onPress={handlePayNow} 
                disabled={!cardComplete || isLoading || !clientSecret} 
                primary 
                style={{ 
                  flex: 1, 
                  height: 52, 
                  borderRadius: 12,
                  marginLeft: 8,
                }} 
                textStyle={{ fontSize: 15, fontWeight: '700' }} 
              />
          </View>
          </View>
            </View>
          )}
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
          {isLoading && (
          <View style={{ marginTop: 10, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}
        </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: { 
    flex: 1, 
    backgroundColor: Colors.background, 
    width: '100%', 
    borderRadius: 0, 
    padding: 20, 
    paddingTop: 24, 
    alignSelf: 'stretch' 
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
  label: { 
    fontWeight: '600', 
    color: Colors.textPrimary 
  },
  section: { 
    marginTop: 16 
  },
  sectionTitle: { 
    fontWeight: '700', 
    color: Colors.textPrimary 
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
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    marginTop: 2,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  radioRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    marginRight: 8,
  },
  radioChecked: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  radioText: { 
    color: Colors.textPrimary 
  },
  autofillLink: { 
    alignSelf: 'flex-end', 
    marginTop: 8,
    paddingVertical: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButtonText: { 
    fontSize: 18, 
    color: Colors.textSecondary, 
    fontWeight: '400',
    lineHeight: 18,
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
});

export default SubscriptionPaymentModal;


