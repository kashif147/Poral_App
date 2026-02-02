import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Label } from '../text/label';
import { Colors } from '../../utils/Styles';
import { getStatusColor, getStatusBg } from '../../utils/status.utils';

const CaseDetailContent = ({ item }) => {
  if (!item) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name="pricetag" size={20} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Label style={styles.label}>Case ID</Label>
          <Label style={styles.value}>{item.id}</Label>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Label style={styles.label}>Date Created</Label>
          <Label style={styles.value}>{item.date}</Label>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Label style={styles.label}>Status</Label>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusBg(item.status) },
            ]}
          >
            <Label style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Label>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  iconContainer: {
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
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 2,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default CaseDetailContent;
