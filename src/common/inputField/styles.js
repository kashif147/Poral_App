import {StyleSheet} from 'react-native';
import { Colors, form, wp } from '../../utils/Styles';

export const styles = StyleSheet.create({
  textStyle: {
    fontSize: 12,
    marginRight: 5,
  },
  svgStyle: {
    marginRight: 10,
  },
  flexbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressicon4: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(4),
  },
  titleStyle: {
    fontSize: 12,
    marginRight: 5,
    color: Colors.primary,
    alignItems: 'center',
  },
  smallMargin: {
    margin: 5,
  },

  textinputContainer: {
    ...form.inputBG,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
