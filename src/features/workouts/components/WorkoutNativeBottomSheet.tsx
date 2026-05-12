import type { ReactNode } from 'react';

export function WorkoutNativeBottomSheet({
  children,
}: {
  children: ReactNode;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  void children;
  return null;
}
