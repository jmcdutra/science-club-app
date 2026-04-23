import { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/src/shared/utils/cn';

type AppCardProps = PropsWithChildren<ViewProps> & {
  active?: boolean;
};

export function AppCard({ active, className, ...props }: AppCardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl border bg-bg-surface p-5',
        active ? 'border-brand-primary' : 'border-border-subtle',
        className,
      )}
      {...props}
    />
  );
}
