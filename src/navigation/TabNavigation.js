import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, NativeModules, Platform, StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { Colors } from '../utils/Styles';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocalSvg } from 'react-native-svg/css';
import Application from '../modules/application/Application';
import Event from '../modules/event/Event';
import Categories from '../modules/categories/Categories';
import Courses from '../modules/courses/Courses';
import Membership from '../modules/membership/Membership';
import svg from '../assets/svg';
import { STACKS } from '../enums/ScreenEnums';
import { IMAGES } from '../assets/images';
import { TabBarIcon } from '../common/tabBarIcon';

const Tab = createBottomTabNavigator();

const TAB_ICONS = [
  {
    name: STACKS.EVENTS_STACK,
    label: 'Event',
    icon: svg.HOME || svg.NEW_EVENT_TAB,
  },
  {
    name: STACKS.CATEGORIES_STACK,
    label: 'Categories',
    icon: svg.SEARCH,
  },
  {
    name: STACKS.APPLICATION_STACK,
    label: 'Application',
    icon: svg.CHAT_MESSAGE_NEW || svg.NEW_CHAT_TAB,
  },
  {
    name: STACKS.COURSES_STACK,
    label: 'Courses',
    icon: svg.CLOCK,
  },
  {
    name: STACKS.MEMBERSHIP_STACK,
    label: 'Membership',
    icon: svg.USERS_GROUP,
  },
];

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { width } = Dimensions.get('window');
  return (
    <View
      style={{
        height: 70,
        flexDirection: 'row',
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = TAB_ICONS[index];
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            activeOpacity={0.8}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{
              borderRadius: 24,
              marginBottom: 4,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <LocalSvg asset={tab.icon} width={24} height={24} fill={isFocused ? Colors.primary : Colors.iconColor} />
            </View>
            <Text style={{
              color: isFocused ? Colors.primary : Colors.iconColor,
              fontSize: 12,
              fontWeight: isFocused ? '700' : '500',
              marginTop: 2,
            }}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const TabNavigator = () => {
  const { StatusBarManager } = NativeModules;
  const backgroundStyle = {
    backgroundColor: Colors.black,
    flex: 1,
  };
  return (
    <SafeAreaProvider
      style={[
        backgroundStyle,
        {
          paddingTop: Platform.OS === 'ios' ? StatusBarManager.HEIGHT || 0 : 0,
        },
      ]}>
      <Tab.Navigator
        initialRouteName="Application"
        backBehavior="history"
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tab.Screen name={STACKS.EVENTS_STACK} component={Event} />
        <Tab.Screen name={STACKS.CATEGORIES_STACK} component={Categories} />
        <Tab.Screen name={STACKS.APPLICATION_STACK} component={Application} />
        <Tab.Screen name={STACKS.COURSES_STACK} component={Courses} />
        <Tab.Screen name={STACKS.MEMBERSHIP_STACK} component={Membership} />
      </Tab.Navigator>
    </SafeAreaProvider>
  );
};


export default TabNavigator;
