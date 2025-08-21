import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { form, Colors } from '../../utils/Styles';

const Picker = forwardRef(({ style, itemStyle, ...props }, ref) => {
  const textLikeInput = {
    ...form.inputText,
    color: Colors.black,
  };

  const defaultStyle = Platform.OS === 'ios'
    ? { height: 44 }
    : {
        height: form.inputBG.height,
        color: Colors.black,
        textAlignVertical: 'center',
        fontSize: form.inputText.fontSize,
      };

  return (
    <RNPicker
      ref={ref}
      style={[defaultStyle, style]}
      itemStyle={[textLikeInput, itemStyle]}
      {...props}
    />
  );
});

Picker.Item = RNPicker.Item;

export default Picker;
