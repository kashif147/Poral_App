import React, { useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Label } from '../../common/text/label';
import { Wrapper } from '../../common/wrapper';
import { SVG } from '../../assets/svg';
import { DashboardCard } from '../../common/DashboardCard';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '../../enums/ScreenEnums';
import { Colors, commonStyles, wp } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';

const DashBoard = () => {
  const navigation = useNavigation();
  const [subscriptionData, setSubscriptionData] = useState({
    current: {
      status: 'Active',
      plan: 'Short-term/ Relief (under 15 hrs/wk average',
      nextPayment: '2024-02-15',
      amount: '€25.00',
    },
    pending: {
      status: 'Pending',
      plan: 'Short-term/ Relief (under 15 hrs/wk average',
      applicationDate: '2024-01-20',
      amount: '€25.00',
    },
  });

  const dashboardCards = [
    {
      key: 'application',
      icon: SVG.PENCIL,
      title: 'Application',
      description: 'Start or continue your membership application',
      button: "Let's get started",
      onPress: () => navigation.navigate(STACKS.APPLICATION_STACK),
    },
  ];

  const renderSubscriptionCard = (type, data) => (
    <View style={[styles.subscriptionCard, { backgroundColor: type === 'current' ? '#e8f5e8' : '#fff3cd' }]}>
      <View style={styles.subscriptionHeader}>
        <Label style={[styles.subscriptionStatus, { color: type === 'current' ? '#28a745' : '#ffc107' }]}>
          {data.status}
        </Label>
        <View style={[styles.statusIndicator, { backgroundColor: type === 'current' ? '#28a745' : '#ffc107' }]} />
      </View>
      <Label style={styles.subscriptionPlan} numberOfLines={2}>{data.plan}</Label>
      <View style={styles.subscriptionDetails}>
        <View style={styles.detailRow}>
          <Label style={styles.detailLabel} numberOfLines={1}>
            {type === 'current' ? 'Next Payment:' : 'Application Date:'}
          </Label>
        </View>
        <View style={styles.detailRow}>
          <Label style={styles.detailLabel} numberOfLines={1}>Amount:</Label>
          <Label style={styles.detailValue} numberOfLines={1}>{data.amount}</Label>
        </View>
      </View>
    </View>
  );

  return (
    <Wrapper style={commonStyles.screenContainer} title={'Dashboard'}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        <View style={styles.subscriptionSection}>
          <Label style={styles.sectionTitle}>Subscription Details</Label>
          <View style={styles.subscriptionContainer}>
            {renderSubscriptionCard('current', subscriptionData.current)}
            {renderSubscriptionCard('current', subscriptionData.pending)}
          </View>
        </View>

        {/* Quick Actions removed as per design - using floating action button instead */}
      </ScrollView>
      <TouchableOpacity
        onPress={() => navigation.navigate(STACKS.APPLICATION_STACK)}
        activeOpacity={0.9}
        style={{
          position: 'absolute',
          right: wp(2),
          bottom: wp(8),
          backgroundColor: Colors.primary,
          borderRadius: 22,
          height: 44,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
          elevation: 10,
        }}
      >
        <Image source={IMAGES.PEN} resizeMode="contain" style={{ height: 18, width: 18, tintColor: Colors.white, marginRight: 8 }} />
        <Text style={{ color: Colors.white, fontWeight: '700' }}>Add application</Text>
      </TouchableOpacity>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  welcomeSubtitle: {
    color: '#888',
    marginBottom: 24,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.white,
  },
  subscriptionSection: {
    marginBottom: 32,
    marginTop: 16
  },
  subscriptionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  subscriptionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subscriptionPlan: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    flexWrap: 'wrap',
  },
  subscriptionDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    flex: 1,
    minWidth: 0,
  },
  cardsSection: {
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 12,
    flex: 0,
  },
  dashboardCard: {
    height: 'auto',
    minHeight: 160,
  },
});

export default DashBoard;