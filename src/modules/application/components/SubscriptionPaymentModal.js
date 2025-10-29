import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, SafeAreaView, StatusBar } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Button } from '../../../common/button';
import { hp, Colors } from '../../../utils/Styles';
import { createPaymentIntentRequest } from '../../../api/payment.api';
import { fetchCategoryByCategoryId } from '../../../api/category.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [isLoading, setIsLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [customPrice, setCustomPrice] = useState('');
  const [userDetail, setUserDetail] = useState(null);
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');

  // Calculate price info from API data (matching web version)
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
        const userStr = await AsyncStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        setUserDetail(userData);

        console.log('💳 User data loaded for payment:', userData);

        // Pre-fill name
        const userName = userData?.userFirstName && userData?.userLastName
          ? `${userData.userFirstName} ${userData.userLastName}`
          : userData?.userName || 
            (formData?.personalInfo?.forename && formData?.personalInfo?.surname
              ? `${formData.personalInfo.forename} ${formData.personalInfo.surname}`
              : '');
        
        // Pre-fill email
        const userEmail = userData?.userEmail || userData?.email || 
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
    }
  }, [visible, formData]);

  // Fetch category data and initialize payment intent (matching web version)
  useEffect(() => {
    const initPayment = async () => {
      if (!visible || !applicationId || !membershipCategory) {
        console.log('⏸️ Payment init skipped:', { visible, applicationId, membershipCategory });
        return;
      }

      // Reset client secret when modal opens to create fresh payment intent
      setClientSecret(null);
      console.log('🔄 Starting payment initialization...');
      setProductLoading(true);

      try {
        // ✅ Step 1: Fetch category details
        console.log('📦 Fetching category:', membershipCategory);
        const categoryRes = await fetchCategoryByCategoryId(membershipCategory);
        const payload = categoryRes?.data?.data || categoryRes?.data;
        setCategoryData(payload || null);
        console.log('✅ Category data loaded:', payload?.name);

        const currentPricing = payload?.currentPricing || {};
        const amountInCents = currentPricing?.price;
        const currency = currentPricing?.currency || 'eur';

        if (!amountInCents) throw new Error('Invalid category price data');

        // ✅ Step 2: Get user data
        const userStr = await AsyncStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        const userId = userData?.id || userData?._id;
        const tenantId = userData?.tenantId || userData?.userTenantId;

        // ✅ Step 3: Create Payment Intent
        const paymentData = {
          purpose: 'subscriptionFee',
          amount: amountInCents, // Stripe amount is in smallest currency unit
          currency,
          metadata: {
            applicationId,
            description: 'Annual membership fees',
            tenantId,
            userId,
            membershipCategory,
            paymentType: formData?.subscriptionDetails?.paymentType,
          },
        };

        console.log('🧾 Creating Payment Intent with:', paymentData);

        const res = await createPaymentIntentRequest(paymentData);
        console.log('💳 Payment Intent Full Response:', JSON.stringify(res?.data, null, 2));
        
        const secret =
          res?.data?.data?.clientSecret ||
          res?.data?.client_secret ||
          res?.data?.clientSecret;

        if (!secret) {
          console.error('❌ No client secret in response. Full response:', res);
          throw new Error('Missing client secret from response');
        }

        console.log('✅ Client secret received:', secret?.substring(0, 20) + '...');
        setClientSecret(secret);
        console.log('✅ Payment initialized successfully');
      } catch (error) {
        console.error('❌ Payment initialization error:', error);
        console.error('❌ Error stack:', error.stack);
        Alert.alert('Error', error.message || 'Payment initialization failed');
        onFailure?.(error.message || 'Payment initialization failed');
      } finally {
        setProductLoading(false);
      }
    };

    initPayment();
  }, [visible, membershipCategory, applicationId]);

  // Display price based on payment type
  const getDisplayPrice = () => {
    return isCardPayment ? priceInfo.full : priceInfo.monthly;
  };

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
          barStyle="light-content"
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
          {productLoading || !categoryData ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{ color: Colors.white, marginTop: 12 }}>Loading payment details...</Text>
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
                <Text style={{ fontSize: 11, color: '#B0BEC5', marginTop: 4, fontWeight: '500' }}>{categoryData.currentPricing.frequency}</Text>
              )}
                </View>
          </View>

          {/* Name + Email */}
          <View style={[styles.row, { marginTop: 20 }]}> 
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.requiredLabel}>Name on Card *</Text>
                  <TextInput value={cardholderName} onChangeText={setCardholderName} placeholder="Full name" placeholderTextColor="#6B7280" style={styles.input} />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.requiredLabel}>Email *</Text>
                  <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#6B7280" keyboardType="email-address" style={styles.input} />
            </View>
          </View>
          <TouchableOpacity onPress={() => {
            const userName = userDetail?.userFirstName && userDetail?.userLastName
              ? `${userDetail.userFirstName} ${userDetail.userLastName}`
              : `${formData?.personalInfo?.forename || ''} ${formData?.personalInfo?.surname || ''}`.trim();
            const userEmail = userDetail?.userEmail || 
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
                      textColor: '#FFFFFF',
                      placeholderColor: '#6B7280',
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
            borderTopColor: '#2A3038' 
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, color: '#B0BEC5', fontWeight: '500' }}>Total Amount</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 }}>
                {formatCurrency(getDisplayPrice())}
              </Text>
            </View>
            <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'right', marginBottom: 20 }}>
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
                  borderColor: '#2A3038',
                  marginRight: 8,
                }} 
                textStyle={{ fontSize: 15, fontWeight: '600' }} 
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
              <ActivityIndicator />
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
    backgroundColor: Colors.surface, 
    width: '100%', 
    borderRadius: 0, 
    padding: 20, 
    paddingTop: 24, 
    alignSelf: 'stretch' 
  },
  title: { 
    fontWeight: '700', 
    fontSize: hp(2.8), 
    color: Colors.white,
    letterSpacing: -0.5,
  },
  caption: { 
    marginTop: 6, 
    color: '#93A1A1', 
    fontSize: 13,
    lineHeight: 18,
  },
  smallLabel: { 
    fontWeight: '600', 
    color: '#B0BEC5', 
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  requiredLabel: { 
    fontWeight: '600', 
    color: '#E5F9F4',
    fontSize: 14,
    marginBottom: 8,
  },
  label: { 
    fontWeight: '600', 
    color: Colors.white 
  },
  section: { 
    marginTop: 16 
  },
  sectionTitle: { 
    fontWeight: '700', 
    color: Colors.white 
  },
  categoryCard: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#1E2328',
    borderWidth: 1,
    borderColor: '#2A3038',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  categoryText: { 
    fontWeight: '700', 
    color: Colors.white, 
    fontSize: 16,
    marginTop: 2,
    marginBottom: 4,
  },
  categoryDescription: { 
    fontSize: 12, 
    color: '#93A1A1', 
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
    borderColor: '#2A3038',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E2328',
    marginTop: 2,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '500',
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
    borderColor: '#4B5563',
    marginRight: 8,
  },
  radioChecked: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  radioText: { 
    color: Colors.white 
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
    backgroundColor: '#2A3038',
    marginLeft: 12,
  },
  closeButtonText: { 
    fontSize: 18, 
    color: '#93A1A1', 
    fontWeight: '400',
    lineHeight: 18,
  },
  cardFieldWrapper: {
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: '#2A3038',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1E2328',
    minHeight: 52,
  },
});

export default SubscriptionPaymentModal;


