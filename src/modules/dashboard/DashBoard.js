import React, { useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, TouchableOpacity, Image, Text, ImageBackground, Platform } from 'react-native';
import { Label } from '../../common/text/label';
import { Wrapper } from '../../common/wrapper';
import { DashboardCard } from '../../common/DashboardCard';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '../../enums/ScreenEnums';
import { Colors, commonStyles, wp, hp, TEXT_STYLE } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import { applicationConfirmationRequest } from '../../api/application.api';
import { getAccountNetBalanceRequest } from '../../api/account.api';
import { useProfile } from '../../contexts/profileContext';
import ScreenHeader from '../../common/screenHeader';
import { useSelector } from 'react-redux';
import DetailModal from '../../common/detailModal';
import { getEventWithRegistrationData } from '../../constants/eventData';
import { useMemberRole } from '../../hooks/useMemberRole';
import DashboardPaymentModal from './DashboardPaymentModal';

const DashBoard = () => {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);
  const { isMember } = useMemberRole();
  const [userName, setUserName] = useState('User');
  const insets = useSafeAreaInsets();
  const { personalDetail, subscriptionDetail, professionalDetail } = useApplication();
  const { fetchAllLookups } = useLookup();
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [accountNetBalance, setAccountNetBalance] = useState(null);
  const [accountNetBalanceLoading, setAccountNetBalanceLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const { getProfileDetail, profileDetail } = useProfile();
  const { getCategoryData, categoryData } = useApplication();
  
  // Match web: use subscriptionDetails.membershipCategory when available, then profile
  const membershipCategory = applicationStatus === 'approved'
    ? (subscriptionDetail?.subscriptionDetails?.membershipCategory || profileDetail?.membershipCategory)
    : professionalDetail?.membershipCategory;
  const { categoryLookups } = useLookup();

  useEffect(() => {
    if (membershipCategory) {
      getCategoryData(membershipCategory, categoryLookups || []);
    }
  }, [membershipCategory, categoryLookups, getCategoryData]);



  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;    
        setUserName(userData?.userFirstName || user?.firstName);
      } catch (error) {
        setUserName('User');
      }
    };
    fetchUserName();
  }, []);

  // Fetch all lookups when Dashboard loads
  useEffect(() => {
    const initializeLookups = async () => {
      try {
        await fetchAllLookups?.();
      } catch (error) {
        // Silently handle errors
      }
    };

    initializeLookups();
  }, []);

  // Fetch application status
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (personalDetail?.applicationId) {
        try {
          const response = await applicationConfirmationRequest(personalDetail.applicationId);
          console.log('response status=======>',response)
          if (response?.status === 200 || response?.data?.status === 'success') {
            const status = response?.data?.data?.applicationStatus || response?.data?.applicationStatus;
            console.log('statue=======>',status)
            setApplicationStatus(status || 'submitted'); // Default to 'submitted' if no status
          } else {
            setApplicationStatus('submitted');
          }
        } catch (error) {
          setApplicationStatus('submitted');
        }
      } else {
        setApplicationStatus('submitted');
      }
    };

    checkApplicationStatus();
  }, [personalDetail?.applicationId]);

  useEffect(() => {
    const memberId = profileDetail?.membershipNumber;
    if (!memberId || !isMember) return;

    setAccountNetBalanceLoading(true);
    getAccountNetBalanceRequest(memberId)
      .then(res => {
        if (res?.status === 200 && res?.data?.data) {
          setAccountNetBalance(res.data.data);
        } else {
          setAccountNetBalance(null);
        }
      })
      .catch(() => setAccountNetBalance(null))
      .finally(() => setAccountNetBalanceLoading(false));
  }, [profileDetail?.membershipNumber, isMember]);

  const formatCurrency = value => {
    const currency = (
      categoryData?.currentPricing?.currency || 'EUR'
    ).toUpperCase();
    try {
      return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency,
      }).format(value || 0);
    } catch {
      return `€${(value || 0).toFixed(2)}`;
    }
  };

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

  // Quick Links - 2x2 grid
  const quickLinks = [
    { 
      key: 'directory', 
      title: 'Member Directory', 
      icon: 'account-group',
      iconType: 'MaterialCommunityIcons',
      iconColor: '#5A8DEE',
      backgroundColor: '#E8F0FE',
      onPress: () => navigation.navigate('Directory')
    },
    { 
      key: 'resources', 
      title: 'Resources', 
      icon: 'folder-open',
      iconType: 'MaterialCommunityIcons',
      iconColor: '#5A8DEE',
      backgroundColor: '#E8F0FE',
      onPress: () => navigation.navigate('Resources')
    },
    { 
      key: 'profile', 
      title: 'My Profile', 
      icon: 'account',
      iconType: 'MaterialCommunityIcons',
      iconColor: '#5A8DEE',
      backgroundColor: '#E8F0FE',
      onPress: () => navigation.navigate('Profile')
    },
    { 
      key: 'contact', 
      title: 'Contact Us', 
      icon: 'email',
      iconType: 'MaterialCommunityIcons',
      iconColor: '#5A8DEE',
      backgroundColor: '#E8F0FE',
      onPress: () => console.log('Contact Us')
    },
  ];

  // Featured event (full detail)
  const featuredEvent = {
    id: 1,
    title: 'Annual General Meeting Reminder',
    date: 'Dec 15, 2024',
    time: '10:00 AM - 2:00 PM',
    location: 'Convention Center, Downtown',
    category: 'Meeting',
    description: 'Don\'t miss our most important meeting of the year. Register now to secure your spot.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    attendees: 250,
    status: 'available',
  };

  // Upcoming Events (full detail)
  const upcomingEvents = [
    {
      id: 2,
      title: 'Networking Mixer',
      date: 'Oct 25, 2024',
      time: '7:00 PM - 10:00 PM',
      location: 'Grand Hotel Ballroom',
      category: 'Networking',
      description: 'Connect with industry professionals and expand your network in a relaxed atmosphere.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&h=200&fit=crop',
      attendees: 180,
      status: 'available',
    },
    {
      id: 3,
      title: 'Leadership Webinar',
      date: 'Nov 2, 2024',
      time: '10:00 AM - 12:00 PM',
      location: 'Online',
      category: 'Webinar',
      description: 'Learn from industry leaders about effective leadership strategies and team management.',
      image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=200&h=200&fit=crop',
      attendees: 320,
      status: 'available',
    },
    {
      id: 4,
      title: 'Tech Skills Workshop',
      date: 'Nov 15, 2024',
      time: '2:00 PM - 5:00 PM',
      location: 'Tech Hub, Innovation Center',
      category: 'Workshop',
      description: 'Hands-on workshop covering the latest technologies and development practices.',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&h=200&fit=crop',
      attendees: 45,
      status: 'available',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'registered': return { bg: '#D1FAE5', text: '#059669' };
      case 'available': return { bg: '#DBEAFE', text: '#2563EB' };
      case 'waitlist': return { bg: '#FEF3C7', text: '#D97706' };
      case 'completed': return { bg: '#F3F4F6', text: '#6B7280' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'registered': return 'Registered';
      case 'available': return 'Register Now';
      case 'waitlist': return 'Waitlist';
      case 'completed': return 'Completed';
      default: return 'Available';
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader showBack={false} title={`Dashboard`} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.welcomeContainer}>
           <Text style={styles.welcomeText}>Welcome, {userName || user?.firstName} 👋</Text>
        </View>
        {/* Application Status or Payment Card - show payment only when approved AND member */}
        {applicationStatus === 'approved' && isMember ? (
           <View style={styles.paymentCard}>
             <View style={styles.paymentCardHeader}>
                <Text style={styles.paymentCardTitle}>Payments & Billing</Text>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                </TouchableOpacity>
             </View>
             
             <View style={styles.paymentCardContent}>
                {accountNetBalance?.year && (
                  <Text style={styles.paymentLabel}>Net Balance ({accountNetBalance.year})</Text>
                )}
                {accountNetBalanceLoading ? (
                  <Text style={styles.paymentAmount}>Loading...</Text>
                ) : (
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(accountNetBalance?.net ?? 0)}
                  </Text>
                )}
             </View>

             <View style={styles.membershipContainer}>
                 <Text style={styles.membershipLabel}>MEMBERSHIP NO</Text>
                 <Text style={styles.membershipValue}>{profileDetail?.membershipNumber || 'N/A'}</Text>
             </View>

             <TouchableOpacity
               style={styles.payNowButton}
               onPress={() => setPaymentModalVisible(true)}
               activeOpacity={0.8}
             >
               <Text style={styles.payNowButtonText}>Pay Now</Text>
             </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardTitle}>Application Status</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: applicationStatus === 'approved' ? '#D1FAE5' : applicationStatus === 'in_review' ? '#FEF3C7' : '#DBEAFE' }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: applicationStatus === 'approved' ? '#059669' : applicationStatus === 'in_review' ? '#D97706' : '#2563EB' }
                ]}>
                  {applicationStatus === 'approved' ? 'Approved' : applicationStatus === 'in_review' ? 'In Review' : 'Submitted'}
                </Text>
              </View>
            </View>
            
            {/* Compact Status Timeline */}
            <View style={styles.statusTimeline}>
              {/* Submitted */}
              <View style={styles.statusStep}>
                <View style={[
                  styles.statusIcon,
                  { backgroundColor: '#E8F0FE', borderColor: Colors.primary, borderWidth: 2 }
                ]}>
                  <Ionicons name="checkmark" size={14} color={Colors.primary} />
                </View>
                <View style={styles.statusStepContent}>
                  <Text style={styles.statusStepLabel}>Submitted</Text>
                </View>
              </View>

              {/* Connector 1 */}
              <View style={styles.statusConnectorContainer}>
                <View style={[
                  styles.statusConnector,
                  { backgroundColor: (applicationStatus === 'in_review' || applicationStatus === 'approved') ? Colors.primary : '#E5E7EB' }
                ]} />
              </View>

              {/* In Review */}
              <View style={styles.statusStep}>
                <View style={[
                  styles.statusIcon,
                  { 
                    backgroundColor: applicationStatus === 'in_review' || applicationStatus === 'approved' ? '#FFF4E6' : '#F1F5F9',
                    borderColor: applicationStatus === 'in_review' || applicationStatus === 'approved' ? '#FFA500' : '#E5E7EB',
                    borderWidth: applicationStatus === 'in_review' || applicationStatus === 'approved' ? 2 : 1
                  }
                ]}>
                  <Ionicons 
                    name="time-outline" 
                    size={14} 
                    color={applicationStatus === 'in_review' || applicationStatus === 'approved' ? '#FFA500' : '#94A3B8'} 
                  />
                </View>
                <View style={styles.statusStepContent}>
                  <Text style={[
                    styles.statusStepLabel,
                    (applicationStatus === 'in_review' || applicationStatus === 'approved') && { color: '#FFA500', fontWeight: '600' }
                  ]}>
                    In Review
                  </Text>
                </View>
              </View>

              {/* Connector 2 */}
              <View style={styles.statusConnectorContainer}>
                <View style={[
                  styles.statusConnector,
                  { backgroundColor: applicationStatus === 'approved' ? Colors.primary : '#E5E7EB' }
                ]} />
              </View>

              {/* Approved */}
              <View style={styles.statusStep}>
                <View style={[
                  styles.statusIcon,
                  { 
                    backgroundColor: applicationStatus === 'approved' ? '#D1FAE5' : '#F1F5F9',
                    borderColor: applicationStatus === 'approved' ? '#10B981' : '#E5E7EB',
                    borderWidth: applicationStatus === 'approved' ? 2 : 1
                  }
                ]}>
                  {applicationStatus === 'approved' ? (
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  ) : (
                    <Ionicons name="lock-closed-outline" size={14} color="#94A3B8" />
                  )}
                </View>
                <View style={styles.statusStepContent}>
                  <Text style={[
                    styles.statusStepLabel,
                    applicationStatus === 'approved' && { color: '#10B981', fontWeight: '600' }
                  ]}>
                    Approved
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Featured Card - full detail */}
        <TouchableOpacity
          style={styles.featuredCard}
          activeOpacity={1}
          onPress={() => setSelectedEvent(featuredEvent)}
        >
          <ImageBackground
            source={{ uri: featuredEvent.image }}
            style={styles.featuredImageBackground}
            imageStyle={styles.featuredImage}
          >
            <View style={styles.featuredOverlay} />
          </ImageBackground>
          <View style={styles.featuredContent}>
            {featuredEvent.category && (
              <View style={styles.featuredCategory}>
                <Text style={styles.featuredCategoryText}>{featuredEvent.category}</Text>
              </View>
            )}
            <Text style={styles.featuredTitle}>{featuredEvent.title}</Text>
            <View style={styles.featuredDetails}>
              <View style={styles.featuredDetailRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.featuredDetailText}>{featuredEvent.date}</Text>
              </View>
              <View style={styles.featuredDetailRow}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.featuredDetailText}>{featuredEvent.time}</Text>
              </View>
              <View style={styles.featuredDetailRow}>
                <Ionicons
                  name={featuredEvent.location === 'Online' ? 'videocam-outline' : 'location-outline'}
                  size={14}
                  color={Colors.textSecondary}
                />
                <Text style={styles.featuredDetailText} numberOfLines={1}>{featuredEvent.location}</Text>
              </View>
            </View>
            <Text style={styles.featuredDescription} numberOfLines={2}>
              {featuredEvent.description}
            </Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate(STACKS.EVENTS_STACK, {
                  screen: STACKS.EVENT_REGISTRATION,
                  params: { event: getEventWithRegistrationData(featuredEvent) },
                });
              }}
            >
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Quick Links Section */}
        <View style={styles.section}>
          <Text style={{...styles.sectionTitle,marginBottom: 16}}>Quick Links</Text>
          <View style={styles.quickLinksGrid}>
            {quickLinks.map((link) => (
              <TouchableOpacity
                key={link.key}
                style={styles.quickLinkCard}
                onPress={link.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickLinkIconContainer, { backgroundColor: link.backgroundColor }]}>
                  <MaterialCommunityIcons name={link.icon} size={28} color={link.iconColor} />
                </View>
                <Text style={styles.quickLinkText}>{link.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate(STACKS.EVENTS_STACK)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => setSelectedEvent(event)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: event.image }}
                style={styles.eventImage}
                resizeMode="cover"
              />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventDetailRow}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.eventDetailText}>{event.date}</Text>
                </View>
                <View style={styles.eventDetailRow}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.eventDetailText}>{event.time}</Text>
                </View>
                <View style={styles.eventDetailRow}>
                  <Ionicons
                    name={event.location === 'Online' ? 'videocam-outline' : 'location-outline'}
                    size={14}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.eventDetailText} numberOfLines={1}>{event.location}</Text>
                </View>
                {event.description ? (
                  <Text style={styles.eventDescription} numberOfLines={1}>{event.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button - hide when application is approved */}
      {applicationStatus !== 'approved' && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom }]}
          onPress={() => navigation.navigate(STACKS.APPLICATION_STACK)}
          activeOpacity={0.8}
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
        <View style={styles.modalDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{selectedEvent?.date}</Text>
              <Text style={styles.detailSubValue}>{selectedEvent?.time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons
                name={selectedEvent?.location === 'Online' ? 'videocam' : 'location'}
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{selectedEvent?.location}</Text>
            </View>
          </View>

          {selectedEvent?.attendees != null && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <MaterialCommunityIcons name="account-group" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Attendance</Text>
                <Text style={styles.detailValue}>{selectedEvent?.attendees} registered</Text>
                <View style={[
                  styles.modalStatusBadge,
                  { backgroundColor: selectedEvent ? getStatusColor(selectedEvent.status).bg : 'transparent' }
                ]}>
                  <Text style={[
                    styles.modalStatusBadgeText,
                    { color: selectedEvent ? getStatusColor(selectedEvent.status).text : '#000' }
                  ]}>
                    {selectedEvent ? getStatusLabel(selectedEvent.status) : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {selectedEvent?.status === 'available' && (
            <TouchableOpacity
              style={styles.modalRegisterButton}
              onPress={() => {
                setSelectedEvent(null);
                navigation.navigate(STACKS.EVENTS_STACK, {
                  screen: STACKS.EVENT_REGISTRATION,
                  params: { event: getEventWithRegistrationData(selectedEvent) },
                });
              }}
            >
              <Text style={styles.registerButtonText}>Register Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </DetailModal>

      <DashboardPaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={() => {
          setPaymentModalVisible(false);
          const memberId = profileDetail?.membershipNumber;
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
  featuredCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredImageBackground: {
    width: '100%',
    height: 160,
  },
  featuredImage: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  featuredCategory: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  featuredCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  featuredDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  featuredDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  featuredDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    maxWidth: 140,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
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
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickLinkCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickLinkIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  eventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  eventDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  viewButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  viewButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusCard: {
    margin: 20,
    marginTop: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statusStep: {
    flex: 1,
    alignItems: 'center',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusStepContent: {
    alignItems: 'center',
  },
  statusStepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statusConnectorContainer: {
    width: 20,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -4,
  },
  statusConnector: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.primary,
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
  paymentCard: {
    marginHorizontal: 20,
    marginVertical: 10,

    backgroundColor: '#3B82F6', // Blue shade matching "wallet" feel
    borderRadius: 16,
    padding: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 16,
  },
  paymentCardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  paymentCardContent: {
    // marginBottom: 20,
  },
  paymentLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  paymentAmount: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  membershipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  membershipLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '600',
    marginRight: 8,
    textTransform: 'uppercase',
  },
  membershipValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  payNowButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  payNowButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
  detailSubValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  modalStatusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalRegisterButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
});

export default DashBoard;