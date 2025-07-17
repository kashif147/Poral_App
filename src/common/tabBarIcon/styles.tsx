// import {Colors, hp, wp} from '@enums/StyleGuide';
import { StyleSheet } from 'react-native';
import { Colors } from '../../utils/Styles';

export const getStyles = ({ focused }: { focused: boolean }) =>
  StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    buttonContaienr: {
      borderRadius: 100,
      paddingVertical: 8,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? Colors.grey800 : 'transparent',
    },
    image: {
      height: 20,
      width: 20,
    },
    title: { fontSize: 12, fontWeight: '600', color: Colors.white },
  });
