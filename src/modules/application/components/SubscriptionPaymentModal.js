import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Button } from '../../../common/button';
import { hp } from '../../../utils/Styles';
import { createPaymentIntentRequest } from '../../../api/payment.api';

const SubscriptionPaymentModal = ({
  visible,
  onClose,
  onSuccess,
  onFailure,
  formData,
  membershipCategory,
  price, // optional, in Euros
}) => {
  const { confirmPayment } = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [method, setMethod] = useState('card');
  const [customPrice, setCustomPrice] = useState(
    typeof price === 'number' ? String(price.toFixed(2)) : ''
  );
  const [cardholderName, setCardholderName] = useState(
    `${formData?.personalInfo?.forename || ''} ${formData?.personalInfo?.surname || ''}`.trim()
  );
  const [email, setEmail] = useState(formData?.personalInfo?.personalEmail || '');

  // Membership prices and helpers (ported from web)
  const membershipPrices = {
    general: { full: 299.0, monthly: 74.75 },
    postgraduate_student: { full: 299.0, monthly: 74.75 },
    short_term_relief: { full: 228.0, monthly: 57.0 },
    private_nursing_home: { full: 288.0, monthly: 72.0 },
    affiliate_members: { full: 116.0, monthly: 29.0 },
    lecturing: { full: 116.0, monthly: 29.0 },
    associate: { full: 75.0, monthly: 18.75 },
    retired_associate: { full: 25.0, monthly: 25.0 },
    undergraduate_student: { full: 0.0, monthly: 0.0 },
  };

  // Map common labels to keys
  const categoryLabelToKey = {
    'General (all grades)': 'general',
    'Postgraduate Student': 'postgraduate_student',
    'Short-term/ Relief (under 15 hrs/wk average)': 'short_term_relief',
    'Private nursing home': 'private_nursing_home',
    'Affiliate members (non-practicing)': 'affiliate_members',
    'Lecturing (employed in universities and IT institutes)': 'lecturing',
    'Associate (not currently employed as a nurse/midwife)': 'associate',
    'Retired Associate': 'retired_associate',
    'Undergraduate Student': 'undergraduate_student',
  };

  const normalizedCategoryKey = useMemo(() => {
    if (!membershipCategory) return undefined;
    // If already a key, use it; otherwise map by label
    if (membershipPrices[membershipCategory]) return membershipCategory;
    return categoryLabelToKey[membershipCategory];
  }, [membershipCategory]);

  const priceInfo = normalizedCategoryKey ? membershipPrices[normalizedCategoryKey] : { full: 0, monthly: 0 };

  const paymentType = formData?.subscriptionDetails?.paymentType;
  const isCardPayment = paymentType === 'Card Payment' || paymentType === 'Credit Card';
  const isPayrollDeduction = paymentType === 'Payroll Deduction' || paymentType === 'Deduction at Source';

  useEffect(() => {
    // Set method based on upstream payment type
    if (isPayrollDeduction) {
      setMethod('bank');
    } else {
      setMethod('card');
    }
  }, [isPayrollDeduction, isCardPayment, visible]);

  // When opening, initialise customPrice from pricing logic
  useEffect(() => {
    if (!visible) return;
    const base = isCardPayment ? priceInfo.full : priceInfo.monthly;
    const baseStr = Number(base || 0).toFixed(2);
    setCustomPrice(baseStr);
  }, [visible, priceInfo.full, priceInfo.monthly, isCardPayment]);

  const amountDescription = useMemo(() => {
    return membershipCategory ? `Membership: ${membershipCategory}` : 'Membership';
  }, [membershipCategory]);

  const minAllowed = priceInfo.full > 0 ? priceInfo.full / 12 : 0;
  const maxAllowed = priceInfo.full || 0;

  const parsedCustom = useMemo(() => {
    const n = parseFloat(customPrice);
    return isFinite(n) ? n : NaN;
  }, [customPrice]);

  const isCustomValid = useMemo(() => {
    if (Number.isNaN(parsedCustom)) return false;
    if (parsedCustom <= 0) return false;
    if (maxAllowed === 0) return false; // students etc. not payable
    return parsedCustom >= minAllowed && parsedCustom <= maxAllowed;
  }, [parsedCustom, minAllowed, maxAllowed]);

  const totalAmountDisplay = useMemo(() => {
    if (!isCustomValid) {
      const fallback = isCardPayment ? priceInfo.full : priceInfo.monthly;
      return `€${Number(fallback || 0).toFixed(2)}`;
    }
    return `€${parsedCustom.toFixed(2)}`;
  }, [isCustomValid, parsedCustom, isCardPayment, priceInfo.full, priceInfo.monthly]);

  const priceNote = useMemo(() => {
    return isCardPayment ? 'Billed once via card' : 'Billed three month via payroll deduction';
  }, [isCardPayment]);

  const handlePay = async () => {
    if (method !== 'card') {
      onFailure?.('Bank transfer is not supported in the app. Please use card.');
      return;
    }
    if (!cardComplete) return;
    if (!isCustomValid) {
      onFailure?.(`Custom price must be between €${minAllowed.toFixed(2)} and €${maxAllowed.toFixed(2)}`);
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        membershipCategory,
        email,
        name: cardholderName,
        description: amountDescription,
        // Optional amount override in cents for backend
        customAmount: Math.round(parsedCustom * 100),
      };
      const intentRes = await createPaymentIntentRequest(payload);
      const clientSecret = intentRes?.data?.clientSecret || intentRes?.data?.data?.clientSecret;
      if (!clientSecret) {
        throw new Error('Unable to start payment');
      }
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: { name: cardholderName, email },
        },
      });
      if (error) {
        onFailure?.(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'Succeeded') {
        onSuccess?.({ paymentMethod: 'card', total: parsedCustom, customPrice: parsedCustom, paymentIntent });
      } else {
        onFailure?.('Payment not completed');
      }
    } catch (e) {
      onFailure?.(e?.message || 'Payment error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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

          {/* Membership category card */}
          <View style={styles.categoryCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>Membership Category</Text>
              <Text style={styles.categoryText}>{amountDescription}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Price</Text>
              <Text style={styles.priceText}>{`€${(isCardPayment ? priceInfo.full : priceInfo.monthly).toFixed(2)}`}</Text>
            </View>
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <TouchableOpacity style={[styles.radioRow, (isPayrollDeduction) && { opacity: 0.5 }]} onPress={() => !isPayrollDeduction && setMethod('card')}>
                <View style={[styles.radio, method === 'card' && styles.radioChecked]} />
                <Text style={styles.radioText}>Credit/Debit Card</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.5, marginTop: 6 }}>
              <View style={[styles.radio]} />
              <Text style={styles.radioText}>Bank Transfer</Text>
            </View>
          </View>

          {/* Custom price */}
          <View style={styles.section}>
            <Text style={styles.smallLabel}>Custom Price</Text>
            <TextInput
              keyboardType="decimal-pad"
              value={customPrice}
              onChangeText={(txt) => {
                const cleaned = (txt || '').replace(/[^0-9.]/g, '');
                setCustomPrice(cleaned);
              }}
              placeholder={price ? String(Number(price).toFixed(2)) : '€0.00'}
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            {!isCustomValid && (
              <Text style={{ color: 'red', marginTop: 4, fontSize: 12 }}>{`Enter between €${minAllowed.toFixed(2)} and €${maxAllowed.toFixed(2)}`}</Text>
            )}
          </View>

          {/* Name + Email */}
          <View style={[styles.row, { marginTop: 8 }]}> 
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.requiredLabel}>Name on Card</Text>
              <TextInput value={cardholderName} onChangeText={setCardholderName} placeholder="Full name" placeholderTextColor="#94A3B8" style={styles.input} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.requiredLabel}>Email</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#94A3B8" keyboardType="email-address" style={styles.input} />
            </View>
          </View>
          <TouchableOpacity onPress={() => {
            setCardholderName(`${formData?.personalInfo?.forename || ''} ${formData?.personalInfo?.surname || ''}`.trim());
            setEmail(formData?.personalInfo?.personalEmail || '');
          }} style={styles.autofillLink}>
            <Text style={{ color: '#007bff' }}>Autofill from profile</Text>
          </TouchableOpacity>

          {/* Card details */}
          <View style={{ marginTop: 8 }}>
            <Text style={styles.requiredLabel}>Card Details</Text>
            <View style={styles.cardFieldWrapper}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{ number: '4242 4242 4242 4242', cvc: 'CVC', expiration: 'MM/YY' }}
                cardStyle={{
                  backgroundColor: '#00000000',
                  textColor: '#000000',
                  placeholderColor: '#94A3B8',
                  borderWidth: 0,
                  borderColor: '#00000000',
                  borderRadius: 10,
                }}
                style={{ width: '100%', height: 52 }}
                onCardChange={details => setCardComplete(details?.complete)}
              />
            </View>
          </View>

          {/* Total + Actions */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontWeight: '600' }}>{`Total Amount: ${totalAmountDisplay}`}</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{priceNote}</Text>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <Button title="Cancel" onPress={onClose} outlined style={{ flex: 1, marginRight: 8 }} textStyle={{ fontSize: 14, fontWeight: '600' }} />
            <Button title={isLoading ? 'Processing…' : 'Pay Now'} onPress={handlePay} disabled={!cardComplete || isLoading || method !== 'card' || !isCustomValid} primary style={{ flex: 1, marginLeft: 8 }} textStyle={{ fontSize: 14, fontWeight: '700' }} />
          </View>
          {isLoading && (
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <ActivityIndicator />
            </View>
          )}
        </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, backgroundColor: '#fff', width: '100%', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 16, paddingTop: 18 },
  title: { fontWeight: 'bold', fontSize: hp(2.4), color: '#0f172a' },
  caption: { marginTop: 2, color: '#64748b', fontSize: 12 },
  smallLabel: { fontWeight: '600', color: '#555', fontSize: 12 },
  requiredLabel: { fontWeight: '600', color: '#555' },
  label: { fontWeight: '600', color: '#555' },
  section: { marginTop: 12 },
  sectionTitle: { fontWeight: '700', color: '#0f172a' },
  categoryCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F7F8FA',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  categoryText: { fontWeight: '600', color: '#111', marginTop: 4 },
  priceText: { fontWeight: '700', color: '#1e90ff' },
  input: {
    height: 46,
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    marginTop: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  radioRow: { flexDirection: 'row', alignItems: 'center' },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#888',
    marginRight: 8,
  },
  radioChecked: { backgroundColor: '#1e90ff', borderColor: '#1e90ff' },
  radioText: { color: '#333' },
  autofillLink: { alignSelf: 'flex-end', marginTop: 6 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  closeButtonText: { fontSize: 16, color: '#334155', fontWeight: '700' },
  cardFieldWrapper: {
    marginTop: 8,
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
  },
});

export default SubscriptionPaymentModal;


