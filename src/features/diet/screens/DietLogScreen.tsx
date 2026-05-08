import { ArrowLeft, Check, ForkKnife, Scales, Swap } from 'phosphor-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';

import { useDietStore } from '../services/diet.store';
import { DietFoodSubstitution } from '../types';
import { formatMacro, scaleNutrition } from '../utils';

export function DietLogScreen() {
  const { isDark } = useAppTheme();
  const params = useLocalSearchParams<{ mealId?: string; foodId?: string; replacementId?: string }>();
  const plan = useDietStore((state) => state.plan);
  const logFood = useDietStore((state) => state.logFood);
  
  const initialMeal = plan.meals.find((meal) => meal.id === params.mealId) ?? plan.meals[0];
  const [mealId, setMealId] = useState(initialMeal.id);
  const selectedMeal = plan.meals.find((meal) => meal.id === mealId) ?? initialMeal;
  
  const initialFood = selectedMeal.foods.find((food) => food.id === params.foodId) ?? selectedMeal.foods[0];
  const [foodId, setFoodId] = useState(initialFood.id);
  const selectedFood = selectedMeal.foods.find((food) => food.id === foodId) ?? selectedMeal.foods[0];
  
  const initialReplacement = selectedFood.substitutions?.find((item) => item.id === params.replacementId);
  const [replacement, setReplacement] = useState<DietFoodSubstitution | undefined>(initialReplacement);
  const source = replacement ?? selectedFood;
  
  const [grams, setGrams] = useState(String(source.plannedGrams));
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [isManual, setIsManual] = useState(false);

  // Auto-calculate nutrition when grams change, unless in manual mode
  useEffect(() => {
    if (!isManual) {
      const numericGrams = Number(grams.replace(',', '.'));
      const nutrition = scaleNutrition(source, Number.isFinite(numericGrams) ? numericGrams : 0);
      setCalories(String(Math.round(nutrition.calories)));
      setProtein(String(formatMacro(nutrition.protein)));
      setCarbs(String(formatMacro(nutrition.carbs)));
      setFat(String(formatMacro(nutrition.fat)));
    }
  }, [grams, source, isManual]);

  const save = () => {
    const numericGrams = Number(grams.replace(',', '.'));
    const customNutrition = {
      calories: Number(calories.replace(',', '.')) || 0,
      protein: Number(protein.replace(',', '.')) || 0,
      carbs: Number(carbs.replace(',', '.')) || 0,
      fat: Number(fat.replace(',', '.')) || 0,
    };

    logFood({
      mealId: selectedMeal.id,
      foodId: selectedFood.id,
      actualGrams: Number.isFinite(numericGrams) ? numericGrams : 0,
      replacement,
      customNutrition: isManual ? customNutrition : undefined,
    });
    router.replace(`/(app)/diet/meals/${selectedMeal.id}`);
  };

  return (
    <AppScreen keyboard contentClassName="px-6 pb-32 pt-8">
      {/* Header */}
      <View className="mb-10 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={() => router.back()}
        >
          <ArrowLeft color={isDark ? '#FFFFFF' : '#111827'} size={20} weight="bold" />
        </Pressable>
        <AppText className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
          Pesar Alimento
        </AppText>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle">
          <Scales color="#A78BFA" size={18} weight="duotone" />
        </View>
      </View>

      {/* Selection Section */}
      <Animated.View entering={FadeInDown.duration(400)} className="mb-12">
        <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em] mb-4">Refeição</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
          {plan.meals.map((meal) => {
            const isSelected = meal.id === selectedMeal.id;
            return (
              <Pressable
                key={meal.id}
                accessibilityRole="button"
                className={cn(
                  'rounded-full border px-5 py-2.5',
                  isSelected ? 'border-brand-primary bg-brand-primary' : 'border-border-subtle bg-bg-surface',
                )}
                onPress={() => {
                  setMealId(meal.id);
                  setFoodId(meal.foods[0].id);
                  setReplacement(undefined);
                  setGrams(String(meal.foods[0].plannedGrams));
                  setIsManual(false);
                }}
              >
                <AppText className={cn('text-sm font-bold', isSelected ? 'text-white' : 'text-text-main')}>
                  {meal.name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em] mb-4 mt-8">Alimento</AppText>
        <View className="gap-2.5">
          {selectedMeal.foods.map((food) => {
            const isSelected = food.id === selectedFood.id;
            return (
              <Pressable
                key={food.id}
                accessibilityRole="button"
                className={cn(
                  'flex-row items-center rounded-2xl border px-4 py-4',
                  isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-border-subtle bg-bg-surface',
                )}
                onPress={() => {
                  setFoodId(food.id);
                  setReplacement(undefined);
                  setGrams(String(food.plannedGrams));
                  setIsManual(false);
                }}
              >
                <View className={cn(
                  "h-8 w-8 items-center justify-center rounded-full mr-3",
                  isSelected ? "bg-brand-primary" : "bg-bg-base border border-border-subtle"
                )}>
                   <ForkKnife color={isSelected ? "#FFFFFF" : (isDark ? "#888888" : "#666666")} size={16} weight="duotone" />
                </View>
                <View className="flex-1">
                  <AppText className="text-base font-semibold text-text-main">{food.name}</AppText>
                  <AppText className="mt-0.5 text-xs text-text-muted">{food.displayQuantity}</AppText>
                </View>
                {isSelected && <Check color="#A78BFA" size={18} weight="bold" />}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Input Section */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-12">
        <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-8">
           <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Peso Consumido</AppText>
           <AppText className="text-xs text-text-muted">Prescrito: {source.plannedGrams}g</AppText>
        </View>

        <View className="flex-row items-center justify-center mb-10">
          <TextInput
            className="text-7xl font-bold tracking-tighter text-text-main"
            cursorColor="#8B5CF6"
            keyboardType="decimal-pad"
            onChangeText={setGrams}
            placeholder="0"
            placeholderTextColor={isDark ? "#333333" : "#E5E5E5"}
            selectionColor="#8B5CF6"
            value={grams}
          />
          <AppText className="ml-2 text-4xl font-bold text-text-muted mb-2">g</AppText>
        </View>

        <View className="mb-6 flex-row items-center justify-between">
           <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Informação Nutricional</AppText>
           <Pressable 
              className={cn("px-3 py-1.5 rounded-full border", isManual ? "bg-brand-primary border-brand-primary" : "border-border-subtle")}
              onPress={() => setIsManual(!isManual)}
           >
              <AppText className={cn("text-[10px] font-bold uppercase", isManual ? "text-white" : "text-text-muted")}>
                {isManual ? "Ajuste Manual On" : "Ajustar Manualmente"}
              </AppText>
           </Pressable>
        </View>

        <View className="flex-row gap-4 flex-wrap">
           {[
             { label: 'kcal', value: calories, setter: setCalories, color: 'text-text-main', tone: 'calories' },
             { label: 'P (g)', value: protein, setter: setProtein, color: 'text-sky-400', tone: 'protein' },
             { label: 'C (g)', value: carbs, setter: setCarbs, color: 'text-amber-400', tone: 'carbs' },
             { label: 'G (g)', value: fat, setter: setFat, color: 'text-rose-400', tone: 'fat' },
           ].map((item) => (
             <View 
                key={item.label} 
                className={cn(
                  "flex-1 min-w-[70px] items-center py-4 rounded-2xl bg-bg-surface border",
                  isManual ? "border-brand-primary/30 shadow-sm" : "border-border-subtle"
                )}
             >
               <AppText className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">{item.label}</AppText>
               {isManual ? (
                 <TextInput
                    className={cn("text-base font-bold text-center w-full", item.color)}
                    keyboardType="decimal-pad"
                    onChangeText={item.setter}
                    value={item.value}
                 />
               ) : (
                 <AppText className={cn('text-base font-bold', item.color)}>{item.value}</AppText>
               )}
             </View>
           ))}
        </View>
        {isManual && (
           <AppText className="mt-4 text-[10px] text-center text-brand-secondary font-medium">
             Ajustes manuais ignoram o cálculo automático da gramagem.
           </AppText>
        )}
      </Animated.View>

      {/* Action */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <Pressable
          accessibilityRole="button"
          className="min-h-[56px] flex-row items-center justify-center gap-3 rounded-2xl bg-brand-primary shadow-lg shadow-brand-primary/30"
          onPress={save}
        >
          <Check color="#FFFFFF" size={20} weight="bold" />
          <AppText className="text-base font-bold text-white">Confirmar Registro</AppText>
        </Pressable>
      </Animated.View>
    </AppScreen>
  );
}
