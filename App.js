import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigation';
import { StatusBar, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Colors } from './src/utils/Styles';
import { ApplicationProvider } from './src/contexts/applicationContext';
import { LookupProvider } from './src/contexts/lookupContext';
import LandingPage from './src/modules/landing/LandingPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBearerToken } from './src/helpers/auth.helper';
import { signInWithAzureB2C, prefetchB2CConfiguration } from './src/helpers/appAuth.helper';
import { createPolicyEvaluationRequest } from './src/api/policy.evaluation.api';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // await prefetchB2CConfiguration();
        const token = await AsyncStorage.getItem('token');
        // if (token) {
        //   createPolicyEvaluationRequest({
        //     token: token,
        //     resource: 'user',
        //     action: 'read',
        //     context: {
        //       userId: '6888b5dc60c798b097e86c91'
        //     },
        //   }).then(res => {
        //     console.log('res=============>', res);
        //   }).catch(err => {
        //     console.log('err=============>', err);
        //   });
        // }
        setIsSignedIn(!!token);
        // setIsSignedIn(true);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);
  const handleLogin = async () => {
    try {
      console.log('Hello world');
      await setBearerToken('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODg4YjVkYzYwYzc5OGIwOTdlODZjOTEiLCJ0ZW5hbnRJZCI6IjM5ODY2YTA2LTMwYmMtNGE4OS04MGM2LTlkZDkzNTdkZDQ1MyIsImlkIjoiNjg4OGI1ZGM2MGM3OThiMDk3ZTg2YzkxIiwiZW1haWwiOiJmYXphbGF6aW0yMzhAZ21haWwuY29tIiwidXNlclR5cGUiOiJQT1JUQUwiLCJyb2xlcyI6W3siaWQiOiI2OGM2YjRkMWU0MjMwNmE2ODM2NjIyY2MiLCJjb2RlIjoiTUVNQkVSIiwibmFtZSI6Ik1lbWJlciJ9XSwicGVybWlzc2lvbnMiOlsiTE9PS1VQX1JFQUQiLCJMT09LVVBUWVBFX1JFQUQiLCJQT1JUQUxfUkVBRCIsIlBPUlRBTF9DUkVBVEUiLCJQT1JUQUxfV1JJVEUiLCJQT1JUQUxfREVMRVRFIiwiQVBQTElDQVRJT05fUkVBRCIsIkRBU0hCT0FSRF9SRUFEIiwiRVZFTlRTX1JFQUQiLCJFVkVOVFNfQ1JFQVRFIiwiRVZFTlRTX1dSSVRFIiwiRVZFTlRTX0RFTEVURSIsIlJFU09VUkNFU19SRUFEIiwiUkVTT1VSQ0VTX0NSRUFURSIsIlJFU09VUkNFU19XUklURSIsIlJFU09VUkNFU19ERUxFVEUiLCJQUk9GSUxFX1JFQUQiLCJQUk9GSUxFX1dSSVRFIiwiUEFZTUVOVFNfUkVBRCIsIlBBWU1FTlRTX0NSRUFURSIsIlBBWU1FTlRTX1dSSVRFIiwiQ0hBTkdFT0ZDQVRFR09SWV9SRUFEIiwiQ0hBTkdFT0ZDQVRFR09SWV9DUkVBVEUiLCJDSEFOR0VPRkNBVEVHT1JZX1dSSVRFIiwiQ0hBTkdFT0ZDQVRFR09SWV9ERUxFVEUiLCJUUkFOU0ZFUlJFUVVFU1RTX1JFQUQiLCJUUkFOU0ZFUlJFUVVFU1RTX0NSRUFURSIsIlRSQU5TRkVSUkVRVUVTVFNfV1JJVEUiLCJUUkFOU0ZFUlJFUVVFU1RTX0RFTEVURSIsIlNVQlNDUklQVElPTlNfUkVBRCIsIlNVQlNDUklQVElPTlNfV1JJVEUiLCJDT01NVU5JQ0FUSU9OX1JFQUQiLCJDT01NVU5JQ0FUSU9OX0NSRUFURSIsIkNPTU1VTklDQVRJT05fV1JJVEUiLCJDT01NVU5JQ0FUSU9OX0RFTEVURSIsIlFVRVJJRVNfUkVBRCIsIlFVRVJJRVNfQ1JFQVRFIiwiUVVFUklFU19XUklURSIsIlFVRVJJRVNfREVMRVRFIiwiVk9USU5HX1JFQUQiLCJWT1RJTkdfQ1JFQVRFIiwiVk9USU5HX1dSSVRFIiwiUFJPRklMRV9DUkVBVEUiLCJQUk9GSUxFX0RFTEVURSIsIlNVQlNDUklQVElPTlNfQ1JFQVRFIiwiU1VCU0NSSVBUSU9OU19ERUxFVEUiLCJQT1JUQUxfQUNDRVNTIiwiUE9SVEFMX1BST0ZJTEVfUkVBRCIsIlBPUlRBTF9QUk9GSUxFX1dSSVRFIiwiQUNDT1VOVF9SRUFEIiwiQUNDT1VOVF9QQVlNRU5UIiwiQUNDT1VOVF9UUkFOU0FDVElPTl9SRUFEIl0sImlhdCI6MTc1ODM5MTE1NiwiZXhwIjoxNzg5OTI3MTU2fQ.vVqlqYh3MphSazNl0jyQ4FIdm76F6NlVWwfY0_O223Q');
      setIsSignedIn(true);
      const res = await signInWithAzureB2C();
      if (res?.ok && res?.result?.accessToken) {
        setIsSignedIn(true);
      } else {
        console.log('B2C sign-in failed', res?.error);
      }
    } catch (error) {
      console.log('B2C sign-in error', error);
    }
  };

  // const handleLogin = async () => {
  //   try {
  //     const res = await signInWithAzureB2C();
  //     if (res?.ok && res?.result?.accessToken) {
  //       setIsSignedIn(true);
  //     } else {
  //       console.log('B2C sign-in failed', res?.error);
  //     }
  //   } catch (error) {
  //     console.log('B2C sign-in error', error);
  //   }
  // };

  if (isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        backgroundColor={Platform.OS === 'android' ? Colors.surface : Colors.background}
        barStyle='dark-content'
        translucent={false}
        hidden={false}
        animated={true}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
        <StripeProvider publishableKey={'pk_test_51SBAG4FTlZb0wcbr19eI8nC5u62DfuaUWRVS51VTERBocxSM9JSEs4ubrW57hYTCAHK9d6jrarrT4SAViKFMqKjT00TrEr3PNV'}>
          {isSignedIn ? (
            <LookupProvider>
              <ApplicationProvider>
                <NavigationContainer>
                  <TabNavigator />
                </NavigationContainer>
              </ApplicationProvider>
            </LookupProvider>
          ) : (
            <LandingPage onLoginPress={handleLogin} />)
          }
        </StripeProvider>
      </SafeAreaView>
    </View>
  );
}

export default App;
