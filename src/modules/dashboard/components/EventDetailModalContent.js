import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Label } from '../../../common/text/label';
import { Colors } from '../../../utils/Styles';
import {
  EVENT_STATUS_COLORS,
  EVENT_STATUS_DEFAULT,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_LABEL_DEFAULT,
} from '../../../constants/dashboard';
import { isRegistrationLocked } from '../../../helpers/events.helper';

export const EventDetailModalContent = ({
  event,
  onClose,
  onRegisterPress,
}) => {
  if (!event) return null;

  const statusColors = EVENT_STATUS_COLORS[event.status] || EVENT_STATUS_DEFAULT;
  const statusLabel =
    EVENT_STATUS_LABELS[event.status] || EVENT_STATUS_LABEL_DEFAULT;
  const canRegister =
    event.type !== 'past' &&
    !isRegistrationLocked(event) &&
    (event.status === 'available' || !event.status);

  return (
    <View style={styles.modalDetails}>
      <View style={styles.detailRow}>
        <View style={styles.detailIconContainer}>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
        </View>
        <View style={styles.detailTextContainer}>
          <Label style={styles.detailLabel}>Date & Time</Label>
          <Text style={styles.detailValue}>{event.date}</Text>
          <Text style={styles.detailSubValue}>{event.time}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailIconContainer}>
          <Ionicons
            name={event.location === 'Online' ? 'videocam' : 'location'}
            size={20}
            color={Colors.primary}
          />
        </View>
        <View style={styles.detailTextContainer}>
          <Label style={styles.detailLabel}>Location</Label>
          <Text style={styles.detailValue}>{event.location}</Text>
        </View>
      </View>

      {event.attendees != null && (
        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color={Colors.primary}
            />
          </View>
          <View style={styles.detailTextContainer}>
            <Label style={styles.detailLabel}>Attendance</Label>
            <Text style={styles.detailValue}>
              {event.attendees} registered
            </Text>
            <View
              style={[
                styles.modalStatusBadge,
                { backgroundColor: statusColors.bg },
              ]}
            >
              <Text
                style={[
                  styles.modalStatusBadgeText,
                  { color: statusColors.text },
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
      )}

      {canRegister && (
        <TouchableOpacity
          style={styles.modalRegisterButton}
          onPress={() => onRegisterPress(event)}
        >
          <Text style={styles.registerButtonText}>Register Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  modalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  modalStatusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalRegisterButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
