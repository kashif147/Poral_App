import React, { forwardRef, useState, useEffect } from 'react';
import { Platform, View, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { form, Colors } from '../../utils/Styles';

const Picker = forwardRef(({ style, itemStyle, containerStyle, enabled = true, selectedValue, onValueChange, children, ...props }, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(selectedValue);

  // Sync tempValue when selectedValue changes externally
  useEffect(() => {
    setTempValue(selectedValue);
  }, [selectedValue]);

  // Get the label for the selected value
  const getSelectedLabel = () => {
    if (!children) return 'Select...';
    const childArray = React.Children.toArray(children);
    const selectedChild = childArray.find(child => child?.props?.value === selectedValue);
    return selectedChild?.props?.label || 'Select...';
  };

  const handleDone = () => {
    onValueChange?.(tempValue);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setTempValue(selectedValue);
    setIsModalVisible(false);
  };

  // Default text styling that matches InputField
  const defaultItemStyle = {
    ...form.inputText,
    color: Colors.textPrimary,
    fontSize: 15,
  };

  // Default picker styling - matches InputField text styling
  const defaultStyle = {
    ...form.inputText,
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
  };

  // Container styling - matches InputField container
  const defaultContainerStyle = {
    ...form.inputBG,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  };

  // iOS: Show as touchable with modal
  if (Platform.OS === 'ios') {
    return (
      <>
        <TouchableOpacity
          style={[defaultContainerStyle, containerStyle]}
          onPress={() => {
            if (enabled) {
              setTempValue(selectedValue);
              setIsModalVisible(true);
            }
          }}
          disabled={!enabled}
        >
          <Text 
            style={[
              defaultStyle, 
              style, 
              { paddingHorizontal: 12, paddingVertical: 12 },
              !enabled && { opacity: 0.5 }
            ]}
            numberOfLines={1}
          >
            {getSelectedLabel()}
          </Text>
          <Text style={iosStyles.dropdownIcon}>▼</Text>
        </TouchableOpacity>

        <Modal
          visible={isModalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={iosStyles.modalOverlay}>
            <TouchableOpacity 
              style={iosStyles.backdrop} 
              activeOpacity={1} 
              onPress={handleCancel}
            />
            <View style={iosStyles.modalContent}>
              <View style={iosStyles.toolbar}>
                <TouchableOpacity onPress={handleCancel} style={iosStyles.toolbarButton}>
                  <Text style={iosStyles.toolbarButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDone} style={iosStyles.toolbarButton}>
                  <Text style={[iosStyles.toolbarButtonText, iosStyles.toolbarButtonDone]}>Done</Text>
                </TouchableOpacity>
              </View>
              <RNPicker
                ref={ref}
                selectedValue={tempValue}
                onValueChange={setTempValue}
                style={iosStyles.picker}
                itemStyle={defaultItemStyle}
                {...props}
              >
                {React.Children.toArray(children)}
              </RNPicker>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Android: Use native picker (works as dropdown)
  return (
    <View style={[defaultContainerStyle, containerStyle]}>
      <RNPicker
        ref={ref}
        enabled={enabled}
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={[defaultStyle, style]}
        itemStyle={[defaultItemStyle, itemStyle]}
        {...props}
      >
        {children}
      </RNPicker>
    </View>
  );
});

const iosStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  toolbarButton: {
    padding: 8,
  },
  toolbarButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  toolbarButtonDone: {
    fontWeight: '600',
  },
  picker: {
    width: '100%',
    height: 216,
  },
  dropdownIcon: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingRight: 12,
    opacity: 0.8,
  },
});

Picker.Item = RNPicker.Item;

export default Picker;
