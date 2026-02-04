import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, wp, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { STACKS } from '../../enums/ScreenEnums';

const DAY_ICONS = {
  calendar: 'calendar-outline',
  settings: 'settings-outline',
  people: 'people-outline',
};

const ScheduleSelection = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { event, selectedDays: initialSelectedDays } = route.params || {};

  const eventData = event || {};
  const days = eventData.days || [];
  const sessions = eventData.sessions || [];

  const [selectedDays, setSelectedDays] = useState(
    initialSelectedDays?.map((d) => d.id) || []
  );

  const toggleDay = (day) => {
    const id = day.id;
    if (selectedDays.includes(id)) {
      setSelectedDays(selectedDays.filter((d) => d !== id));
    } else {
      setSelectedDays([...selectedDays, id]);
    }
  };

  const getSessionsForDay = (dayId) =>
    sessions.filter((s) => s.dayId === dayId);

  const getTotalCost = () => {
    return days
      .filter((d) => selectedDays.includes(d.id))
      .reduce((sum, d) => sum + (d.price || 0), 0);
  };

  const selectedDaysData = days.filter((d) => selectedDays.includes(d.id));
  const totalCost = getTotalCost();

  const handleContinue = () => {
    if (selectedDaysData.length === 0) return;
    navigation.navigate(STACKS.EVENT_PAYMENT, {
      event: eventData,
      selectedDays: selectedDaysData,
    });
  };

  const dayIcons = ['calendar', 'settings', 'people'];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 140 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <Image
            source={{ uri: eventData.image }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerContent}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>
                {(eventData.category || 'CONFERENCE').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.bannerTitle}>{eventData.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color={Colors.white} />
              <Text style={styles.locationText}>{eventData.location || eventData.venue}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select Your Schedule</Text>
          <Text style={styles.sectionDescription}>
            Personalize your experience by choosing the days you'd like to attend.
            Each day offers unique tracks and workshops.
          </Text>

          <View style={styles.timeline}>
            {days.map((day, index) => {
              const isSelected = selectedDays.includes(day.id);
              const daySessions = getSessionsForDay(day.id);
              const iconName = dayIcons[index % dayIcons.length];
              return (
                <View key={day.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineIcon}>
                      <Ionicons
                        name={DAY_ICONS[iconName] || 'calendar-outline'}
                        size={20}
                        color={Colors.white}
                      />
                    </View>
                    {index < days.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={[styles.dayCard, isSelected && styles.dayCardSelected]}>
                    <View style={styles.dayCardHeader}>
                      <View>
                        <Text style={styles.dayLabel}>DAY {String(index + 1).padStart(2, '0')}</Text>
                        <Text style={styles.dayTitle}>{day.title}</Text>
                        <Text style={styles.dayDate}>{day.date}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.selectButton, isSelected && styles.selectButtonSelected]}
                        onPress={() => toggleDay(day)}
                      >
                        <Text
                          style={[
                            styles.selectButtonText,
                            isSelected && styles.selectButtonTextSelected,
                          ]}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {daySessions.map((session, si) => (
                      <View key={si} style={styles.sessionRow}>
                        <Text
                          style={[
                            styles.sessionTime,
                            isSelected && styles.sessionTimeSelected,
                          ]}
                        >
                          {session.time}
                        </Text>
                        <Text style={styles.sessionTitle}>{session.title}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footerBar, { paddingBottom: insets.bottom || 20 }]}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Registration Summary</Text>
          <Text style={styles.footerSummary}>
            {selectedDaysData.length} Day{selectedDaysData.length !== 1 ? 's' : ''} Selected
          </Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.footerLabel}>Total Cost</Text>
          <Text style={styles.footerAmount}>${totalCost.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedDaysData.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedDaysData.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue Registration</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  banner: {
    height: hp(28),
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bannerContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: Colors.white,
    marginLeft: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    marginTop: -24,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 44,
    alignItems: 'center',
  },
  timelineIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.divider,
    marginTop: 8,
  },
  dayCard: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dayCardSelected: {
    borderColor: Colors.primary,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  selectButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    marginBottom: 12,
  },
  sessionTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  sessionTimeSelected: {
    color: Colors.primary,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerLeft: {
    marginBottom: 8,
  },
  footerRight: {
    marginBottom: 8,
  },
  footerLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  footerSummary: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  footerAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 8,
  },
});

export default ScheduleSelection;
