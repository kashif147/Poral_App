import React from 'react';
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
import { STACKS } from '../../enums/ScreenEnums';

const EventConfirmation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const {
    event,
    selectedDays,
    transactionId = 'GTS-99201-B',
    totalPaid = 299,
  } = route.params || {};

  const daySummary =
    selectedDays?.length > 1
      ? `Day ${selectedDays.map((_, i) => i + 1).join(' & Day ')} Access`
      : selectedDays?.[0]?.title || 'Full Event Access';

  const handleDownloadReceipt = () => {
    navigation.navigate(STACKS.EVENT_RECEIPT, {
      event,
      selectedDays,
      transactionId,
      totalPaid,
      registrationId: `#EVT-${Date.now().toString().slice(-6)}`,
    });
  };

  const handleBackToEvents = () => {
    navigation.getParent()?.navigate('Event');
    navigation.reset({
      index: 0,
      routes: [{ name: 'EventList' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={handleBackToEvents} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={56} color="#22C55E" />
          </View>
          <Text style={styles.successTitle}>Payment Successful</Text>
          <Text style={styles.transactionId}>
            Transaction ID: #{transactionId}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Registration Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryEventTitle}>
              {event?.title || 'Global Tech Summit 2024'}
            </Text>
            <Text style={styles.summaryDays}>{daySummary}</Text>
            <Text style={styles.summaryLabel}>TOTAL PAID</Text>
            <Text style={styles.summaryAmount}>${Number(totalPaid).toFixed(2)}</Text>
          </View>
          {event?.image && (
            <Image
              source={{ uri: event.image }}
              style={styles.summaryImage}
              resizeMode="cover"
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>What's Next</Text>

        <View style={styles.nextCard}>
          <View style={styles.nextIcon}>
            <Ionicons name="mail" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.nextText}>
            We've sent a confirmation email with your digital ticket and event
            details to your registered email.
          </Text>
        </View>

        <View style={styles.nextCard}>
          <View style={styles.nextIcon}>
            <Ionicons name="star" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.nextText}>
            Your {event?.credits || '12'} CPD credits will be automatically added
            to your profile once your attendance is verified at the event.
          </Text>
        </View>

        <View style={styles.mapPlaceholder}>
          <View style={styles.mapPin}>
            <Ionicons name="location" size={24} color={Colors.primary} />
            <Text style={styles.mapPinText}>
              {event?.venue || event?.location || 'MOSCONE CENTER, SF'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadReceipt}
        >
          <Ionicons name="download-outline" size={22} color={Colors.white} />
          <Text style={styles.downloadButtonText}>Download Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToEvents}
        >
          <Text style={styles.backButtonText}>Back to My Events</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  transactionId: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryContent: {
    flex: 1,
  },
  summaryEventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  summaryDays: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  summaryImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  nextCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  nextIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight || '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nextText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapPinText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.background,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginLeft: 8,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

export default EventConfirmation;
