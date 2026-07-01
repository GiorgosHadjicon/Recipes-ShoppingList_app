import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RecipesStackParamList } from '../navigation/types';
import { createRecipe } from '../services/recipeBackendService';
import { computeMacros, getUnitsForIngredient, isKnownIngredient, searchIngredients, sumMacros } from '../services/nutritionService';
import { radius, spacing, type Colors } from '../theme';
import type { Difficulty, Ingredient, Recipe } from '../types';

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

type DraftIngredient = { name: string; quantity: string; unit: string };

export function AddRecipeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RecipesStackParamList>>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [title, setTitle] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('10');
  const [cookTimeMinutes, setCookTimeMinutes] = useState('15');
  const [servings, setServings] = useState('2');
  const [estimatedCostEur, setEstimatedCostEur] = useState('5');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([{ name: '', quantity: '', unit: 'g' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [suggestionRow, setSuggestionRow] = useState<number | null>(null);

  const canSave = title.trim().length > 0 && ingredients.some((i) => i.name.trim().length > 0);

  function updateIngredient(index: number, patch: Partial<DraftIngredient>) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  }

  function selectIngredient(index: number, name: string) {
    const units = getUnitsForIngredient(name);
    updateIngredient(index, { name, unit: units[0] ?? 'g' });
    setSuggestionRow(null);
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: 'g' }]);
  }

  function removeIngredientRow(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInstruction(index: number, text: string) {
    setInstructions((prev) => prev.map((step, i) => (i === index ? text : step)));
  }

  function addInstructionRow() {
    setInstructions((prev) => [...prev, '']);
  }

  function removeInstructionRow(index: number) {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);

    const finalIngredients: Ingredient[] = ingredients
      .filter((i) => i.name.trim().length > 0)
      .map((i, idx) => ({
        id: `i${idx + 1}`,
        name: i.name.trim().toLowerCase(),
        quantity: parseFloat(i.quantity) || 0,
        unit: i.unit.trim() || 'g',
      }));

    const macros = sumMacros(finalIngredients.map((i) => computeMacros(i.name, i.quantity, i.unit)));

    const recipe: Omit<Recipe, 'id'> = {
      title: title.trim(),
      cuisine: cuisine.trim() || 'Homemade',
      difficulty,
      prepTimeMinutes: parseInt(prepTimeMinutes, 10) || 0,
      cookTimeMinutes: parseInt(cookTimeMinutes, 10) || 0,
      servings: Math.max(1, parseInt(servings, 10) || 1),
      estimatedCostEur: parseFloat(estimatedCostEur) || 0,
      totalCalories: Math.round(macros.calories),
      proteinG: Math.round(macros.proteinG),
      carbsG: Math.round(macros.carbsG),
      fatG: Math.round(macros.fatG),
      dietaryTags: [],
      possibleAdditions: [],
      calorieReductions: [],
      description: description.trim(),
      ingredients: finalIngredients,
      instructions: instructions.map((s) => s.trim()).filter((s) => s.length > 0),
    };

    try {
      await createRecipe(recipe);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save recipe', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.signInPrompt}>
          <Text style={styles.signInText}>Sign in to add your own recipe.</Text>
          <Pressable style={styles.saveButton} onPress={() => navigation.navigate('AuthScreen' as never)}>
            <Text style={styles.saveButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Sunday Roast Chicken" colors={colors} />
        <Field label="Cuisine" value={cuisine} onChangeText={setCuisine} placeholder="e.g. British" colors={colors} />

        <Text style={styles.label}>Difficulty</Text>
        <View style={styles.pillRow}>
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[styles.pill, difficulty === d && styles.pillActive]}
            >
              <Text style={[styles.pillText, difficulty === d && styles.pillTextActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.rowFields}>
          <Field label="Prep (min)" value={prepTimeMinutes} onChangeText={setPrepTimeMinutes} keyboardType="number-pad" colors={colors} flex />
          <Field label="Cook (min)" value={cookTimeMinutes} onChangeText={setCookTimeMinutes} keyboardType="number-pad" colors={colors} flex />
        </View>
        <View style={styles.rowFields}>
          <Field label="Servings" value={servings} onChangeText={setServings} keyboardType="number-pad" colors={colors} flex />
          <Field label="Est. Cost (€)" value={estimatedCostEur} onChangeText={setEstimatedCostEur} keyboardType="decimal-pad" colors={colors} flex />
        </View>

        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="A short, tasty description"
          multiline
          colors={colors}
        />

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.hint}>Search to pick a known ingredient — its units fill in automatically.</Text>
        {ingredients.map((ing, i) => {
          const known = isKnownIngredient(ing.name);
          const units = known ? getUnitsForIngredient(ing.name) : [];
          const suggestions = suggestionRow === i && !known ? searchIngredients(ing.name) : [];
          return (
            <View key={i} style={styles.ingredientBlock}>
              <View style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.ingredientQty]}
                  value={ing.quantity}
                  onChangeText={(t) => updateIngredient(i, { quantity: t })}
                  onFocus={() => setSuggestionRow(null)}
                  keyboardType="decimal-pad"
                  placeholder="qty"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.input, styles.ingredientName, known && styles.ingredientNameKnown]}
                  value={ing.name}
                  onChangeText={(t) => updateIngredient(i, { name: t })}
                  onFocus={() => setSuggestionRow(i)}
                  placeholder="Search ingredients..."
                  placeholderTextColor={colors.textMuted}
                />
                <Pressable onPress={() => removeIngredientRow(i)} hitSlop={8}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>

              {suggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  {suggestions.map((name) => (
                    <Pressable key={name} style={styles.suggestionRow} onPress={() => selectIngredient(i, name)}>
                      <Text style={styles.suggestionText}>{name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {known ? (
                <View style={styles.unitChips}>
                  {units.map((unit) => (
                    <Pressable
                      key={unit}
                      style={[styles.unitChip, ing.unit === unit && styles.unitChipActive]}
                      onPress={() => updateIngredient(i, { unit })}
                    >
                      <Text style={[styles.unitChipText, ing.unit === unit && styles.unitChipTextActive]}>{unit}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                ing.name.trim().length > 0 && (
                  <View style={styles.customUnitRow}>
                    <Text style={styles.hint}>Not a known ingredient — no macros. Unit:</Text>
                    <TextInput
                      style={[styles.input, styles.ingredientUnit]}
                      value={ing.unit}
                      onChangeText={(t) => updateIngredient(i, { unit: t })}
                      onFocus={() => setSuggestionRow(null)}
                      placeholder="unit"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                )
              )}
            </View>
          );
        })}
        <Pressable style={styles.addRowBtn} onPress={addIngredientRow}>
          <Text style={styles.addRowText}>+ Add Ingredient</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Instructions</Text>
        {instructions.map((step, i) => (
          <View key={i} style={styles.instructionRow}>
            <Text style={styles.stepNumber}>{i + 1}.</Text>
            <TextInput
              style={[styles.input, styles.instructionInput]}
              value={step}
              onChangeText={(t) => updateInstruction(i, t)}
              placeholder={`Step ${i + 1}`}
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Pressable onPress={() => removeInstructionRow(i)} hitSlop={8}>
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addRowBtn} onPress={addInstructionRow}>
          <Text style={styles.addRowText}>+ Add Step</Text>
        </Pressable>

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Recipe'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  flex,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  multiline?: boolean;
  flex?: boolean;
  colors: Colors;
}) {
  const styles = makeStyles(colors);
  return (
    <View style={flex ? styles.fieldFlex : undefined}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm },
    signInPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    signInText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, marginTop: spacing.sm },
    hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.text,
    },
    inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
    rowFields: { flexDirection: 'row', gap: spacing.sm },
    fieldFlex: { flex: 1 },
    pillRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    pillText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    pillTextActive: { color: '#fff' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.md },
    ingredientBlock: {
      marginBottom: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    ingredientQty: { width: 55 },
    ingredientUnit: { width: 65 },
    ingredientName: { flex: 1 },
    ingredientNameKnown: { borderColor: colors.primary },
    suggestionBox: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      marginTop: 2,
      overflow: 'hidden',
    },
    suggestionRow: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
    suggestionText: { fontSize: 14, color: colors.text },
    unitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: spacing.xs },
    unitChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    unitChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    unitChipText: { fontSize: 12, color: colors.textSecondary },
    unitChipTextActive: { color: '#fff', fontWeight: '600' },
    customUnitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
    instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginBottom: spacing.xs },
    stepNumber: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
    instructionInput: { flex: 1 },
    removeText: { fontSize: 16, color: colors.difficulty.Hard, paddingHorizontal: 4, marginTop: spacing.sm },
    addRowBtn: { alignSelf: 'flex-start', paddingVertical: spacing.xs, marginBottom: spacing.sm },
    addRowText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
    },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  });
}
