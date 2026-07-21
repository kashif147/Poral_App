import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Label } from '../../common/text/label';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { STACKS } from '../../enums/ScreenEnums';
import { Colors } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import { getAccountNetBalanceRequest } from '../../api/account.api';
import { useProfile } from '../../contexts/profileContext';
import ScreenHeader from '../../common/screenHeader';
import { useSelector, useDispatch } from 'react-redux';
import DetailModal from '../../common/detailModal';
import { getEventWithRegistrationData } from '../../constants/eventData';
import {
  QUICK_ACTION_COLORS,
  FEATURED_EVENT,
  UPCOMING_EVENTS,
} from '../../constants/dashboard';
import {
  isActiveApplicationCompleteStatus,
  isActiveApplicationPersonalDetail,
  isProcessedApplicationStatus,
  normalizeApplicationStatus,
  resolveEffectiveApplicationStatus,
} from '../../helpers/applicationPayload.helper';
import { canAccessProfile } from '../../helpers/role.helper';
import { useMemberRole } from '../../hooks/useMemberRole';
import { validation } from '../../services/auth.services';
import DashboardPaymentModal from './DashboardPaymentModal';
import { QuickActionCard } from '../../common/QuickActionCard';
import {
  FeaturedEventCard,
  UpcomingEventCard,
  EventDetailModalContent,
  DashboardPaymentCard,
  ApplicationStatusCard,
  StatusCardSkeleton,
} from './components';

const DashBoard = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { isMember } = useMemberRole();
  const insets = useSafeAreaInsets();
  const {
    personalDetail,
    subscriptionDetail,
    professionalDetail,
    applicationStatus: contextApplicationStatus,
    refreshApplicationState,
    loading: applicationContextLoading,
  } = useApplication();
  const { fetchAllLookups } = useLookup();
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [isApplicationActive, setIsApplicationActive] = useState(true);
  const [isResignedMember, setIsResignedMember] = useState(false);
  const [applicationStatusLoading, setApplicationStatusLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [accountNetBalance, setAccountNetBalance] = useState(null);
  const [accountNetBalanceLoading, setAccountNetBalanceLoading] =
    useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { getProfileDetail, profileDetail } = useProfile();
  const { getCategoryData, categoryData } = useApplication();
  const resolvedMembershipNumber =
    profileDetail?.membershipNumber ||
    profileDetail?.membershipId ||
    user?.membershipNumber ||
    user?.membershipId ||
    null;

  const { categoryLookups } = useLookup();
  const applicationStatusLoadingRef = useRef(false);
  const refreshApplicationStateRef = useRef(refreshApplicationState);

  useEffect(() => {
    refreshApplicationStateRef.current = refreshApplicationState;
  }, [refreshApplicationState]);

  const loadCategoryData = async () => {
    if (!membershipCategory) return;
    try {
      await getCategoryData(membershipCategory, categoryLookups || []);
    } catch (error) {
      // Silently handle errors
    }
  };

  const loadLookups = async () => {
    try {
      await fetchAllLookups?.();
    } catch (error) {
      // Silently handle errors
    }
  };

  const loadProfile = async () => {
    try {
      await getProfileDetail?.();
    } catch (error) {
      // Silently handle errors
    }
  };

  const loadApplicationStatus = useCallback(async () => {
    if (applicationStatusLoadingRef.current) {
      return;
    }

    applicationStatusLoadingRef.current = true;

    try {
      setApplicationStatusLoading(true);
      const result = await refreshApplicationStateRef.current?.();

      if (result?.status != null) {
        setApplicationStatus(result.status);
        setIsApplicationActive(Boolean(result.isActive));
        return;
      }

      setApplicationStatus('none');
      setIsApplicationActive(true);
    } catch (error) {
      setApplicationStatus(null);
      setIsApplicationActive(true);
    } finally {
      applicationStatusLoadingRef.current = false;
      setApplicationStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (applicationStatusLoading || applicationContextLoading) {
      return;
    }

    const resolvedStatus = resolveEffectiveApplicationStatus({
      localStatus: applicationStatus,
      contextStatus: contextApplicationStatus,
      personalDetail,
    });

    if (resolvedStatus === 'none') {
      return;
    }

    if (
      applicationStatus == null ||
      applicationStatus === 'none' ||
      applicationStatus !== resolvedStatus
    ) {
      setApplicationStatus(resolvedStatus);
      setIsApplicationActive(
        personalDetail?.meta?.isActive ?? personalDetail?.isActive ?? true,
      );
    }
  }, [
    applicationStatus,
    applicationStatusLoading,
    applicationContextLoading,
    contextApplicationStatus,
    personalDetail,
    personalDetail?.applicationStatus,
    personalDetail?.meta?.isActive,
    personalDetail?.isActive,
  ]);

  const loadAccountNetBalance = async () => {
    if (!resolvedMembershipNumber) {
      return;
    }
    try {
      setAccountNetBalanceLoading(true);
      const res = await getAccountNetBalanceRequest(resolvedMembershipNumber);
      if (res?.status === 200 && res?.data?.data) {
        setAccountNetBalance(res.data.data);
      } else {
        setAccountNetBalance(null);
      }
    } catch (error) {
      setAccountNetBalance(null);
    } finally {
      setAccountNetBalanceLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        dispatch(validation()),
        loadProfile(),
        loadApplicationStatus(),
        loadAccountNetBalance(),
        loadCategoryData(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategoryData();
  }, [membershipCategory, categoryLookups, getCategoryData]);

  // Fetch all lookups when Dashboard loads
  useEffect(() => {
    loadProfile();
    loadLookups();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadApplicationStatus();
    }, [loadApplicationStatus]),
  );

  useEffect(() => {
    loadAccountNetBalance();
  }, [resolvedMembershipNumber, isMember]);

  useEffect(() => {
    const subscriptionStateCandidates = [
      subscriptionDetail?.subscriptionStatus,
      subscriptionDetail?.subscriptionDetails?.subscriptionStatus,
      subscriptionDetail?.subscriptionDetails?.membershipStatus,
      profileDetail?.membershipStatus,
    ];
    const normalizedStatuses = subscriptionStateCandidates
      .map(status => String(status || '').toLowerCase())
      .filter(Boolean);
    setIsResignedMember(normalizedStatuses.includes('resigned'));
  }, [subscriptionDetail, profileDetail?.membershipStatus]);

  const formatCurrency = valueInCents => {
    const currency = (
      categoryData?.currentPricing?.currency || 'EUR'
    ).toUpperCase();

    if (!valueInCents || valueInCents === 0) {
      return currency === 'EUR' ? '€0.00' : `${currency}0.00`;
    }

    const amountInEuros = valueInCents / 100;
    const currencySymbol = currency === 'EUR' ? '€' : currency;

    return `${currencySymbol}${amountInEuros.toFixed(2)}`;
  };

  const canPay = useMemo(
    () =>
      isMember &&
      !accountNetBalanceLoading &&
      categoryData?.code !== 'undergraduate_student' &&
      typeof accountNetBalance?.net === 'number' &&
      accountNetBalance.net > 0,
    [
      isMember,
      accountNetBalanceLoading,
      accountNetBalance?.net,
      categoryData?.code,
    ],
  );

  // Get payment amount based on payment type
  const getPaymentAmount = () => {
    if (!categoryData?.currentPricing?.price) return 0;
    const priceInEuros = categoryData.currentPricing.price / 100;

    // If payment type is set in subscription details
    const paymentType = subscriptionDetail?.subscriptionDetails?.paymentType;
    if (paymentType === 'deduction') {
      // Monthly payment (divide by 12 for monthly)
      return priceInEuros / 12;
    }

    // Default to annual price
    return priceInEuros;
  };

  const effectiveApplicationStatus = resolveEffectiveApplicationStatus({
    localStatus: applicationStatus,
    contextStatus: contextApplicationStatus,
    personalDetail,
  });

  const normalizedApplicationStatus = normalizeApplicationStatus(
    effectiveApplicationStatus,
  );
  const membershipCategory =
    normalizedApplicationStatus === 'processed' ||
    normalizedApplicationStatus === 'approved'
      ? subscriptionDetail?.subscriptionDetails?.membershipCategory ||
        profileDetail?.membershipCategory
      : professionalDetail?.membershipCategory;
  const isUndergraduateStudent = categoryData?.code === 'undergraduate_student';
  const isInactiveLikeStatus =
    !isApplicationActive ||
    isResignedMember ||
    normalizedApplicationStatus === 'cancelled' ||
    normalizedApplicationStatus === 'canceled' ||
    normalizedApplicationStatus === 'inactive';
  const isApplicationSubmitted = isActiveApplicationCompleteStatus(
    effectiveApplicationStatus,
    isApplicationActive,
  );
  const isApplicationTerminal =
    isApplicationSubmitted ||
    isProcessedApplicationStatus(effectiveApplicationStatus) ||
    (isApplicationActive && normalizedApplicationStatus === 'submitted');
  const isSubmittedOrApproved = isApplicationTerminal;
  // Ready once the dashboard status fetch finishes — including "none" (no application).
  // Do not gate on shared applicationContextLoading (other API calls flip that flag)
  // or exclude "none"; both left Quick Actions stuck on "Loading...".
  const isApplicationStatusReady = !applicationStatusLoading;
  const isApplicationActionDisabled =
    !isApplicationStatusReady || isApplicationTerminal;
  const shouldStartFresh =
    isInactiveLikeStatus || normalizedApplicationStatus === 'rejected';

  const navigateToApplication = () => {
    if (isApplicationActionDisabled) {
      return;
    }

    navigation.navigate(STACKS.APPLICATION_STACK, {
      screen: STACKS.APPLICATION_FORM,
      params: shouldStartFresh ? { startFresh: true } : undefined,
    });
  };

  // FAB: only when user has an application record in a non-terminal state (e.g. draft / in review / rejected).
  // Hidden when no application exists yet — Application card + status banner already start the flow.
  const hasStartedApplication = !!personalDetail?.applicationId;
  const showApplicationFab =
    hasStartedApplication &&
    !isApplicationTerminal &&
    isApplicationStatusReady &&
    !isMember;

  const applicationSubtitle = !isApplicationStatusReady
    ? 'Loading...'
    : isInactiveLikeStatus
    ? 'Start Application'
    : isProcessedApplicationStatus(effectiveApplicationStatus)
      ? 'Processed'
      : normalizedApplicationStatus === 'approved'
      ? 'Approved'
      : applicationStatus === 'in_review' ||
          normalizedApplicationStatus === 'in review'
      ? 'In Review'
      : isApplicationSubmitted
      ? 'In Review'
      : personalDetail?.applicationId
      ? 'Resume Application'
      : applicationStatus === 'rejected' ||
          normalizedApplicationStatus === 'rejected'
      ? 'Start Application'
      : 'Start Application';

  const quickActions = useMemo(() => {
    const base = [
      {
        key: 'application',
        title: 'Application',
        subtitle: applicationSubtitle,
        icon: 'document-text',
        scheme:
          (normalizedApplicationStatus === 'processed' ||
            normalizedApplicationStatus === 'approved') &&
          isApplicationActive
            ? 'green'
            : normalizedApplicationStatus === 'rejected'
            ? 'red'
            : 'blue',
        onPress: navigateToApplication,
        disabled: isApplicationActionDisabled,
      },
      ...(canAccessProfile({
        isMember,
        applicationStatus: normalizedApplicationStatus,
        isActive: personalDetail
          ? isActiveApplicationPersonalDetail(personalDetail)
          : isApplicationActive,
      })
        ? [
            {
              key: 'profile',
              title: 'My Profile',
              subtitle: 'View Profile',
              icon: 'person',
              scheme: 'purple',
              onPress: () => navigation.navigate('Profile'),
              disabled: false,
            },
          ]
        : []),
      {
        key: 'events',
        title: 'Events',
        subtitle: 'View Events',
        icon: 'calendar-outline',
        scheme: 'orange',
        onPress: () => navigation.navigate(STACKS.EVENTS_STACK),
        disabled: false,
      },
      ...(isMember && !isUndergraduateStudent
        ? [
            {
              key: 'payments',
              title: 'Payments',
              subtitle: 'Pay Now',
              icon: 'card-outline',
              scheme: 'teal',
              onPress: () => {
                if (canPay) {
                  setPaymentModalVisible(true);
                }
              },
              disabled: !canPay,
            },
          ]
        : []),
    ];
    return base;
  }, [
    normalizedApplicationStatus,
    applicationSubtitle,
    isApplicationActive,
    isApplicationSubmitted,
    shouldStartFresh,
    isApplicationTerminal,
    isApplicationStatusReady,
    applicationContextLoading,
    applicationStatusLoading,
    isMember,
    isUndergraduateStudent,
    navigation,
    canPay,
    navigateToApplication,
    personalDetail,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#F8F5ED"
        barStyle="dark-content"
        translucent={false}
      />
      <ScreenHeader showBack={false} title={`Dashboard`} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.welcomeContainer}>
          <Label style={styles.welcomeText}>
            Welcome, {user?.fullName || user?.userFullName} 👋
          </Label>
        </View>
        {/* Application Status or Payment Card - show skeleton when loading */}
        {applicationStatusLoading ? (
          <StatusCardSkeleton />
        ) : !!resolvedMembershipNumber && !isUndergraduateStudent ? (
          <DashboardPaymentCard
            accountNetBalance={accountNetBalance}
            accountNetBalanceLoading={accountNetBalanceLoading}
            formatCurrency={formatCurrency}
          />
        ) : (
          <ApplicationStatusCard
            applicationStatus={
              isInactiveLikeStatus ? 'none' : effectiveApplicationStatus
            }
            isApplicationSubmitted={isApplicationSubmitted}
            personalDetail={personalDetail}
            professionalDetail={professionalDetail}
            subscriptionDetail={subscriptionDetail}
            onStartApplication={navigateToApplication}
            onContinueApplication={navigateToApplication}
            actionsDisabled={isApplicationActionDisabled}
          />
        )}

        {/* Featured Card - full detail */}
        <FeaturedEventCard
          event={FEATURED_EVENT}
          onPress={() => setSelectedEvent(FEATURED_EVENT)}
        />

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Label style={[styles.sectionTitle, { marginBottom: 16 }]}>
            Quick Actions
          </Label>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(action => {
              const colors =
                QUICK_ACTION_COLORS[action.scheme] || QUICK_ACTION_COLORS.blue;
              return (
                <QuickActionCard
                  key={action.key}
                  title={action.title}
                  subtitle={action.subtitle}
                  icon={action.icon}
                  cardBackground={colors.cardBackground}
                  iconBackground={colors.iconBackground}
                  disabled={action.disabled}
                  onPress={action.onPress}
                />
              );
            })}
          </View>
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Label style={styles.sectionTitle}>Upcoming Events</Label>
            <TouchableOpacity
              onPress={() => navigation.navigate(STACKS.EVENTS_STACK)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {UPCOMING_EVENTS.map(event => (
            <UpcomingEventCard
              key={event.id}
              event={event}
              onPress={setSelectedEvent}
              onViewPress={setSelectedEvent}
            />
          ))}
        </View>
      </ScrollView>

      {/* FAB: continue application only after a record exists; not for brand-new "none" users */}
      {showApplicationFab && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom }]}
          onPress={navigateToApplication}
          activeOpacity={0.8}
          disabled={isApplicationActionDisabled}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Event detail modal */}
      <DetailModal
        visible={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        item={selectedEvent}
      >
        <EventDetailModalContent
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegisterPress={ev => {
            setSelectedEvent(null);
            navigation.navigate(STACKS.EVENTS_STACK, {
              screen: STACKS.EVENT_REGISTRATION,
              params: { event: getEventWithRegistrationData(ev) },
            });
          }}
        />
      </DetailModal>

      <DashboardPaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        netAmountInCents={accountNetBalance?.net ?? 0}
        onSuccess={() => {
          setPaymentModalVisible(false);
          const memberId = resolvedMembershipNumber;
          if (memberId) {
            getAccountNetBalanceRequest(memberId)
              .then(res => {
                if (res?.status === 200 && res?.data?.data) {
                  setAccountNetBalance(res.data.data);
                }
              })
              .catch(() => {});
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5A77B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipBadge: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 12,
  },
  membershipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  membershipNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#064E3B',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    // paddingTop: 16,
    // backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
});

export default DashBoard;
