import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingList } from '../context/ShoppingListContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import supermarketsData from '../data/supermarkets.json';
import { distanceKm, getCurrentPosition } from '../services/locationService';
import { searchNearbySupermarkets } from '../services/nearbyStoreService';
import { getSupermarketLocations } from '../services/supermarketLocationService';
import { radius, spacing, type Colors } from '../theme';
import type { Supermarket } from '../types';

const supermarkets = supermarketsData as Supermarket[];
const UNMATCHED_COLOR = '#8E8E93';

interface StoreOption {
  id: string;
  name: string;
  accentColor: string;
  distanceKm: number | null;
  hasPricing: boolean;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SupermarketSelectorModal() {
  const route = useRoute<RouteProp<RootStackParamList, 'SupermarketSelector'>>();
  const navigation = useNavigation<Nav>();
  const { generateList, generateWeeklyList, selectedSupermarketId, loading } = useShoppingList();
  const [chosen, setChosen] = useState(selectedSupermarketId);
  const [options, setOptions] = useState<StoreOption[]>(
    supermarkets.map((sm) => ({ id: sm.id, name: sm.name, accentColor: sm.accentColor, distanceKm: null, hasPricing: true })),
  );
  const [searchingNearby, setSearchingNearby] = useState(false);
  const userChangedSelection = useRef(false);
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    let cancelled = false;

    async function locateStores() {
      setSearchingNearby(true);
      const current = await getCurrentPosition();
      if (!current || cancelled) {
        setSearchingNearby(false);
        return;
      }

      const known: StoreOption[] = supermarkets.map((sm) => ({
        id: sm.id,
        name: sm.name,
        accentColor: sm.accentColor,
        distanceKm: null,
        hasPricing: true,
      }));
      const extra: StoreOption[] = [];

      const nearby = await searchNearbySupermarkets(current);
      if (nearby.length > 0) {
        for (const store of nearby) {
          if (store.matchedSupermarketId) {
            const match = known.find((k) => k.id === store.matchedSupermarketId);
            if (match && (match.distanceKm === null || store.distanceKm < match.distanceKm)) {
              match.distanceKm = store.distanceKm;
            }
          } else {
            extra.push({
              id: store.id,
              name: store.name,
              accentColor: UNMATCHED_COLOR,
              distanceKm: store.distanceKm,
              hasPricing: false,
            });
          }
        }
      } else {
        // Overpass found nothing (offline / no data for this area) — fall back to
        // whatever the user manually pinned in Settings for the 3 known chains.
        const pinned = await getSupermarketLocations();
        for (const [id, coords] of Object.entries(pinned)) {
          const match = known.find((k) => k.id === id);
          if (match) match.distanceKm = distanceKm(current, coords);
        }
      }

      if (cancelled) return;
      const combined = [...known, ...extra.slice(0, 8)].sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
      setOptions(combined);
      if (!userChangedSelection.current && combined[0]?.distanceKm !== null) setChosen(combined[0].id);
      setSearchingNearby(false);
    }

    locateStores();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerate() {
    const store = options.find((o) => o.id === chosen);
    const name = store?.name ?? chosen;
    if ('recipeIds' in route.params) {
      await generateWeeklyList(route.params.recipeIds, chosen, name);
    } else {
      await generateList(route.params.recipeId, chosen, name, route.params.ingredients);
    }
    navigation.navigate('MainTabs', { screen: 'ShoppingListTab' } as any);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choose Your Supermarket</Text>
      <Text style={styles.subtitle}>
        {searchingNearby ? 'Looking for nearby stores...' : 'Prices will be matched to your chosen store.'}
      </Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
        {options.map((sm) => (
          <Pressable
            key={sm.id}
            style={[styles.option, chosen === sm.id && styles.optionSelected]}
            onPress={() => {
              userChangedSelection.current = true;
              setChosen(sm.id);
            }}
          >
            <View style={[styles.colorDot, { backgroundColor: sm.accentColor }]} />
            <View style={styles.optionTextBlock}>
              <Text style={[styles.optionName, chosen === sm.id && styles.optionNameSelected]}>
                {sm.name}
              </Text>
              {!sm.hasPricing && <Text style={styles.noPricingHint}>No price data yet</Text>}
            </View>
            {sm.distanceKm !== null && (
              <Text style={styles.distanceText}>
                {sm.distanceKm < 1 ? `${Math.round(sm.distanceKm * 1000)}m` : `${sm.distanceKm.toFixed(1)}km`}
              </Text>
            )}
            {chosen === sm.id && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
        ))}
      </ScrollView>

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

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    scroll: { flex: 1 },
    options: { gap: spacing.sm, paddingVertical: spacing.sm },
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
      backgroundColor: colors.tagBg,
    },
    colorDot: { width: 20, height: 20, borderRadius: 10 },
    optionTextBlock: { flex: 1, gap: 1 },
    optionName: { fontSize: 17, fontWeight: '600', color: colors.text },
    optionNameSelected: { color: colors.primary },
    noPricingHint: { fontSize: 12, color: colors.textMuted },
    distanceText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
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
}
