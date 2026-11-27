import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageStyle, Platform, StyleProp } from 'react-native';
import { motion } from './theme';

export function Kits({ style, celebrate = false }: { style?: StyleProp<ImageStyle>; celebrate?: boolean }) {
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!celebrate) return;
    let active = true;
    const { celebrationRise, celebrationSettle } = motion;
    const bounce = Animated.sequence([
      Animated.timing(lift, { toValue: -5, duration: celebrationRise.duration,
        easing: Easing.bezier(...celebrationRise.curve), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(lift, { toValue: 0, duration: celebrationSettle.duration,
        easing: Easing.bezier(...celebrationSettle.curve), useNativeDriver: Platform.OS !== 'web' }),
    ]);
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (active && !reduced) bounce.start();
    }, () => { if (active) lift.setValue(0); });
    return () => { active = false; bounce.stop(); lift.setValue(0); };
  }, [celebrate, lift]);

  return <Animated.Image source={require('../assets/kits.png')} accessible={false} resizeMode="contain"
    style={celebrate ? [style, { transform: [{ translateY: lift }] }] : style} />;
}
