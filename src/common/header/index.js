import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, hp, wp } from '../../utils/Styles';
import { SVG } from '../../assets/svg';
import { IMAGES } from '../../assets/images';
import { LocalSvg } from 'react-native-svg/css';

export const Header = ({ title, showBack = false, onBellPress, onProfilePress }) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {!showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <LocalSvg width={26} height={26} asset={SVG.BACK_ICON} fill={Colors.white} />
          </TouchableOpacity>
        )}
        <Text numberOfLines={1} style={styles.title}>{title || 'Portal'}</Text>
      </View>
      <View style={styles.rightContainer}>
        <TouchableOpacity onPress={onBellPress} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <LocalSvg width={26} height={26} asset={SVG.NOTIFICATION} fill={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onProfilePress} style={styles.avatarBtn}>
          <Image source={IMAGES.AVATAR} style={styles.avatar} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: hp(6.5),
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: 16,
    borderBottomWidth: 0,
    alignSelf: 'stretch'
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: wp(5.2),
    fontWeight: '700',
    color: Colors.white,
    // marginLeft: 10,
  },
  backBtn: { paddingRight: 8 },
  backIcon: { width: wp(5), height: wp(5), tintColor: '#93A1A1' },
  bellIcon: { width: wp(5.5), height: wp(5.5), tintColor: '#93A1A1' },
  iconBtn: { padding: 6, borderRadius: 16, },
  avatarBtn: { marginLeft: 8 },
  avatar: { width: hp(4), height: hp(4), borderRadius: hp(2) },
});

export default Header;

