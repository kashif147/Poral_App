import { StyleSheet } from 'react-native';
import { Colors, hp, wp } from '../../utils/Styles';

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
        ? { paddingHorizontal: wp(3), paddingVertical: hp(0.6) }
        : { 
            height: wp(12.5),
            paddingHorizontal: wp(4),
            shadowColor: Colors.black,
            shadowOffset: {
              width: 0,
              height: primary ? 6 : 4,
            },
            shadowOpacity: primary ? 0.25 : 0.15,
            shadowRadius: primary ? 12 : 8,
            elevation: primary ? 12 : 8,
            borderWidth: 0,
          }),
      borderRadius: hp(2.5),
      backgroundColor:
        disabled || isloading
          ? '#5A6B6B'
          : outlined
            ? Colors.surface
            : primary
              ? Colors.primary
              : Colors.primary,
      ...(outlined && { 
        borderWidth: 2, 
        borderColor: Colors.primary,
        backgroundColor: Colors.surface,
      }),
      ...(!outlined && !disabled && !isloading && {
        backgroundColor: primary ? Colors.primary : Colors.primary,
      }),
      ...(primary && !outlined && !disabled && !isloading && {
        backgroundColor: Colors.primary,
      }),
      ...(disabled && {
        opacity: 0.6,
      }),
    },
    innerContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: wp(2),
      minHeight: wp(10),
    },
    titleStyle: {
      fontSize: primary ? wp(4.5) : wp(4.2),
      fontWeight: primary ? '700' : '600',
      color: outlined ? Colors.primary : Colors.white,
      letterSpacing: primary ? 0.8 : 0.5,
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
