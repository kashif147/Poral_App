// import { Label, Loader, Touchable } from '@common';
import { btnStyle, Colors } from '@enums';
import React from 'react';
import { TouchableOpacityProps, View } from 'react-native';
import { getStyles } from './styles';
import { Label } from '../text/label';
import { Touchable } from '../touchable';
import { Loader } from '../loader';


export const Button = ({
  title,
  onPress,
  icon1,
  icon2,
  style,
  innerStyle,
  textStyle,
  disabled,
  isloading,
  outlined,
  type,
  ...props
}) => {
  const styles = getStyles({
    disabled,
    outlined,
    isloading,
    type,
  });
  return (
    <Touchable
      style={{ ...styles.container, ...style }}
      onPress={() => onPress && onPress()}
      disabled={disabled}
      {...props}>
      <View style={[styles.innerContainer, innerStyle]}>
        {icon1}
        {!isloading && (
          <Label
            style={{
              ...btnStyle.btnText,
              ...styles.titleStyle,
              ...textStyle,
            }}>
            {title}
          </Label>
        )}
        {isloading && <Loader color={Colors.white} />}
        {icon2}
      </View>
    </Touchable>
  );
};
