import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, wp } from '../../utils/Styles';

const HamburgerIcon = ({ color = Colors.iconColor, size = wp(5) }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.line, { backgroundColor: color, width: size * 0.6 }]} />
      <View style={[styles.line, { backgroundColor: color, width: size * 0.6 }]} />
      <View style={[styles.line, { backgroundColor: color, width: size * 0.6 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    height: 2,
    marginVertical: 1,
    borderRadius: 1,
  },
});

export default HamburgerIcon;
