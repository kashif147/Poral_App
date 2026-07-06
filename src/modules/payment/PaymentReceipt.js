import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../utils/Styles';

const PaymentReceipt = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const { receipt } = route.params || {};

  const memberName = receipt?.memberName || 'Member';
  const membershipNumber = receipt?.membershipNumber || 'N/A';
  const date = receipt?.date || new Date().toLocaleDateString();
  const description = receipt?.description || 'Subscription Payment';
  const statusLabel = receipt?.statusLabel || 'Payment record';
  const isCompletedPayment = statusLabel === 'Payment completed';
  const amount = typeof receipt?.amountInEuros === 'number'
    ? receipt.amountInEuros
    : 0;

  const handleShare = async () => {
    try {
      const message = `Payment Receipt\n\nName: ${memberName}\nMembership No: ${membershipNumber}\nDate: ${date}\nDescription: ${description}\nAmount: €${amount.toFixed(
        2,
      )}`;
      await Share.share({
        message,
        title: 'Payment Receipt',
      });
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Receipt</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.headerButton}
        >
          <Ionicons
            name="share-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color="#22C55E" />
          </View>
          <Text style={styles.successTitle}>{statusLabel}</Text>
          <Text style={styles.successSubtitle}>
            {isCompletedPayment
              ? 'Your membership payment has been completed.'
              : 'This payment has been recorded on your account.'}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionLabel}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>
                {isCompletedPayment ? 'Amount Paid' : 'Amount'}
              </Text>
              <Text style={styles.summaryAmount}>
                €{amount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{date}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Member Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{memberName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membership No.</Text>
            <Text style={styles.infoValue}>{membershipNumber}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Payment Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{description}</Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.noteText}>
            A full PDF receipt is available on the web portal under Payments.
          </Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 16,
    flex: 1,
    textAlign: 'right',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight || '#E8F0FE',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
});

export default PaymentReceipt;

