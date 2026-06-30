import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DifficultyBadge } from '../components/DifficultyBadge';
import type { RecipesStackParamList } from '../navigation/types';
import type { RootStackParamList } from '../navigation/types';
import { getRecipeById } from '../services/recipeService';
import { colors, radius, spacing } from '../theme';
import type { Recipe } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RecipeDetailScreen() {
  const route = useRoute<RouteProp<RecipesStackParamList, 'RecipeDetail'>>();
  const navigation = useNavigation<Nav>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero placeholder */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🍽️</Text>
          <Text style={styles.heroCuisine}>{recipe.cuisine}</Text>
        </View>

        <View style={styles.content}>
          <DifficultyBadge difficulty={recipe.difficulty} />
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
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.section}>
            {recipe.ingredients.map((ing) => (
              <View key={ing.id} style={styles.ingredientRow}>
                <Text style={styles.ingredientQty}>
                  {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity} {ing.unit}
                </Text>
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
        <Pressable
          style={styles.ctaButton}
          onPress={() => navigation.navigate('SupermarketSelector', { recipeId: recipe.id })}
        >
          <Text style={styles.ctaText}>Generate Shopping List</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    height: 200,
    backgroundColor: '#F0EDE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 72 },
  heroCuisine: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  content: { padding: spacing.md, gap: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, lineHeight: 32 },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: '#EEF7E8',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: { fontSize: 12, color: colors.primaryLight, fontWeight: '600' },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: colors.text },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  ingredientQty: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    width: 80,
  },
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
