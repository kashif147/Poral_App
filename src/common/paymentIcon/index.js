import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, wp } from '../../utils/Styles';

const PaymentIcon = ({ color = Colors.iconColor, size = wp(5) }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Credit card shape */}
      <View style={[styles.card, { borderColor: color }]}>
        {/* Card chip */}
        <View style={[styles.chip, { backgroundColor: color }]} />
        {/* Card lines */}
        <View style={[styles.line1, { backgroundColor: color }]} />
        <View style={[styles.line2, { backgroundColor: color }]} />
        <View style={[styles.line3, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '80%',
    height: '60%',
    borderWidth: 2,
    borderRadius: 4,
    padding: 2,
    justifyContent: 'space-between',
  },
  chip: {
    width: '30%',
    height: '40%',
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  line1: {
    width: '60%',
    height: 2,
    borderRadius: 1,
    alignSelf: 'flex-end',
  },
  line2: {
    width: '40%',
    height: 2,
    borderRadius: 1,
    alignSelf: 'flex-end',
  },
  line3: {
    width: '50%',
    height: 2,
    borderRadius: 1,
    alignSelf: 'flex-end',
  },
});

export default PaymentIcon;
