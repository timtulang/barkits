import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

export function useSharedData<T>(load: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  function refresh() { setLoading(true); setVersion(value => value + 1); }
  useEffect(() => {
    if (Platform.OS === 'web') {
      const focus = () => { if (document.visibilityState === 'visible') refresh(); };
      window.addEventListener('focus', focus);
      return () => window.removeEventListener('focus', focus);
    }
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    load().then(value => { if (active) setData(value); }).catch(problem => {
      if (active) setError(problem instanceof Error ? problem.message : 'Couldn’t load shared meetups. Try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, version]);
  return { data, loading, error, refresh };
}
