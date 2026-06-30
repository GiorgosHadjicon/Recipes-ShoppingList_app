import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingList } from '../context/ShoppingListContext';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import supermarketsData from '../data/supermarkets.json';
import { colors, radius, spacing } from '../theme';
import type { Supermarket } from '../types';

const supermarkets = supermarketsData as Supermarket[];

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SupermarketSelectorModal() {
  const route = useRoute<RouteProp<RootStackParamList, 'SupermarketSelector'>>();
  const navigation = useNavigation<Nav>();
  const { generateList, selectedSupermarketId, loading } = useShoppingList();
  const [chosen, setChosen] = useState(selectedSupermarketId);

  async function handleGenerate() {
    await generateList(route.params.recipeId, chosen);
    navigation.navigate('MainTabs', { screen: 'ShoppingListTab' } as any);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choose Your Supermarket</Text>
      <Text style={styles.subtitle}>Prices will be matched to your chosen store.</Text>

      <View style={styles.options}>
        {supermarkets.map((sm) => (
          <Pressable
            key={sm.id}
            style={[styles.option, chosen === sm.id && styles.optionSelected]}
            onPress={() => setChosen(sm.id)}
          >
            <View style={[styles.colorDot, { backgroundColor: sm.accentColor }]} />
            <Text style={[styles.optionName, chosen === sm.id && styles.optionNameSelected]}>
              {sm.name}
            </Text>
            {chosen === sm.id && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Build My List</Text>
        )}
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  options: { gap: spacing.sm, marginBottom: spacing.xl },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF7E8',
  },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  optionName: { fontSize: 17, fontWeight: '600', color: colors.text, flex: 1 },
  optionNameSelected: { color: colors.primary },
  checkmark: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  cancel: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { fontSize: 16, color: colors.textSecondary },
});
