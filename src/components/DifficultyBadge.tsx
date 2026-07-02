import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing } from '../theme';
import type { Difficulty } from '../types';

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { colors } = useTheme();
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
