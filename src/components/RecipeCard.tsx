import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { DifficultyBadge } from './DifficultyBadge';
import { fonts, lightColors, radius, spacing, type Colors } from '../theme';
import type { Recipe } from '../types';
import { getRecipeImageUrl } from '../utils/recipeImage';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: Props) {
  const styles = makeStyles(lightColors);
  const totalMin = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const timeLabel = totalMin < 60 ? `${totalMin} min` : `${Math.round(totalMin / 60)}h ${totalMin % 60 > 0 ? `${totalMin % 60}m` : ''}`.trim();

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <Image source={{ uri: getRecipeImageUrl(recipe.title) }} style={styles.thumb} />

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        <Text style={styles.meta}>{timeLabel} · €{recipe.estimatedCostEur.toFixed(2)}</Text>

        <View style={styles.badgeRow}>
          <DifficultyBadge difficulty={recipe.difficulty} />
          {recipe.dietaryTags.length > 0 && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{recipe.dietaryTags[0]}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      gap: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    pressed: {
      opacity: 0.85,
    },
    thumb: {
      width: 96,
      height: 96,
      borderRadius: radius.md,
      backgroundColor: colors.border,
    },
    body: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing.sm,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 18,
      color: colors.text,
      lineHeight: 22,
    },
    meta: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textSecondary,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
    },
    tag: {
      backgroundColor: colors.tagBg,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    tagText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 11,
      color: colors.textSecondary,
    },
  });
}
