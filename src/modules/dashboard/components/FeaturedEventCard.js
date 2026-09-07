import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SvgXml } from 'react-native-svg';
import { Colors } from '../../../utils/Styles';
import {
  getRegistrationStatusLabel,
  isRegistrationLocked,
} from '../../../helpers/events.helper';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COMPACT_CARD_WIDTH = SCREEN_WIDTH * 0.9;
const IMAGE_HEIGHT = 120;

const SVG_DATA_URI_PREFIX = 'data:image/svg+xml;base64,';

const resolveImageUri = event => {
  const raw =
    event?.image ||
    event?.imageUrl ||
    event?.raw?.imageUrl ||
    event?.rawRegistration?.imageUrl ||
    '';
  return typeof raw === 'string' ? raw.trim() : '';
};

// Manual base64 decoder — avoids depending on atob/Buffer being polyfilled in RN.
const base64ToUtf8 = base64 => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  let output = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '=') break;
    const val = chars.indexOf(c);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  try {
    // Handle UTF-8 multi-byte sequences correctly (SVGs may contain
    // non-ASCII chars like em-dashes, &amp; entities, etc.)
    return decodeURIComponent(escape(output));
  } catch (e) {
    return output;
  }
};

const getSvgXmlFromDataUri = uri => {
  if (!uri || !uri.startsWith(SVG_DATA_URI_PREFIX)) return null;
  const base64 = uri.slice(SVG_DATA_URI_PREFIX.length);
  try {
    return base64ToUtf8(base64);
  } catch (e) {
    return null;
  }
};

export const FeaturedEventCard = ({
  event,
  onPress,
  compact = false,
  embedded = false,
}) => {
  const imageUri = resolveImageUri(event);
  const svgXml = getSvgXmlFromDataUri(imageUri);
  const isLocked = isRegistrationLocked(event);
  const statusLabel = getRegistrationStatusLabel(event?.status);
  const statusKey = String(event?.status || '').toLowerCase();
  const statusColor =
    statusKey === 'submitted' ? '#B45309' : Colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.featuredCard,
        compact && styles.featuredCardCompact,
        embedded && styles.featuredCardEmbedded,
      ]}
      activeOpacity={1}
      onPress={() => onPress?.(event)}
    >
      {svgXml ? (
        <View style={styles.imageWrap}>
          <SvgXml
            xml={svgXml}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
          />
        </View>
      ) : imageUri ? (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imageUri }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <View style={styles.featuredContent}>
        {event.category ? (
          <View style={styles.featuredCategory}>
            <Text style={styles.featuredCategoryText}>{event.category}</Text>
          </View>
        ) : null}
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {event.title}
        </Text>

        {(event.date || event.time) ? (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.date || 'Date TBD'}
              {event.time ? ` · ${event.time}` : ''}
            </Text>
          </View>
        ) : null}

        {event.location ? (
          <View style={styles.metaRow}>
            <Ionicons
              name={
                event.location === 'Online' ? 'videocam-outline' : 'location-outline'
              }
              size={14}
              color={Colors.primary}
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        ) : null}

        {isLocked ? (
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

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
  featuredCardCompact: {
    width: COMPACT_CARD_WIDTH,
    marginHorizontal: 0,
    marginRight: 12,
  },
  featuredCardEmbedded: {
    marginHorizontal: 0,
  },
  imageWrap: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#0A1F2E', // matches the SVG banner's dark gradient stop
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredContent: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  featuredCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  featuredCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  statusText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
});