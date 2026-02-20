import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../../../utils/Styles';

export const StatusCardSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Animated.View style={[styles.line, styles.titleLine, { opacity }]} />
        <Animated.View style={[styles.badge, { opacity }]} />
      </View>
      <View style={styles.timeline}>
        <Animated.View style={[styles.stepCircle, { opacity }]} />
        <Animated.View style={[styles.connector, { opacity }]} />
        <Animated.View style={[styles.stepCircle, { opacity }]} />
        <Animated.View style={[styles.connector, { opacity }]} />
        <Animated.View style={[styles.stepCircle, { opacity }]} />
      </View>
      <View style={styles.labels}>
        <Animated.View style={[styles.line, styles.labelLine, { opacity }]} />
        <Animated.View style={[styles.line, styles.labelLine, { opacity }]} />
        <Animated.View style={[styles.line, styles.labelLine, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 20,
    marginTop: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleLine: {
    width: '50%',
    height: 18,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
  },
  badge: {
    width: 80,
    height: 28,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.textSecondary,
  },
  connector: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: Colors.textSecondary,
    borderRadius: 1,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  labelLine: {
    width: 60,
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
  },
});
