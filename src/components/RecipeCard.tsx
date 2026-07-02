import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, type Colors } from '../theme';
import type { Recipe } from '../types';
import { getRecipeImageUrl } from '../utils/recipeImage';

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
      <Image source={{ uri: getRecipeImageUrl(recipe.title) }} style={styles.thumb} />

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.meta}>
          {timeLabel} · {recipe.difficulty} · €{recipe.estimatedCostEur.toFixed(2)}
        </Text>

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
      flexDirection: 'row',
      gap: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    pressed: {
      opacity: 0.85,
    },
    thumb: {
      width: 84,
      height: 84,
      borderRadius: radius.md,
      backgroundColor: colors.border,
    },
    body: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing.xs,
    },
    title: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
      color: colors.text,
    },
    meta: {
      fontFamily: fonts.body,
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
