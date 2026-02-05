import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, wp, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../common/screenHeader';
import { getEventWithRegistrationData } from '../../constants/eventData';
import { STACKS } from '../../enums/ScreenEnums';
import { useProfile } from '../../contexts/profileContext';

const EventRegistration = () => {
  const { profileDetail } = useProfile();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const event = getEventWithRegistrationData(route.params?.event);

  const [selectedDays, setSelectedDays] = useState([]);

  const days = event?.days || [];
  const sessions = event?.sessions || [];
  const venue = event?.venue || event?.location || 'TBD';
  const credits = event?.credits || '—';
  const eventLocation = event?.location || venue;

  const getEventYear = () => {
    const d = event?.date;
    if (typeof d === 'string' && /\d{4}/.test(d)) {
      const match = d.match(/\d{4}/);
      return match ? match[0] : new Date().getFullYear().toString();
    }
    if (days[0]?.date && /\d{4}/.test(days[0].date)) {
      const match = days[0].date.match(/\d{4}/);
      return match ? match[0] : new Date().getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  };

  const getDaySessions = (dayId) => sessions.filter((s) => s.dayId === dayId);

  const getStartTimeFromSession = (timeStr) => {
    if (!timeStr) return '9:00 AM';
    const start = timeStr.split('-')[0]?.trim();
    if (!start) return '9:00 AM';
    const [hh, mm] = start.split(':');
    const h = parseInt(hh, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${mm || '00'} ${ampm}`;
  };

  const getDayTheme = (day) => {
    const t = day.title || '';
    const match = t.match(/^Day \d+: (.+)$/i);
    return match ? match[1] : t;
  };

  const DAY_ICONS = ['calendar-outline', 'settings-outline', 'people-outline'];

  const toggleDay = (day) => {
    const id = day.id;
    if (selectedDays.some((d) => d.id === id)) {
      setSelectedDays(selectedDays.filter((d) => d.id !== id));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const getTotalCost = () =>
    selectedDays.reduce((sum, d) => sum + (d.price || 0), 0);

  const totalCost = getTotalCost();
  const membershipNumber = profileDetail?.membershipNumber || profileDetail?.membershipId || '#12345';

  const handleRegisterAndPay = () => {
    if (selectedDays.length === 0) return;
    const isFullEvent = selectedDays.length === days.length;
    if (isFullEvent) {
      navigation.navigate(STACKS.EVENT_PAYMENT, {
        event,
        selectedDays,
      });
    } else {
      navigation.navigate(STACKS.EVENT_SCHEDULE_SELECTION, {
        event,
        selectedDays,
      });
    }
  };

  const canProceed = selectedDays.length > 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Event Registration" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerContainer}>
          {event?.image ? (
            <ImageBackground
              source={{ uri: event.image }}
              style={styles.bannerImage}
              resizeMode="cover"
            >
              <View style={styles.bannerOverlay}>
                <View style={styles.bannerContent}>
                  {event?.category ? (
                    <View style={styles.bannerTag}>
                      <Text style={styles.bannerTagText}>
                        {(event.category || '').toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.bannerTitle}>{event?.title || 'Event'}</Text>
                  <Text style={styles.bannerYear}>{getEventYear()}</Text>
                  <View style={styles.bannerLocationRow}>
                    <Ionicons name="location" size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.bannerLocation}>{eventLocation}</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          ) : (
            <View style={styles.bannerPlaceholder}>
              <View style={styles.bannerOverlay}>
                <View style={styles.bannerContent}>
                  {event?.category ? (
                    <View style={styles.bannerTag}>
                      <Text style={styles.bannerTagText}>
                        {(event.category || '').toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.bannerTitle}>{event?.title || 'Event'}</Text>
                  <Text style={styles.bannerYear}>{getEventYear()}</Text>
                  <View style={styles.bannerLocationRow}>
                    <Ionicons name="location" size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.bannerLocation}>{eventLocation}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.description}>{event?.description}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color={Colors.primary} style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Venue</Text>
            <Text style={styles.infoValue}>{venue}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Credits</Text>
            <Text style={styles.infoValue}>{credits}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* <View style={styles.membershipCard}>
          <View style={styles.membershipHeader}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.fruitSalad || '#4CAF50'} />
            <Text style={styles.membershipStatus}>Logged in as Member</Text>
          </View>
          <Text style={styles.membershipNumber}>Membership Number: {membershipNumber}</Text>
          <TouchableOpacity
            style={styles.viewProfileLink}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View> */}

        <Text style={styles.sectionTitle}>Registration Options</Text>

        <View style={styles.timelineContainer}>
          {days.map((day, index) => {
            const isSelected = selectedDays.some((d) => d.id === day.id);
            const daySessions = getDaySessions(day.id);
            const firstSessionTime = daySessions[0]?.time;
            const startTime = getStartTimeFromSession(firstSessionTime);
            const theme = getDayTheme(day);
            const dayLabel = `DAY ${String(index + 1).padStart(2, '0')}`;
            const iconName = DAY_ICONS[index % DAY_ICONS.length];

            return (
              <View key={day.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineIconCircle, isSelected && styles.timelineIconCircleSelected]}>
                    <Ionicons
                      name={iconName}
                      size={20}
                      color={isSelected ? Colors.primary : Colors.textSecondary}
                    />
                  </View>
                  {index < days.length - 1 && <View style={styles.timelineLine} />}
                </View>

                <TouchableOpacity
                  style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={styles.dayCardCheckBadge}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    </View>
                  )}
                  <View style={styles.dayCardHeader}>
                    <View style={styles.dayCardHeaderLeft}>
                      <Text style={styles.dayLabel}>{dayLabel}</Text>
                      <Text style={styles.dayTheme}>{theme}</Text>
                      <Text style={styles.dayDateTime}>
                        {day.date} • {startTime}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.selectButton, isSelected && styles.selectButtonSelected]}
                      onPress={() => toggleDay(day)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextSelected]}>
                        {isSelected ? 'Selected' : 'Select'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {daySessions.map((session, si) => (
                    <View key={si} style={styles.sessionRow}>
                      <Text style={styles.sessionTime}>{session.time}</Text>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footerBar, { paddingBottom: insets.bottom || 16 }]}>
        <View>
          <Text style={styles.footerLabel}>TOTAL COST</Text>
          <Text style={styles.footerAmount}>${totalCost.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.registerButton, !canProceed && styles.registerButtonDisabled]}
          onPress={handleRegisterAndPay}
          disabled={!canProceed}
        >
          <Text style={styles.registerButtonText}>Register & Pay</Text>
          <MaterialCommunityIcons name="credit-card" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bannerContainer: {
    width: Dimensions.get('window').width,
    marginLeft: -20,
    marginTop: -16,
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: 220,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#374151',
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerContent: {
    paddingBottom: 8,
  },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  bannerTagText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  bannerTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  bannerYear: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  bannerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  bannerLocation: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    marginLeft: 6,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  membershipCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  membershipStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  membershipNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  viewProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 16,
  },
  timelineContainer: {
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 44,
    alignItems: 'center',
  },
  timelineIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconCircleSelected: {
    backgroundColor: Colors.primaryLight || '#E8F0FE',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
    minHeight: 20,
  },
  dayCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  dayCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight || '#E8F0FE',
  },
  dayCardCheckBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayCardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  dayTheme: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dayDateTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E8F0FE',
  },
  selectButtonSelected: {
    backgroundColor: Colors.primary,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectButtonTextSelected: {
    color: Colors.white,
  },
  sessionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12,
  },
  sessionTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    minWidth: 70,
  },
  sessionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  footerAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 8,
  },
});

export default EventRegistration;
