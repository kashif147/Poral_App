import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Colors, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../common/screenHeader';
import DetailModal from '../../common/detailModal';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'articles', label: 'Articles' },
  { id: 'case-studies', label: 'Case Studies' },
  { id: 'webinars', label: 'Webinars' },
  { id: 'videos', label: 'Videos' },
  { id: 'guides', label: 'Guides' },
  { id: 'podcasts', label: 'Podcasts' },
];

const RESOURCES_DATA = [
  {
    id: 1,
    title: '2024 Industry Trend Report',
    type: 'PDF Document',
    badge: 'New',
    badgeColor: '#DCFCE7',
    badgeTextColor: '#16A34A',
    gradient: ['#667EEA', '#764BA2'],
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
    category: 'Case Studies',
    format: 'case-studies',
  },
  {
    id: 2,
    title: 'Mastering Digital Marketing',
    type: 'Video',
    badge: 'Exclusive',
    badgeColor: '#FEF3C7',
    badgeTextColor: '#D97706',
    gradient: ['#2C3E50', '#4CA1AF'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    category: 'Videos',
    format: 'videos',
  },
  {
    id: 3,
    title: 'Webinar: The Future of AI',
    type: 'Webinar Recording',
    badge: 'New',
    badgeColor: '#DCFCE7',
    badgeTextColor: '#16A34A',
    gradient: ['#000000', '#434343'],
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
    category: 'Webinars',
    format: 'webinars',
  },
  {
    id: 4,
    title: 'Expert Interview Series',
    type: 'Article',
    badge: null,
    gradient: ['#B2DFDB', '#E0F7FA'],
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop',
    category: 'Articles',
    format: 'articles',
  },
  {
    id: 5,
    title: 'Guide to Sustainable Practices',
    type: 'Guide',
    badge: 'Exclusive',
    badgeColor: '#FEF3C7',
    badgeTextColor: '#D97706',
    gradient: ['#4A6741', '#78A665'],
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop',
    category: 'Guides',
    format: 'guides',
  },
  {
    id: 6,
    title: 'Podcast: Leadership Insights',
    type: 'Podcast',
    badge: null,
    gradient: ['#000000', '#2C2C2C'],
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop',
    category: 'Podcasts',
    format: 'podcasts',
  },
];

const Resources = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set());
  const [selectedResource, setSelectedResource] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const toggleBookmark = (id) => {
    setBookmarkedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredResources = RESOURCES_DATA.filter((resource) => {
    if (selectedFilter === 'all') return true;
    return resource.format === selectedFilter;
  }).filter((resource) => {
    if (!normalizedQuery) return true;
    const searchable = [
      resource.title,
      resource.type,
      resource.format,
    ];
    return searchable.some((field) =>
      field?.toLowerCase().includes(normalizedQuery),
    );
  });

  const clearSearch = () => setSearchQuery('');

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Resources" />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color={Colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          style={styles.filterScrollView}
        >
          {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter.id && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.resourcesGrid}>
          {filteredResources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={styles.resourceCard}
              activeOpacity={0.8}
              onPress={() => setSelectedResource(resource)}
            >
              <View style={styles.cardImageContainer}>
                <Image
                  source={{ uri: resource.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.imageOverlay,
                    resource.gradient && {
                      backgroundColor: resource.gradient[0] + '80',
                    },
                  ]}
                />

                <TouchableOpacity
                  style={styles.bookmarkButton}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    toggleBookmark(resource.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      bookmarkedItems.has(resource.id)
                        ? 'bookmark'
                        : 'bookmark-outline'
                    }
                    size={20}
                    color={Colors.white}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {resource.title}
                </Text>
                <Text style={styles.cardType}>{resource.type}</Text>

                {resource.badge && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: resource.badgeColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: resource.badgeTextColor },
                      ]}
                    >
                      {resource.badge}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filteredResources.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="folder-open-outline"
              size={64}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>No resources found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>

      <DetailModal
        visible={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        item={selectedResource}
      >
        <View style={styles.modalDetails}>
           {/* Resource Type */}
           <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{selectedResource?.type}</Text>
            </View>
          </View>

          {/* Badge/Tags */}
          {selectedResource?.badge && (
             <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="pricetag-outline" size={20} color={selectedResource?.badgeTextColor || Colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[
                  styles.badge, 
                  { 
                    backgroundColor: selectedResource?.badgeColor, 
                    alignSelf: 'flex-start',
                    marginTop: 4,
                  }
                ]}>
                  <Text style={[styles.badgeText, { color: selectedResource?.badgeTextColor }]}>
                    {selectedResource?.badge}
                  </Text>
                </View>
              </View>
            </View>
          )}

           {/* Access Action */}
           <TouchableOpacity style={[styles.accessButton, { marginTop: 24 }]}>
               <Text style={styles.accessButtonText}>Access Resource</Text>
               <Ionicons name="arrow-forward" size={20} color={Colors.white} style={{ marginLeft: 8 }}/>
           </TouchableOpacity>
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

  // Header - Matching Application.js
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5A77B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchContainer: {
    flex: 0,
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

  // Filter Tabs - fixed height; flex: 0 so this row never takes extra space when content shrinks
  filterRowWrapper: {
    flex: 0,
    height: 70,
    minHeight: 70,
    maxHeight: 70,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollView: {
    height: 70,
    minHeight: 70,
    maxHeight: 70,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },

  // Resources Grid - flex: 1 and minHeight: 0 so this takes all space below filter without pushing it
  contentScrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  resourceCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 22,
  },
  cardType: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '400',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  accessButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  accessButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Resources;

