import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wrapper } from '../../common/wrapper';
import { commonStyles, Colors, wp, hp } from '../../utils/Styles';


const Membership = () => {

  return (
    <Wrapper style={commonStyles.screenContainer} title={'Membership'} showBack={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Membership</Text>
        <Text style={styles.subtitle}>Membership functionality will be implemented here</Text>
      </View>
    </Wrapper>
  );
};


const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
});

export default Membership;