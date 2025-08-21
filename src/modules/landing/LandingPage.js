import React, { useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, Animated, StyleSheet, Image } from 'react-native';
import { Button } from '../../common/button';
import { Colors, wp } from '../../utils/Styles';
import { microSoftUrlRedirect } from '../../helpers/B2C.helper';
import { IMAGES } from '../../assets/images';

const LandingPage = ({ onLoginPress }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 25000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: wp(4) }}>
        <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
          <Animated.View style={{ opacity: 0.15, transform: [{ rotate: spin }] }}>
            <Image source={IMAGES.LOGO} style={{ width: wp(60), height: wp(60) }} resizeMode="contain" />
          </Animated.View>
        </View>

        <View style={{ alignItems: 'center', zIndex: 1, maxWidth: 600, width: '100%' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24, marginBottom: 12, color: Colors.black }}>
            Welcome to Members Portal
          </Text>
          <Text style={{ color: '#666', marginBottom: 24, fontSize: 16, textAlign: 'center' }}>
            Access all your membership services in one place
          </Text>

          <View style={{ alignItems: 'center' }}>
            <Button
              title={'Register Now'}
              onPress={onLoginPress || microSoftUrlRedirect}
              style={{ width: '100%', paddingHorizontal: wp(10) }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LandingPage;


