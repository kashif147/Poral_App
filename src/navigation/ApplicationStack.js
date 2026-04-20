import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { STACKS } from '../enums/ScreenEnums';
import ApplicationHistory from '../modules/application/ApplicationHistory';
import ApplicationDetail from '../modules/application/ApplicationDetail';
import Application from '../modules/application/Application';

const Stack = createStackNavigator();

const ApplicationStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen
      name={STACKS.APPLICATION_HISTORY}
      component={ApplicationHistory}
    />
    <Stack.Screen
      name={STACKS.APPLICATION_DETAIL}
      component={ApplicationDetail}
    />
    <Stack.Screen name={STACKS.APPLICATION_FORM} component={Application} />
  </Stack.Navigator>
);

export default ApplicationStack;
