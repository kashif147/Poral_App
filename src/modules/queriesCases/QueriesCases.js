import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { STACKS } from '../../enums/ScreenEnums';
import { Colors } from '../../utils/Styles';
import { getStatusColor, getStatusBg } from '../../utils/status.utils';
import { CASE_FILTERS, QUERIES_CASES_DUMMY_DATA } from '../../constants/queriesCases';
import ScreenHeader from '../../common/screenHeader';
import DetailModal from '../../common/detailModal';
import CaseDetailContent from '../../common/caseDetailContent';
import Ionicons from 'react-native-vector-icons/Ionicons';

const QueriesCases = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedCase, setSelectedCase] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const filteredData = QUERIES_CASES_DUMMY_DATA.filter((item) => {
    const matchesFilter = selectedFilter === 'All' || item.status === selectedFilter;
    const matchesSearch =
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => setSelectedCase(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.caseId}>{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <Text style={styles.subject}>{item.subject}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
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
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search queries..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CASE_FILTERS.map((filter) => (
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
      </View>
      
      <View style={styles.content}>
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No queries found</Text>
              </View>
          }
        />
      </View>

        <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(STACKS.CREATE_CASE)}
        >
            <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity> 

        <DetailModal
          visible={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          item={selectedCase}
        >
          <CaseDetailContent item={selectedCase} />
        </DetailModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 80, 
  },
  card: {
    backgroundColor: Colors.cardBackground || '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  caseId: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
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
  subject: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
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
      marginTop: 50,
  },
  emptyText: {
      color: Colors.textSecondary,
      fontSize: 16,
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
