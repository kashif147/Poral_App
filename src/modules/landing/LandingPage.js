import React from 'react';
import { SafeAreaView, View, Text, Image, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Button } from '../../common/button';
import { Colors, wp, hp } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';
import FontIcons from '../../utils/FontIcons';

const LandingPage = ({ onLoginPress, onFaceRecognitionPress }) => {
  const MCI = FontIcons.MATERIAL_COMMUNITY_ICONS;

  return (
    <View style={{ flex: 1 }}>
      {/* Blue Radial Gradient Background */}
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6', '#1E293B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: wp(6), alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Top Section - Logo and Welcome */}
          <View style={{ width: '100%', alignItems: 'center', marginTop: hp(8) }}>
            <View style={styles.logoContainer}>
              <Image source={IMAGES.LOGO} style={{ width: wp(18), height: wp(18) }} resizeMode="contain" />
            </View>
            
            <Text style={styles.welcomeTitle}>
              Welcome to Members Portal
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in to access your membership services and continue your application
            </Text>
          </View>

          {/* Bottom Section - Authentication Options */}
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 600, marginBottom: hp(4) }}>
            
            {/* Microsoft Logo */}
            <View style={styles.microsoftLogoContainer}>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                <View style={[styles.microsoftSquare, { backgroundColor: '#F25022', marginRight: 4 }]} />
                <View style={[styles.microsoftSquare, { backgroundColor: '#7FBA00' }]} />
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={[styles.microsoftSquare, { backgroundColor: '#00A4EF', marginRight: 4 }]} />
                <View style={[styles.microsoftSquare, { backgroundColor: '#FFB900' }]} />
              </View>
            </View>

            {/* Face Recognition Option */}
            <View style={{ alignItems: 'center', marginBottom: wp(6) }}>
              <TouchableOpacity
                onPress={() => {
                  if (onFaceRecognitionPress) {
                    onFaceRecognitionPress();
                  } else {
                    Alert.alert('Face Recognition', 'This feature will be enabled soon.');
                  }
                }}
                activeOpacity={0.85}
                style={styles.faceRecognitionButton}
              >
                <MCI name="face-recognition" size={wp(8)} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.faceRecognitionText}>Face Recognition</Text>
            </View>

            {/* Login Button */}
            <Button
              title={'Continue with Microsoft'}
              primary
              onPress={onLoginPress}
              style={{ width: '100%', marginBottom: wp(3) }}
            />
            
            <Text style={styles.footerText}>
              Secure authentication powered by Microsoft
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: wp(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeTitle: {
    fontWeight: '700',
    fontSize: 28,
    marginBottom: wp(3),
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: wp(6),
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: wp(8),
    lineHeight: 20,
  },
  microsoftLogoContainer: {
    marginBottom: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  microsoftSquare: {
    width: 24,
    height: 24,
    borderRadius: 2,
  },
  faceRecognitionButton: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  faceRecognitionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: wp(2),
    fontSize: 13,
    fontWeight: '500',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: wp(2),
  },
});

export default LandingPage;


