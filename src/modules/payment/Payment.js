import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Colors } from '../../utils/Styles';
import { useProfile } from '../../contexts/profileContext';
import { getAccountStatementRequest } from '../../api/account.api';
import { formatToDDMMYYYY } from '../../helpers/date.helper';
import ScreenHeader from '../../common/screenHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Payment = () => {
  const { profileDetail, getProfileDetail } = useProfile();
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const memberId = profileDetail?.membershipNumber;
  const txns = statementData?.txns ?? [];

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
    const rawAmount = txn.amount ?? txn.total ?? 0;
    const amount = typeof rawAmount === 'number' && rawAmount > 100 ? rawAmount / 100 : rawAmount;
    const status = txn.status || 'Paid';

    return (
      <View style={styles.statementCard}>
        <View style={styles.statementRow}>
          <Text style={styles.statementDate}>{dateStr}</Text>
          <Text style={styles.statementAmount}>{formatCurrency(amount)}</Text>
        </View>
        <Text style={styles.statementDescription} numberOfLines={2}>
          {description}
        </Text>
        <View style={styles.statementRow}>
          <Text style={styles.statementStatus}>{status}</Text>
        </View>
      </View>
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

    if (!txns.length) {
      return renderEmptyState('No transactions found.');
    }

    return (
      <FlatList
        data={txns}
        keyExtractor={(item, index) => item.id || item.key || `txn-${index}`}
        renderItem={renderStatementItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  statementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginTop: 6,
    marginBottom: 6,
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
