import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Platform, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontIcons from '../../utils/FontIcons';
import { wp, hp } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';

const SplashScreen = () => {
  const MCI = FontIcons.MATERIAL_COMMUNITY_ICONS;
  const isIOS = Platform.OS === 'ios';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const detailsTranslate = useRef(new Animated.Value(14)).current;

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

    // 1.0s-1.5s: reveal logo + tagline as if wave is passing.
    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslate, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(detailsOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(detailsTranslate, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.55,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.28,
            duration: 260,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // 1.5s-2.0s: hold final state briefly before parent flow navigates.
      Animated.delay(500),
    ]).start();
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
      <View style={styles.backgroundLayer}>
        <ImageBackground
          source={IMAGES.SPLASH}
          defaultSource={IMAGES.SPLASH}
          style={styles.backgroundImage}
          resizeMode="cover"
          fadeDuration={0}
        />
        <LinearGradient
          colors={['rgba(96, 121, 255, 0.62)', 'rgba(52, 72, 198, 0.76)', 'rgba(10, 18, 88, 0.90)']}
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
        <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
        <Animated.View
          style={[
            styles.brandPill,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoWrap}>
            <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandText}>MemberHub</Text>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslate }],
            },
          ]}
        >
          Your Gateway to{'\n'}
          <Text style={styles.titleAccent}>Excellence.</Text>
        </Animated.Text>
        <Animated.View
          style={[
            styles.detailsSection,
            {
              opacity: detailsOpacity,
              transform: [{ translateY: detailsTranslate }],
            },
          ]}
        >
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
  logoGlow: {
    position: 'absolute',
    top: hp(9.2),
    left: wp(9.5),
    width: wp(54),
    height: hp(8.4),
    borderRadius: 18,
    backgroundColor: 'rgba(123, 181, 255, 0.32)',
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
  detailsSection: {
    flex: 1,
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

