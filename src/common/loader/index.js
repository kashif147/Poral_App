import React from 'react';
import { ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../../utils/Styles';


export const Loader = ({ color, size, style, nostyle, overlay }) => {
  const containerStyle = overlay
    ? [styles.overlayContainer, style]
    : [style ? style : nostyle === true ? {} : styles.container];

  return (
    <SafeAreaView style={containerStyle} pointerEvents="auto">
      <ActivityIndicator
        size={size === undefined ? 'large' : size}
        color={color === undefined ? Colors.primary : color}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Ensure it's on top
    pointerEvents: 'auto', // Block interactions with components behind
  },
});
