import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { STACKS } from '../enums/ScreenEnums';
import Event from '../modules/event/Event';
import EventRegistration from '../modules/event/EventRegistration';
import EventPayment from '../modules/event/EventPayment';
import EventConfirmation from '../modules/event/EventConfirmation';
import EventReceipt from '../modules/event/EventReceipt';

const Stack = createStackNavigator();

const EventStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="EventList" component={Event} />
    <Stack.Screen name={STACKS.EVENT_REGISTRATION} component={EventRegistration} />
    <Stack.Screen name={STACKS.EVENT_PAYMENT} component={EventPayment} />
    <Stack.Screen name={STACKS.EVENT_CONFIRMATION} component={EventConfirmation} />
    <Stack.Screen name={STACKS.EVENT_RECEIPT} component={EventReceipt} />
  </Stack.Navigator>
);

export default EventStack;
