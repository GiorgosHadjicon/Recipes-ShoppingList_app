import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecipeCard } from '../components/RecipeCard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RecipesStackParamList } from '../navigation/types';
import { getRecipes, isHealthy, isHighProtein, isOwnRecipe } from '../services/recipeService';
import { spacing, radius, type Colors } from '../theme';
import type { Difficulty, Recipe } from '../types';

const FILTERS: Array<Difficulty | 'All'> = ['All', 'Easy', 'Medium', 'Hard'];
const DIFFICULTY_ORDER: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

export function RecipeBrowseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RecipesStackParamList>>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filter, setFilter] = useState<Difficulty | 'All'>('All');
  const [healthyOnly, setHealthyOnly] = useState(false);
  const [highProteinOnly, setHighProteinOnly] = useState(false);
  const [myRecipesOnly, setMyRecipesOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterRowHeight, setFilterRowHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<Recipe>>(null);
  const { user } = useAuth();
  const { colors } = useTheme();
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
    // Refetch on focus so a recipe just added via AddRecipe shows up without a full reload.
    const unsubscribe = navigation.addListener('focus', () => {
      getRecipes().then(setRecipes);
    });
    return unsubscribe;
  }, [navigation]);

  const q = query.trim().toLowerCase();
  const filtered = recipes
    .filter((r) => !q || r.title.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q))
    .filter((r) => filter === 'All' || r.difficulty === filter)
    .filter((r) => !healthyOnly || isHealthy(r))
    .filter((r) => !highProteinOnly || isHighProtein(r))
    .filter((r) => !myRecipesOnly || isOwnRecipe(r, user?.id ?? null))
    .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);

  // Changing a filter/search while scrolled down (and the row hidden) shouldn't strand
  // you with no way to see the pills again — snap back to the top so it reappears.
  useEffect(() => {
    scrollY.setValue(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filter, healthyOnly, highProteinOnly, myRecipesOnly, query]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>Recipes</Text>
            <Text style={styles.subheading}>Pick a dish, get your shopping list</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => navigation.navigate('AddRecipe')}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search recipes by name or cuisine..."
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
          <Pressable
            onPress={() => setHealthyOnly((v) => !v)}
            style={[styles.filterPill, healthyOnly && styles.filterPillActive]}
          >
            <Text style={[styles.filterText, healthyOnly && styles.filterTextActive]}>🥗 Healthy</Text>
          </Pressable>
          <Pressable
            onPress={() => setHighProteinOnly((v) => !v)}
            style={[styles.filterPill, highProteinOnly && styles.filterPillActive]}
          >
            <Text style={[styles.filterText, highProteinOnly && styles.filterTextActive]}>💪 High Protein</Text>
          </Pressable>
          <Pressable
            onPress={() => setMyRecipesOnly((v) => !v)}
            style={[styles.filterPill, myRecipesOnly && styles.filterPillActive]}
          >
            <Text style={[styles.filterText, myRecipesOnly && styles.filterTextActive]}>👤 My Recipes</Text>
          </Pressable>
        </View>
      </Animated.View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          ref={listRef}
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            // Clamp out negative offsets from iOS's rubber-band bounce at the top —
            // diffClamp tracks deltas, and bounce noise makes it jump erratically otherwise.
            scrollY.setValue(Math.max(0, e.nativeEvent.contentOffset.y));
          }}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {myRecipesOnly ? "You haven't added any recipes yet." : 'No recipes match your search or filters.'}
              </Text>
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
    heading: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
    },
    subheading: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      marginTop: spacing.xs,
    },
    addButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.text,
    },
    searchClear: { fontSize: 15, color: colors.textMuted, paddingLeft: spacing.sm },
    empty: { paddingTop: spacing.xl, paddingHorizontal: spacing.xl, alignItems: 'center' },
    emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
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
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: '#fff',
    },
    list: {
      paddingBottom: spacing.xl,
    },
    loader: {
      flex: 1,
    },
  });
}
