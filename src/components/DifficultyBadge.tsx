import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, lightColors, radius, spacing } from '../theme';
import type { DifficultyLevel } from '../types';

export function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  const colors = lightColors;
  return (
    <View style={[styles.badge, { backgroundColor: colors.difficultyBg[difficulty] }]}>
      <Text style={[styles.text, { color: colors.difficulty[difficulty] }]}>{difficulty}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
