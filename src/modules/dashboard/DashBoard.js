import React, { useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, TouchableOpacity, Image, Text, ImageBackground, Platform } from 'react-native';
import { Label } from '../../common/text/label';
import { Wrapper } from '../../common/wrapper';
import { SVG } from '../../assets/svg';
import { DashboardCard } from '../../common/DashboardCard';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '../../enums/ScreenEnums';
import { Colors, commonStyles, wp, hp, TEXT_STYLE } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalSvg } from 'react-native-svg/css';
import { useApplication } from '../../contexts/applicationContext';
import { applicationConfirmationRequest } from '../../api/application.api';

const DashBoard = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('User');
  const insets = useSafeAreaInsets();
  const { personalDetail } = useApplication();
  const [applicationStatus, setApplicationStatus] = useState(null);
x
  // Fetch user name from token or storage
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = await AsyncStorage.getItem('token');xq
        if (token) {
          // Decode JWT token to get user info
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decoded = JSON.parse(jsonPayload);
          
          // Extract name from token (adjust field names based on your token structure)
          const name = decoded.name || decoded.given_name || decoded.email?.split('@')[0] || 'User';
          setUserName(name.charAt(0).toUpperCase() + name.slice(1));
        }
      } catch (error) {
        console.log('Error fetching user name:', error);
        setUserName('User');
      }
    };
    
    fetchUserName();
  }, []);

  // Fetch application status
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (personalDetail?.ApplicationId) {
        try {
          console.log('📋 Checking application status for:', personalDetail.ApplicationId);
          const response = await applicationConfirmationRequest(personalDetail.ApplicationId);
          console.log('Application Status Response:', response);
          
          if (response?.status === 200 || response?.data?.status === 'success') {
            const status = response?.data?.data?.applicationStatus || response?.data?.applicationStatus;
            console.log('✅ Application status:', status);
            setApplicationStatus(status || 'submitted'); // Default to 'submitted' if no status
          } else {
            // For testing: set default status
            console.log('⚠️ No valid response, setting default status');
            setApplicationStatus('submitted');
          }
        } catch (error) {
          console.error('❌ Failed to fetch application status:', error);
          // For testing: set default status even on error
          setApplicationStatus('submitted');
        }
      } else {
        // For testing: show card even without ApplicationId
        console.log('⚠️ No ApplicationId, setting default status for testing');
        setApplicationStatus('submitted');
      }
    };

    checkApplicationStatus();
  }, [personalDetail?.ApplicationId]);

  // Get application status display info
  const getStatusInfo = (status) => {
    const statusMap = {
      'submitted': {
        label: 'Submitted',
        sublabel: 'Completed on Jan 12, 2024',
        icon: 'checkmark-circle',
        iconColor: Colors.primary,
        iconBg: '#E8F0FE',
        status: 'completed'
      },
      'in_review': {
        label: 'In Review',
        sublabel: 'Current Step',
        icon: 'reload-circle',
        iconColor: '#FFA500',
        iconBg: '#FFF4E6',
        status: 'current'
      },
      'approved': {
        label: 'Approved',
        sublabel: 'Pending',
        icon: 'lock-closed',
        iconColor: '#94A3B8',
        iconBg: '#F1F5F9',
        status: 'pending'
      },
      'pending': {
        label: 'Pending Review',
        sublabel: 'Waiting for approval',
        icon: 'time',
        iconColor: '#FFA500',
        iconBg: '#FFF4E6',
        status: 'current'
      },
      'rejected': {
        label: 'Rejected',
        sublabel: 'Please contact support',
        icon: 'close-circle',
        iconColor: '#EF4444',
        iconBg: '#FEE2E2',
        status: 'rejected'
      }
    };
    return statusMap[status] || statusMap['pending'];
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

  // Upcoming Events
  const upcomingEvents = [
    {
      id: 1,
      title: 'Networking Mixer',
      date: 'Oct 25, 7:00 PM',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&h=200&fit=crop',
      onPress: () => navigation.navigate(STACKS.EVENTS_STACK)
    },
    {
      id: 2,
      title: 'Leadership Webinar',
      date: 'Nov 2, 10:00 AM',
      image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=200&h=200&fit=crop',
      onPress: () => navigation.navigate(STACKS.EVENTS_STACK)
    },
    {
      id: 3,
      title: 'Tech Skills Workshop',
      date: 'Nov 15, 2:00 PM',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&h=200&fit=crop',
      onPress: () => navigation.navigate(STACKS.EVENTS_STACK)
    },
  ];

  return (
    <View style={styles.container}>
      {/* Sticky Header with greeting and notification */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 16 : 16 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color={Colors.white} />
          </View>
          <Text style={styles.greetingText}>Hello, {userName}!</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
        <LocalSvg width={26} height={26} asset={SVG.NOTIFICATION} fill={Colors.textPrimary} />
          {/* <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} /> */}
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Application Status Card */}
        {applicationStatus && (
          <View style={styles.statusCard}>
            <Text style={styles.statusCardTitle}>Your Application Status</Text>
            <Text style={{ fontSize: 10, color: '#999', marginBottom: 8 }}>Status: {applicationStatus}</Text>
            
            {/* Status Timeline */}
            <View style={styles.statusTimeline}>
              {/* Submitted */}
              <View style={styles.statusRow}>
                <View style={styles.statusIconContainer}>
                  <View style={[styles.statusIcon, { backgroundColor: '#E8F0FE' }]}>
                    <Text style={styles.statusEmoji}>✓</Text>
                  </View>
                  {applicationStatus !== 'submitted' && <View style={styles.statusConnector} />}
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusLabel}>Submitted</Text>
                  <Text style={styles.statusSublabel}>Completed on Jan 12, 2024</Text>
                </View>
              </View>

              {/* In Review */}
              <View style={styles.statusRow}>
                <View style={styles.statusIconContainer}>
                  <View style={[
                    styles.statusIcon,
                    { backgroundColor: applicationStatus === 'in_review' || applicationStatus === 'approved' ? '#FFF4E6' : '#F1F5F9' }
                  ]}>
                    <Text style={[
                      styles.statusEmoji,
                      { color: applicationStatus === 'in_review' || applicationStatus === 'approved' ? '#FFA500' : '#94A3B8' }
                    ]}>⟳</Text>
                  </View>
                  {applicationStatus !== 'in_review' && applicationStatus !== 'approved' && (
                    <View style={[styles.statusConnector, { backgroundColor: '#E5E5E5' }]} />
                  )}
                  {(applicationStatus === 'in_review' || applicationStatus === 'approved') && (
                    <View style={styles.statusConnector} />
                  )}
                </View>
                <View style={styles.statusContent}>
                  <Text style={[styles.statusLabel, applicationStatus === 'in_review' && { color: Colors.primary }]}>
                    In Review
                  </Text>
                  {applicationStatus === 'in_review' && (
                    <Text style={[styles.statusSublabel, { color: Colors.primary, fontWeight: '600' }]}>
                      Current Step
                    </Text>
                  )}
                </View>
              </View>

              {/* Approved */}
              <View style={styles.statusRow}>
                <View style={styles.statusIconContainer}>
                  <View style={[
                    styles.statusIcon,
                    { backgroundColor: applicationStatus === 'approved' ? '#10B981' : '#F1F5F9' }
                  ]}>
                    <Text style={[
                      styles.statusEmoji,
                      { color: applicationStatus === 'approved' ? '#FFFFFF' : '#94A3B8' }
                    ]}>{applicationStatus === 'approved' ? '✓' : '🔒'}</Text>
                  </View>
                </View>
                <View style={styles.statusContent}>
                  <Text style={[styles.statusLabel, applicationStatus === 'approved' && { color: '#10B981' }]}>
                    {applicationStatus === 'approved' ? 'Approved' : 'Approved'}
                  </Text>
                  {applicationStatus !== 'approved' && (
                    <Text style={styles.statusSublabel}>Pending</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Featured Card - Annual General Meeting */}
        <View style={styles.featuredCard}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop' }}
            style={styles.featuredImageBackground}
            imageStyle={styles.featuredImage}
          >
            <View style={styles.featuredOverlay} />
          </ImageBackground>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>Annual General Meeting Reminder</Text>
            <Text style={styles.featuredDescription}>
              Don't miss our most important meeting of the year. Register now to secure your spot.
            </Text>
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => navigation.navigate(STACKS.EVENTS_STACK)}
            >
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
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
              onPress={event.onPress}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: event.image }}
                style={styles.eventImage}
              />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{event.date}</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={event.onPress}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    margin: 20,
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
    marginBottom: 16,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  statusTimeline: {
    paddingLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  statusIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusEmoji: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statusConnector: {
    width: 2,
    height: 32,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  statusContent: {
    flex: 1,
    paddingTop: 4,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statusSublabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

export default DashBoard;