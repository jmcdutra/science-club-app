import {
  Bicycle,
  Lightning,
  PersonSimpleRun,
  PersonSimpleWalk,
  Waves,
  type IconProps,
} from 'phosphor-react-native';

import type { CardioIconName } from '../types';

interface CardioIconProps extends Omit<IconProps, 'children'> {
  name: CardioIconName;
}

export function CardioIcon({ name, ...props }: CardioIconProps) {
  if (name === 'walk') return <PersonSimpleWalk {...props} />;
  if (name === 'bike') return <Bicycle {...props} />;
  if (name === 'hiit') return <Lightning {...props} />;
  if (name === 'swim') return <Waves {...props} />;
  return <PersonSimpleRun {...props} />;
}
