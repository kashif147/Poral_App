import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../utils/Styles';
import { useProfile } from '../../contexts/profileContext';
import { getAccountStatementRequest } from '../../api/account.api';
import { formatToDDMMYYYY } from '../../helpers/date.helper';
import { getSettlementStatusMemberLabel } from '../../helpers/paymentIntent.helper';
import ScreenHeader from '../../common/screenHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const Payment = () => {
  const { profileDetail, getProfileDetail } = useProfile();
  const navigation = useNavigation();
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const memberId = profileDetail?.membershipNumber;
  const txns = statementData?.txns ?? [];
  const filteredTxns = txns.filter(
    txn => String(txn.docType || '').toLowerCase() !== 'invoice',
  );

  const getTxnAmountInCents = txn => {
    if (!txn) return 0;

    if (typeof txn.amount === 'number') return Math.abs(txn.amount);
    if (typeof txn.total === 'number') return Math.abs(txn.total);

    const entries = Array.isArray(txn.entries) ? txn.entries : [];
    if (!entries.length) return 0;

    const memberIdForEntries = statementData?.memberId || memberId;
    const relevant = memberIdForEntries
      ? entries.filter(e => e.memberId === memberIdForEntries)
      : entries;

    if (!relevant.length) return 0;

    const net = relevant.reduce((sum, e) => {
      const amount = typeof e.amount === 'number' ? e.amount : 0;
      if (!amount) return sum;
      return sum + (e.dc === 'C' ? -amount : amount);
    }, 0);

    return Math.abs(net);
  };

  const fetchStatement = useCallback(() => {
    if (!memberId) {
      return;
    }
    setStatementLoading(true);
    getAccountStatementRequest(memberId)
      .then(res => {
        if (res?.status === 200) {
          const data = res.data?.data || res.data;
          setStatementData(
            data && typeof data === 'object' ? data : { memberId, txns: [] },
          );
        } else {
          setStatementData({ memberId, txns: [] });
        }
      })
      .catch(() => {
        setStatementData({ memberId, txns: [] });
      })
      .finally(() => {
        setStatementLoading(false);
      });
  }, [memberId]);

  useEffect(() => {
    getProfileDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const formatCurrency = value => {
    try {
      return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR',
      }).format(value ?? 0);
    } catch {
      return `€${(value ?? 0).toFixed(2)}`;
    }
  };

  const renderStatementItem = ({ item: txn, index }) => {
    const dateStr = formatToDDMMYYYY(txn.date || txn.transactionDate) || 'N/A';
    const description =
      txn.description || txn.type || txn.descriptionLabel || 'Transaction';
    const amountInCents = getTxnAmountInCents(txn);
    const amountInEuros = amountInCents / 100;

    const handlePress = () => {
      const rawStatus = txn.settlement?.status || txn.status || 'PENDING';
      const receiptPayload = {
        memberName: profileDetail?.fullName || profileDetail?.userFullName,
        membershipNumber: profileDetail?.membershipNumber,
        date: dateStr,
        description,
        amountInEuros,
        statusLabel: getSettlementStatusMemberLabel(rawStatus),
        rawTxn: txn,
      };
      navigation.navigate('PaymentReceipt', { receipt: receiptPayload });
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={styles.statementCard}
      >
        <View style={styles.statementRow}>
          <View style={styles.statementLeft}>
            <Text style={styles.statementDate}>{dateStr}</Text>
            <Text style={styles.statementDescription} numberOfLines={2}>
              {description}
            </Text>
          </View>
          <View style={styles.amountPill}>
            <Text style={styles.statementAmount}>
              {formatCurrency(amountInEuros)}
            </Text>
          </View>
        </View>
        <View style={styles.statementFooterRow}>
          <Text style={styles.tapForDetailsText}>Tap to view receipt</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (message) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>{message}</Text>
    </View>
  );

  const renderContent = () => {
    if (statementLoading && !statementData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      );
    }

    if (!memberId) {
      return renderEmptyState('Member account required to view statements.');
    }

    return (
      <FlatList
        data={filteredTxns}
        keyExtractor={(item, index) => item.id || item.key || `txn-${index}`}
        renderItem={renderStatementItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState('No transactions found.')}
        refreshing={statementLoading}
        onRefresh={fetchStatement}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      <ScreenHeader title="Payment" />
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  statementCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  statementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statementFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statementLeft: {
    flex: 1,
    paddingRight: 12,
  },
  statementDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statementAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  statementDescription: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  amountPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Colors.primary + '11',
    minWidth: 90,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tapForDetailsText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statementStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: Colors.textPrimary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default Payment;
