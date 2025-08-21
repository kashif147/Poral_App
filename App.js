import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigation';
import { SafeAreaView, StatusBar } from 'react-native';
import { Colors } from './src/utils/Styles';
import LandingPage from './src/modules/landing/LandingPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { microSoftUrlRedirect } from './src/helpers/B2C.helper';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        // setIsSignedIn(!!token);
        setIsSignedIn(true);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    console.log('Hello world');
    await microSoftUrlRedirect();
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
