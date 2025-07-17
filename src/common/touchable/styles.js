import {StyleSheet} from 'react-native';
import { hp } from '../../utils/Styles';

export const getStyles = ({ underline, isTextLight}) =>
  StyleSheet.create({
    titleStyle: {
      fontSize: hp(1.8),
      fontWeight: '500',
      ...(isTextLight && {opacity: 0.7}),
      ...(underline && {textDecorationLine: 'underline'}),
    },
    container: {
      justifyContent: 'center',
    },
  });
