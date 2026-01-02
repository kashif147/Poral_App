import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Colors, hp, wp } from '../../utils/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../common/screenHeader';

const FILTER_TABS = ['All', 'Articles', 'Case Studies', 'Webinars'];

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
  },
  {
    id: 4,
    title: 'Expert Interview Series',
    type: 'Article',
    badge: null,
    gradient: ['#B2DFDB', '#E0F7FA'],
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop',
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
  },
  {
    id: 6,
    title: 'Podcast: Leadership Insights',
    type: 'Podcast',
    badge: null,
    gradient: ['#000000', '#2C2C2C'],
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop',
  },
];

const Resources = () => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set());

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

  const filteredResources = RESOURCES_DATA.filter((resource) => {
    const matchesSearch = resource.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' ||
      resource.type.toLowerCase().includes(activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <ScreenHeader title="Resources" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(12) }}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search articles, videos, documents..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContainer}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                activeFilter === tab && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab && styles.filterTabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Resources Grid */}
        <View style={styles.resourcesGrid}>
          {filteredResources.map((resource) => (
            <View key={resource.id} style={styles.resourceCard}>
              {/* Card Image/Thumbnail */}
              <View style={styles.cardImageContainer}>
                <Image
                  source={{ uri: resource.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                {/* Gradient Overlay */}
                <View
                  style={[
                    styles.imageOverlay,
                    resource.gradient && {
                      backgroundColor: resource.gradient[0] + '80',
                    },
                  ]}
                />

                {/* Bookmark Icon */}
                <TouchableOpacity
                  style={styles.bookmarkButton}
                  onPress={() => toggleBookmark(resource.id)}
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

              {/* Card Content */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {resource.title}
                </Text>
                <Text style={styles.cardType}>{resource.type}</Text>

                {/* Badge */}
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
            </View>
          ))}
        </View>

        {/* Empty State */}
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
    </View>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '400',
  },

  // Filter Tabs
  filterTabsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E8EEF7',
    marginRight: 12,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },

  // Resources Grid
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
});

export default Resources;

