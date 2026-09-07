import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { STACKS } from '../../enums/ScreenEnums';
import { Colors } from '../../utils/Styles';
import { getStatusColor, getStatusBg } from '../../utils/status.utils';
import { CASE_FILTERS } from '../../constants/queriesCases';
import ScreenHeader from '../../common/screenHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchMyPortalIssues } from '../../api/issue.api';
import {
  getIssueApiErrorMessage,
  isIssueApiSuccess,
  mapPortalIssueToListItem,
  parseIssuesListResponse,
} from '../../helpers/issues.helper';

const QueriesCases = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [loadError, setLoadError] = useState('');

  const loadIssues = useCallback(async () => {
    try {
      const response = await fetchMyPortalIssues();
      if (isIssueApiSuccess(response)) {
        setIssues(
          parseIssuesListResponse(response).map(mapPortalIssueToListItem),
        );
        setLoadError('');
      } else {
        setIssues([]);
        setLoadError(
          getIssueApiErrorMessage(response, 'Failed to load complaints'),
        );
      }
    } catch (error) {
      setIssues([]);
      setLoadError('Failed to load complaints');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const init = async () => {
        setLoading(true);
        await loadIssues();
        if (active) setLoading(false);
      };
      init();
      return () => {
        active = false;
      };
    }, [loadIssues]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIssues();
    setRefreshing(false);
  };

  const openCount = useMemo(
    () =>
      issues.filter(i =>
        String(i.status || '')
          .toLowerCase()
          .includes('open'),
      ).length,
    [issues],
  );

  const filteredData = useMemo(
    () =>
      issues.filter(item => {
        const matchesFilter =
          selectedFilter === 'All' || item.status === selectedFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          item.subject.toLowerCase().includes(query) ||
          String(item.id).toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
      }),
    [issues, searchQuery, selectedFilter],
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate(STACKS.CASE_DETAIL, { issueId: item.id })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.caseId} numberOfLines={1}>
          {item.subject}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description || 'No description provided.'}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Queries & Cases" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="help-circle-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statLabel}>Total Cases</Text>
            <Text style={styles.statValue}>{issues.length}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.statLabel}>Open / Active</Text>
            <Text style={[styles.statValue, { color: '#D97706' }]}>
              {openCount}
            </Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.statLabel}>Resolved</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>
              {issues.length - openCount}
            </Text>
          </View>
        </View>

        {/* <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={20}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search complaints..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View> */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CASE_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Submitted Cases</Text>
          <Text style={styles.listCount}>{filteredData.length} total</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loadError || 'No complaints or cases found.'}
            </Text>
          </View>
        ) : (
          filteredData.map(item => (
            <View key={String(item.id)}>{renderItem({ item })}</View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate(STACKS.CREATE_CASE)}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  banner: {
    backgroundColor: Colors.white || '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerGlow: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  bannerButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white || '#FFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white || '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filterRow: {
    paddingBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  listCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  loader: {
    marginTop: 40,
  },
  card: {
    backgroundColor: Colors.cardBackground || '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  caseId: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default QueriesCases;
