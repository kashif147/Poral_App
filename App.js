import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigation';
import { SafeAreaView, StatusBar } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Colors } from './src/utils/Styles';
import { ApplicationProvider } from './src/contexts/applicationContext';
import LandingPage from './src/modules/landing/LandingPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBearerToken } from './src/helpers/auth.helper';
import { signInWithAzureB2C } from './src/helpers/appAuth.helper';
import { createPolicyEvaluationRequest } from './src/api/policy.evaluation.api';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
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
    // console.log('Hello world');
    await setBearerToken('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjg4OGI1ZGM2MGM3OThiMDk3ZTg2YzkxIiwidXNlckVtYWlsIjoiZmF6YWxhemltMjM4QGdtYWlsLmNvbSIsInVzZXJGdWxsTmFtZSI6IkZhemFsIEF6aW0iLCJ1c2VyTWljcm9zb2Z0SWQiOiJhOWY3YzkzMS03MTA0LTQyMGItYTdiNS00MjAzMjc4YjliNGMiLCJ1c2VyTWVtYmVyTnVtYmVyIjpudWxsLCJ1c2VyTW9iaWxlUGhvbmUiOm51bGwsInVzZXJQb2xpY3kiOiJCMkNfMV9wcm9qZWN0c2hlbGwiLCJ1c2VySXNzdWVkQXQiOiIyMDI1LTA5LTA1VDA1OjM2OjQ0LjAwMFoiLCJ1c2VyQXV0aFRpbWUiOiIyMDI1LTA5LTA1VDA1OjM1OjQ0LjAwMFoiLCJ0b2tlblZlcnNpb24iOiJBenVyZSBBRCBCMkMgdjEiLCJ1c2VyVHlwZSI6IlBPUlRBTCJ9LCJpYXQiOjE3NTcwNTA2MDUsImV4cCI6MTc4ODYwODIwNX0.EuvSN9LkBIehQmS1kygasRnpmY_IvVe2Tdmt_rhXgXo');
    setIsSignedIn(true);
    // signInWithAzureB2C()
    //   .then(res => console.log('response========>', res))
    //   .catch(erro => console.log('error==========>', erro))
  };

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        backgroundColor={Colors.black}
        barStyle={'light-content'}
      />
      <StripeProvider publishableKey={'pk_test_51Rut8HQeJh5X1hcfNrG7yUZjkR9F3jURKHAiz5UCpJiOjaHjfx43ZimY7nJvLT3EvgrUtIMq1nrgwMgo5js7TOL1006raA9kpv'}>
        {isSignedIn ? (
          <ApplicationProvider>
            <NavigationContainer>
              <TabNavigator />
            </NavigationContainer>
          </ApplicationProvider>
        ) : (
          <LandingPage onLoginPress={handleLogin} />)
        }
      </StripeProvider>
    </SafeAreaView>
  );
}

export default App;
