import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { getRecipes } from '../services/recipeService';
import { colors, radius, spacing } from '../theme';
import type { Recipe } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Plan = Record<string, string | null>;

export function WeeklyPlannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plan, setPlan] = useState<Plan>(() => Object.fromEntries(DAYS.map((d) => [d, null])));
  const [pickerDay, setPickerDay] = useState<string | null>(null);

  useEffect(() => {
    getRecipes().then(setRecipes);
  }, []);

  const recipeById = (id: string | null) => recipes.find((r) => r.id === id) ?? null;
  const plannedCount = Object.values(plan).filter(Boolean).length;

  function selectRecipe(recipeId: string) {
    if (pickerDay) setPlan((p) => ({ ...p, [pickerDay]: recipeId }));
    setPickerDay(null);
  }

  function clearDay(day: string) {
    setPlan((p) => ({ ...p, [day]: null }));
  }

  function clearWeek() {
    setPlan(Object.fromEntries(DAYS.map((d) => [d, null])));
  }

  function generateBasket() {
    const recipeIds = Object.values(plan).filter((id): id is string => id !== null);
    if (recipeIds.length === 0) return;
    navigation.navigate('SupermarketSelector', { recipeIds });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Weekly Planner</Text>
        <Text style={styles.subheading}>Pick a meal for each day, then build one combined basket</Text>
      </View>

      <FlatList
        data={DAYS}
        keyExtractor={(d) => d}
        contentContainerStyle={styles.list}
        renderItem={({ item: day }) => {
          const recipe = recipeById(plan[day]);
          return (
            <View style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day}</Text>
              {recipe ? (
                <Pressable style={styles.filledSlot} onPress={() => setPickerDay(day)}>
                  <Text style={styles.filledSlotText} numberOfLines={1}>{recipe.title}</Text>
                  <Pressable hitSlop={8} onPress={() => clearDay(day)}>
                    <Text style={styles.clearX}>✕</Text>
                  </Pressable>
                </Pressable>
              ) : (
                <Pressable style={styles.emptySlot} onPress={() => setPickerDay(day)}>
                  <Text style={styles.emptySlotText}>+ Add recipe</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Pressable
              style={[styles.generateBtn, plannedCount === 0 && styles.generateBtnDisabled]}
              onPress={generateBasket}
              disabled={plannedCount === 0}
            >
              <Text style={styles.generateBtnText}>
                Generate Weekly Basket{plannedCount > 0 ? ` (${plannedCount})` : ''}
              </Text>
            </Pressable>
            {plannedCount > 0 && (
              <Pressable style={styles.clearWeekBtn} onPress={clearWeek}>
                <Text style={styles.clearWeekText}>Clear Week</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <Modal visible={pickerDay !== null} animationType="slide" onRequestClose={() => setPickerDay(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{pickerDay}</Text>
            <Pressable onPress={() => setPickerDay(null)}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>
          <FlatList
            data={recipes}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => (
              <Pressable style={styles.pickerRow} onPress={() => selectRecipe(item.id)}>
                <Text style={styles.pickerRowTitle}>{item.title}</Text>
                <Text style={styles.pickerRowMeta}>{item.cuisine} · {item.totalCalories} kcal</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  heading: { fontSize: 30, fontWeight: '800', color: colors.text },
  subheading: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  dayRow: { gap: spacing.xs, marginBottom: spacing.sm },
  dayLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  emptySlot: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptySlotText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  filledSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  filledSlotText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  clearX: { fontSize: 16, color: colors.textMuted, paddingHorizontal: 4 },
  footer: { marginTop: spacing.md, gap: spacing.sm },
  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  clearWeekBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  clearWeekText: { fontSize: 14, color: '#DC3545', fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalClose: { fontSize: 15, fontWeight: '600', color: colors.primary },
  pickerRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerRowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  pickerRowMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
