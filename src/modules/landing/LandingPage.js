import React from 'react';
import { SafeAreaView, View, Text, Image, Alert, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Button } from '../../common/button';
import { Colors, wp } from '../../utils/Styles';
import { microSoftUrlRedirect } from '../../helpers/B2C.helper';
import { signInWithAzureB2C } from '../../helpers/appAuth.helper';
import { IMAGES } from '../../assets/images';
import FontIcons from '../../utils/FontIcons';

const LandingPage = ({ onLoginPress, onFaceRecognitionPress }) => {
  const MCI = FontIcons.MATERIAL_COMMUNITY_ICONS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      {/* Decorative bottom-to-top gradient occupying half screen */}
      <LinearGradient
        colors={[Colors.lightsky, 'rgba(212,255,242,0)']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' }}
      />

      <View style={{ flex: 1, padding: wp(6), alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: '100%', alignItems: 'center', marginTop: 0, marginBottom: wp(6) }}>
          <Image source={IMAGES.LOGO} style={{ width: wp(18), height: wp(18) }} resizeMode="contain" />
        </View>

        <View style={{ alignItems: 'center', width: '100%', maxWidth: 600 }}>
          <Text style={{ fontWeight: '700', fontSize: 24, marginBottom: wp(2), color: Colors.black }}>
            Welcome back!
          </Text>
          <Text style={{ color: Colors.grey700, marginBottom: wp(6), fontSize: 14, textAlign: 'center' }}>
            Sign in securely to continue
          </Text>

          <View style={{ width: '100%', gap: wp(4), alignItems: 'center' }}>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  if (onFaceRecognitionPress) {
                    onFaceRecognitionPress();
                  } else {
                    Alert.alert('Face Recognition', 'This feature will be enabled soon.');
                  }
                }}
                activeOpacity={0.85}
                style={{
                  width: wp(16),
                  height: wp(16),
                  borderRadius: wp(8),
                  backgroundColor: Colors.ligthWhite,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: Colors.lightgray,
                  shadowColor: Colors.black,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <MCI name="face-recognition" size={wp(8)} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={{ color: Colors.grey700, marginTop: wp(2), fontSize: 12 }}>Face Recognition</Text>
            </View>
            <Button
              title={'Start'}
              primary
              onPress={
                onLoginPress || (async () => {
                  const signIn = await signInWithAzureB2C();
                  if (!signIn.ok) {
                    await microSoftUrlRedirect();
                  }
                })
              }
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LandingPage;


