import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Label } from '../text/label';
import { Colors } from '../../utils/Styles';

const TimePickerModal = ({ visible, value, onSelect, onClose }) => {
  if (!visible) return null;

  const handleChange = (event, date) => {
    if (event?.type === 'dismissed') {
      onClose?.();
      return;
    }
    if (date) {
      onSelect?.(date);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content}>
          <RNDateTimePicker
            value={value}
            mode="time"
            display="spinner"
            onChange={handleChange}
          />
          <Pressable onPress={onClose} style={styles.doneButton}>
            <Label style={styles.doneText}>Done</Label>
          </Pressable>
        </View>
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
    padding: 16,
    alignItems: 'flex-end',
  },
  doneButton: {
    padding: 12,
  },
  doneText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '600',
  },
});

export default TimePickerModal;
