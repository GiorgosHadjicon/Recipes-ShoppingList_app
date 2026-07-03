import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import supermarketsData from '../data/supermarkets.json';
import type { RootStackParamList } from '../navigation/types';
import { getCurrentPosition, type Coords } from '../services/locationService';
import { getMyProfile, updateMyProfile, type Profile } from '../services/profileService';
import {
  clearSupermarketLocation,
  getSupermarketLocations,
  setSupermarketLocation,
} from '../services/supermarketLocationService';
import { spacing, radius, type Colors } from '../theme';
import type { Supermarket } from '../types';

const supermarkets = supermarketsData as Supermarket[];

const AVATAR_EMOJIS = ['🍳', '🍕', '🥑', '🌮', '🍜', '🍰', '🥕', '🍇', '🌶️', '🧀', '🍣', '☕'];
const AVATAR_COLORS = ['#C1663E', '#E8B94F', '#7A9E7E', '#5E8CA7', '#A56FA5', '#C25B6A', '#8C7B5E', '#607D8B'];

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const { colors, scheme, toggleScheme } = useTheme();
  const styles = makeStyles(colors);
  const [locations, setLocations] = useState<Record<string, Coords>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    getSupermarketLocations().then(setLocations);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    getMyProfile()
      .then((p) => {
        setProfile(p);
        if (p) setUsernameDraft(p.username);
      })
      .catch(() => {});
  }, [user?.id]);

  async function handleSaveProfile(changes: { username?: string; avatarEmoji?: string; avatarColor?: string }) {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      await updateMyProfile(changes);
      setProfile((p) =>
        p
          ? {
              ...p,
              username: changes.username?.trim().toLowerCase() ?? p.username,
              avatarEmoji: changes.avatarEmoji ?? p.avatarEmoji,
              avatarColor: changes.avatarColor ?? p.avatarColor,
            }
          : p,
      );
    } catch (err) {
      Alert.alert('Could not save profile', err instanceof Error ? err.message : 'Please try again.');
      if (profile) setUsernameDraft(profile.username);
    } finally {
      setSavingProfile(false);
    }
  }

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
          {user && profile && <Avatar emoji={profile.avatarEmoji} color={profile.avatarColor} size={36} />}
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>
              {user ? (profile ? `@${profile.username}` : user.email) : 'Not signed in'}
            </Text>
            <Text style={styles.rowSubtext}>{user ? user.email : 'Sign in to add your own recipes'}</Text>
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

        {user && profile && (
          <View style={styles.profileCard}>
            <Text style={styles.rowLabel}>Profile</Text>

            <View style={styles.usernameRow}>
              <TextInput
                style={styles.usernameInput}
                value={usernameDraft}
                onChangeText={setUsernameDraft}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="username"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable
                onPress={() => handleSaveProfile({ username: usernameDraft })}
                disabled={savingProfile || usernameDraft.trim().toLowerCase() === profile.username}
              >
                <Text
                  style={[
                    styles.setText,
                    (savingProfile || usernameDraft.trim().toLowerCase() === profile.username) && { opacity: 0.4 },
                  ]}
                >
                  {savingProfile ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.rowSubtext}>Avatar</Text>
            <View style={styles.chipRow}>
              {AVATAR_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={[styles.emojiChip, profile.avatarEmoji === emoji && styles.chipSelected]}
                  onPress={() => handleSaveProfile({ avatarEmoji: emoji })}
                >
                  <Text style={styles.emojiChipText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.chipRow}>
              {AVATAR_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorChip,
                    { backgroundColor: color },
                    profile.avatarColor === color && styles.chipSelected,
                  ]}
                  onPress={() => handleSaveProfile({ avatarColor: color })}
                />
              ))}
            </View>
          </View>
        )}

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
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    usernameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    usernameInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.text,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    emojiChip: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiChipText: { fontSize: 20 },
    colorChip: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    chipSelected: { borderColor: colors.primary },
  });
}
