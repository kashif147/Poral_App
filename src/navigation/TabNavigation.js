import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, NativeModules, Platform, StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { Colors, wp } from '../utils/Styles';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Application from '../modules/application/Application';
import Event from '../modules/event/Event';
import Categories from '../modules/categories/Categories';
import Courses from '../modules/courses/Courses';
import Membership from '../modules/membership/Membership';
import Payment from '../modules/payment/Payment';
import Profile from '../modules/profile/Profile';
import { STACKS } from '../enums/ScreenEnums';
import { IMAGES } from '../assets/images';
import { TabBarIcon } from '../common/tabBarIcon';
import DashBoard from '../modules/dashboard/DashBoard';
import HamburgerIcon from '../common/hamburgerIcon';
import PopupMenu from '../common/popupMenu';
import PaymentIcon from '../common/paymentIcon';

const Tab = createBottomTabNavigator();

const TAB_ICONS = [
  {
    name: STACKS.DASHBOARD_STACK,
    label: 'Dashboard',
    icon: IMAGES.HOME,
  },
  {
    name: STACKS.PAYMENT_STACK,
    label: 'Payment',
    icon: IMAGES.PAYMENT,
  },
  {
    name: STACKS.APPLICATION_STACK,
    label: 'Application',
    icon: IMAGES.PEN,
  },
  {
    name: 'menu',
    label: 'Menu',
    icon: null,
  },
];

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const { width } = Dimensions.get('window');

  const handleMenuPress = () => {
    setPopupVisible(true);
  };

  const handlePopupClose = () => {
    setPopupVisible(false);
  };

  const handlePopupNavigate = (route) => {
    // Handle navigation to different routes from popup
    console.log('Navigate to:', route);
    
    // Map popup routes to actual stack names
    const routeMap = {
      'Event': STACKS.EVENTS_STACK,
      'Category': STACKS.CATEGORIES_STACK,
      'Courses': STACKS.COURSES_STACK,
      'Membership': STACKS.MEMBERSHIP_STACK,
      'Profile': 'Profile', // You can add this to STACKS if needed
    };
    
    const targetRoute = routeMap[route];
    if (targetRoute) {
      navigation.navigate(targetRoute);
    }
  };

  return (
    <>
      <View
        style={{
          height: 70,
          flexDirection: 'row',
          backgroundColor: Colors.surface,
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 10,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = TAB_ICONS[index];
          
          // Only render tabs for visible tab bar items (first 4)
          if (index >= TAB_ICONS.length) {
            return null;
          }
          
          const onPress = () => {
            if (tab.name === 'menu') {
              handleMenuPress();
              return;
            }
            
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
                {tab.name === 'menu' ? (
                  <HamburgerIcon
                    color={isFocused ? Colors.primary : '#93A1A1'}
                    size={wp(5)}
                  />
                ) : tab.name === STACKS.PAYMENT_STACK ? (
                  <PaymentIcon
                    color={isFocused ? Colors.primary : '#93A1A1'}
                    size={wp(5)}
                  />
                ) : (
                  <Image
                    source={tab.icon}
                    resizeMode="contain"
                    style={{
                      ...styles.image,
                      tintColor: isFocused ? Colors.primary : '#93A1A1',
                    }}
                  />
                )}
              </View>
              <Text style={{
                color: isFocused ? Colors.primary : '#93A1A1',
                fontSize: 12,
                fontWeight: isFocused ? '700' : '500',
                marginTop: 2,
              }}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <PopupMenu
        visible={popupVisible}
        onClose={handlePopupClose}
        onNavigate={handlePopupNavigate}
      />
    </>
  );
};

const TabNavigator = () => {
  const { StatusBarManager } = NativeModules;
  const backgroundStyle = {
    backgroundColor: Colors.background,
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
        initialRouteName="Dashboard"
        backBehavior="history"
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor: Colors.background },
        }}
      >
        <Tab.Screen name={STACKS.DASHBOARD_STACK} component={DashBoard} />
        <Tab.Screen name={STACKS.PAYMENT_STACK} component={Payment} />
        <Tab.Screen name={STACKS.APPLICATION_STACK} component={Application} />
        <Tab.Screen name="Menu" component={DashBoard} />
        {/* Hidden screens for popup navigation */}
        <Tab.Screen name={STACKS.EVENTS_STACK} component={Event} />
        <Tab.Screen name={STACKS.CATEGORIES_STACK} component={Categories} />
        <Tab.Screen name={STACKS.COURSES_STACK} component={Courses} />
        <Tab.Screen name={STACKS.MEMBERSHIP_STACK} component={Membership} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
    </SafeAreaProvider>
  );
};


export default TabNavigator;

export const styles = StyleSheet.create({

  image: {
    height: wp(5),
    width: wp(5),
  },
  title: { fontSize: wp(2.5), fontWeight: '600' },
});