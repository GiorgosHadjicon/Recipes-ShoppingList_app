import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import supermarketsData from '../data/supermarkets.json';
import type { RootStackParamList } from '../navigation/types';
import { getCurrentPosition, type Coords } from '../services/locationService';
import {
  clearSupermarketLocation,
  getSupermarketLocations,
  setSupermarketLocation,
} from '../services/supermarketLocationService';
import { spacing, radius, type Colors } from '../theme';
import type { Supermarket } from '../types';

const supermarkets = supermarketsData as Supermarket[];

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const { colors, scheme, toggleScheme } = useTheme();
  const styles = makeStyles(colors);
  const [locations, setLocations] = useState<Record<string, Coords>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    getSupermarketLocations().then(setLocations);
  }, []);

  async function handleSetLocation(supermarketId: string) {
    setSavingId(supermarketId);
    const position = await getCurrentPosition();
    setSavingId(null);
    if (!position) {
      Alert.alert('Location unavailable', 'Enable location access for this app in your device settings to use this.');
      return;
    }
    await setSupermarketLocation(supermarketId, position);
    setLocations((prev) => ({ ...prev, [supermarketId]: position }));
  }

  async function handleClearLocation(supermarketId: string) {
    await clearSupermarketLocation(supermarketId);
    setLocations((prev) => {
      const next = { ...prev };
      delete next[supermarketId];
      return next;
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.heading}>Settings</Text>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{user ? user.email : 'Not signed in'}</Text>
            <Text style={styles.rowSubtext}>
              {user ? 'You can add and manage your own recipes' : 'Sign in to add your own recipes'}
            </Text>
          </View>
          {user ? (
            <Pressable onPress={signOut}>
              <Text style={styles.clearText}>Sign Out</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => navigation.navigate('AuthScreen')}>
              <Text style={styles.setText}>Sign In</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Dark Mode</Text>
            <Text style={styles.rowSubtext}>Switch between light and dark appearance</Text>
          </View>
          <Switch
            value={scheme === 'dark'}
            onValueChange={toggleScheme}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <Text style={styles.sectionTitle}>My Supermarkets</Text>
        <Text style={styles.sectionSubtext}>
          Save the location of the branch you actually shop at, so the app can suggest your nearest one when you generate a list.
        </Text>
        {supermarkets.map((sm) => {
          const isSet = Boolean(locations[sm.id]);
          return (
            <View key={sm.id} style={styles.row}>
              <View style={styles.rowText}>
                <View style={styles.smNameRow}>
                  <View style={[styles.smDot, { backgroundColor: sm.accentColor }]} />
                  <Text style={styles.rowLabel}>{sm.name}</Text>
                </View>
                <Text style={styles.rowSubtext}>
                  {isSet ? '📍 Location saved' : 'Not set — using manual selection'}
                </Text>
              </View>
              {isSet ? (
                <Pressable onPress={() => handleClearLocation(sm.id)}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => handleSetLocation(sm.id)} disabled={savingId === sm.id}>
                  <Text style={styles.setText}>{savingId === sm.id ? 'Locating...' : 'Set to here'}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
    heading: { fontSize: 30, fontWeight: '800', color: colors.text },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginHorizontal: spacing.md,
      marginTop: spacing.lg,
    },
    sectionSubtext: {
      fontSize: 13,
      color: colors.textSecondary,
      marginHorizontal: spacing.md,
      marginTop: 2,
      marginBottom: spacing.sm,
      lineHeight: 18,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.md,
    },
    rowText: { flex: 1, gap: 2 },
    smNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    smDot: { width: 10, height: 10, borderRadius: 5 },
    rowLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
    rowSubtext: { fontSize: 13, color: colors.textSecondary },
    setText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    clearText: { fontSize: 14, fontWeight: '600', color: colors.difficulty.Hard },
  });
}
