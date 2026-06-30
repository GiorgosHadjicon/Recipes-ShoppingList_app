import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Recipe } from '../types';
import { DifficultyBadge } from './DifficultyBadge';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: Props) {
  const totalMin = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const timeLabel = totalMin < 60 ? `${totalMin} min` : `${Math.round(totalMin / 60)}h ${totalMin % 60 > 0 ? `${totalMin % 60}m` : ''}`.trim();

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {/* Image placeholder */}
      <View style={styles.imagePlaceholder}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.cuisineOverlay}>{recipe.cuisine}</Text>
      </View>

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

const styles = StyleSheet.create({
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
    backgroundColor: '#F0EDE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
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
    backgroundColor: '#EEF7E8',
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
