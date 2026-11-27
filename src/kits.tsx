import { useEffect, useRef } from 'react';
import { Animated, Easing, ImageStyle, Platform, StyleProp } from 'react-native';
import { useMotionAllowed } from './motion-feedback';
import { motion } from './theme';

export function Kits({ style, celebrate = false }: { style?: StyleProp<ImageStyle>; celebrate?: boolean }) {
  const lift = useRef(new Animated.Value(0)).current;
  const played = useRef(false);
  const allowed = useMotionAllowed();

  useEffect(() => {
    if (!celebrate) { played.current = false; return; }
    if (allowed === undefined || played.current) return;
    played.current = true;
    if (!allowed) return;
    const { celebrationRise, celebrationSettle } = motion;
    const bounce = Animated.sequence([
      Animated.timing(lift, { toValue: -5, duration: celebrationRise.duration,
        easing: Easing.bezier(...celebrationRise.curve), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(lift, { toValue: 0, duration: celebrationSettle.duration,
        easing: Easing.bezier(...celebrationSettle.curve), useNativeDriver: Platform.OS !== 'web' }),
    ]);
    bounce.start();
    return () => { bounce.stop(); lift.setValue(0); };
  }, [celebrate, lift, allowed]);

  return <Animated.Image source={require('../assets/kits.png')} accessible={false} resizeMode="contain"
    style={celebrate ? [style, { transform: [{ translateY: lift }] }] : style} />;
}
