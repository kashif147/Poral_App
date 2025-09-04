import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigation';
import { SafeAreaView, StatusBar } from 'react-native';
import { Colors } from './src/utils/Styles';
import LandingPage from './src/modules/landing/LandingPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBearerToken } from './src/helpers/auth.helper';
import { microSoftUrlRedirect } from './src/helpers/B2C.helper';
import { signInWithAzureB2C } from './src/helpers/appAuth.helper';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
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
    // await setBearerToken('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjg4OGI1ZGM2MGM3OThiMDk3ZTg2YzkxIiwidXNlckVtYWlsIjoiZmF6YWxhemltMjM4QGdtYWlsLmNvbSIsInVzZXJGdWxsTmFtZSI6IkZhemFsIEF6aW0iLCJ1c2VyTWljcm9zb2Z0SWQiOiJhOWY3YzkzMS03MTA0LTQyMGItYTdiNS00MjAzMjc4YjliNGMiLCJ1c2VyTWVtYmVyTnVtYmVyIjpudWxsLCJ1c2VyTW9iaWxlUGhvbmUiOm51bGwsInVzZXJQb2xpY3kiOiJCMkNfMV9wcm9qZWN0c2hlbGwiLCJ1c2VySXNzdWVkQXQiOiIyMDI1LTA4LTIwVDE3OjAwOjM3LjAwMFoiLCJ1c2VyQXV0aFRpbWUiOiIyMDI1LTA4LTIwVDE3OjAwOjMwLjAwMFoiLCJ0b2tlblZlcnNpb24iOiJBenVyZSBBRCBCMkMgdjEiLCJ1c2VyVHlwZSI6IlBPUlRBTCJ9LCJpYXQiOjE3NTU3MDkyMzcsImV4cCI6MTc4NzI2NjgzN30.xcrjxBbgc_UB2cGeqRHXCnZD4TKbN80v3LxOJk8FLVw');
    await signInWithAzureB2C();
  };

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        backgroundColor={Colors.black}
        barStyle={'dark-content'}
      />
      {isSignedIn ? (
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      ) : (
        <LandingPage onLoginPress={handleLogin} />)
      }
    </SafeAreaView>
  );
}

export default App;
