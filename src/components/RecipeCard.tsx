import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, type Colors } from '../theme';
import type { Recipe } from '../types';
import { getRecipeImageUrl } from '../utils/recipeImage';
import { DifficultyBadge } from './DifficultyBadge';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const totalMin = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const timeLabel = totalMin < 60 ? `${totalMin} min` : `${Math.round(totalMin / 60)}h ${totalMin % 60 > 0 ? `${totalMin % 60}m` : ''}`.trim();

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <ImageBackground source={{ uri: getRecipeImageUrl(recipe.title) }} style={styles.imagePlaceholder}>
        <Text style={styles.cuisineOverlay}>{recipe.cuisine}</Text>
      </ImageBackground>

      <View style={styles.body}>
        <DifficultyBadge difficulty={recipe.difficulty} />
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>⏱ {timeLabel}</Text>
          <Text style={styles.metaText}>👤 {recipe.servings}</Text>
          <Text style={styles.metaText}>€{recipe.estimatedCostEur.toFixed(0)}</Text>
        </View>

        {recipe.dietaryTags.length > 0 && (
          <View style={styles.tags}>
            {recipe.dietaryTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    imagePlaceholder: {
      height: 140,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cuisineOverlay: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.sm,
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    body: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 22,
    },
    meta: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    metaText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    tag: {
      backgroundColor: colors.tagBg,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    tagText: {
      fontSize: 11,
      color: colors.primaryLight,
      fontWeight: '600',
    },
  });
}
