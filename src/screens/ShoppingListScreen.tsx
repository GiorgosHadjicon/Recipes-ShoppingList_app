import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Pressable,
  SectionList,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingList } from '../context/ShoppingListContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import supermarketsData from '../data/supermarkets.json';
import { radius, spacing, type Colors } from '../theme';
import type { ShoppingListItem, Supermarket } from '../types';

const supermarkets = supermarketsData as Supermarket[];

export function ShoppingListScreen() {
  const { list, toggleItem, clearList } = useShoppingList();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  if (!list) {
    return (
      <SafeAreaView style={styles.empty} edges={['top']}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>No list yet</Text>
        <Text style={styles.emptySubtitle}>
          Pick a recipe and tap "Generate Shopping List" to get started.
        </Text>
        <Pressable
          style={styles.browseButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'RecipesTab' } as any)}
        >
          <Text style={styles.browseButtonText}>Browse Recipes</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentList = list;
  const supermarket = supermarkets.find((s) => s.id === currentList.supermarketId);
  const checkedCount = currentList.groups.flatMap((g) => g.items).filter((i) => i.checked).length;
  const totalCount = currentList.groups.flatMap((g) => g.items).length;

  async function handleShare() {
    const lines: string[] = [`🛒 Shopping List — ${currentList.recipeTitle}`, `📍 ${currentList.supermarketName}`, ''];
    for (const group of currentList.groups) {
      lines.push(group.aisleLabel);
      for (const item of group.items) {
        const check = item.checked ? '✅' : '☐';
        const price = item.product ? ` (${item.product.estimated ? '~' : ''}€${item.product.priceEur.toFixed(2)})` : '';
        lines.push(`  ${check} ${item.ingredient.quantity} ${item.ingredient.unit} ${item.ingredient.name}${price}`);
      }
      lines.push('');
    }
    lines.push(`💰 Est. Total: €${currentList.totalEur.toFixed(2)}`);
    await Share.share({ message: lines.join('\n') });
  }

  const sections = currentList.groups.map((group, gi) => ({
    title: group.aisleLabel,
    groupIndex: gi,
    data: group.items.map((item, ii) => ({ item, gi, ii })),
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.heading} numberOfLines={1}>{list.recipeTitle}</Text>
          <View style={styles.supermarketRow}>
            <View style={[styles.smDot, { backgroundColor: supermarket?.accentColor ?? colors.textMuted }]} />
            <Text style={styles.supermarketName}>{currentList.supermarketName}</Text>
            <Text style={styles.progress}> · {checkedCount}/{totalCount} done</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareIcon}>↑</Text>
        </TouchableOpacity>
      </View>

      {!supermarket && (
        <View style={styles.noPricingBanner}>
          <Text style={styles.noPricingText}>
            No real price data for this store — prices below are estimated from the average at AlphaMega, Sklavenitis, and Lidl.
          </Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(data, i) => `${data.gi}-${data.ii}-${i}`}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: { item, gi, ii } }) => (
          <ListItem item={item} onToggle={() => toggleItem(gi, ii)} />
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalValue}>€{currentList.totalEur.toFixed(2)}</Text>
            </View>
            <Text style={styles.totalNote}>* Based on individual item prices. Exact total may vary.</Text>
            <Pressable style={styles.clearBtn} onPress={clearList}>
              <Text style={styles.clearBtnText}>Clear List</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function ListItem({ item, onToggle }: { item: ShoppingListItem; onToggle: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <Pressable
      style={[styles.item, item.checked && styles.itemChecked]}
      onPress={onToggle}
    >
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
          {item.ingredient.quantity} {item.ingredient.unit} {item.ingredient.name}
        </Text>
        {item.product ? (
          <Text style={styles.itemSub}>
            {item.product.displayName}{item.product.estimated ? ' · estimated' : ''}
          </Text>
        ) : (
          <Text style={[styles.itemSub, styles.itemSubMissing]}>Not found at this store</Text>
        )}
      </View>
      {item.product && (
        <Text style={[styles.itemPrice, item.checked && styles.itemPriceChecked]}>
          {item.product.estimated ? '~' : ''}€{item.product.priceEur.toFixed(2)}
        </Text>
      )}
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    emptyEmoji: { fontSize: 64 },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
    emptySubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    browseButton: {
      marginTop: spacing.sm,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
    },
    browseButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerLeft: { flex: 1 },
    heading: { fontSize: 20, fontWeight: '800', color: colors.text },
    supermarketRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    smDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
    supermarketName: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    progress: { fontSize: 13, color: colors.textMuted },
    shareBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
    noPricingBanner: {
      backgroundColor: colors.tagBg,
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.sm,
    },
    noPricingText: { fontSize: 12, color: colors.textSecondary },
    sectionHeader: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xs,
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 },
    listContent: { paddingBottom: spacing.xl },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: spacing.md,
      marginBottom: 2,
      padding: spacing.md,
      borderRadius: radius.md,
      gap: spacing.sm,
    },
    itemChecked: { opacity: 0.5 },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    checkboxChecked: { backgroundColor: colors.primary },
    checkboxTick: { fontSize: 14, color: '#fff', fontWeight: '700' },
    itemBody: { flex: 1 },
    itemName: { fontSize: 15, color: colors.text, fontWeight: '500' },
    itemNameChecked: { textDecorationLine: 'line-through' },
    itemSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
    itemSubMissing: { color: colors.difficulty.Hard },
    itemPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
    itemPriceChecked: { color: colors.textMuted },
    footer: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    totalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
    totalNote: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
    clearBtn: {
      marginTop: spacing.sm,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    clearBtnText: { fontSize: 14, color: colors.difficulty.Hard, fontWeight: '600' },
  });
}
