import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, wp, hp } from '../../utils/Styles';
import ScreenHeader from '../../common/screenHeader';
import { useNotification } from '../../contexts/notificationContext';
import { fetchNotificationRequest, readNotificationRequest, deleteNotificationRequest, deleteAllNotificationRequest } from '../../api/notification.api';
import moment from 'moment';

const Notifications = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const auth = useSelector(state => state.auth);
  const user = auth.user || auth.userDetail;
  const userId =
    user?.id || user?._id || auth.userDetail?.id || auth.userDetail?._id;
  const tenantId =
    user?.tenantId ||
    user?.userTenantId ||
    auth.userDetail?.tenantId ||
    auth.userDetail?.userTenantId;
  const {
    notifications,
    unreadCount,
    markAsRead: markAsReadContext,
    markAllAsRead: markAllAsReadContext,
    setNotificationsValue,
    setUnreadCountValue,
  } = useNotification();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, payment, subscription, unread
    

  // Fetch notifications from API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetchNotificationRequest({ page: 1, limit: 50 });
      
      // Check if response is successful (matching web version structure)
      if (response?.status === 200 && response?.data?.success) {
        const data = response.data.data;
        // API returns notifications in data.notifications array
        const notificationsList = data?.notifications || [];
        
        // Ensure notificationsList is an array
        if (!Array.isArray(notificationsList)) {
          console.warn('Notifications data is not an array:', notificationsList);
          setNotificationsValue([]);
          setUnreadCountValue(0);
          return;
        }
        
        // Map API response to notification format
        const mappedNotifications = notificationsList.map(notif => ({
          messageId: notif._id || notif.messageId || notif.id || Date.now().toString(),
          from: notif.from,
          title: notif.title || 'Notification',
          body: notif.body || notif.message || '',
          read: notif.isRead || notif.read || false,
          timestamp: notif.sentAt || notif.createdAt || notif.timestamp || new Date().toISOString(),
          data: notif.data || {},
          // Extract type from data or infer from title/body
          type: notif.data?.type || (notif.title?.toLowerCase().includes('payment') ? 'payment' : 'subscription'),
          // Format time
          time: (notif.sentAt || notif.createdAt || notif.timestamp) 
            ? moment(notif.sentAt || notif.createdAt || notif.timestamp).fromNow() 
            : 'Just now',
        }));
        
        setNotificationsValue(mappedNotifications);
        
        // Set unread count from API response or calculate from notifications
        const unread = data?.unreadCount !== undefined 
          ? data.unreadCount 
          : mappedNotifications.filter(n => !n.read).length;
        setUnreadCountValue(unread);
      } else {
        // Handle error response
        const errorMessage = response?.data?.message || 'Failed to fetch notifications';
        console.error('Failed to fetch notifications:', errorMessage);
        // Don't show alert for empty responses, just log
        if (response?.status !== 200) {
          Alert.alert('Error', errorMessage);
        } else {
          // Success but no data - set empty arrays
          setNotificationsValue([]);
          setUnreadCountValue(0);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
      // Set empty state on error
      setNotificationsValue([]);
      setUnreadCountValue(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and when screen focuses
  useEffect(() => {
    fetchNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const getIcon = (iconType, color) => {
    switch (iconType) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={24} color={color} />;
      case 'warning':
        return <Ionicons name="warning" size={24} color={color} />;
      case 'info':
      default:
        return <Ionicons name="information-circle" size={24} color={color} />;
    }
  };

  const getIconBgColor = (color) => {
    const colors = {
      blue: { bg: '#DBEAFE', text: '#2563EB' },
      green: { bg: '#D1FAE5', text: '#059669' },
      orange: { bg: '#FED7AA', text: '#D97706' },
      purple: { bg: '#E9D5FF', text: '#7C3AED' },
    };
    return colors[color] || colors.blue;
  };

  const markAsRead = async (messageId) => {
    if (!userId || !tenantId) {
      console.warn('markAsRead: missing userId or tenantId');
      return;
    }

    try {
      // Call API to mark as read
      const response = await readNotificationRequest({
        notificationIds: [messageId],
        userId,
        tenantId,
      });

      if (response?.status === 200 && response?.data?.success) {
        // Update context
        markAsReadContext(messageId);
      } else {
        console.error(
          'Failed to mark notification as read:',
          response?.data || response,
        );
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to mark notification as read',
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!userId || !tenantId) {
      console.warn('markAllAsRead: missing userId or tenantId');
      return;
    }

    try {
      // Get all unread notification IDs
      const unreadIds = notifications.filter(n => !n.read).map(n => n.messageId);
      if (unreadIds.length === 0) return;

      // Call API to mark all as read
      const response = await readNotificationRequest({
        notificationIds: unreadIds,
        userId,
        tenantId,
      });

      if (response?.status === 200 && response?.data?.success) {
        // Update context
        markAllAsReadContext();
      } else {
        console.error(
          'Failed to mark all notifications as read:',
          response?.data || response,
        );
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to mark all notifications as read',
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      // Call API to delete notification
      const response = await deleteNotificationRequest(id);
      if (response?.status === 200 || response?.status === 204) {
        // Update local state after successful deletion
        const updatedNotifications = notifications.filter(notif => notif.messageId !== id);
        setNotificationsValue(updatedNotifications);
        // Update unread count if deleted notification was unread
        const deletedNotif = notifications.find(n => n.messageId === id);
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCountValue(unreadCount - 1);
        }
      } else {
        Alert.alert('Error', 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const deleteAllNotifications = async () => {
    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteAllNotificationRequest();
              if (response?.status === 200 || response?.status === 204) {
                // Clear all notifications from local state
                setNotificationsValue([]);
                setUnreadCountValue(0);
              } else {
                Alert.alert('Error', 'Failed to delete all notifications');
              }
            } catch (error) {
              console.error('Error deleting all notifications:', error);
              Alert.alert('Error', 'Failed to delete all notifications');
            }
          },
        },
      ]
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const paymentCount = notifications.filter(n => n.type === 'payment').length;
  const subscriptionCount = notifications.filter(n => n.type === 'subscription').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Notifications" />
      
      {/* Unread Count and Action Buttons */}
      {(unreadCount > 0 || notifications.length > 0) && (
        <View style={styles.headerActionBar}>
          <Text style={styles.unreadCountText}>
            {unreadCount > 0 
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : `${notifications.length} notification${notifications.length > 1 ? 's' : ''}`}
          </Text>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={styles.markAllButton}
              >
                <Text style={styles.markAllButtonText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity
                onPress={deleteAllNotifications}
                style={styles.deleteAllButton}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <Text style={styles.deleteAllButtonText}>Delete All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[
              styles.filterButton,
              filter === 'all' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive
            ]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            style={[
              styles.filterButton,
              filter === 'unread' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'unread' && styles.filterButtonTextActive
            ]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('payment')}
            style={[
              styles.filterButton,
              filter === 'payment' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'payment' && styles.filterButtonTextActive
            ]}>
              Payments ({paymentCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('subscription')}
            style={[
              styles.filterButton,
              filter === 'subscription' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'subscription' && styles.filterButtonTextActive
            ]}>
              Subscription ({subscriptionCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              // Determine icon and color based on notification type or data
              const iconType = notification.data?.iconType || 'info';
              const color = notification.data?.color || 'blue';
              const iconColors = getIconBgColor(color);
              return (
                <View
                  key={notification.messageId}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.notificationCardUnread
                  ]}
                >
                  <View style={styles.notificationContent}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColors.bg }]}>
                      {getIcon(iconType, iconColors.text)}
                    </View>
                    <View style={styles.notificationTextContainer}>
                      <View style={styles.notificationHeader}>
                        <View style={styles.notificationTitleContainer}>
                          <Text style={styles.notificationTitle}>
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <View style={styles.unreadDot} />
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => deleteNotification(notification.messageId)}
                          style={styles.deleteButton}
                        >
                          <Ionicons name="close" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.notificationMessage}>
                        {notification.body}
                      </Text>
                      <View style={styles.notificationFooter}>
                        <View style={styles.footerLeft}>
                          <Text style={styles.notificationTime}>{notification.time}</Text>
                          <View style={[
                            styles.typeBadge,
                            notification.type === 'payment' ? styles.typeBadgePayment : styles.typeBadgeSubscription
                          ]}>
                            <Text style={[
                              styles.typeBadgeText,
                              notification.type === 'payment' ? styles.typeBadgeTextPayment : styles.typeBadgeTextSubscription
                            ]}>
                              {notification.type === 'payment' ? '💳 Payment' : '📋 Subscription'}
                            </Text>
                          </View>
                        </View>
                        {!notification.read && (
                          <TouchableOpacity
                            onPress={() => markAsRead(notification.messageId)}
                            style={styles.markReadButton}
                          >
                            <Text style={styles.markReadButtonText}>Mark as read</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : `No ${filter === 'all' ? '' : filter} notifications to display.`}
            </Text>
          </View>
        )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unreadCountText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  deleteAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    padding: 16,
  },
  notificationCardUnread: {
    borderColor: '#BFDBFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgePayment: {
    backgroundColor: '#D1FAE5',
  },
  typeBadgeSubscription: {
    backgroundColor: '#E9D5FF',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadgeTextPayment: {
    color: '#059669',
  },
  typeBadgeTextSubscription: {
    color: '#7C3AED',
  },
  markReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markReadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 48,
    alignItems: 'center',
    marginTop: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default Notifications;

