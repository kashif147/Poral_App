import React, { useMemo, useState } from 'react';
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

  const amountDescription = useMemo(() => {
    return membershipCategory ? `Membership: ${membershipCategory}` : 'Membership';
  }, [membershipCategory]);

  const totalAmountDisplay = useMemo(() => {
    const parsed = parseFloat(customPrice);
    if (!isFinite(parsed) || parsed <= 0) return price ? `€${Number(price).toFixed(2)}` : '€0.00';
    return `€${parsed.toFixed(2)}`;
  }, [customPrice, price]);

  const handlePay = async () => {
    if (!cardComplete || method !== 'card') return;
    setIsLoading(true);
    try {
      const payload = {
        membershipCategory,
        email,
        name: cardholderName,
        description: amountDescription,
        // Optional amount override in cents for backend
        customAmount: (() => {
          const num = parseFloat(customPrice);
          if (!isFinite(num) || num <= 0) return undefined;
          return Math.round(num * 100);
        })(),
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
        onSuccess?.(paymentIntent);
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
            {!!price && (
              <Text style={styles.priceText}>{`€${Number(price).toFixed(2)}`}</Text>
            )}
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <TouchableOpacity style={styles.radioRow} onPress={() => setMethod('card')}>
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
              onChangeText={setCustomPrice}
              placeholder={price ? String(Number(price).toFixed(2)) : '€0.00'}
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
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
          </View>

          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <Button title="Cancel" onPress={onClose} outlined style={{ flex: 1, marginRight: 8 }} textStyle={{ fontSize: 14, fontWeight: '600' }} />
            <Button title={isLoading ? 'Processing…' : 'Pay Now'} onPress={handlePay} disabled={!cardComplete || isLoading || method !== 'card'} primary style={{ flex: 1, marginLeft: 8 }} textStyle={{ fontSize: 14, fontWeight: '700' }} />
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


