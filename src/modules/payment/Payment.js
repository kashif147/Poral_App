import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import { Button } from '../../common/button';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createPaymentIntentRequest } from '../../api/payment.api';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import ScreenHeader from '../../common/screenHeader';

const Payment = () => {
  const insets = useSafeAreaInsets();
  const { confirmPayment } = useStripe();
  const { personalDetail, categoryData, getCategoryData, categoryLoading } = useApplication();
  const { categoryLookups } = useLookup();
  
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [editablePrice, setEditablePrice] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');
  
  // Get membership category from personalDetail
  const membershipCategory = personalDetail?.professionalDetails?.membershipCategory;
  
  const canPay = editablePrice && parseFloat(editablePrice) > 0 && cardholderName && email && cardComplete;

  // Load user data and pre-fill form
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        setUserDetail(userData);

        // Pre-fill name
        const userName = userData?.userFirstName && userData?.userLastName
          ? `${userData.userFirstName} ${userData.userLastName}`
          : userData?.userName || '';
        
        // Pre-fill email
        const userEmail = userData?.userEmail || userData?.email || '';

        setCardholderName(userName);
        setEmail(userEmail);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Fetch category data to get default price
  useEffect(() => {
    if (membershipCategory) {
      getCategoryData(membershipCategory, categoryLookups || []);
    }
  }, [membershipCategory, categoryLookups, getCategoryData]);

  // Set default price when category data is loaded
  useEffect(() => {
    if (categoryData?.currentPricing?.price && !editablePrice) {
      const priceInEuros = (categoryData.currentPricing.price / 100).toFixed(2);
      setEditablePrice(priceInEuros);
    }
  }, [categoryData, editablePrice]);

  // Format currency
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

  // Payment handler
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
      // Step 1: Create Payment Intent with the edited price
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

      console.log('Creating Payment Intent with:', paymentData);
      const intentResponse = await createPaymentIntentRequest(paymentData);
      
      const secret =
        intentResponse?.data?.data?.clientSecret ||
        intentResponse?.data?.client_secret ||
        intentResponse?.data?.clientSecret;

      if (!secret) {
        throw new Error('Missing client secret from payment intent response');
      }

      setClientSecret(secret);

      // Step 2: Confirm the payment
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

      // Check if payment was successful
      if (paymentIntent?.status === 'Succeeded') {
        Alert.alert('Success', 'Payment completed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setCardComplete(false);
              setClientSecret(null);
            }
          }
        ]);
      } else {
        throw new Error(`Payment status: ${paymentIntent?.status || 'unknown'}`);
      }
    } catch (err) {
      console.error('Payment Error:', err);
      Alert.alert('Payment Failed', err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      {/* Header */}
      <ScreenHeader title="Payment" />

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
            <Text style={styles.title}>Membership Subscription</Text>
            <Text style={styles.caption}>Review your membership and complete payment</Text>

            {/* Loading state */}
            {categoryLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ color: Colors.textPrimary, marginTop: 12 }}>Loading payment details...</Text>
              </View>
            ) : (
              <View>
                {/* Membership category card */}
                {categoryData && (
                  <View style={styles.categoryCard}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.smallLabel}>MEMBERSHIP CATEGORY</Text>
                      <Text style={styles.categoryText}>{categoryData?.name || 'Membership Category'}</Text>
                      {categoryData?.description && (
                        <Text style={styles.categoryDescription}>{categoryData.description}</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.smallLabel}>DEFAULT PRICE</Text>
                      <Text style={styles.priceText}>
                        {formatCurrency(categoryData?.currentPricing?.price / 100 || 0)}
                      </Text>
                      {categoryData?.currentPricing?.frequency && (
                        <Text style={styles.frequencyText}>{categoryData.currentPricing.frequency}</Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Editable Amount */}
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.requiredLabel}>Amount to Pay *</Text>
                  <TextInput
                    value={editablePrice}
                    onChangeText={setEditablePrice}
                    placeholder="Enter amount"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <Text style={styles.hintText}>
                    Default price: {formatCurrency(categoryData?.currentPricing?.price / 100 || 0)}
                  </Text>
                </View>

                {/* Name + Email */}
                <View style={[styles.row, { marginTop: 20 }]}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.requiredLabel}>Name on Card *</Text>
                    <TextInput
                      value={cardholderName}
                      onChangeText={setCardholderName}
                      placeholder="Full name"
                      placeholderTextColor={Colors.textSecondary}
                      style={styles.input}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
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
                <Text style={styles.autofillText}>✓ Pre-filled from your profile</Text>

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
                <View style={styles.totalSection}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, color: Colors.textSecondary, fontWeight: '500' }}>Total Amount</Text>
                    <Text style={styles.totalAmount}>
                      {formatCurrency(parseFloat(editablePrice) || 0)}
                    </Text>
                  </View>

                  <Button
                    title={loading ? 'Processing…' : 'Pay Now'}
                    onPress={handlePayNow}
                    disabled={!canPay || loading}
                    primary
                    style={{ height: 52, borderRadius: 12 }}
                    textStyle={{ fontSize: 15, fontWeight: '700' }}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Header - Matching Application.js
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5A77B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    paddingTop: 24,
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
    alignItems: 'center',
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

export default Payment;
