import { Text as RNText, } from 'react-native';
import React, { useContext } from 'react';
import { styles } from './styles';
import { AppDataContext } from '@contexts';

export const Text = (props) => {
  const { activeTheme } = useContext(AppDataContext);
  const { children, style, onpress, numberOfLines } = props;
  const Styles = styles({ activeTheme });
  return (
    <RNText
      numberOfLines={numberOfLines}
      allowFontScaling={false}
      style={[Styles.textStyle, style]}
      onPress={onpress}>
      {children}
    </RNText>
  );
};
