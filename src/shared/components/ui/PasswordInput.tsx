import { Eye, EyeSlash } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { AppInput } from './AppInput';

type PasswordInputProps = Omit<React.ComponentProps<typeof AppInput>, 'secureTextEntry' | 'rightElement'>;

export function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <AppInput
      autoCapitalize="none"
      autoCorrect={false}
      secureTextEntry={!isVisible}
      textContentType="password"
      rightElement={
        <Pressable
          accessibilityLabel={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => setIsVisible((current) => !current)}
        >
          {isVisible ? (
            <EyeSlash color="#666666" size={22} weight="bold" />
          ) : (
            <Eye color="#666666" size={22} weight="bold" />
          )}
        </Pressable>
      }
      {...props}
    />
  );
}
