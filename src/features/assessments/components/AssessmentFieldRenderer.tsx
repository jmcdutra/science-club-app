import { CheckSquare, RadioButton, Square } from 'phosphor-react-native';
import { type ReactNode, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';

import { type AssessmentAnswerValue, type AssessmentField } from '../types';
import { getFieldKeyboardType, isAnswerFilled } from '../utils';

type Props = {
  field: AssessmentField;
  value?: AssessmentAnswerValue;
  onChange: (value: AssessmentAnswerValue) => void;
  onToggleOption: (option: string) => void;
};

export function AssessmentFieldRenderer({ field, value, onChange, onToggleOption }: Props) {
  const missing = field.required && !isAnswerFilled(value);
  const textValue = Array.isArray(value) ? value.join(', ') : (value ?? '');

  if (field.type === 'paragraph') {
    return (
      <View style={{ paddingVertical: 4, paddingHorizontal: 4 }}>
        <AppText style={{ fontSize: 14, color: '#666666', lineHeight: 20 }}>{field.label}</AppText>
      </View>
    );
  }

  if (field.type === 'select' || field.type === 'radio') {
    return (
      <FieldShell field={field} missing={missing}>
        <View style={{ gap: 7 }}>
          {field.options?.map((option) => {
            const active = value === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                style={{
                  minHeight: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? '#8B5CF6' : '#1F1F23',
                  backgroundColor: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                  paddingHorizontal: 14,
                }}
                onPress={() => onChange(option)}
              >
                <RadioButton
                  color={active ? '#A78BFA' : '#444444'}
                  size={18}
                  weight={active ? 'fill' : 'regular'}
                />
                <AppText
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: '500',
                    color: active ? '#C4B5FD' : '#888888',
                    lineHeight: 18,
                  }}
                >
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
        <View style={{ gap: 7 }}>
          {field.options?.map((option) => {
            const active = values.includes(option);
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                style={{
                  minHeight: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? '#8B5CF6' : '#1F1F23',
                  backgroundColor: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                  paddingHorizontal: 14,
                }}
                onPress={() => onToggleOption(option)}
              >
                {active ? (
                  <CheckSquare color="#A78BFA" size={19} weight="fill" />
                ) : (
                  <Square color="#444444" size={19} weight="regular" />
                )}
                <AppText
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: '500',
                    color: active ? '#C4B5FD' : '#888888',
                    lineHeight: 18,
                  }}
                >
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
      <FocusableInput field={field} value={textValue} onChange={onChange} />
    </FieldShell>
  );
}

function FocusableInput({
  field,
  value,
  onChange,
}: {
  field: AssessmentField;
  value: string;
  onChange: (v: AssessmentAnswerValue) => void;
}) {
  const [focused, setFocused] = useState(false);
  const isLong = field.type === 'long_text';

  return (
    <TextInput
      keyboardType={getFieldKeyboardType(field)}
      multiline={isLong}
      onChangeText={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="Digite aqui"
      placeholderTextColor="#2A2A2A"
      returnKeyType={isLong ? 'default' : 'done'}
      textAlignVertical={isLong ? 'top' : 'center'}
      value={value}
      style={{
        borderWidth: 1,
        borderColor: focused ? '#8B5CF6' : '#1F1F23',
        borderRadius: 12,
        height: isLong ? undefined : 52,
        minHeight: isLong ? 120 : undefined,
        paddingHorizontal: 16,
        paddingVertical: isLong ? 14 : 0,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: -0.1,
        ...(focused && {
          shadowColor: '#8B5CF6',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        }),
      }}
    />
  );
}

function FieldShell({
  children,
  field,
  missing,
}: {
  children: ReactNode;
  field: AssessmentField;
  missing: boolean;
}) {
  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: missing ? 'rgba(251,191,36,0.20)' : '#181818',
        backgroundColor: '#0C0C0C',
        padding: 16,
      }}
    >
      {/* Label row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <AppText
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: '600',
            color: '#EDEDED',
            lineHeight: 20,
            paddingRight: 12,
          }}
        >
          {field.label}
        </AppText>
        {missing ? (
          <View
            style={{
              borderRadius: 99,
              backgroundColor: 'rgba(251,191,36,0.10)',
              paddingHorizontal: 10,
              paddingVertical: 3,
              flexShrink: 0,
            }}
          >
            <AppText style={{ fontSize: 10, fontWeight: '700', color: '#FBBF24' }}>Falta</AppText>
          </View>
        ) : (
          <AppText style={{ fontSize: 10, fontWeight: '600', color: '#3A3A3A', marginTop: 2, flexShrink: 0 }}>
            {field.required ? 'Obrigatório' : 'Opcional'}
          </AppText>
        )}
      </View>
      {children}
    </View>
  );
}
