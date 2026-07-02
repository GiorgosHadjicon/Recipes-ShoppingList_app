import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecipeCard } from '../components/RecipeCard';
import { useTheme } from '../context/ThemeContext';
import type { CommunityStackParamList } from '../navigation/types';
import { getCommunityRecipes } from '../services/recipeBackendService';
import { fonts, spacing, type Colors } from '../theme';
import type { Recipe } from '../types';

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const load = useCallback(() => {
    getCommunityRecipes()
      .then(setRecipes)
      .catch(() => {}); // backend hiccups already warn in the service; feed just stays as-is
  }, []);

  useFocusEffect(load);

  async function onRefresh() {
    setRefreshing(true);
    await getCommunityRecipes().then(setRecipes).catch(() => {});
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Community</Text>
          <Text style={styles.heading}>Latest recipes</Text>
        </View>
        <Pressable style={styles.chatsButton} onPress={() => navigation.navigate('ChatList')} hitSlop={8}>
          <Text style={styles.chatsButtonText}>💬 Chats</Text>
        </Pressable>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View>
            <Text style={styles.attribution}>
              by {item.authorName ?? 'Unknown'}
              {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
            </Text>
            <RecipeCard
              recipe={item}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
            />
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              Recipes added by the community show up here. Add one from the Recipes tab to get things going.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    kicker: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heading: { fontFamily: fonts.display, fontSize: 30, color: colors.text, marginTop: 2 },
    chatsButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      marginTop: spacing.xs,
    },
    chatsButtonText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
    attribution: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      marginHorizontal: spacing.md,
      marginBottom: spacing.xs,
    },
    list: { paddingBottom: spacing.xl },
    empty: { paddingTop: spacing.xl, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.sm },
    emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
    emptySubtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
}
