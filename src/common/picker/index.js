import React, { forwardRef } from 'react';
import { Platform, View } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { form, Colors } from '../../utils/Styles';

const Picker = forwardRef(({ style, itemStyle, containerStyle, ...props }, ref) => {
  // Default text styling that matches InputField
  const defaultItemStyle = {
    ...form.inputText,
    color: Colors.black,
  };

  // Default picker styling - matches InputField text styling
  const defaultStyle = {
    ...form.inputText,
    color: Colors.black,
    flex: 1,
  };

  // Container styling - matches InputField container
  const defaultContainerStyle = {
    ...form.inputBG,
    flexDirection: 'row',
    alignItems: 'center',
  };

  return (
    <View style={[defaultContainerStyle, containerStyle]}>
      <RNPicker
        ref={ref}
        style={[defaultStyle, style]}
        itemStyle={[defaultItemStyle, itemStyle]}
        {...props}
      />
    </View>
  );
});

Picker.Item = RNPicker.Item;

export default Picker;
