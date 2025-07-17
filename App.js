import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigation';
import { SafeAreaView, StatusBar } from 'react-native';
import { primaryColor } from './src/utils/Styles';

function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        backgroundColor={primaryColor}
        barStyle={'light-content'}
      />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default App;
