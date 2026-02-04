import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, wp, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../common/screenHeader';
import Checkbox from '../../common/checkbox';
import { getEventWithRegistrationData } from '../../constants/eventData';
import { STACKS } from '../../enums/ScreenEnums';
import { useProfile } from '../../contexts/profileContext';

const EventRegistration = () => {
  const { profileDetail } = useProfile();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const event = getEventWithRegistrationData(route.params?.event);

  const [registrationType, setRegistrationType] = useState('full'); // 'full' | 'custom'
  const [selectedDays, setSelectedDays] = useState([]);

  const days = event?.days || [];
  const venue = event?.venue || event?.location || 'TBD';
  const credits = event?.credits || '—';

  const toggleDay = (day) => {
    const id = day.id;
    if (selectedDays.some((d) => d.id === id)) {
      setSelectedDays(selectedDays.filter((d) => d.id !== id));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const getTotalCost = () => {
    if (registrationType === 'full') {
      return days.reduce((sum, d) => sum + (d.price || 0), 0);
    }
    return selectedDays.reduce((sum, d) => sum + (d.price || 0), 0);
  };

  const totalCost = getTotalCost();
  const membershipNumber = profileDetail?.membershipNumber || profileDetail?.membershipId || '#12345';

  const handleRegisterAndPay = () => {
    const daysToUse = registrationType === 'full' ? days : selectedDays;
    if (registrationType === 'custom' && daysToUse.length === 0) {
      return;
    }
    if (registrationType === 'custom') {
      navigation.navigate(STACKS.EVENT_SCHEDULE_SELECTION, {
        event,
        selectedDays: daysToUse,
      });
    } else {
      navigation.navigate(STACKS.EVENT_PAYMENT, {
        event,
        selectedDays: daysToUse,
      });
    }
  };

  const canProceed = registrationType === 'full' || selectedDays.length > 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title={event?.title || 'Event Registration'} showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.membershipCard}>
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
        </View>

        <Text style={styles.sectionTitle}>Registration Options</Text>
        <View style={styles.optionTabs}>
          <TouchableOpacity
            style={[styles.optionTab, registrationType === 'full' && styles.optionTabActive]}
            onPress={() => setRegistrationType('full')}
          >
            <Text
              style={[
                styles.optionTabText,
                registrationType === 'full' && styles.optionTabTextActive,
              ]}
            >
              Full Event
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionTab, registrationType === 'custom' && styles.optionTabActive]}
            onPress={() => setRegistrationType('custom')}
          >
            <Text
              style={[
                styles.optionTabText,
                registrationType === 'custom' && styles.optionTabTextActive,
              ]}
            >
              Custom Schedule
            </Text>
          </TouchableOpacity>
        </View>

        {days.map((day) => {
          const isSelected =
            registrationType === 'full' || selectedDays.some((d) => d.id === day.id);
          return (
            <TouchableOpacity
              key={day.id}
              style={[styles.dayCard, isSelected && styles.dayCardSelected]}
              onPress={() => registrationType === 'custom' && toggleDay(day)}
              activeOpacity={0.8}
            >
              <View style={styles.dayCardContent}>
                <Checkbox
                  checked={isSelected}
                  onPress={() => registrationType === 'custom' && toggleDay(day)}
                />
                <View style={styles.dayInfo}>
                  <Text style={styles.dayTitle}>{day.title}</Text>
                  <Text style={styles.dayDate}>{day.date}</Text>
                </View>
                <Text style={styles.dayPrice}>${(day.price || 0).toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
    marginBottom: 12,
  },
  optionTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  optionTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  optionTabActive: {
    backgroundColor: '#E5E7EB',
  },
  optionTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionTabTextActive: {
    color: Colors.textPrimary,
  },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight || '#E8F0FE',
  },
  dayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayInfo: {
    flex: 1,
    marginLeft: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dayDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  dayPrice: {
    fontSize: 16,
    fontWeight: '700',
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
