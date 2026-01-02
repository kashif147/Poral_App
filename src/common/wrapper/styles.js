import { StyleSheet } from 'react-native';
import { Colors } from '../../utils/Styles';
export const getStyles = ({
  style,
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.surface,
      width: '100%',
      alignSelf: 'stretch',
      ...style,
    },
    safeAreaView: {
      flex: 1,
      backgroundColor: Colors.surface,
      ...style,
    },
  });
