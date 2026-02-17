import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../../utils/Styles';

export const UpcomingEventCard = ({ event, onPress, onViewPress }) => (
  <TouchableOpacity
    style={styles.eventCard}
    onPress={() => onPress(event)}
    activeOpacity={0.7}
  >
    <Image
      source={{ uri: event.image }}
      style={styles.eventImage}
      resizeMode="cover"
    />
    <View style={styles.eventContent}>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <View style={styles.eventDetailRow}>
        <Ionicons
          name="calendar-outline"
          size={14}
          color={Colors.textSecondary}
        />
        <Text style={styles.eventDetailText}>{event.date}</Text>
      </View>
      <View style={styles.eventDetailRow}>
        <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.eventDetailText}>{event.time}</Text>
      </View>
      <View style={styles.eventDetailRow}>
        <Ionicons
          name={
            event.location === 'Online'
              ? 'videocam-outline'
              : 'location-outline'
          }
          size={14}
          color={Colors.textSecondary}
        />
        <Text style={styles.eventDetailText} numberOfLines={1}>
          {event.location}
        </Text>
      </View>
      {event.description ? (
        <Text style={styles.eventDescription} numberOfLines={1}>
          {event.description}
        </Text>
      ) : null}
    </View>
    <TouchableOpacity
      style={styles.viewButton}
      onPress={e => {
        e.stopPropagation();
        onViewPress(event);
      }}
    >
      <Text style={styles.viewButtonText}>View</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  eventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  eventDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  viewButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  viewButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
