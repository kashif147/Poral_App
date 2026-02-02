import React from 'react';
import { Modal, View, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Label } from '../text/label';
import { Colors } from '../../utils/Styles';

const StaffSelectionModal = ({
  visible,
  title = 'Select Staff',
  staffList,
  selectedStaffIds = [],
  onSelect,
  onClose,
}) => {
  const availableStaff = staffList.filter(
    (s) => !selectedStaffIds.includes(s.id),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          <Label style={styles.title}>{title}</Label>
          {availableStaff.map((staff) => (
            <TouchableOpacity
              key={staff.id}
              style={styles.item}
              onPress={() => onSelect?.(staff)}
              activeOpacity={0.7}
            >
              <Label>{staff.name}</Label>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Label style={styles.cancelText}>Cancel</Label>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.textPrimary,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});

export default StaffSelectionModal;
