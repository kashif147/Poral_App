import { StyleSheet } from 'react-native';
import { Colors, Radius, Shadows, wp } from '../../utils/Styles';

export const getStyles = ({
  disabled,
  outlined,
  isloading,
  type,
  primary,
}) =>
  StyleSheet.create({
    container: {
      ...(type === 'tag'
        ? {
            paddingHorizontal: wp(3),
            paddingVertical: 6,
            borderRadius: Radius.full,
          }
        : {
            height: 50,
            paddingHorizontal: wp(5),
            ...(primary && !outlined && !disabled && !isloading
              ? Shadows.soft
              : Shadows.none),
            borderWidth: 0,
          }),
      borderRadius: type === 'tag' ? Radius.full : Radius.md,
      backgroundColor:
        disabled || isloading
          ? Colors.muted
          : outlined
            ? 'transparent'
            : Colors.primary,
      ...(outlined && {
        borderWidth: 1.5,
        borderColor: disabled ? Colors.border : Colors.primary,
        backgroundColor: 'transparent',
      }),
      ...(disabled && {
        opacity: 0.55,
      }),
    },
    innerContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: wp(2),
      flex: 1,
    },
    titleStyle: {
      fontSize: 15,
      fontWeight: '600',
      color: outlined
        ? disabled
          ? Colors.textMuted
          : Colors.primary
        : disabled
          ? Colors.textSecondary
          : Colors.white,
      letterSpacing: 0.2,
      textAlign: 'center',
      textTransform: 'none',
    },
    leftIconView: {
      paddingRight: wp(2),
      marginRight: wp(1),
    },
    rightIconView: {
      paddingLeft: wp(2),
      marginLeft: wp(1),
    },
  });
