import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecipeCard } from '../components/RecipeCard';
import type { RecipesStackParamList } from '../navigation/types';
import { getRecipes } from '../services/recipeService';
import { fonts, lightColors, spacing, radius, type Colors } from '../theme';
import type { DifficultyLevel, Recipe } from '../types';
import { getRecipeImageUrl } from '../utils/recipeImage';

const FILTERS: Array<DifficultyLevel | 'All'> = ['All', 'Easy', 'Medium', 'Hard'];
const DIFFICULTY_ORDER: Record<DifficultyLevel, number> = { Easy: 0, Medium: 1, Hard: 2 };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeLabelFor(recipe: Recipe): string {
  const totalMin = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  return totalMin < 60 ? `${totalMin} min` : `${Math.floor(totalMin / 60)}h ${totalMin % 60 > 0 ? `${totalMin % 60}m` : ''}`.trim();
}

function FeaturedCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const styles = makeStyles(lightColors);
  return (
    <>
      <Text style={styles.featuredLabel}>Featured tonight</Text>
      <Pressable onPress={onPress}>
        <ImageBackground
          source={{ uri: getRecipeImageUrl(recipe.title, 800, 500) }}
          style={styles.featuredCard}
          imageStyle={{ borderRadius: radius.lg }}
        >
          <View style={styles.featuredScrim}>
            <Text style={styles.featuredTitle} numberOfLines={1}>{recipe.title}</Text>
            <Text style={styles.featuredMeta}>
              {timeLabelFor(recipe)} · {recipe.difficulty} · ~€{recipe.estimatedCostEur.toFixed(0)}
            </Text>
          </View>
        </ImageBackground>
      </Pressable>
    </>
  );
}

export function RecipeBrowseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RecipesStackParamList>>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filter, setFilter] = useState<DifficultyLevel | 'All'>('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterRowHeight, setFilterRowHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<Recipe>>(null);
  const colors = lightColors;
  const styles = makeStyles(colors);

  // Hides the filter row as you scroll down, reveals it as soon as you scroll back up —
  // diffClamp tracks scroll delta rather than absolute position, so a small scroll-up
  // reveals it immediately regardless of how far down the list you are.
  const clampedScrollY = useMemo(
    () => Animated.diffClamp(scrollY, 0, filterRowHeight || 1),
    [scrollY, filterRowHeight],
  );
  const filterRowAnimatedHeight = clampedScrollY.interpolate({
    inputRange: [0, filterRowHeight || 1],
    outputRange: [filterRowHeight || 1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    getRecipes().then((data) => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = recipes
    .filter((r) => !q || r.title.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q))
    .filter((r) => filter === 'All' || r.difficulty === filter)
    .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);

  const showFeatured = filter === 'All' && !q;
  const featured = showFeatured ? filtered[0] : undefined;
  const listData = featured ? filtered.slice(1) : filtered;
  const hasActiveFilters = filter !== 'All' || !!q;

  function clearFilters() {
    setQuery('');
    setFilter('All');
  }

  // Changing a filter/search while scrolled down (and the row hidden) shouldn't strand
  // you with no way to see the pills again — snap back to the top so it reappears.
  useEffect(() => {
    scrollY.setValue(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filter, query]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.heading}>What's cooking?</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search recipes, ingredients..."
          placeholderTextColor={colors.textMuted}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Text style={styles.searchClear}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Filter pills — collapses on scroll down, reappears on scroll up */}
      <Animated.View style={{ height: filterRowHeight ? filterRowAnimatedHeight : undefined, overflow: 'hidden' }}>
        <View
          style={styles.filterRow}
          onLayout={(e) => {
            if (filterRowHeight === 0) setFilterRowHeight(e.nativeEvent.layout.height);
          }}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          ref={listRef}
          data={listData}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
            />
          )}
          ListHeaderComponent={
            featured ? (
              <FeaturedCard
                recipe={featured}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: featured.id })}
              />
            ) : null
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            // Clamp out iOS rubber-band bounce at both ends — diffClamp tracks deltas,
            // and the bottom bounce-back reads as a scroll-up, popping the filter row open.
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            const maxOffset = Math.max(0, contentSize.height - layoutMeasurement.height);
            scrollY.setValue(Math.min(Math.max(0, contentOffset.y), maxOffset));
          }}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>🙁</Text>
              </View>
              <Text style={styles.emptyTitle}>Nothing on the menu</Text>
              <Text style={styles.emptySubtitle}>
                {`No recipes match ${q ? `"${query.trim()}"` : 'these filters'} just yet. Loosen a filter and we'll find you something to cook.`}
              </Text>
              {hasActiveFilters && (
                <Pressable style={styles.clearFiltersBtn} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    greeting: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heading: {
      fontFamily: fonts.display,
      fontSize: 30,
      color: colors.text,
      marginTop: 2,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
    },
    searchIcon: { fontSize: 14, paddingRight: spacing.xs },
    searchInput: {
      flex: 1,
      fontFamily: fonts.body,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.text,
    },
    searchClear: { fontSize: 15, color: colors.textMuted, paddingLeft: spacing.sm },
    empty: { paddingTop: spacing.xl, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.sm },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyIconText: { fontSize: 28 },
    emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
    emptySubtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    clearFiltersBtn: {
      marginTop: spacing.sm,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 999,
    },
    clearFiltersText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: '#fff' },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    filterPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: '#fff',
    },
    featuredLabel: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 11,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    featuredCard: {
      height: 190,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      borderRadius: radius.lg,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    featuredScrim: {
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: spacing.md,
    },
    featuredTitle: { fontFamily: fonts.display, fontSize: 21, color: '#fff' },
    featuredMeta: { fontFamily: fonts.body, fontSize: 12, color: '#fff', marginTop: 2, opacity: 0.9 },
    list: {
      paddingBottom: spacing.xl,
    },
    loader: {
      flex: 1,
    },
  });
}
