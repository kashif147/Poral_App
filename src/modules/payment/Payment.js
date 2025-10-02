import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, wp, hp, commonStyles } from '../../utils/Styles';
import { Wrapper } from '../../common/wrapper';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import { Button } from '../../common/button';

const paymentTypes = ['Deduction at Source', 'Credit Card'];

const Payment = () => {
  const [paymentType, setPaymentType] = useState(paymentTypes[1]);
  const [amount, setAmount] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');

  const canPay = paymentType === 'Credit Card' ? amount && cardholderName && email : amount;

  return (
    <Wrapper style={commonStyles.screenContainer} title={'Payment'} showBack={false}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Payment Details</Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Payment Type</Text>
          <View style={styles.pickerField}>
            <Picker selectedValue={paymentType} onValueChange={val => setPaymentType(val)}>
              {paymentTypes.map(t => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.inputField}>
            <InputField
              value={amount}
              onChange={setAmount}
              keyboardType={'decimal-pad'}
              holderTextColor={'#94A3B8'}
              placeholder={'Enter amount'}
            />
          </View>
        </View>

        {paymentType === 'Credit Card' && (
          <View style={styles.row}>
            <View style={[styles.col, { marginRight: 8 }]}>
              <Text style={styles.label}>Name on Card</Text>
              <View style={styles.inputField}>
                <InputField
                  value={cardholderName}
                  onChange={setCardholderName}
                  holderTextColor={'#94A3B8'}
                  placeholder={'Full name'}
                />
              </View>
            </View>
            <View style={[styles.col, { marginLeft: 8 }]}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputField}>
                <InputField
                  value={email}
                  onChange={setEmail}
                  holderTextColor={'#94A3B8'}
                  placeholder={'you@example.com'}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Payment Type</Text>
            <Text style={styles.summaryVal}>{paymentType}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Amount</Text>
            <Text style={styles.summaryVal}>{amount ? `€${amount}` : '-'}</Text>
          </View>
        </View>

        <Button
          title={paymentType === 'Credit Card' ? 'Pay Now' : 'Proceed'}
          primary
          disabled={!canPay}
          style={{ width: '100%', marginTop: hp(2) }}
          onPress={() => {}}
        />
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: wp(2),
    paddingBottom: hp(2),
  },
  sectionTitle: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#E5F9F4',
  },
  fieldBlock: {
    width: '100%',
    marginBottom: 8,
  },
  inputField: {
    marginBottom: 8,
  },
  pickerField: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  summaryCard: {
    marginTop: hp(1),
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2F33',
    backgroundColor: '#1A1F23',
    borderRadius: 16,
  },
  summaryTitle: {
    color: Colors.white,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryKey: {
    color: '#E5F9F4',
  },
  summaryVal: {
    color: Colors.white,
    fontWeight: '700',
  },
});

export default Payment;
