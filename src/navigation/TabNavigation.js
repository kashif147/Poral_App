import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, NativeModules, Text, View } from 'react-native';
import AppEnums from '../enums/AppEnums';

import { STACKS } from '../enums/ScreenEnums';
import {
  btnBG,
  Colors,
  primaryColor,
  secondryColor,
  textColor,
} from '../utils/Styles';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Helper from '../utils/Helpers';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { LocalSvg } from 'react-native-svg/css';
import SvgIcons from '../enums/SvgIcons';
import Application from '../modules/application/Application';
import Event from '../modules/event/Event';
import Categories from '../modules/categories/Categories';
import Courses from '../modules/courses/Courses';
import Membership from '../modules/membership/Membership';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { StatusBarManager } = NativeModules;
  const backgroundStyle = {
    backgroundColor: 'black',
    flex: 1,
  };
  return (
    <SafeAreaProvider
      style={[
        backgroundStyle,
        {
          paddingTop: Helper.isIOS() ? StatusBarManager.HEIGHT || 0 : 0,
        },
      ]}>
      <Tab.Navigator
        initialRouteName="Network"
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            height: Helper.isIOS() ? 82 : 75,
            paddingLeft: 16,
            paddingRight: 16,
          },
          tabBarActiveTintColor: secondryColor,
          tabBarShowLabel: false,
          tabBarInactiveTintColor: btnBG,
          tabBarBackground: () => (
            <>
              <LinearGradient
                colors={['#00000000', '#000000F0', '#000000']}
                locations={[0, 0.4, 0.5]}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 100,
                }}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['#00000000', '#000000F0']}
                locations={[0, 1]}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 80,
                }}
                pointerEvents="none"
              />
            </>
          ),
        }}>
        <Tab.Screen
          name={STACKS.EVENTS_STACK}
          component={Event}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                {focused ?
                  <LocalSvg asset={SvgIcons.NEW_EVENT_WHITE} />
                  :
                  <LocalSvg asset={SvgIcons.NEW_EVENT} />}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name={STACKS.CALL_STACK}
          component={Categories}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={{ alignItems: 'center' }}>
                {focused ?
                  <LocalSvg asset={SvgIcons.NEW_CALL_WHITE} />
                  :
                  <LocalSvg asset={SvgIcons.NEW_CALL} />}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name={STACKS.NETWORK_STACK}
          component={Application}
          options={{
            tabBarIcon: ({ focused }) => (
              <View
                style={{ alignItems: 'center' }}>
                {focused ?
                  <LocalSvg asset={SvgIcons.NEW_NETWORK_WHITE} />
                  :
                  <LocalSvg asset={SvgIcons.NEW_NETWORK} />}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name={STACKS.CHAT_STACK}
          component={Courses}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={{ alignItems: 'center' }}>
                {focused ?
                  <LocalSvg asset={SvgIcons.NEW_CHAT_WHITE} />
                  :
                  <LocalSvg asset={SvgIcons.NEW_CHAT} />}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name={STACKS.ACCOUNT_STACK}
          component={Membership}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={{ alignItems: 'center', }}>
                <FastImage
                  source={{ uri: userData?.profile }}
                  resizeMode="cover"
                  style={{
                    height: 32,
                    width: 32,
                    borderRadius: 16,
                    overflow: 'hidden',
                    borderWidth: focused ? 1.5 : 0,
                    borderColor: focused ? Colors.white : 'transparent',
                  }}
                />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaProvider>
  );
};

export default TabNavigator;
