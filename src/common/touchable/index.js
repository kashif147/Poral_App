import { TouchableOpacity, ActivityIndicator } from 'react-native';
import React from 'react';
import { getStyles } from './styles';
import { ACTIVE_OPACITY, Colors } from '../../utils/Styles';
import { If } from '../If';

export const Touchable = (props) => {
  const {
    children,
    textStyle,
    style,
    onPress,
    disabled,
    isLoading,
    underline,
    activeOpacity,
    isTextLight,
  } = props;
  const styles = getStyles({ underline, isTextLight });
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity || ACTIVE_OPACITY}
      style={[styles.container, style]}
      disabled={disabled || !onPress}
      onPress={() => {
        onPress && onPress();
      }}>
      <If
        condition={!isLoading}
        elseComp={<ActivityIndicator color={Colors.white} />}>
        {children?.length === undefined ? (
          children
        ) : (
          <Label style={[styles.titleStyle, textStyle]}>{children}</Label>
        )}
      </If>
    </TouchableOpacity>
  );
};
