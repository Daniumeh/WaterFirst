import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors, shadow, spacing } from '@/src/theme/tokens';

type KidneyProgressRingProps = {
  progress: number;
  size?: 'hero' | 'mini';
};

export function KidneyProgressRing({ progress, size = 'hero' }: KidneyProgressRingProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const [animatedProgress] = useState(() => new Animated.Value(clampedProgress));
  const shouldAnimate = process.env.NODE_ENV !== 'test';

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }

    Animated.timing(animatedProgress, {
      toValue: clampedProgress,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, clampedProgress, shouldAnimate]);

  const staticWaterTop = `${96 - clampedProgress * 96}%` as `${number}%`;
  const waterTop = shouldAnimate
    ? animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['96%', '0%'],
      })
    : staticWaterTop;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.ringOuter, size === 'mini' && styles.ringOuterMini]}>
        <View style={[styles.ringInner, size === 'mini' && styles.ringInnerMini]}>
          <View style={[styles.kidneyStage, size === 'mini' && styles.kidneyStageMini]}>
            <View style={styles.ureterLeft} />
            <View style={styles.ureterRight} />
            <View style={styles.ureterStemLeft} />
            <View style={styles.ureterStemRight} />
            <KidneyLobe side="left" waterTop={waterTop} />
            <KidneyLobe side="right" waterTop={waterTop} />
          </View>
          {size === 'hero' ? <Text style={styles.centerLabel}>Keep Going!</Text> : null}
        </View>
      </View>
    </View>
  );
}

type KidneyLobeProps = {
  side: 'left' | 'right';
  waterTop: `${number}%` | Animated.AnimatedInterpolation<string | number>;
};

function KidneyLobe({ side, waterTop }: KidneyLobeProps) {
  return (
    <View style={[styles.kidney, side === 'left' ? styles.kidneyLeft : styles.kidneyRight]}>
      <View style={styles.kidneyHalo} />
      <View style={styles.kidneyShadow} />
      <View style={styles.kidneyDepth} />
      <Animated.View style={[styles.water, { top: waterTop }]}>
        <View style={styles.waterGlow} />
        <View style={[styles.waterWave, side === 'left' ? styles.waterWaveLeft : styles.waterWaveRight]} />
        <View style={styles.waterSurface} />
        <View style={styles.waterDotOne} />
        <View style={styles.waterDotTwo} />
      </Animated.View>
      <View style={side === 'left' ? styles.innerNotchLeft : styles.innerNotchRight} />
      <View style={styles.kidneyGloss} />
      <View style={styles.kidneySparkOne} />
      <View style={styles.kidneySparkTwo} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ringOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 10,
    borderColor: colors.cyan,
    backgroundColor: '#041423',
    ...shadow,
  },
  ringOuterMini: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 7,
  },
  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#061524',
  },
  ringInnerMini: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  kidneyStage: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: 100,
    justifyContent: 'center',
    width: 126,
  },
  kidneyStageMini: {
    width: 56,
    height: 50,
    transform: [{ scale: 0.48 }],
  },
  kidney: {
    overflow: 'hidden',
    width: 54,
    height: 82,
    borderWidth: 2,
    borderColor: 'rgba(136, 195, 255, 0.95)',
    backgroundColor: 'rgba(33, 55, 80, 0.72)',
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  kidneyLeft: {
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 22,
    borderTopLeftRadius: 46,
    borderTopRightRadius: 25,
    transform: [{ rotate: '-15deg' }],
  },
  kidneyRight: {
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 42,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 46,
    transform: [{ rotate: '15deg' }],
  },
  kidneyHalo: {
    position: 'absolute',
    left: -8,
    right: -8,
    top: -8,
    bottom: -8,
    borderRadius: 44,
    backgroundColor: 'rgba(22, 158, 255, 0.16)',
  },
  kidneyShadow: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 4,
    bottom: 7,
    borderRadius: 34,
    backgroundColor: 'rgba(3, 15, 29, 0.46)',
  },
  kidneyDepth: {
    position: 'absolute',
    left: 13,
    right: 8,
    top: 12,
    bottom: 10,
    borderRadius: 30,
    borderColor: 'rgba(122, 183, 255, 0.18)',
    borderWidth: 1,
  },
  water: {
    position: 'absolute',
    left: -10,
    right: -10,
    bottom: -10,
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#008DFF',
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
  },
  waterGlow: {
    position: 'absolute',
    left: 7,
    right: 7,
    top: 12,
    height: 36,
    borderRadius: 22,
    backgroundColor: 'rgba(105, 226, 255, 0.7)',
  },
  waterWave: {
    position: 'absolute',
    top: -9,
    width: 78,
    height: 26,
    borderRadius: 24,
    backgroundColor: '#27D6FF',
  },
  waterWaveLeft: {
    left: -4,
    transform: [{ rotate: '-6deg' }],
  },
  waterWaveRight: {
    right: -4,
    transform: [{ rotate: '6deg' }],
  },
  waterSurface: {
    position: 'absolute',
    left: 13,
    right: 13,
    top: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(229, 251, 255, 0.72)',
  },
  waterDotOne: {
    position: 'absolute',
    left: 20,
    top: 28,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  waterDotTwo: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  innerNotchLeft: {
    position: 'absolute',
    right: -11,
    top: 27,
    width: 25,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#061524',
    borderLeftColor: 'rgba(103, 223, 255, 0.5)',
    borderLeftWidth: 1,
  },
  innerNotchRight: {
    position: 'absolute',
    left: -11,
    top: 27,
    width: 25,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#061524',
    borderRightColor: 'rgba(103, 223, 255, 0.5)',
    borderRightWidth: 1,
  },
  kidneyGloss: {
    position: 'absolute',
    left: 12,
    top: 10,
    width: 13,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(214, 235, 255, 0.3)',
    transform: [{ rotate: '-10deg' }],
  },
  kidneySparkOne: {
    position: 'absolute',
    right: 13,
    top: 15,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  kidneySparkTwo: {
    position: 'absolute',
    right: 19,
    top: 27,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  ureterLeft: {
    position: 'absolute',
    left: 53,
    top: 53,
    width: 19,
    height: 35,
    borderColor: colors.cyan,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderTopRightRadius: 18,
    opacity: 0.9,
  },
  ureterRight: {
    position: 'absolute',
    right: 53,
    top: 53,
    width: 19,
    height: 35,
    borderColor: colors.cyan,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderTopLeftRadius: 18,
    opacity: 0.9,
  },
  ureterStemLeft: {
    position: 'absolute',
    left: 66,
    top: 81,
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.cyan,
    opacity: 0.85,
  },
  ureterStemRight: {
    position: 'absolute',
    right: 66,
    top: 81,
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.cyan,
    opacity: 0.85,
  },
  centerLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
});
