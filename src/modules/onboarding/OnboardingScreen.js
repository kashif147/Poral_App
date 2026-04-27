import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontIcons from '../../utils/FontIcons';
import { wp, hp } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';

const OnboardingScreen = ({ onComplete }) => {
  const MCI = FontIcons.MATERIAL_COMMUNITY_ICONS;
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = useMemo(
    () => [
      {
        title: 'Welcome to\nMemberHub',
        subtitle:
          'Your central place for connecting and managing your membership.',
        pointIcons: [
          'view-dashboard-outline',
          'message-processing-outline',
          'account-cog-outline',
        ],
        points: ['Personal Dashboard', 'Message Center', 'Account Settings'],
      },
      {
        title: 'Expand Your\nKnowledge',
        subtitle:
          'Access exclusive workshops, courses, and premium content tailored for your professional growth.',
        pointIcons: [
          'school-outline',
          'calendar-month-outline',
          'book-open-page-variant-outline',
        ],
        points: ['Learning Courses', 'Events & Workshops', 'Resource Library'],
      },
      {
        title: 'Connect and\nMake an Impact',
        subtitle:
          'Join member-exclusive groups, find a mentor, and collaborate on projects that matter.',
        pointIcons: ['account-plus-outline', 'account-group-outline', 'briefcase-outline'],
        points: ['Apply for Mentorship', 'Community Forums', 'Project Collaboration'],
      },
      {
        title: 'Secure Your\nMembership',
        subtitle:
          'Set up your preferred payment method and customize notifications to stay informed.',
        pointIcons: ['shield-check-outline', 'account-check-outline', 'bell-outline'],
        points: ['Secure Payment Setup', 'Account Verification', 'Notification Preferences'],
      },
    ],
    [],
  );

  const isLastSlide = currentIndex === slides.length - 1;
  const activeSlide = slides[currentIndex];

  const handleNext = () => {
    if (isLastSlide) {
      if (onComplete) onComplete();
      return;
    }
    setCurrentIndex(index => index + 1);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent={Platform.OS === 'android'}
        backgroundColor={Platform.OS === 'android' ? 'rgba(30, 39, 130, 0.40)' : 'transparent'}
        barStyle="light-content"
      />

      <ImageBackground
        source={IMAGES.SPLASH}
        defaultSource={IMAGES.SPLASH}
        fadeDuration={0}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(96, 121, 255, 0.62)', 'rgba(52, 72, 198, 0.76)', 'rgba(10, 18, 88, 0.90)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <View style={styles.brandPill}>
          <View style={styles.logoWrap}>
            <Image source={IMAGES.LOGO} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandText}>MemberHub</Text>
        </View>

        <Text style={styles.title}>
          {activeSlide.title.split('\n')[0]}
          {'\n'}
          <Text style={styles.titleAccent}>{activeSlide.title.split('\n')[1]}</Text>
        </Text>

        <Text style={styles.subtitle}>{activeSlide.subtitle}</Text>

        {/* <View style={styles.heroIconsRow}>
          {activeSlide.topIcons.map(icon => (
            <View key={icon} style={styles.heroIconWrap}>
              <MCI name={icon} size={30} color="#E7EBFF" />
            </View>
          ))}
        </View> */}

        <View style={styles.pointList}>
          {activeSlide.points.map((point, index) => (
            <View key={point} style={styles.pointRow}>
              <MCI name={activeSlide.pointIcons[index]} size={18} color="#DDE4FF" />
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerBlock}>
          <View style={styles.progressInlineWrap}>
            {slides.map((_, index) => (
              <View key={`step-${index}`} style={styles.progressInlineStep}>
                <Text
                  style={[
                    styles.progressInlineNumber,
                    currentIndex >= index && styles.progressInlineNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
                {index !== slides.length - 1 ? (
                  <View style={styles.progressInlineTrack}>
                    <View
                      style={[
                        styles.progressInlineFill,
                        currentIndex > index && styles.progressInlineFillDone,
                        currentIndex === index && styles.progressInlineFillCurrent,
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.9} onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>{isLastSlide ? "Let's Get Started" : 'Next'}</Text>
          </TouchableOpacity>

          <View style={styles.bottomMeta}>
            <View style={styles.metaItem}>
              <MCI name="lock-outline" size={14} color="#DDE4FF" />
              <Text style={styles.metaText}>Bank-grade encryption</Text>
            </View>
            <View style={styles.metaItem}>
              <MCI name="web" size={14} color="#DDE4FF" />
              <Text style={styles.metaText}>Global accessibility</Text>
            </View>
          </View>
        </View>
      </View>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: Platform.OS === 'ios' ? hp(8) : hp(5),
    paddingBottom: hp(2.2),
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 12,
    paddingVertical: hp(0.65),
    paddingHorizontal: wp(2.5),
    marginBottom: hp(3.3),
  },
  logoWrap: {
    width: wp(6.8),
    height: wp(6.8),
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.1),
  },
  logo: {
    width: wp(4.7),
    height: wp(4.7),
  },
  brandText: {
    color: '#F7F8FF',
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: '#F9FBFF',
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 54,
    marginBottom: hp(1.8),
  },
  titleAccent: {
    color: '#CFE0FF',
  },
  subtitle: {
    color: '#E5E9FF',
    fontSize: hp(1.8),
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: hp(2.8),
    maxWidth: '94%',
  },
  heroIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2.4),
  },
  heroIconWrap: {
    width: wp(18),
    height: wp(18),
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.8),
  },
  pointList: {
    marginBottom: hp(2.4),
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  pointText: {
    color: '#F2F5FF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: wp(2.1),
    fontWeight: '500',
  },
  footerBlock: {
    marginTop: 'auto',
  },
  progressInlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },
  progressInlineStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressInlineNumber: {
    color: 'rgba(240, 244, 255, 0.65)',
    fontSize: 20,
    fontWeight: '700',
  },
  progressInlineNumberActive: {
    color: '#EEF4FF',
  },
  progressInlineTrack: {
    width: wp(18),
    height: 4,
    borderRadius: 4,
    marginHorizontal: wp(2.1),
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    overflow: 'hidden',
  },
  progressInlineFill: {
    width: '0%',
    height: '100%',
    backgroundColor: '#DCE7FF',
  },
  progressInlineFillCurrent: {
    width: '60%',
  },
  progressInlineFillDone: {
    width: '100%',
  },
  nextButton: {
    backgroundColor: '#BFD5FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.6),
    marginBottom: hp(2),
  },
  nextButtonText: {
    color: '#1D2A57',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    paddingTop: hp(1.2),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#D8E0FF',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: wp(1.2),
  },
});

export default OnboardingScreen;
