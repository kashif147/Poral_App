// import {Label} from '@common';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { getStyles } from './styles';
import { LocalSvg } from 'react-native-svg/css';
import { Colors } from '../../utils/Styles';
// import { Colors } from '@enums';

export const TabBarIcon = ({
  focused,
  source,
  label,
  onPress,
  type,
  style,
}) => {
  const styles = getStyles({ focused });
  return (
    <TouchableOpacity style={style} disabled={!onPress} onPress={onPress}>
      <View style={styles.container}>
        <View style={[styles.buttonContaienr]}>
          {type === 'svg' ? (
            <LocalSvg asset={source} {...styles.image} />
          ) : (
            <Image
              source={source}
              resizeMode="contain"
              style={{
                ...styles.image,
                tintColor: Colors.white,
              }}
            />
          )}
        </View>
        <Text style={styles.title}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};
