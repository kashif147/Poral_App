import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import { Wrapper } from '../../common/wrapper';
import { commonStyles } from '../../utils/Styles';

const Profile = () => {
  return (
    <Wrapper style={commonStyles.screenContainer} title={'Profile'} showBack={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>User profile information will be displayed here</Text>
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

export default Profile;
