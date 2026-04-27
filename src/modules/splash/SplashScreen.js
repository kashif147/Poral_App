import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, StatusBar, Platform, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontIcons from '../../utils/FontIcons';
import { wp, hp } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';

const SplashScreen = () => {
  const MCI = FontIcons.MATERIAL_COMMUNITY_ICONS;
  const isIOS = Platform.OS === 'ios';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel(
      [
      Animated.timing(fadeAnim, {
        toValue: 1,
          duration: 700,
        useNativeDriver: true,
      }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 700,
        useNativeDriver: true,
      }),
      ],
      { stopTogether: false },
    ).start();
  }, []);

  const featureRows = [
    { icon: 'view-dashboard-outline', label: 'Personal Dashboard' },
    { icon: 'help-circle-outline', label: 'Issue Management' },
    { icon: 'account-plus-outline', label: 'Apply for Membership' },
    { icon: 'calendar-month-outline', label: 'Events & Workshops' },
    { icon: 'book-open-page-variant-outline', label: 'Member Resources' },
    { icon: 'school-outline', label: 'Learning Courses' },
    { icon: 'message-text-outline', label: 'Messages & Notifications' },
    { icon: 'credit-card-outline', label: 'Secure Payments' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        translucent={Platform.OS === 'android'}
        backgroundColor={Platform.OS === 'android' ? 'rgba(30, 39, 130, 0.40)' : 'transparent'}
        barStyle="light-content"
      />
      <View style={styles.backgroundLayer}>
        <ImageBackground
          source={IMAGES.SPLASH}
          defaultSource={IMAGES.SPLASH}
          style={styles.backgroundImage}
          resizeMode="cover"
          fadeDuration={0}
        />
        <LinearGradient
          colors={['rgba(92, 108, 220, 0.42)', 'rgba(56, 69, 182, 0.58)', 'rgba(18, 24, 98, 0.78)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <Animated.View
        style={[
          styles.content,
          isIOS ? styles.contentIOS : styles.contentAndroid,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          },
        ]}
      >
        <View style={styles.brandPill}>
          <View style={styles.logoWrap}>
            <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandText}>MemberHub</Text>
        </View>

        <Text style={styles.title}>
          Your Gateway to{'\n'}
          <Text style={styles.titleAccent}>Excellence.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Manage your profile, track subscriptions, and handle payments in one secure, unified platform designed for our members.
        </Text>

        <View style={styles.featureList}>
          {featureRows.map(item => (
            <View style={styles.featureRow} key={item.label}>
              <MCI name={item.icon} size={20} color="#E7EBFF" />
              <Text style={styles.featureText}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomLine} />
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <MCI name="lock-outline" size={18} color="#DDE4FF" />
            <Text style={styles.footerText}>Bank-grade encryption</Text>
          </View>
          <View style={styles.footerItem}>
            <MCI name="web" size={18} color="#DDE4FF" />
            <Text style={styles.footerText}>Global accessibility</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101A62',
    paddingHorizontal: wp(3.2),
    paddingTop: 0,
    paddingBottom: hp(1.6),
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#101A62',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingBottom: hp(2.2),
  },
  contentIOS: {
    paddingTop: hp(5.4),
  },
  contentAndroid: {
    paddingTop: hp(3.2),
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 14,
    paddingVertical: hp(0.75),
    paddingHorizontal: wp(2.8),
    marginTop: hp(2.8),
    marginBottom: hp(4),
  },
  logoWrap: {
    width: wp(8.2),
    height: wp(8.2),
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.5),
  },
  logo: {
    width: wp(5.6),
    height: wp(5.6),
  },
  brandText: {
    color: '#F7F8FF',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    color: '#F9FBFF',
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
    letterSpacing: 0.2,
    marginBottom: hp(2),
    maxWidth: '92%',
  },
  titleAccent: {
    color: '#CFE0FF',
  },
  subtitle: {
    color: '#E2E7FF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: hp(4),
    maxWidth: '90%',
  },
  featureList: {
    marginBottom: hp(2.5),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  featureText: {
    color: '#F2F5FF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: wp(2.2),
    fontWeight: '500',
  },
  bottomLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 'auto',
    marginBottom: hp(1.8),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#D8E0FF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: wp(1.2),
  },
});

export default SplashScreen;

