import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Colors } from '../../utils/Styles';
import ScreenHeader from '../../common/screenHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DetailModal from '../../common/detailModal';

const QueriesCases = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedCase, setSelectedCase] = useState(null);

  const filters = ['All', 'Open', 'In Progress', 'Closed'];

  const dummyData = [
    {
      id: 'CS-2023-001',
      subject: 'Membership Renewal Issue',
      title: 'Membership Renewal Issue', // Added title for DetailModal
      date: 'Oct 24, 2023',
      status: 'Open',
      description: 'I cannot proceed with my payment for renewal.',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop', // Dummy image
    },
    {
      id: 'CS-2023-002',
      subject: 'Certificate Request',
      title: 'Certificate Request',
      date: 'Oct 20, 2023',
      status: 'Closed',
      image: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=800&h=400&fit=crop',
      description: 'Requesting a copy of my membership certificate.',
    },
    {
      id: 'CS-2023-003',
      subject: 'Event Registration',
      title: 'Event Registration',
      date: 'Oct 15, 2023',
      status: 'In Progress',
      description: 'Need help registering for the Annual Meetup.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    },
    {
      id: 'CS-2023-004',
        subject: 'Profile Update',
        title: 'Profile Update',
        date: 'Oct 10, 2023',
        status: 'Closed',
        description: 'Updated my contact details but not reflecting.',
        image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=400&fit=crop',
      },
  ];

  const filteredData = dummyData.filter(item => {
    const matchesFilter = selectedFilter === 'All' || item.status === selectedFilter;
    const matchesSearch = 
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return '#10B981'; // Green
      case 'In Progress': return '#F59E0B'; // Amber
      case 'Closed': return '#6B7280'; // Gray
      default: return Colors.primary;
    }
  };

  const getStatusBg = (status) => {
      switch (status) {
        case 'Open': return '#D1FAE5'; 
        case 'In Progress': return '#FEF3C7'; 
        case 'Closed': return '#F3F4F6'; 
        default: return '#E0F2FE';
      }
    };

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
      <ScreenHeader title="Queries & Cases" showBack={true} />
      
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
            {filters.map((filter) => (
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
          ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No queries found</Text>
              </View>
          }
        />
      </View>

        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
            <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity> 

        <DetailModal
        visible={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        item={selectedCase}
      >
        <View style={styles.modalDetails}>
            <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                    <Ionicons name="pricetag" size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Case ID</Text>
                    <Text style={styles.detailValue}>{selectedCase?.id}</Text>
                </View>
            </View>

            <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                    <Ionicons name="calendar" size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Date Created</Text>
                    <Text style={styles.detailValue}>{selectedCase?.date}</Text>
                </View>
            </View>

            <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                    <Ionicons name="information-circle" size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[
                        styles.statusBadge, 
                        { 
                            backgroundColor: selectedCase ? getStatusBg(selectedCase.status) : 'transparent',
                            alignSelf: 'flex-start',
                            marginTop: 4,
                        }
                        ]}>
                        <Text style={[
                            styles.statusText, 
                            { color: selectedCase ? getStatusColor(selectedCase.status) : 'black' }
                        ]}>
                            {selectedCase?.status}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
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
  modalDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
});

export default QueriesCases;
