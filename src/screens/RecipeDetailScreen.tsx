import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { useShoppingList } from '../context/ShoppingListContext';
import type { RecipesStackParamList, TabParamList } from '../navigation/types';
import { getRecipeById } from '../services/recipeService';
import { fonts, lightColors, radius, spacing, type Colors } from '../theme';
import type { Recipe } from '../types';
import { getRecipeImageUrl } from '../utils/recipeImage';

type Nav = NativeStackNavigationProp<RecipesStackParamList>;

export function RecipeDetailScreen() {
  const route = useRoute<RouteProp<RecipesStackParamList, 'RecipeDetail'>>();
  const navigation = useNavigation<Nav>();
  const { generateList } = useShoppingList();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const colors = lightColors;
  const styles = makeStyles(colors);

  useEffect(() => {
    getRecipeById(route.params.recipeId).then(setRecipe);
  }, [route.params.recipeId]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const totalMin = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  async function handleGenerateList() {
    await generateList(recipe!.id);
    navigation.getParent<NativeStackNavigationProp<TabParamList>>()?.navigate('ShoppingListTab');
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: getRecipeImageUrl(recipe.title, 800, 600) }} style={styles.hero}>
          <SafeAreaView edges={['top']} style={styles.heroHeader}>
            <Pressable style={styles.heroIconBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Text style={styles.heroIconText}>‹</Text>
            </Pressable>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.tags}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            <View style={styles.tag}>
              <Text style={styles.tagText}>{recipe.cuisine}</Text>
            </View>
            {recipe.dietaryTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.description}>{recipe.description}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Stat label="Prep" value={`${recipe.prepTimeMinutes}m`} />
            <Stat label="Cook" value={recipe.cookTimeMinutes > 0 ? `${recipe.cookTimeMinutes}m` : '—'} />
            <Stat label="Total" value={totalMin < 60 ? `${totalMin}m` : `${Math.floor(totalMin / 60)}h ${totalMin % 60 > 0 ? `${totalMin % 60}m` : ''}`.trim()} />
            <Stat label="Serves" value={String(recipe.servings)} />
            <Stat label="Est. Cost" value={`€${recipe.estimatedCostEur}`} />
          </View>

          {/* Ingredients */}
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.section}>
            {recipe.ingredients.map((ing) => (
              <View key={ing.id} style={styles.ingredientRow}>
                <Text style={styles.ingredientQty}>{formatQuantity(ing.quantity)} {ing.unit}</Text>
                <Text style={styles.ingredientName}>
                  {ing.name}{ing.notes ? ` (${ing.notes})` : ''}
                </Text>
              </View>
            ))}
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

          <View style={styles.ctaSpace} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaBar}>
        <Pressable style={styles.ctaButton} onPress={handleGenerateList}>
          <Text style={styles.ctaText}>🛒  Generate shopping list</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const styles = makeStyles(lightColors);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatQuantity(quantity: number): string {
  return Number.isFinite(quantity) ? String(Math.round(quantity * 100) / 100) : '0';
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    hero: {
      height: 320,
      backgroundColor: colors.border,
    },
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    heroIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroIconText: { fontSize: 18, color: colors.text },
    content: {
      marginTop: -radius.xl,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      backgroundColor: colors.background,
      padding: spacing.md,
      paddingTop: spacing.lg,
      gap: spacing.lg,
    },
    title: { fontFamily: fonts.display, fontSize: 28, color: colors.text, lineHeight: 34 },
    description: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: spacing.md,
    },
    stat: { alignItems: 'center', gap: 2, flexBasis: '18%' },
    statValue: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
    statLabel: {
      fontFamily: fonts.body,
      fontSize: 10,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
    tag: {
      backgroundColor: colors.tagBg,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
    },
    tagText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.textSecondary },
    sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 19, color: colors.text },
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
    ingredientQty: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, width: 90 },
    ingredientName: { fontFamily: fonts.body, fontSize: 14, color: colors.text, flex: 1 },
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
    stepNumberText: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff' },
    stepText: { fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 22, flex: 1 },
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
      borderRadius: 999,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    ctaText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: '#fff' },
  });
}
