import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../../utils/Styles';

export const FeaturedEventCard = ({ event, onPress }) => (
  <TouchableOpacity
    style={styles.featuredCard}
    activeOpacity={1}
    onPress={() => onPress(event)}
  >
    <ImageBackground
      source={{ uri: event.image }}
      style={styles.featuredImageBackground}
      imageStyle={styles.featuredImage}
    >
      <View style={styles.featuredOverlay} />
      <View style={styles.bottomMeta}>
        <View style={styles.dateTimePill}>
          <Ionicons name="calendar-outline" size={12} color={Colors.white} />
          <Text style={styles.dateTimeText}>{event.date}</Text>
          <View style={styles.dateTimeDot} />
          <Ionicons name="time-outline" size={12} color={Colors.white} />
          <Text style={styles.dateTimeText}>{event.time}</Text>
        </View>
        <View style={styles.locationPill}>
          <Ionicons
            name={event.location === 'Online' ? 'videocam-outline' : 'location-outline'}
            size={12}
            color={Colors.white}
          />
          <Text style={styles.dateTimeText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </View>
    </ImageBackground>
    <View style={styles.featuredContent}>
      {event.category && (
        <View style={styles.featuredCategory}>
          <Text style={styles.featuredCategoryText}>{event.category}</Text>
        </View>
      )}
      <Text style={styles.featuredTitle}>{event.title}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  featuredCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredImageBackground: {
    width: '100%',
    height: 118,
  },
  featuredImage: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  bottomMeta: {
    position: 'absolute',
    left: 10,
    bottom: 10,
  },
  dateTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 24, 72, 0.74)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 24, 72, 0.74)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
    maxWidth: 230,
  },
  dateTimeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateTimeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginHorizontal: 8,
  },
  featuredContent: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  featuredDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  featuredCategory: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  featuredCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'uppercase',
  },
});
