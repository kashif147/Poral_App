import { StyleSheet } from 'react-native';
import { Colors, hp, wp } from '../../utils/Styles';

export const getStyles = ({
  disabled,
  outlined,
  isloading,
  type,
}) =>
  StyleSheet.create({
    container: {
      ...(type === 'tag'
        ? { paddingHorizontal: wp(3), paddingVertical: hp(0.6) }
        : { height: wp(12.5) }),
      borderRadius: hp(4),
      backgroundColor:
        disabled || isloading
          ? Colors.grey800
          : outlined
            ? Colors.grey500
            : Colors.grey900,
      ...(outlined && { borderWidth: 1, borderColor: Colors.primary }),
    },
    innerContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleStyle: {
      fontSize: wp(4),
      color: outlined ? Colors.grey600 : Colors.white,
    },
    leftIconView: { paddingRight: wp(2) },
    rightIconView: { paddingLeft: wp(2) },
  });
