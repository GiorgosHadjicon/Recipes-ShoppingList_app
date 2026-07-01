import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RecipesStackParamList } from '../navigation/types';
import type { RootStackParamList } from '../navigation/types';
import { deleteRecipe } from '../services/recipeBackendService';
import { getRecipeById, isOwnRecipe } from '../services/recipeService';
import { computeMacros, getAvailableUnits, sumMacros } from '../services/nutritionService';
import { radius, spacing, type Colors } from '../theme';
import type { Ingredient, Recipe } from '../types';
import { getRecipeImageUrl } from '../utils/recipeImage';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// One row of "what-if" edits, keyed by ingredient id. Resets whenever the recipe changes.
type IngredientEdit = { quantityText: string; unit: string };

export function RecipeDetailScreen() {
  const route = useRoute<RouteProp<RecipesStackParamList, 'RecipeDetail'>>();
  const navigation = useNavigation<Nav>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [desiredServings, setDesiredServings] = useState(1);
  const [edits, setEdits] = useState<Record<string, IngredientEdit>>({});
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    getRecipeById(route.params.recipeId).then((r) => {
      setRecipe(r);
      setDesiredServings(r?.servings ?? 1);
      setEdits(r ? defaultEdits(r, r.servings) : {});
    });
  }, [route.params.recipeId]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const totalMin = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const scaledDefaults = defaultEdits(recipe, desiredServings);
  const isEdited =
    desiredServings !== recipe.servings ||
    recipe.ingredients.some((ing) => {
      const edit = edits[ing.id];
      const def = scaledDefaults[ing.id];
      return edit && (edit.unit !== def.unit || parseFloat(edit.quantityText) !== parseFloat(def.quantityText));
    });

  const liveMacros = sumMacros(
    recipe.ingredients.map((ing) => {
      const edit = edits[ing.id];
      const quantity = edit ? parseFloat(edit.quantityText) || 0 : ing.quantity;
      const unit = edit?.unit ?? ing.unit;
      return computeMacros(ing.name, quantity, unit);
    }),
  );

  function updateQuantity(ingredientId: string, quantityText: string) {
    setEdits((prev) => ({ ...prev, [ingredientId]: { ...prev[ingredientId], quantityText } }));
  }

  function bumpQuantity(ing: Recipe['ingredients'][number], delta: number) {
    setEdits((prev) => {
      const current = prev[ing.id] ?? { quantityText: formatQuantity(ing.quantity), unit: ing.unit };
      const quantity = Math.max(0, (parseFloat(current.quantityText) || 0) + delta);
      return { ...prev, [ing.id]: { ...current, quantityText: formatQuantity(quantity) } };
    });
  }

  function updateUnit(ing: Recipe['ingredients'][number], unit: string) {
    setEdits((prev) => {
      const current = prev[ing.id];
      const quantity = current ? parseFloat(current.quantityText) || 0 : ing.quantity;
      const converted = convertQuantity(ing.name, quantity, current?.unit ?? ing.unit, unit);
      return { ...prev, [ing.id]: { quantityText: formatQuantity(converted), unit } };
    });
  }

  function updateServings(servings: number) {
    if (!recipe) return;
    const clamped = Math.max(1, Math.round(servings));
    setDesiredServings(clamped);
    setEdits(defaultEdits(recipe, clamped));
  }

  function resetEdits() {
    if (!recipe) return;
    setDesiredServings(recipe.servings);
    setEdits(defaultEdits(recipe, recipe.servings));
  }

  function handleDelete() {
    if (!recipe) return;
    Alert.alert(
      'Delete Recipe',
      `Delete "${recipe.title}"? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipe.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Could not delete recipe', err instanceof Error ? err.message : 'Please try again.');
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: getRecipeImageUrl(recipe.title, 800, 600) }} style={styles.hero}>
          <Text style={styles.heroCuisine}>{recipe.cuisine}</Text>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            {isOwnRecipe(recipe, user?.id ?? null) && (
              <Pressable onPress={handleDelete} hitSlop={8}>
                <Text style={styles.deleteText}>🗑 Delete Recipe</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.authorName && <Text style={styles.authorText}>by {recipe.authorName}</Text>}
          <Text style={styles.description}>{recipe.description}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Stat label="Prep" value={`${recipe.prepTimeMinutes}m`} />
            <Stat label="Cook" value={recipe.cookTimeMinutes > 0 ? `${recipe.cookTimeMinutes}m` : '—'} />
            <Stat label="Total" value={totalMin < 60 ? `${totalMin}m` : `${Math.floor(totalMin / 60)}h ${totalMin % 60 > 0 ? `${totalMin % 60}m` : ''}`.trim()} />
            <Stat label="Serves" value={String(desiredServings)} />
            <Stat label="Est. Cost" value={`€${recipe.estimatedCostEur}`} />
            <Stat label="Calories" value={String(Math.round(liveMacros.calories))} />
            <Stat label="Protein" value={`${Math.round(liveMacros.proteinG)}g`} />
            <Stat label="Carbs" value={`${Math.round(liveMacros.carbsG)}g`} />
            <Stat label="Fat" value={`${Math.round(liveMacros.fatG)}g`} />
          </View>

          {/* Servings adjuster */}
          <View style={styles.servingsRow}>
            <Text style={styles.servingsLabel}>Making for</Text>
            <View style={styles.servingsStepper}>
              <Pressable
                style={styles.servingsBtn}
                onPress={() => updateServings(desiredServings - 1)}
                hitSlop={6}
              >
                <Text style={styles.servingsBtnText}>−</Text>
              </Pressable>
              <Text style={styles.servingsValue}>{desiredServings}</Text>
              <Pressable
                style={styles.servingsBtn}
                onPress={() => updateServings(desiredServings + 1)}
                hitSlop={6}
              >
                <Text style={styles.servingsBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.servingsLabel}>{desiredServings === 1 ? 'person' : 'people'}</Text>
          </View>

          {/* Dietary tags */}
          {recipe.dietaryTags.length > 0 && (
            <View style={styles.tags}>
              {recipe.dietaryTags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {isEdited && (
              <Pressable onPress={resetEdits} hitSlop={8}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.section}>
            {recipe.ingredients.map((ing) => {
              const edit = edits[ing.id] ?? { quantityText: formatQuantity(ing.quantity), unit: ing.unit };
              const units = getAvailableUnits(ing.name, ing.unit);
              const step = stepFor(edit.unit);
              return (
                <View key={ing.id} style={styles.ingredientRow}>
                  <View style={styles.qtyStepper}>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => bumpQuantity(ing, -step)}
                      hitSlop={6}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </Pressable>
                    <TextInput
                      style={styles.ingredientQtyInput}
                      value={edit.quantityText}
                      onChangeText={(text) => updateQuantity(ing.id, text)}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                    />
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => bumpQuantity(ing, step)}
                      hitSlop={6}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </Pressable>
                  </View>
                  {units.length > 1 ? (
                    <View style={styles.unitChips}>
                      {units.map((unit) => (
                        <Pressable
                          key={unit}
                          style={[styles.unitChip, unit === edit.unit && styles.unitChipActive]}
                          onPress={() => updateUnit(ing, unit)}
                        >
                          <Text style={[styles.unitChipText, unit === edit.unit && styles.unitChipTextActive]}>
                            {unit}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.ingredientUnit}>{edit.unit}</Text>
                  )}
                  <Text style={styles.ingredientName}>
                    {ing.name}{ing.notes ? ` (${ing.notes})` : ''}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Instructions */}
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.section}>
            {recipe.instructions.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Possible additions */}
          {recipe.possibleAdditions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Possible Additions</Text>
              <View style={styles.section}>
                {recipe.possibleAdditions.map((addition, i) => (
                  <Text key={i} style={styles.additionText}>• {addition}</Text>
                ))}
              </View>
            </>
          )}

          {/* Calorie reductions */}
          {recipe.calorieReductions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Lighten It Up</Text>
              <View style={styles.section}>
                {recipe.calorieReductions.map((tip, i) => (
                  <Text key={i} style={styles.additionText}>• {tip}</Text>
                ))}
              </View>
            </>
          )}

          <View style={styles.ctaSpace} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaBar}>
        <Pressable
          style={styles.ctaButton}
          onPress={() =>
            navigation.navigate('SupermarketSelector', {
              recipeId: recipe.id,
              ingredients: effectiveIngredients(recipe, edits),
            })
          }
        >
          <Text style={styles.ctaText}>Generate Shopping List</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function stepFor(unit: string): number {
  return unit === 'g' || unit === 'ml' ? 10 : 1;
}

function formatQuantity(quantity: number): string {
  return Number.isFinite(quantity) ? String(Math.round(quantity * 100) / 100) : '0';
}

function defaultEdits(recipe: Recipe, servings: number): Record<string, IngredientEdit> {
  const scale = servings / recipe.servings;
  return Object.fromEntries(
    recipe.ingredients.map((ing) => [ing.id, { quantityText: formatQuantity(ing.quantity * scale), unit: ing.unit }]),
  );
}

// What's actually on screen right now (servings scaling + any per-ingredient tweaks),
// so the shopping list can be built from this instead of the recipe's stored quantities.
function effectiveIngredients(recipe: Recipe, edits: Record<string, IngredientEdit>): Ingredient[] {
  return recipe.ingredients.map((ing) => {
    const edit = edits[ing.id];
    if (!edit) return ing;
    return { ...ing, quantity: parseFloat(edit.quantityText) || 0, unit: edit.unit };
  });
}

// Converts a quantity between two units of the same ingredient via their gram equivalents,
// so switching units (e.g. tbsp -> tsp) preserves the real-world amount.
function convertQuantity(ingredientName: string, quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;
  // Both units convert to grams for the same ingredient, so the calories-per-one-unit
  // ratio is the grams-per-one-unit ratio — reuse it instead of a separate gram lookup.
  const fromCaloriesPerUnit = computeMacros(ingredientName, 1, fromUnit).calories;
  const toCaloriesPerUnit = computeMacros(ingredientName, 1, toUnit).calories;
  if (fromCaloriesPerUnit === 0 || toCaloriesPerUnit === 0) return quantity;
  return (quantity * fromCaloriesPerUnit) / toCaloriesPerUnit;
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    hero: {
      height: 200,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroCuisine: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.md,
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    content: { padding: spacing.md, gap: spacing.md },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    deleteText: { fontSize: 13, fontWeight: '600', color: colors.difficulty.Hard },
    title: { fontSize: 26, fontWeight: '800', color: colors.text, lineHeight: 32 },
    authorText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
    description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    stat: { alignItems: 'center', gap: 2, flexBasis: '30%' },
    statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textMuted },
    servingsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    servingsLabel: { fontSize: 14, color: colors.textSecondary },
    servingsStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    servingsBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    servingsBtnText: { fontSize: 20, fontWeight: '700', color: colors.primary },
    servingsValue: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      minWidth: 32,
      textAlign: 'center',
    },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    tag: {
      backgroundColor: colors.tagBg,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    tagText: { fontSize: 12, color: colors.primaryLight, fontWeight: '600' },
    sectionTitle: { fontSize: 19, fontWeight: '700', color: colors.text },
    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resetText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    section: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.sm,
    },
    ingredientRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
      paddingVertical: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    qtyStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    stepperBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    stepperBtnText: { fontSize: 18, fontWeight: '700', color: colors.primary },
    ingredientQtyInput: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      width: 42,
      height: 30,
      textAlign: 'center',
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    ingredientUnit: { fontSize: 13, color: colors.textSecondary, width: 60 },
    unitChips: { flexDirection: 'row', gap: 4, width: 90 },
    unitChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: 7,
      paddingVertical: 5,
    },
    unitChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    unitChipText: { fontSize: 12, color: colors.textSecondary },
    unitChipTextActive: { color: '#fff', fontWeight: '600' },
    ingredientName: { fontSize: 14, color: colors.text, flex: 1 },
    stepRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 1,
    },
    stepNumberText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    stepText: { fontSize: 14, color: colors.text, lineHeight: 22, flex: 1 },
    additionText: { fontSize: 14, color: colors.text, lineHeight: 22 },
    ctaSpace: { height: spacing.xl },
    ctaBar: {
      padding: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    ctaButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    ctaText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  });
}
