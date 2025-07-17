import { Text, TextStyle, StyleProp } from 'react-native';
import React from 'react';
import { styles } from './styles';
import { useTheme } from '@contexts';

export const Label = (props) => {
  const { THEME_COLOR } = useTheme();
  const { children, style, onpress } = props;
  const Styles = styles({ THEME_COLOR });
  return (
    <Text
      allowFontScaling={false}
      style={[Styles.textStyle, style]}
      onPress={onpress}>
      {children}
    </Text>
  );
};
