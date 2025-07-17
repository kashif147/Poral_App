import { StyleSheet } from 'react-native';
import { Colors, TEXT_STYLE, wp } from '../../../utils/Styles';

export const styles = StyleSheet.create({
  textStyle: {
    color: Colors.black,
    ...TEXT_STYLE.h16M,
    fontSize: wp(3.2),
  },
});
