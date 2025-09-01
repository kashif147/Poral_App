import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wrapper } from '../../common/wrapper';
import { commonStyles, Colors, wp, hp } from '../../utils/Styles';


const Categories = () => {

  return (
    <Wrapper style={commonStyles.screenContainer} title={'Categories'} showBack={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Categories functionality will be implemented here</Text>
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

export default Categories;