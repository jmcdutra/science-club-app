import { CheckSquare, RadioButton, Square } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';

import { AssessmentAnswerValue, AssessmentField } from '../types';
import { getFieldKeyboardType, isAnswerFilled } from '../utils';

type AssessmentFieldRendererProps = {
  field: AssessmentField;
  value?: AssessmentAnswerValue;
  onChange: (value: AssessmentAnswerValue) => void;
  onToggleOption: (option: string) => void;
};

export function AssessmentFieldRenderer({ field, value, onChange, onToggleOption }: AssessmentFieldRendererProps) {
  const { isDark } = useAppTheme();
  const missing = field.required && !isAnswerFilled(value);
  const textValue = Array.isArray(value) ? value.join(', ') : value ?? '';

  if (field.type === 'paragraph') {
    return (
      <View className="mb-4 px-1">
        <AppText className="text-base leading-relaxed text-text-main">{field.label}</AppText>
      </View>
    );
  }

  if (field.type === 'select' || field.type === 'radio') {
    return (
      <FieldShell field={field} missing={missing}>
        <View className="gap-2">
          {field.options?.map((option) => {
            const active = value === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                className={cn(
                  'min-h-[52px] flex-row items-center rounded-2xl border px-4',
                  active ? 'border-brand-primary bg-brand-primary/15' : 'border-border-subtle bg-bg-base',
                )}
                onPress={() => onChange(option)}
              >
                {field.type === 'radio' && (
                  <RadioButton color={active ? '#A78BFA' : '#71717A'} size={19} weight={active ? 'fill' : 'regular'} />
                )}
                <AppText className={cn('ml-3 flex-1 text-sm font-semibold', active ? 'text-brand-secondary' : 'text-text-muted')}>
                  {option}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </FieldShell>
    );
  }

  if (field.type === 'checkbox') {
    const values = Array.isArray(value) ? value : [];
    return (
      <FieldShell field={field} missing={missing}>
        <View className="gap-2">
          {field.options?.map((option) => {
            const active = values.includes(option);
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                className={cn(
                  'min-h-[52px] flex-row items-center rounded-2xl border px-4',
                  active ? 'border-brand-primary bg-brand-primary/15' : 'border-border-subtle bg-bg-base',
                )}
                onPress={() => onToggleOption(option)}
              >
                {active ? (
                  <CheckSquare color="#A78BFA" size={21} weight="fill" />
                ) : (
                  <Square color="#71717A" size={21} weight="regular" />
                )}
                <AppText className={cn('ml-3 flex-1 text-sm font-semibold', active ? 'text-brand-secondary' : 'text-text-muted')}>
                  {option}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </FieldShell>
    );
  }

  return (
    <FieldShell field={field} missing={missing}>
      <TextInput
        className={cn(
          'rounded-2xl border border-border-subtle bg-bg-base px-4 py-4 font-sans text-base',
          field.type === 'long_text' && 'min-h-[132px]',
        )}
        style={{ color: isDark ? '#FFFFFF' : '#111111' }}
        keyboardType={getFieldKeyboardType(field)}
        multiline={field.type === 'long_text'}
        onChangeText={(nextValue) => onChange(nextValue)}
        placeholder="Digite aqui"
        placeholderTextColor="#71717A"
        returnKeyType={field.type === 'long_text' ? 'default' : 'done'}
        textAlignVertical={field.type === 'long_text' ? 'top' : 'center'}
        value={textValue}
      />
    </FieldShell>
  );
}

function FieldShell({ children, field, missing }: { children: ReactNode; field: AssessmentField; missing: boolean }) {
  return (
    <View className="rounded-[24px] border border-border-subtle bg-bg-surface p-4">
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <AppText className="text-base font-semibold leading-snug text-text-main">{field.label}</AppText>
          <AppText className="mt-1 text-xs font-bold text-text-muted">
            {field.required ? 'Obrigatório' : 'Opcional'}
          </AppText>
        </View>
        {missing && (
          <View className="rounded-full bg-amber-400/10 px-3 py-1">
            <AppText className="text-xs font-bold text-amber-400">Falta</AppText>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}
