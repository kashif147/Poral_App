import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, NativeModules, Platform, StyleSheet, Text, View, Dimensions, TouchableOpacity, Keyboard } from 'react-native';
import { Colors, wp, hp } from '../utils/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Application from '../modules/application/Application';
import Event from '../modules/event/Event';
import Categories from '../modules/categories/Categories';
import Courses from '../modules/courses/Courses';
import Membership from '../modules/membership/Membership';
import Payment from '../modules/payment/Payment';
import PaymentMethod from '../modules/payment/PaymentMethod';
import Profile from '../modules/profile/Profile';
import Resources from '../modules/resources/Resources';
import Notifications from '../modules/notifications/Notifications';
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
    label: 'Home',
    icon: IMAGES.HOME,
  },
  {
    name: STACKS.EVENTS_STACK,
    label: 'Event',
    icon: IMAGES.EVENT,
  },
  {
    name: STACKS.COURSES_STACK,
    label: 'Courses',
    icon: IMAGES.COURSES,
  },
  {
    name: STACKS.PAYMENT_STACK,
    label: 'Payment',
    icon: IMAGES.PAYMENT,
  },
  {
    name: 'menu',
    label: 'More',
    icon: null,
  },
];

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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
      'Profile': 'Profile',
      'Resources': 'Resources',
      'Application': STACKS.APPLICATION_STACK,
      'Payment': STACKS.PAYMENT_STACK,
      'PaymentMethod': STACKS.PAYMENT_METHOD_STACK,
    };
    
    const targetRoute = routeMap[route];
    if (targetRoute) {
      navigation.navigate(targetRoute);
    }
  };

  // Hide tab bar when keyboard is visible
  if (isKeyboardVisible) {
    return null;
  }

  return (
    <>
      <View
        style={{
          height: hp(8),
          flexDirection: 'row',
          backgroundColor: Colors.primary,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 10,
          paddingBottom: 0,
          paddingHorizontal: wp(6),
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
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: hp(0.8), position: 'relative' }}
            >
              <View style={{
                borderRadius: 24,
                marginBottom: 2,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {tab.name === 'menu' ? (
                  <HamburgerIcon
                    color={Colors.white}
                    size={wp(5)}
                  />
                ) : tab.name === STACKS.PAYMENT_STACK ? (
                  <PaymentIcon
                    color={Colors.white}
                    size={wp(5)}
                  />
                ) : (
                  <Image
                    source={tab.icon}
                    resizeMode="contain"
                    style={{
                      ...styles.image,
                      tintColor: Colors.white,
                    }}
                  />
                )}
              </View>
              <Text style={{
                color: Colors.white,
                fontSize: 10,
                fontWeight: isFocused ? '600' : '500',
                marginTop: 2,
              }}>{tab.label}</Text>
              {isFocused && (
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  left: wp(3),
                  right: wp(3),
                  height: 3,
                  backgroundColor: Colors.white,
                  borderRadius: 2,
                }} />
              )}
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
  return (
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
        <Tab.Screen name={STACKS.EVENTS_STACK} component={Event} />
        <Tab.Screen name={STACKS.COURSES_STACK} component={Courses} />
        <Tab.Screen name={STACKS.PAYMENT_STACK} component={Payment} />
        <Tab.Screen name="Menu" component={DashBoard} />
        {/* Hidden screens for popup navigation */}
        <Tab.Screen name={STACKS.APPLICATION_STACK} component={Application} />
        <Tab.Screen name={STACKS.CATEGORIES_STACK} component={Categories} />
        <Tab.Screen name={STACKS.MEMBERSHIP_STACK} component={Membership} />
        <Tab.Screen name={STACKS.PAYMENT_METHOD_STACK} component={PaymentMethod} />
        <Tab.Screen name="Profile" component={Profile} />
        <Tab.Screen name="Resources" component={Resources} />
        <Tab.Screen name="Directory" component={Profile} />
        <Tab.Screen name="Notifications" component={Notifications} />
      </Tab.Navigator>
  );
};


export default TabNavigator;

export const styles = StyleSheet.create({

  image: {
    height: wp(4.5),
    width: wp(4.5),
  },
  title: { fontSize: wp(2.5), fontWeight: '600' },
});