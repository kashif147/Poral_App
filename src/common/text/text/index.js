import { Text as RNText, } from 'react-native';
import React, { useContext } from 'react';
import { styles } from './styles';

export const Text = (props) => {
  const { children, style, onpress, numberOfLines } = props;
  return (
    <RNText
      numberOfLines={numberOfLines}
      allowFontScaling={false}
      style={[styles.textStyle, style]}
      onPress={onpress}>
      {children}
    </RNText>
  );
};
