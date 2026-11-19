import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageStyle, Platform, StyleProp } from 'react-native';

export function Kits({ style, celebrate = false }: { style?: StyleProp<ImageStyle>; celebrate?: boolean }) {
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!celebrate) return;
    let active = true;
    const motion = Animated.sequence([
      Animated.timing(lift, { toValue: -5, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(lift, { toValue: 0, duration: 170, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
    ]);
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (active && !reduced) motion.start();
    }, () => lift.setValue(0));
    return () => { active = false; motion.stop(); };
  }, [celebrate, lift]);

  return <Animated.Image source={require('../assets/kits.png')} accessible={false} resizeMode="contain"
    style={celebrate ? [style, { transform: [{ translateY: lift }] }] : style} />;
}
