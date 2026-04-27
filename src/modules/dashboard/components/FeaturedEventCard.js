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

export const FeaturedEventCard = ({ event, onPress, onRegisterPress }) => (
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
    </ImageBackground>
    <View style={styles.featuredContent}>
      {event.category && (
        <View style={styles.featuredCategory}>
          <Text style={styles.featuredCategoryText}>{event.category}</Text>
        </View>
      )}
      <Text style={styles.featuredTitle}>{event.title}</Text>
      <View style={styles.featuredDetails}>
        <View style={styles.featuredDetailRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.featuredDetailText}>{event.date}</Text>
        </View>
        <View style={styles.featuredDetailRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.featuredDetailText}>{event.time}</Text>
        </View>
        <View style={styles.featuredDetailRow}>
          <Ionicons
            name={
              event.location === 'Online'
                ? 'videocam-outline'
                : 'location-outline'
            }
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.featuredDetailText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </View>
      <Text style={styles.featuredDescription} numberOfLines={2}>
        {event.description}
      </Text>
      <TouchableOpacity
        style={styles.registerButton}
        onPress={e => {
          e.stopPropagation();
          onRegisterPress(event);
        }}
      >
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>
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
    height: 132,
  },
  featuredImage: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
  featuredDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featuredDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  featuredDetailText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 3,
    maxWidth: 120,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
