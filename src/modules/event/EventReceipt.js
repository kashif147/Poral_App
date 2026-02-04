import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, wp, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';

const EventReceipt = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const {
    event,
    selectedDays,
    transactionId,
    totalPaid = 200,
    registrationId = '#EVT-992834',
  } = route.params || {};

  const registrationDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const billingItems =
    selectedDays?.map((d) => ({
      label: d.title,
      amount: d.price || 0,
    })) || [{ label: 'Member Early Bird Rate', amount: totalPaid }];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Event Registration Receipt - ${event?.title}\nRegistration ID: ${registrationId}\nTotal: $${Number(totalPaid).toFixed(2)}`,
        title: 'Registration Receipt',
      });
    } catch (e) {
      // User cancelled or share failed
    }
  };

  const handleSavePDF = () => {
    Alert.alert(
      'Save as PDF',
      'PDF export will be available in a future update. For now, use the share option to save this receipt.',
      [{ text: 'OK' }]
    );
  };

  const handlePrint = () => {
    Alert.alert(
      'Print Receipt',
      'Print functionality will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleBackToEvents = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'EventList' }],
    });
  };

  const qrValue = `${registrationId}|${event?.id || ''}|${transactionId || ''}`;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registration Receipt</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
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
            <Ionicons name="checkmark" size={48} color="#22C55E" />
          </View>
          <Text style={styles.successTitle}>Registration Confirmed</Text>
          <Text style={styles.successSubtitle}>
            Your spot for {event?.title || 'the event'} is secured.
          </Text>
        </View>

        <View style={styles.qrCard}>
          <View style={styles.qrWrapper}>
            <QRCode value={qrValue} size={180} color="#1A1A1A" backgroundColor="#FFFFFF" />
          </View>
          <Text style={styles.qrLabel}>ENTRY PASS QR CODE</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailsRow}>
            <View>
              <Text style={styles.detailLabel}>REGISTRATION ID</Text>
              <Text style={styles.detailValue}>{registrationId}</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={styles.detailLabel}>DATE</Text>
              <Text style={styles.detailValue}>{registrationDate}</Text>
            </View>
          </View>

          <View style={styles.dottedDivider} />

          <Text style={styles.billingLabel}>BILLING SUMMARY</Text>
          {billingItems.map((item, i) => (
            <View key={i} style={styles.billingRow}>
              <Text style={styles.billingItem}>{item.label}</Text>
              <Text style={styles.billingAmount}>${(item.amount || 0).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.billingTotalRow}>
            <Text style={styles.billingTotalLabel}>Total Amount Paid</Text>
            <Text style={styles.billingTotalAmount}>${Number(totalPaid).toFixed(2)}</Text>
          </View>

          <View style={styles.emailNote}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.emailNoteText}>
              A copy of this receipt has been sent to your email.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.pdfButton} onPress={handleSavePDF}>
          <Ionicons name="download-outline" size={22} color={Colors.white} />
          <Text style={styles.pdfButtonText}>Save as PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Ionicons name="print-outline" size={22} color={Colors.textPrimary} />
          <Text style={styles.printButtonText}>Print Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={handleBackToEvents}>
          <Text style={styles.backLinkText}>Back to My Events</Text>
        </TouchableOpacity>

        <View style={styles.venueCard}>
          {event?.image && (
            <Image
              source={{ uri: event.image }}
              style={styles.venueImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.venueInfo}>
            <Text style={styles.venueLabel}>EVENT VENUE</Text>
            <Text style={styles.venueName}>
              {event?.venue || event?.location || 'Moscone Center, SF'}
            </Text>
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  headerButton: {
    padding: 8,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  qrCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dottedDivider: {
    height: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginBottom: 16,
  },
  billingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billingItem: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  billingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  billingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  billingTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  billingTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  emailNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight || '#E8F0FE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emailNoteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  pdfButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginLeft: 8,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  venueCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  venueImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  venueInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  venueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default EventReceipt;
