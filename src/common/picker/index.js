import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { form } from '../../utils/Styles';

const Picker = forwardRef(({ style, ...props }, ref) => {
  const defaultStyle = Platform.OS === 'ios'
    ? { height: 44 }
    : { ...form.inputBG, width: '100%', color: 'black' };

  return (
    <RNPicker
      ref={ref}
      style={[defaultStyle, style]}
      {...props}
    />
  );
});

Picker.Item = RNPicker.Item;

export default Picker;
