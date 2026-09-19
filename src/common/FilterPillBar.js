import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Colors, Radius, Spacing } from '../utils/Styles';

const PILL_HEIGHT = 34;
const PILL_GAP = 8;

/**
 * Horizontal filter pill bar with uniform height and spacing.
 * filters: [{ id, label, count? }]
 */
const FilterPillBar = ({
  filters = [],
  selectedId,
  onSelect,
  style,
  contentContainerStyle,
}) => {
  if (!filters.length) return null;

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentContainerStyle]}
      >
        {filters.map((filter, index) => {
          const selected = selectedId === filter.id;
          const label =
            filter.count != null
              ? `${filter.label} (${filter.count})`
              : filter.label;

          return (
            <TouchableOpacity
              key={filter.id}
              activeOpacity={0.85}
              onPress={() => onSelect?.(filter.id)}
              style={[
                styles.pill,
                selected && styles.pillActive,
                index < filters.length - 1 && styles.pillSpacing,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.pillText, selected && styles.pillTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    minHeight: PILL_HEIGHT + 16,
  },
  pill: {
    height: PILL_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillSpacing: {
    marginRight: PILL_GAP,
  },
  pillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  pillTextActive: {
    color: Colors.primaryDark,
  },
});

export default FilterPillBar;
