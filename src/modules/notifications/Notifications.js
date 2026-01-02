import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, wp, hp } from '../../utils/Styles';
import ScreenHeader from '../../common/screenHeader';

const Notifications = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'payment',
      icon: 'info',
      title: 'Monthly Payment Due',
      message: 'Your monthly subscription payment of €24.92 is due on December 1, 2025.',
      time: '2 hours ago',
      read: false,
      color: 'blue',
    },
    {
      id: 2,
      type: 'subscription',
      icon: 'success',
      title: 'Subscription Activated',
      message: 'Your membership subscription has been successfully activated. Welcome aboard!',
      time: '1 day ago',
      read: false,
      color: 'green',
    },
    {
      id: 3,
      type: 'payment',
      icon: 'success',
      title: 'Payment Successful',
      message: 'Your payment of €299.00 has been processed successfully. Receipt #INV-2024-001234.',
      time: '2 days ago',
      read: true,
      color: 'green',
    },
    {
      id: 4,
      type: 'subscription',
      icon: 'warning',
      title: 'Subscription Renewal Reminder',
      message: 'Your annual subscription will renew on January 15, 2026. Update payment method if needed.',
      time: '3 days ago',
      read: true,
      color: 'orange',
    },
    {
      id: 5,
      type: 'payment',
      icon: 'info',
      title: 'Payment Method Updated',
      message: 'Your payment method ending in ****4242 has been updated successfully.',
      time: '5 days ago',
      read: true,
      color: 'blue',
    },
    {
      id: 6,
      type: 'subscription',
      icon: 'info',
      title: 'New Benefits Available',
      message: 'Check out the new member benefits and rewards available to you.',
      time: '1 week ago',
      read: true,
      color: 'purple',
    },
    {
      id: 7,
      type: 'payment',
      icon: 'success',
      title: 'Payment Confirmation',
      message: 'Monthly payment of €24.92 received. Thank you for your payment.',
      time: '2 weeks ago',
      read: true,
      color: 'green',
    },
    {
      id: 8,
      type: 'subscription',
      icon: 'info',
      title: 'Profile Update Required',
      message: 'Please review and update your profile information to keep your account current.',
      time: '3 weeks ago',
      read: true,
      color: 'blue',
    },
  ]);

  const [filter, setFilter] = useState('all'); // all, payment, subscription, unread

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

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const paymentCount = notifications.filter(n => n.type === 'payment').length;
  const subscriptionCount = notifications.filter(n => n.type === 'subscription').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Notifications" />
      
      {/* Unread Count and Mark All Button */}
      {unreadCount > 0 && (
        <View style={styles.headerActionBar}>
          <Text style={styles.unreadCountText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllButtonText}>Mark all as read</Text>
          </TouchableOpacity>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const iconColors = getIconBgColor(notification.color);
            return (
              <View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread
                ]}
              >
                <View style={styles.notificationContent}>
                  <View style={[styles.iconContainer, { backgroundColor: iconColors.bg }]}>
                    {getIcon(notification.icon, iconColors.text)}
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
                        onPress={() => deleteNotification(notification.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="close" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
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
                          onPress={() => markAsRead(notification.id)}
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
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
});

export default Notifications;

