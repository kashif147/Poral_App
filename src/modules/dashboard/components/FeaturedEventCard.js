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
    marginBottom: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredImageBackground: {
    width: '100%',
    height: 160,
  },
  featuredImage: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  featuredCategory: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  featuredCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  featuredDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  featuredDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  featuredDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    maxWidth: 140,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
