import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

export function useRefetchOnFocus(refetch: (() => Promise<unknown>) | undefined, enabled = true) {
  const hasFocusedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !refetch) return undefined;

      if (hasFocusedOnceRef.current) {
        void refetch();
      } else {
        hasFocusedOnceRef.current = true;
      }

      return undefined;
    }, [enabled, refetch]),
  );
}
