import { Text, TextStyle, StyleProp } from 'react-native';
import React from 'react';
import { styles } from './styles';

export const Label = (props) => {
  const { children, style, onpress } = props;
  return (
    <Text
      allowFontScaling={false}
      style={[styles.textStyle, style]}
      onPress={onpress}>
      {children}
    </Text>
  );
};
