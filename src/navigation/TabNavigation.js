import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, NativeModules, Platform, StyleSheet, Text, View, Dimensions, TouchableOpacity, Keyboard } from 'react-native';
import { Colors, wp, hp } from '../utils/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ApplicationStack from './ApplicationStack';
import EventStack from './EventStack';
import Categories from '../modules/categories/Categories';
import CourseStack from './CourseStack';
import Membership from '../modules/membership/Membership';
import Payment from '../modules/payment/Payment';
import PaymentMethod from '../modules/payment/PaymentMethod';
import PaymentReceipt from '../modules/payment/PaymentReceipt';
import Profile from '../modules/profile/Profile';
import Resources from '../modules/resources/Resources';
import Notifications from '../modules/notifications/Notifications';
import QueriesCases from '../modules/queriesCases/QueriesCases';
import CreateCase from '../modules/queriesCases/CreateCase';
import CaseDetail from '../modules/queriesCases/CaseDetail';
import { STACKS } from '../enums/ScreenEnums';
import { IMAGES } from '../assets/images';
import { TabBarIcon } from '../common/tabBarIcon';
import DashBoard from '../modules/dashboard/DashBoard';
import HamburgerIcon from '../common/hamburgerIcon';
import PopupMenu from '../common/popupMenu';
import PaymentIcon from '../common/paymentIcon';
import { useMemberRole } from '../hooks/useMemberRole';

const Tab = createBottomTabNavigator();

const TAB_ICONS = [
  { name: STACKS.DASHBOARD_STACK, label: 'Home', icon: IMAGES.HOME },
  { name: STACKS.EVENTS_STACK, label: 'Events', icon: IMAGES.EVENT },
  { name: STACKS.PAYMENT_STACK, label: 'Payment', icon: IMAGES.PAYMENT },
  { name: 'menu', label: 'More', icon: null },
];

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const { isMember } = useMemberRole();

  // Member-only: hide Payment tab when not member (match web)
  const mainRouteCount = 4; // Dashboard, Events, Payment, Menu
  const routes = state.routes.slice(0, mainRouteCount);
  const visibleRoutes = isMember
    ? routes
    : [routes[0], routes[1], routes[3]];
  const visibleTabIcons = isMember
    ? TAB_ICONS
    : [TAB_ICONS[0], TAB_ICONS[1], TAB_ICONS[3]];

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
      'Courses': STACKS.EVENTS_STACK,
      'Membership': STACKS.MEMBERSHIP_STACK,
      'Profile': 'Profile',
      'Resources': 'Resources',
      'Application': STACKS.APPLICATION_STACK,
      'Payment': STACKS.PAYMENT_STACK,
      'PaymentMethod': STACKS.PAYMENT_METHOD_STACK,
      'QueriesCases': STACKS.QUERIES_CASES_STACK,
    };
    
    const targetRoute = routeMap[route];
    if (targetRoute) {
      if (route === 'Courses') {
        navigation.navigate(STACKS.EVENTS_STACK, {
          screen: 'EventList',
          params: { categoryType: 'course' },
        });
        return;
      }
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
          backgroundColor: Colors.white,
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
        {visibleRoutes.map((route, idx) => {
          const actualIndex = isMember ? idx : [0, 1, 2, 4][idx];
          const { options } = descriptors[route.key];
          const isFocused = state.index === actualIndex;
          const tab = visibleTabIcons[idx];
          const iconColor = isFocused ? Colors.primary : Colors.textPrimary;

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
                    color={iconColor}
                    size={wp(5)}
                  />
                ) : tab.name === STACKS.PAYMENT_STACK ? (
                  <PaymentIcon
                    color={iconColor}
                    size={wp(5)}
                  />
                ) : (
                  <Image
                    source={tab.icon}
                    resizeMode="contain"
                    style={{
                      ...styles.image,
                      tintColor: iconColor,
                    }}
                  />
                )}
              </View>
              <Text style={{
                color: iconColor,
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
                  backgroundColor: Colors.primary,
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
        isMember={isMember}
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
          statusBarStyle: 'dark',
          statusBarAnimation: 'none',
        }}
      >
        <Tab.Screen name={STACKS.DASHBOARD_STACK} component={DashBoard} />
        <Tab.Screen name={STACKS.EVENTS_STACK} component={EventStack} />
        <Tab.Screen name={STACKS.PAYMENT_STACK} component={Payment} />
        <Tab.Screen name="Menu" component={DashBoard} />
        {/* Hidden screens for popup navigation */}
        <Tab.Screen name={STACKS.COURSES_STACK} component={CourseStack} />
        <Tab.Screen name={STACKS.APPLICATION_STACK} component={ApplicationStack} />
        <Tab.Screen name={STACKS.CATEGORIES_STACK} component={Categories} />
        <Tab.Screen name={STACKS.MEMBERSHIP_STACK} component={Membership} />
        <Tab.Screen name={STACKS.PAYMENT_METHOD_STACK} component={PaymentMethod} />
        <Tab.Screen name="PaymentReceipt" component={PaymentReceipt} />
        <Tab.Screen name="Profile" component={Profile} />
        <Tab.Screen name="Resources" component={Resources} />
        <Tab.Screen name="Directory" component={Profile} />
        <Tab.Screen name="Notifications" component={Notifications} />
        <Tab.Screen name={STACKS.QUERIES_CASES_STACK} component={QueriesCases} />
        <Tab.Screen name={STACKS.CREATE_CASE} component={CreateCase} />
        <Tab.Screen name={STACKS.CASE_DETAIL} component={CaseDetail} />
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