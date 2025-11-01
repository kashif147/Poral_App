import { Dimensions, Platform, StyleSheet } from 'react-native';
const transparentStatus = {
  statusBarTranslucent: true,
  statusBarColor: transparent,
};
import {
  widthPercentageToDP as wpOriginal,
  heightPercentageToDP as hpOriginal,
} from 'react-native-responsive-screen';

const ACTIVE_OPACITY = 0.9;
const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const wp = percentage =>
  wpOriginal(percentage);
const hp = percentage =>
  hpOriginal(percentage);

const statusBarColor = '#0F1214';
const primaryColor = '#21C7A8';
const secondryColor = '#1A1E21';
const tertiaryColor = '#99999B';
const btnBG = '#565658';
const textColor = '#FFFFFF';
const textColorDim = '#BBBBBB';
const transparent = 'transparent';
const white = '#FFFFFF';
const dimPrimaryColor = '#464648';

const normalFont = Platform.OS === 'ios' ? 'Inter-Regular' : 'Inter-Regular';
const mediumFont = Platform.OS === 'ios' ? 'Inter-Medium' : 'Inter-Medium';
const semiBoldFont =
  Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold';
const boldFont = Platform.OS === 'ios' ? 'Inter-Bold' : 'Inter-Bold';
const styleFont =
  Platform.OS === 'ios' ? 'RobotoFlex-Regular' : 'RobotoFlex-Regular';
const textFont = { fontFamily: normalFont };
const mediumTextFont = { fontFamily: mediumFont };
const semiTextFont = { fontFamily: semiBoldFont };
const boldTextFont = { fontFamily: boldFont };
const styleTextFont = { fontFamily: styleFont };

const Colors = {
  primary: '#3A7BF6', // Blue primary color from the image
  background: '#F5F5F5', // Light gray background
  surface: '#FFFFFF', // White surface
  primaryDark: '#2E62CC',
  primaryLight: '#E8F0FE',
  white: '#FFFFFF',
  grey70: '#48484A',
  gray: '#929292',
  lightgrey: '#F4F4F4',
  grey700: '#AEAEB2',
  ligthWhite: '#f8f8f8',
  darkgrey: '#363638',
  orange: '#F48120',
  golden: '#FFD213',
  dodgeBlue: '#2196F3',
  fruitSalad: '#4CAF50',
  black: '#000000',
  Ruby: '#E91E63',
  grey300: '#C7C7CC',
  lightYellow: '#FFC107',
  NeroBlack: '#1D1D1D',
  backFaded: 'rgba(255, 255, 255, 0.2)',
  lightsky: '#D4FFF2',
  Green: '#41AD49',
  orangePeel: '#FF9800',
  lightGreen: '#F5FFFC',
  redFaded: 'rgba(255,0,0,0.4)',
  red: 'rgb(155,0,0)',
  iconColor: '#949494',
  StarkWhite: '#CCC4B7',
  appleBlue: '#559EF8',
  Manatee: '#86868A',
  darkCharcoal: '#323234', //Divider Color
  Charcoal: '#323233',
  charlestonGreen: '#2C2C2E',
  gray9: '#171717',
  frenchGray: '#C7C7CB',
  Gray60: '#99999B',
  GreySuit: '#8E8E92',
  TricornBlack: '#2C2C2D',
  gray97: '#7F7F7F',
  JetBlack: '#323233',
  PayneGrey: '#464648',
  PictonBlue: '#4293EE',
  ChestyBond: '#526E9F',
  davyGrey: '#555555',
  gray15: '#262626',
  gray75: '#BFBFBF',
  gingerBlue: '#559EF8',
  redOrange: '#FF2222',
  pinkSwan: '#B2B2B2',
  eclipse: '#363637',
  SpanishGray: '#989898',
  GunPowder: '#575759',
  Alabaster: '#FAFAFA',
  Gray22: '#383838',
  SpanishGray99: '#98979C',
  RaisanBlack: '#282829',
  silver: '#C5C5C5',
  Gray88: '#E0E0E0',
  dullBlack: '#161616',
  pureBlue: '#0095F6',
  lightishBlue: '#3F86F7',
  congressBlue: '#64B1F9',
  seaGreen: '#4F9289',
  deepOrange: '#EA8634',
  aluminium: '#8A8A8D',
  Pantone: '#5A5F65',
  PantoneC: '#89898D',
  Magenta: '#5E5E5F',
  blackRussian: '#1C1C1D',
  blackRussian1: '#1C1C1E',
  Gray35: '#59595D',
  lightSilver: '#CBCBD0',
  grey500: '#8E8E93',
  grey600: '#636366',
  halfWhite: '#F8F8FF',
  dimGray: '#C6C6CC',
  Smokey: '#646467',
  santasGray: '#9D9DA6',
  Azure: '#9B9CA2',
  extraSilver: '#C4C4C4',
  cyanBlue: '#0095F6',
  RaisinBlack: '#202022',
  SuvaGrey: '#929296',
  CharcoalGray: '#564E46',
  StonewallGrey: '#C1C1C1',
  NightRider: '#303030',
  dimWhite: '#F2F2F2',
  MediumSilver: '#B9B9B9',
  Blue: '#3A82F7',
  Gray66: '#A8A8A8',
  MidGray: '#656569',
  SlateGray: '#98989E',
  darkCharcoal2: '#333434',
  brightRed: '#EB4D3D',
  Gray24: '#3D3D3D',
  LoveRed: '#E41F17',
  Gray59: '#969696',
  StormGray: '#787A7D',
  grey900: '#2D2C2E',
  searchFaded: 'rgba(255,255,255,0.25)',
  silvedFaded: 'rgba(196, 196, 196, 0.7)',
  whiteFaded: 'rgba(255, 255, 255, 0)',
  backdrop: 'rgba(0, 0, 0, 0.4)',
  blurEffect: 'rgba(0, 0, 0, 0.5)',
  blackShadow: '#rgba(0, 0, 0, 0.6)',
  blackFaded: 'rgba(0, 0, 0, 0.7)',
  blackOpaque: 'rgba(0, 0, 0, 0.9)',
  fadedBlack: 'rgba(0, 0, 0, 0)',
  naturalGrey: '#F2F2F7',
  grey950: '#1C1B1D',
  grey800: '#3A3A3C',
  red50: '#FF443A',
  grey50: '#F2F2F7',
  blue100: '#4293EE',
  blue200: '#0A84FF',
  lightgray: '#E7E7E7',
  textPrimary: '#1A1A1A', // Dark text for light theme
  textSecondary: '#666666', // Secondary text color
  cardBackground: '#FFFFFF', // Card background
  divider: '#E5E5E5', // Divider color
};

const Fonts = {
  Satoshi: {
    Regular: 'Satoshi-Regular',
    Medium: 'Satoshi-Medium',
    SemiBold: 'Satoshi-SemiBold',
    Bold: 'Satoshi-Bold',
  },
};

export const FontStyles = {
  Satoshi: {
    Regular: { fontFamily: Fonts.Satoshi.Regular },
    Medium: { fontFamily: Fonts.Satoshi.Medium },
    SemiBold: { fontFamily: Fonts.Satoshi.SemiBold },
    Bold: { fontFamily: Fonts.Satoshi.Bold },
  },
};

const TEXT_STYLE = StyleSheet.create({
  h8: {
    ...FontStyles.Satoshi.Regular,
    fontSize: hp(1),
    fontWeight: '400',
  },
  h10: {
    ...FontStyles.Satoshi.Regular,
    fontSize: hp(1.2),
    fontWeight: '400',
  },
  h12: {
    ...FontStyles.Satoshi.Regular,
    fontSize: hp(1.4),
    fontWeight: '400',
  },
  h12B: {
    ...FontStyles.Satoshi.Bold,
    fontSize: hp(1.4),
    fontWeight: '700',
  },
  h12SB: {
    ...FontStyles.Satoshi.SemiBold,
    fontSize: hp(1.4),
    fontWeight: '600',
  },
  h14: {
    ...FontStyles.Satoshi.Regular,
    fontSize: hp(1.4),
    fontWeight: '400',
  },
  h14M: {
    ...FontStyles.Satoshi.Medium,
    fontSize: hp(1.6),
    fontWeight: '500',
  },
  h14B: {
    ...FontStyles.Satoshi.Bold,
    fontSize: hp(1.55),
    fontWeight: '700',
  },
  h14S: {
    ...FontStyles.Satoshi.SemiBold,
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  h15B: {
    ...FontStyles.Satoshi.SemiBold,
    fontSize: hp(1.5),
    fontWeight: '600',
  },
  h15RB: {
    ...FontStyles.Satoshi.Regular,
    fontSize: hp(1.5),
    fontWeight: '500',
  },
  h16: {
    ...FontStyles.Satoshi.Regular,
    fontSize: hp(1.5),
    fontWeight: '500',
  },
  h16M: {
    ...FontStyles.Satoshi.Medium,
    fontSize: hp(1.3),
    fontWeight: '500',
  },
  h16SB: {
    ...FontStyles.Satoshi.SemiBold,
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  h16B: {
    ...FontStyles.Satoshi.Bold,
    fontSize: hp(1.7),
    fontWeight: '700',
  },
  h18: {
    ...FontStyles.Satoshi.Regular,
    fontSize: hp(1.7),
    fontWeight: '400',
  },
  h18RB: {
    ...FontStyles.Satoshi.Regular,
    fontSize: hp(1.9),
    fontWeight: '600',
  },
  h18B: {
    ...FontStyles.Satoshi.Bold,
    fontSize: hp(1.8),
    fontWeight: '700',
  },
  h18M: {
    ...FontStyles.Satoshi.Medium,
    fontSize: hp(1.9),
    fontWeight: '500',
  },
  h19B: {
    ...FontStyles.Satoshi.Bold,
    fontSize: hp(2.1),
    fontWeight: '700',
  },
  h20M: {
    ...FontStyles.Satoshi.Medium,
    fontSize: hp(2.1),
    fontWeight: '500',
  },
  h20B: {
    ...FontStyles.Satoshi.Bold,
    fontSize: hp(2.2),
    fontWeight: '700',
  },
  h20R: {
    ...FontStyles.Satoshi.Regular,
    fontSize: hp(2.1),
    fontWeight: '300',
  },
  h24S: {
    ...FontStyles.Satoshi.SemiBold,
    fontSize: hp(2.1),
    fontWeight: '600',
    color: Colors.black,
  },
  h24M: {
    ...FontStyles.Satoshi.Medium,
    fontSize: hp(2.7),
    fontWeight: '500',
  },
  h24B: {
    ...FontStyles.Satoshi.Bold,
    fontSize: hp(2.7),
    fontWeight: '700',
  },
  h24BS: {
    ...FontStyles.Satoshi.SemiBold,
    fontSize: hp(2.7),
    fontWeight: '600',
  },
  h30B: {
    ...FontStyles.Satoshi.Bold,
    fontSize: hp(3.5),
    fontWeight: '700',
  },
  h40B: {
    ...FontStyles.Satoshi.Bold,
    fontSize: hp(4.2),
    fontWeight: '700',
  },
});

const form = StyleSheet.create({
  inputBG: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    backgroundColor: Colors.white,
    height: wp(13),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputText: {
    ...TEXT_STYLE.h14M,
    flex: 1,
    textAlignVertical: 'center',
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '400',
  },
});

const container = StyleSheet.create({
  parent: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { flex: 1 },
  roundFormBG: {
    flex: 1,
    paddingVertical: hp(3.0),
    borderTopStartRadius: wp(3.0),
    borderTopEndRadius: wp(3.0),
    borderTopLeftRadius: wp(3.0),
    borderTopRightRadius: wp(3.0),
    marginTop: hp(-0.2),
  },
});

const Popupmenu = StyleSheet.create({
  Options: {
    ...TEXT_STYLE.h14M,
    color: Colors.primary,
    textAlign: 'center',

    fontWeight: '700',
  },
  Optioncont: {
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  OptionPadding: {
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  selectedOption: { color: '#fff', fontWeight: 'bold' },
});

const commonStyles = StyleSheet.create({
  flex1: { flex: 1 },
  flexGrow1: { flexGrow: 1 },
  flex1Row: { flex: 1, flexDirection: 'row' },
  flexRow: { flexDirection: 'row' },
  screenContainer: {
    flex: 1,
    paddingHorizontal: wp(2),
  },
  horizontalView: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  horizontalView_m05: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: hp(0.5),
  },
  horizontalView_m1: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: hp(1),
  },
  justifyView: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  justifyView_m05: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(0.5),
  },
  justifyView_m1: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(1),
  },
  justifyView_m2: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(2),
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow_5: {
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  shadow_3: {
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  shadow_10: {
    elevation: 10,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  shadow_20: {
    elevation: 20,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
  },
  noPadding: {
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingStart: 0,
    paddingEnd: 0,
  },
  noMargin: {
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
    marginStart: 0,
    marginEnd: 0,
  },
  bottomView: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderTopRightRadius: hp(1.4),
    borderTopLeftRadius: hp(1.4),
    paddingHorizontal: '5%',
    paddingTop: hp(2),
    paddingBottom: Platform.OS === 'ios' ? hp(3.3) : hp(2),
  },

  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },

  floatingButtonContainer: {
    position: 'absolute',
    right: wp(7),
    bottom: hp(2),
    borderRadius: 1000,
  },
  floatingButton: { padding: wp(2) },
  flatlistCardContainer: {
    flexGrow: 0.5,
    margin: wp(1.8),
  },
  emptyDesc: {
    width: wp((33.5 / Dimensions.get('window').width) * 100),
    // width: wp((1 / 2) * 100)
  },
  fallingImage: {
    position: 'absolute',
    right: -wp(25),
  },
  riseImage: {
    position: 'absolute',
    left: -wp(25),
  },
  authTabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  authRiseImageContainer: { left: 0 },
  authFallingImageContainer: { right: 0 },
  authRiseImageStyle: { width: wp(30) },
  authFallingImageStyle: { width: wp(30) },

  authContentBoxStyle: {
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  authGradientContainer: {
    flex: 1,
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
    paddingHorizontal: wp(5),
    marginTop: hp(2),
    paddingTop: hp(12),
  },
  gradientScreenContainer: {
    flex: 1,
    paddingTop: hp(4),
  },
  horizontalRowBarWithSearch: { paddingTop: 0, paddingVertical: 0 },
  horizontalSearchBarWithRow: {
    paddingTop: hp(1),
  },
  tabletCommentWrapper: {
    marginLeft: 20,
    marginTop: 20,
  },
});

const shadow = StyleSheet.create({
  whiteShadow: {
    shadowColor: Colors.white,
    shadowOffset: {
      width: 0,
      height: hp(0.03),
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  blackShadow: {
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
});
const btnStyle = StyleSheet.create({
  btnBG: {
    height: 52,
    paddingHorizontal: wp(6),
    borderRadius: 12,
    borderWidth: 0,
    borderColor: Colors.transparent,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  btnText: {
    ...FontStyles.Satoshi.Bold,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  btnTextCol: {
    ...FontStyles.Satoshi.Medium,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});


export {
  wp,
  hp,
  transparentStatus,
  textFont,
  semiTextFont,
  boldTextFont,
  mediumFont,
  textColorDim,
  btnStyle,
  statusBarColor,
  dimPrimaryColor,
  btnBG,
  white,
  textColor,
  mediumTextFont,
  styleTextFont,
  container,
  primaryColor,
  secondryColor,
  tertiaryColor,
  // headings,
  form,
  shadow,
  transparent,
  Colors,
  TEXT_STYLE,
  commonStyles,
  ACTIVE_OPACITY,
};
