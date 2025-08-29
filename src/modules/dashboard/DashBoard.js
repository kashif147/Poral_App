import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { Label } from '../../common/text/label';
import { Wrapper } from '../../common/wrapper';
import { SVG } from '../../assets/svg';
import { DashboardCard } from '../../common/DashboardCard';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '../../enums/ScreenEnums';
import { commonStyles } from '../../utils/Styles';

const { width } = Dimensions.get('window');

const CARD_WIDTH = width > 500 ? (width - 64) / 2 : '100%';

const DashBoard = () => {
  const navigation = useNavigation();

  const dashboardCards = [
    {
      key: 'application',
      icon: SVG.PENCIL,
      title: 'Application',
      description: 'Start or continue your membership application',
      button: "Let's get started",
      onPress: () => navigation.navigate(STACKS.APPLICATION_STACK),
    },
    {
      key: 'profile',
      icon: SVG.USERS_GROUP,
      title: 'My Profile',
      description: 'View and update your profile information',
      button: 'View My Profile',
      onPress: () => { },
    },
    {
      key: 'events',
      icon: SVG.CARD,
      title: 'Events',
      description: 'Browse and register for upcoming events',
      button: 'View Events',
      onPress: () => navigation.navigate(STACKS.EVENTS_STACK),
    },
    {
      key: 'payments',
      icon: SVG.CARD,
      title: 'Payments',
      description: 'Manage your payments and subscriptions',
      button: 'View Payments',
      onPress: () => { },
    },
  ];

  return (
    <Wrapper style={commonStyles.screenContainer} title={'Dashboard'}>
      <ScrollView contentContainerStyle={{ padding: 1 }}>
        <Label style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          Welcome to Members Portal
        </Label>
        <Label style={{ color: '#888', marginBottom: 20 }}>
          Access all your membership services in one place
        </Label>
        <View
          style={{
            flexDirection: width > 500 ? 'row' : 'column',
            flexWrap: 'wrap',
            justifyContent: width > 500 ? 'space-between' : 'flex-start',
            alignItems: 'stretch',
          }}
        >
          {dashboardCards.map((card, idx) => (
            <DashboardCard
              key={card.key}
              icon={card.icon}
              title={card.title}
              description={card.description}
              button={card.button}
              onPress={card.onPress}
              style={{ width: CARD_WIDTH }}
            />
          ))}
        </View>
      </ScrollView>
    </Wrapper>
  );
};

export default DashBoard;