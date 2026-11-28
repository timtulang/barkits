import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useMotionAllowed() {
  const [allowed, setAllowed] = useState<boolean>();
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', reduced => {
      changed = true;
      setAllowed(!reduced);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (active && !changed) setAllowed(!reduced);
    }, () => { if (active && !changed) setAllowed(false); });
    return () => { active = false; subscription?.remove(); };
  }, []);
  return allowed;
}

export function useNewMilestone(reached?: boolean) {
  const previous = useRef(reached);
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    if (reached === undefined) return;
    if (reached && previous.current === false) setFresh(true);
    if (!reached) setFresh(false);
    previous.current = reached;
  }, [reached]);
  return reached !== false && fresh;
}
