import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, wp, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../common/screenHeader';
import DetailModal from '../../common/detailModal';

const Event = () => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filters = [
    { id: 'all', label: 'All Events' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'webinar', label: 'Webinars' },
    { id: 'workshop', label: 'Workshops' },
  ];

  const events = [
    {
      id: 1,
      title: 'Annual General Meeting 2024',
      date: 'Dec 15, 2024',
      time: '10:00 AM - 2:00 PM',
      location: 'Convention Center, Downtown',
      category: 'Meeting',
      type: 'upcoming',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
      attendees: 250,
      status: 'registered',
      description: 'Join us for our most important meeting of the year. Discuss annual reports, elections, and future plans.',
    },
    {
      id: 2,
      title: 'Networking Mixer',
      date: 'Oct 25, 2024',
      time: '7:00 PM - 10:00 PM',
      location: 'Grand Hotel Ballroom',
      category: 'Networking',
      type: 'upcoming',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=400&fit=crop',
      attendees: 180,
      status: 'available',
      description: 'Connect with industry professionals and expand your network in a relaxed atmosphere.',
    },
    {
      id: 3,
      title: 'Leadership Webinar Series',
      date: 'Nov 2, 2024',
      time: '10:00 AM - 12:00 PM',
      location: 'Online',
      category: 'Webinar',
      type: 'upcoming',
      image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop',
      attendees: 320,
      status: 'available',
      description: 'Learn from industry leaders about effective leadership strategies and team management.',
    },
    {
      id: 4,
      title: 'Tech Skills Workshop',
      date: 'Nov 15, 2024',
      time: '2:00 PM - 5:00 PM',
      location: 'Tech Hub, Innovation Center',
      category: 'Workshop',
      type: 'upcoming',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
      attendees: 45,
      status: 'waitlist',
      description: 'Hands-on workshop covering the latest technologies and development practices.',
    },
    {
      id: 5,
      title: 'Industry Conference 2024',
      date: 'Sep 20, 2024',
      time: '9:00 AM - 6:00 PM',
      location: 'International Convention Center',
      category: 'Conference',
      type: 'past',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop',
      attendees: 500,
      status: 'completed',
      description: 'Annual industry conference featuring keynote speakers and breakout sessions.',
    },
    {
      id: 6,
      title: 'Digital Marketing Masterclass',
      date: 'Nov 8, 2024',
      time: '1:00 PM - 4:00 PM',
      location: 'Online',
      category: 'Webinar',
      type: 'upcoming',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
      attendees: 210,
      status: 'available',
      description: 'Master the art of digital marketing with expert insights and practical strategies.',
    },
    {
      id: 7,
      title: 'Member Appreciation Gala',
      date: 'Dec 5, 2024',
      time: '6:00 PM - 11:00 PM',
      location: 'Grand Ballroom, Luxury Hotel',
      category: 'Social',
      type: 'upcoming',
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=400&fit=crop',
      attendees: 300,
      status: 'available',
      description: 'Celebrate our members and enjoy an evening of fine dining and entertainment.',
    },
    {
      id: 8,
      title: 'Professional Development Summit',
      date: 'Aug 15, 2024',
      time: '8:00 AM - 5:00 PM',
      location: 'Business Center',
      category: 'Conference',
      type: 'past',
      image: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=800&h=400&fit=crop',
      attendees: 400,
      status: 'completed',
      description: 'Comprehensive summit covering various aspects of professional growth and development.',
    },
  ];

  const filteredEvents = events.filter(event => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'upcoming') return event.type === 'upcoming';
    if (selectedFilter === 'past') return event.type === 'past';
    if (selectedFilter === 'webinar') return event.category === 'Webinar';
    if (selectedFilter === 'workshop') return event.category === 'Workshop';
    return true;
  }).filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'registered':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'available':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'waitlist':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'completed':
        return { bg: '#F3F4F6', text: '#6B7280' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'registered':
        return 'Registered';
      case 'available':
        return 'Register Now';
      case 'waitlist':
        return 'Waitlist';
      case 'completed':
        return 'Completed';
      default:
        return 'Available';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader  title="Events" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
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

      {/* Events List */}
      <ScrollView
        // style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const statusColors = getStatusColor(event.status);
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                activeOpacity={0.8}
                onPress={() => setSelectedEvent(event)}
              >
                <Image
                  source={{ uri: event.image }}
                  style={styles.eventImage}
                  resizeMode="cover"
                />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventCategory}>
                      <Text style={styles.eventCategoryText}>{event.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                        {getStatusLabel(event.status)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>

                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.eventDetailText}>{event.date}</Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.eventDetailText}>{event.time}</Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <Ionicons
                        name={event.location === 'Online' ? 'videocam-outline' : 'location-outline'}
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.eventDetailText} numberOfLines={1}>
                        {event.location}
                      </Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <MaterialCommunityIcons name="account-group" size={16} color={Colors.textSecondary} />
                      <Text style={styles.eventDetailText}>{event.attendees} attendees</Text>
                    </View>
                  </View>

                  {event.status === 'available' && (
                    <TouchableOpacity 
                      style={styles.registerButton}
                      onPress={() => setSelectedEvent(event)}
                    >
                      <Text style={styles.registerButtonText}>Register Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}
      </ScrollView>

      <DetailModal
        visible={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        item={selectedEvent}
      >
        <View style={styles.modalDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{selectedEvent?.date}</Text>
              <Text style={styles.detailSubValue}>{selectedEvent?.time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons 
                name={selectedEvent?.location === 'Online' ? 'videocam' : 'location'} 
                size={20} 
                color={Colors.primary} 
              />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{selectedEvent?.location}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="account-group" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Attendance</Text>
              <Text style={styles.detailValue}>{selectedEvent?.attendees} registered</Text>
              <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: selectedEvent ? getStatusColor(selectedEvent.status).bg : 'transparent',
                    alignSelf: 'flex-start',
                    marginTop: 4,
                  }
                ]}>
                <Text style={[
                  styles.statusBadgeText, 
                  { color: selectedEvent ? getStatusColor(selectedEvent.status).text : 'black' }
                ]}>
                  {selectedEvent ? getStatusLabel(selectedEvent.status) : ''}
                </Text>
              </View>
            </View>
          </View>

          {selectedEvent?.status === 'available' && (
             <TouchableOpacity style={[styles.registerButton, { marginTop: 24 }]}>
               <Text style={styles.registerButtonText}>Register Now</Text>
             </TouchableOpacity>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventCategory: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
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
  detailSubValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default Event;
