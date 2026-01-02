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
        ? { paddingHorizontal: wp(3), paddingVertical: hp(0.6), borderRadius: 20 }
        : { 
            height: 52,
            paddingHorizontal: wp(5),
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: primary && !outlined ? 4 : 2,
            },
            shadowOpacity: primary && !outlined ? 0.2 : 0.08,
            shadowRadius: primary && !outlined ? 8 : 4,
            elevation: primary && !outlined ? 6 : 2,
            borderWidth: 0,
          }),
      borderRadius: 12,
      backgroundColor:
        disabled || isloading
          ? '#CCCCCC'
          : outlined
            ? 'transparent'
            : primary
              ? Colors.primary
              : Colors.primary,
      ...(outlined && { 
        borderWidth: 2, 
        borderColor: disabled ? '#CCCCCC' : Colors.primary,
        backgroundColor: 'transparent',
      }),
      ...(!outlined && !disabled && !isloading && {
        backgroundColor: primary ? Colors.primary : Colors.primary,
      }),
      ...(primary && !outlined && !disabled && !isloading && {
        backgroundColor: Colors.primary,
      }),
      ...(disabled && {
        opacity: 0.5,
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
      fontSize: 16,
      fontWeight: '600',
      color: outlined 
        ? (disabled ? '#999999' : Colors.primary)
        : (disabled ? '#666666' : Colors.white),
      letterSpacing: 0.3,
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
