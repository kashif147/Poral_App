import React, { useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Label } from '../../common/text/label';
import { Wrapper } from '../../common/wrapper';
import { SVG } from '../../assets/svg';
import { DashboardCard } from '../../common/DashboardCard';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '../../enums/ScreenEnums';
import { Colors, commonStyles, wp, hp } from '../../utils/Styles';
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

  // Quick access menu items
  // Quick access excluding the three main tabs
  const quickActions = [
    { key: 'events', title: 'Events', icon: IMAGES.EVENT, onPress: () => navigation.navigate(STACKS.EVENTS_STACK) },
    { key: 'categories', title: 'Categories', icon: IMAGES.CATEGORIES, onPress: () => navigation.navigate(STACKS.CATEGORIES_STACK) },
    { key: 'courses', title: 'Courses', icon: IMAGES.COURSES, onPress: () => navigation.navigate(STACKS.COURSES_STACK) },
    { key: 'membership', title: 'Membership', icon: IMAGES.SETTING, onPress: () => navigation.navigate(STACKS.MEMBERSHIP_STACK) },
    { key: 'profile', title: 'Profile', icon: IMAGES.USER, onPress: () => navigation.navigate('Profile') },
  ];

  // Mock data for charts
  const monthlySpend = [120, 80, 140, 100, 160, 110, 90, 130, 150, 170, 155, 180];
  const recentPayments = [
    { label: 'Jul', amount: '€25.00' },
    { label: 'Aug', amount: '€25.00' },
    { label: 'Sep', amount: '€25.00' },
  ];

  const renderBarChart = (data) => {
    const max = Math.max(...data, 1);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120 }}>
        {data.map((v, i) => (
          <View key={i} style={{ width: 10, marginHorizontal: 6, backgroundColor: '#123338', height: 120, borderRadius: 6, justifyContent: 'flex-end' }}>
            <View style={{ height: Math.max(6, (v / max) * 120), backgroundColor: Colors.primary, borderRadius: 6 }} />
          </View>
        ))}
      </View>
    );
  };

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.container, { paddingBottom: 120 }]}>
        {/* Overview graph */}
        <View style={styles.card}>
          <Label style={styles.sectionTitle}>Payments Overview</Label>
          {renderBarChart(monthlySpend)}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: '#93A1A1', fontSize: 12 }}>Last 12 months</Text>
            <Text style={{ color: Colors.white, fontWeight: '700' }}>Total: €{monthlySpend.reduce((a,b)=>a+b,0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Quick Access horizontal buttons */}
        <View style={{ marginTop: 16 }}>
          <Label style={styles.sectionTitle}>Quick Access</Label>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickContainer}
          >
            {quickActions.map(item => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.9}
                onPress={item.onPress}
                style={styles.quickButton}
              >
                <Image source={item.icon} resizeMode="contain" style={styles.quickIcon} />
                <Text style={styles.quickLabel}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.subscriptionSection}>
          <Label style={styles.sectionTitle}>Subscription Details</Label>
          {/* Single attractive card */}
          <View style={styles.subscriptionCardEnhanced}>
            {/* Top: status + amount */}
            <View style={styles.subscriptionHeader}>
              <View style={[styles.statusPill, { borderColor: Colors.primary, backgroundColor: '#0b2a2620' }]}>
                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 12 }}>{subscriptionData.current.status}</Text>
              </View>
              <Text style={styles.amountText}>{subscriptionData.current.amount}</Text>
            </View>

            {/* Plan */}
            <Text style={styles.planText} numberOfLines={2}>{subscriptionData.current.plan}</Text>

            {/* Info row */}
            <View style={styles.subscriptionDetailsRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Next Payment</Text>
                <Text style={styles.detailValue}>{subscriptionData.current.nextPayment}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={[styles.detailCol, { paddingLeft: 12 }]}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{subscriptionData.current.status}</Text>
              </View>
            </View>

            {/* CTA */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.primaryBtn}
                onPress={() => navigation.navigate(STACKS.PAYMENT_STACK)}
              >
                <Text style={styles.primaryBtnText}>Manage</Text>
              </TouchableOpacity>
            </View>

            {/* Pending change, if any */}
            {subscriptionData?.pending ? (
              <View style={styles.pendingBox}>
                <Text style={styles.pendingTitle}>Pending Change</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.detailLabel, { color: '#93A1A1' }]}>Application Date</Text>
                  <Text style={styles.detailValue}>{subscriptionData.pending.applicationDate}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={[styles.detailLabel, { color: '#93A1A1' }]}>Amount</Text>
                  <Text style={styles.detailValue}>{subscriptionData.pending.amount}</Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={{ color: Colors.white, fontWeight: '700', marginBottom: 8 }}>Recent Payments</Text>
            {recentPayments.map((p, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: idx === recentPayments.length -1 ? 0 : 1, borderBottomColor: '#2A2F33' }}>
                <Text style={{ color: '#93A1A1' }}>{p.label}</Text>
                <Text style={{ color: Colors.white, fontWeight: '600' }}>{p.amount}</Text>
              </View>
            ))}
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
          bottom: wp(4),
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
  card: {
    backgroundColor: '#1A1F23',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2A2F33',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2F33',
    backgroundColor: '#1A1F23',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    minHeight: 120,
  },
  subscriptionCardEnhanced: {
    backgroundColor: '#1A1F23',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2F33',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subscriptionDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F23',
    borderWidth: 1,
    borderColor: '#22292E',
    padding: 12,
    borderRadius: 12,
  },
  pendingBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2F33',
    backgroundColor: '#161C20',
    padding: 12,
  },
  pendingTitle: {
    color: Colors.white,
    fontWeight: '700',
    marginBottom: 6,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  primaryBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },
  quickContainer: {
    gap: 12,
  },
  quickButton: {
    height: 120,
    width: 140,
    borderRadius: 16,
    backgroundColor: '#1A1F23',
    borderWidth: 1,
    borderColor: '#2A2F33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  quickIcon: {
    height: 28,
    width: 28,
    tintColor: Colors.white,
    marginBottom: 8,
  },
  quickLabel: {
    color: Colors.white,
    fontWeight: '700',
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
    color: '#93A1A1',
    flexWrap: 'wrap',
  },
  amountText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  planText: {
    color: '#B7C3C6',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 12,
    marginTop: 2,
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
    color: '#93A1A1',
    flex: 1,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93A1A1',
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
  detailCol: {
    flex: 1,
    minWidth: 0,
  },
  detailDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#232a2f',
  },
});

export default DashBoard;