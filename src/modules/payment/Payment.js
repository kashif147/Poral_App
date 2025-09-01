import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, wp, hp, commonStyles } from '../../utils/Styles';
import { Wrapper } from '../../common/wrapper';

const Payment = () => {
  return (
    <Wrapper style={commonStyles.screenContainer} title={'Payment'} showBack={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Payment functionality will be implemented here</Text>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  title: {
    fontSize: hp(3),
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: hp(2),
  },
  subtitle: {
    fontSize: hp(1.8),
    color: Colors.gray,
    textAlign: 'center',
  },
});

export default Payment;
