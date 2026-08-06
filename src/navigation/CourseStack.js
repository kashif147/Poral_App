import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { STACKS } from '../enums/ScreenEnums';
import Event from '../modules/event/Event';
import CourseRegistration from '../modules/courses/CourseRegistration';
import EventPayment from '../modules/event/EventPayment';
import EventConfirmation from '../modules/event/EventConfirmation';
import EventReceipt from '../modules/event/EventReceipt';

const Stack = createStackNavigator();

const CourseStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="CourseList" component={Event} initialParams={{ categoryType: 'course' }} />
    <Stack.Screen name={STACKS.COURSE_REGISTRATION} component={CourseRegistration} />
    <Stack.Screen name={STACKS.EVENT_PAYMENT} component={EventPayment} />
    <Stack.Screen name={STACKS.EVENT_CONFIRMATION} component={EventConfirmation} />
    <Stack.Screen name={STACKS.EVENT_RECEIPT} component={EventReceipt} />
  </Stack.Navigator>
);

export default CourseStack;
