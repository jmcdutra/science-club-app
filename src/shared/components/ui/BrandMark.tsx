import Svg, { Rect } from 'react-native-svg';

import { colors } from '@/src/shared/theme/tokens';

type BrandMarkProps = {
  size?: number;
};

export function BrandMark({ size = 40 }: BrandMarkProps) {
  return (
    <Svg height={size} viewBox="0 0 40 40" width={size}>
      <Rect fill={colors.brand.primary} height="40" rx="12" width="40" />
      <Rect fill={colors.text.main} height="12" rx="3" width="12" x="14" y="14" />
    </Svg>
  );
}
