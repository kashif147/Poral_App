import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../common/screenHeader';
import DetailModal from '../../common/detailModal';
import { EventCourseCardHeader } from '../../common/EventCourseCardHeader';
import FilterPillBar from '../../common/FilterPillBar';
import {
  fetchMyRegistrations,
  fetchPublishedCourses,
  fetchPublishedEvents,
} from '../../api/events.api';
import {
  applyRegistrationStatus,
  filterEventsBySearch,
  filterRegisteredItems,
  formatRegistrationPrice,
  isRegistrationLocked,
  parseEventsResponse,
  parseRegistrationsResponse,
  resolveDisplayPrice,
} from '../../helpers/events.helper';
import { useMemberRole } from '../../hooks/useMemberRole';
import { useApplication } from '../../contexts/applicationContext';
import { useProfile } from '../../contexts/profileContext';
import { STACKS } from '../../enums/ScreenEnums';
import { toast } from '../../utils/toast.utils';

const FILTER_IDS = {
  ALL: 'all',
  EVENT: 'event',
  COURSE: 'course',
  MY_EVENT: 'my-event',
  MY_COURSE: 'my-course',
};

const tagItems = (items, kind) =>
  (items || []).map(item => ({
    ...item,
    kind,
    category: item.category || (kind === 'course' ? 'Course' : 'Event'),
  }));

const excludePast = items =>
  (items || []).filter(item => item?.type !== 'past');

const resolveInitialFilter = (route, initialCategoryType) => {
  const type = route.params?.categoryType || route.params?.type || initialCategoryType;
  const scope = route.params?.scope;
  if (scope === 'my' && type === 'course') return FILTER_IDS.MY_COURSE;
  if (scope === 'my' && type === 'event') return FILTER_IDS.MY_EVENT;
  if (type === 'course') return FILTER_IDS.COURSE;
  if (type === 'event') return FILTER_IDS.EVENT;
  return FILTER_IDS.ALL;
};

const Event = ({ initialCategoryType } = {}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isMember } = useMemberRole();
  const {
    professionalDetail,
    subscriptionDetail,
    categoryData,
  } = useApplication();
  const { getProfileDetail } = useProfile();
  const membershipCategory =
    professionalDetail?.professionalDetails?.membershipCategory ||
    subscriptionDetail?.subscriptionDetails?.membershipCategory ||
    '';

  const [selectedFilter, setSelectedFilter] = useState(() =>
    resolveInitialFilter(route, initialCategoryType),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedFilter(resolveInitialFilter(route, initialCategoryType));
    setSearchQuery('');
  }, [
    route.params?.categoryType,
    route.params?.type,
    route.params?.scope,
    initialCategoryType,
  ]);

  const loadData = useCallback(async () => {
    try {
      const [eventsRes, coursesRes, registrationsRes] = await Promise.all([
        fetchPublishedEvents(),
        fetchPublishedCourses(),
        fetchMyRegistrations(),
      ]);

      const eventsOk = eventsRes?.status >= 200 && eventsRes?.status < 300;
      const coursesOk = coursesRes?.status >= 200 && coursesRes?.status < 300;

      if (!eventsOk && !coursesOk) {
        setItems([]);
        setRegistrations([]);
        toast.error('Error', 'Unable to load events and courses.');
        return;
      }

      const regs = registrationsRes
        ? parseRegistrationsResponse(registrationsRes)
        : [];
      const events = eventsOk
        ? tagItems(parseEventsResponse(eventsRes), 'event')
        : [];
      const courses = coursesOk
        ? tagItems(parseEventsResponse(coursesRes), 'course')
        : [];

      setRegistrations(regs);
      setItems(applyRegistrationStatus([...events, ...courses], regs));
    } catch (error) {
      console.error('Failed to fetch events and courses:', error);
      setItems([]);
      setRegistrations([]);
      toast.error('Error', 'Unable to load events and courses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getProfileDetail?.();
  }, [getProfileDetail]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const activeItems = useMemo(() => excludePast(items), [items]);

  const myEvents = useMemo(
    () =>
      excludePast(filterRegisteredItems(activeItems, registrations, 'event')),
    [activeItems, registrations],
  );

  const myCourses = useMemo(
    () =>
      excludePast(filterRegisteredItems(activeItems, registrations, 'course')),
    [activeItems, registrations],
  );

  const filters = useMemo(
    () => [
      { id: FILTER_IDS.ALL, label: 'All', count: activeItems.length },
      {
        id: FILTER_IDS.EVENT,
        label: 'Events',
        count: activeItems.filter(item => item.kind === 'event').length,
      },
      {
        id: FILTER_IDS.COURSE,
        label: 'Courses',
        count: activeItems.filter(item => item.kind === 'course').length,
      },
      {
        id: FILTER_IDS.MY_EVENT,
        label: 'My Events',
        count: myEvents.length,
      },
      {
        id: FILTER_IDS.MY_COURSE,
        label: 'My Courses',
        count: myCourses.length,
      },
    ],
    [activeItems, myEvents, myCourses],
  );

  const filteredItems = useMemo(() => {
    let source = activeItems;
    if (selectedFilter === FILTER_IDS.EVENT) {
      source = activeItems.filter(item => item.kind === 'event');
    } else if (selectedFilter === FILTER_IDS.COURSE) {
      source = activeItems.filter(item => item.kind === 'course');
    } else if (selectedFilter === FILTER_IDS.MY_EVENT) {
      source = myEvents;
    } else if (selectedFilter === FILTER_IDS.MY_COURSE) {
      source = myCourses;
    }
    return filterEventsBySearch(source, searchQuery);
  }, [selectedFilter, activeItems, myEvents, myCourses, searchQuery]);

  const navigateToRegistration = item => {
    if (!item?.id) return;
    if (isRegistrationLocked(item)) {
      toast.info(
        'Already applied',
        item.status === 'submitted'
          ? 'This registration is pending review.'
          : 'You are already registered for this item.',
      );
      return;
    }
    if (item.kind === 'course') {
      navigation.navigate(STACKS.COURSE_REGISTRATION, {
        courseId: item.courseId || item.id,
      });
    } else {
      navigation.navigate(STACKS.EVENT_REGISTRATION, { eventId: item.id });
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'registered':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'submitted':
        return { bg: '#FEF3C7', text: '#B45309' };
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

  const getStatusLabel = status => {
    switch (status) {
      case 'registered':
        return 'Registered';
      case 'submitted':
        return 'Submitted';
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleFilterChange = nextFilter => {
    setSelectedFilter(nextFilter);
    setSearchQuery('');
    navigation.setParams?.({
      categoryType:
        nextFilter === FILTER_IDS.COURSE || nextFilter === FILTER_IDS.MY_COURSE
          ? 'course'
          : nextFilter === FILTER_IDS.EVENT || nextFilter === FILTER_IDS.MY_EVENT
            ? 'event'
            : undefined,
      scope:
        nextFilter === FILTER_IDS.MY_EVENT || nextFilter === FILTER_IDS.MY_COURSE
          ? 'my'
          : undefined,
    });
  };

  const getDisplayPrice = item =>
    formatRegistrationPrice(
      resolveDisplayPrice(item, {
        isMember,
        membershipCategory,
        categoryCode: categoryData?.code,
        categoryName: categoryData?.name,
      }),
    );

  const canRegister = item =>
    item?.type === 'upcoming' &&
    item?.status === 'available' &&
    !isRegistrationLocked(item);

  const emptyTitle =
    selectedFilter === FILTER_IDS.MY_EVENT
      ? 'No My Events yet'
      : selectedFilter === FILTER_IDS.MY_COURSE
        ? 'No My Courses yet'
        : selectedFilter === FILTER_IDS.EVENT
          ? 'No events found'
          : selectedFilter === FILTER_IDS.COURSE
            ? 'No courses found'
            : 'No events or courses found';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Events & Courses" />

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
            placeholder="Search events & courses..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FilterPillBar
        filters={filters}
        selectedId={selectedFilter}
        onSelect={handleFilterChange}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredItems.length > 0 ? (
          filteredItems.map(item => {
            const statusColors = getStatusColor(item.status);
            return (
              <TouchableOpacity
                key={`${item.kind}-${item.id}`}
                style={styles.eventCard}
                activeOpacity={0.8}
                onPress={() => setSelectedItem(item)}>
                <EventCourseCardHeader item={item} />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    {item.category ? (
                      <View style={styles.eventCategory}>
                        <Text style={styles.eventCategoryText}>
                          {item.category}
                        </Text>
                      </View>
                    ) : null}
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColors.bg },
                      ]}>
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: statusColors.text },
                        ]}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.eventDetailText}>{item.date}</Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.eventDetailText}>{item.time}</Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <Ionicons
                        name={
                          item.location === 'Online'
                            ? 'videocam-outline'
                            : 'location-outline'
                        }
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.eventDetailText}>
                        {item.location}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.eventDetails}>
                    {item.attendees != null && (
                      <View style={styles.eventDetailRow}>
                        <MaterialCommunityIcons
                          name="account-group"
                          size={16}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.eventDetailText}>
                          {item.attendees} capacity
                        </Text>
                      </View>
                    )}
                    <View style={styles.eventDetailRow}>
                      <MaterialCommunityIcons
                        name="cash"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.eventDetailText}>
                        {getDisplayPrice(item)}
                      </Text>
                    </View>
                  </View>

                  {canRegister(item) && (
                    <TouchableOpacity
                      style={styles.registerButton}
                      onPress={() => {
                        setSelectedItem(null);
                        navigateToRegistration(item);
                      }}>
                      <Text style={styles.registerButtonText}>Register Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter.startsWith('my-')
                ? 'Register for an item to see it here.'
                : 'Try adjusting your search or filter criteria'}
            </Text>
          </View>
        )}
      </ScrollView>

      <DetailModal
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}>
        <View style={styles.modalDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{selectedItem?.date}</Text>
              <Text style={styles.detailSubValue}>{selectedItem?.time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons
                name={
                  selectedItem?.location === 'Online' ? 'videocam' : 'location'
                }
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{selectedItem?.location}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons
                name="account-group"
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Attendance</Text>
              <Text style={styles.detailValue}>
                {selectedItem?.attendees != null
                  ? `${selectedItem.attendees} capacity`
                  : 'Open registration'}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: selectedItem
                      ? getStatusColor(selectedItem.status).bg
                      : 'transparent',
                    alignSelf: 'flex-start',
                    marginTop: 4,
                  },
                ]}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: selectedItem
                        ? getStatusColor(selectedItem.status).text
                        : 'black',
                    },
                  ]}>
                  {selectedItem ? getStatusLabel(selectedItem.status) : ''}
                </Text>
              </View>
            </View>
          </View>

          {selectedItem && canRegister(selectedItem) && (
            <TouchableOpacity
              style={[styles.registerButton, { marginTop: 24 }]}
              onPress={() => {
                setSelectedItem(null);
                navigateToRegistration(selectedItem);
              }}>
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
    paddingTop: 12,
    paddingBottom: 8,
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
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 380,
  },
  eventContent: {
    padding: 16,
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventHeaderWithImage: {
    justifyContent: 'flex-end',
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
