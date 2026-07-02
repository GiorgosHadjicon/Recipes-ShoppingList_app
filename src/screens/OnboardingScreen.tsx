import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { fonts, palette, spacing } from '../theme';
import { getRecipeImageUrl } from '../utils/recipeImage';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const navigation = useNavigation<Nav>();

  function getStarted() {
    onDone();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }

  function signIn() {
    onDone();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    navigation.navigate('AuthScreen');
  }

  return (
    <ImageBackground source={{ uri: getRecipeImageUrl('roast dinner table', 900, 1600) }} style={styles.hero}>
      <View style={styles.scrim} />
      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        <Text style={styles.logo}>L  Larder</Text>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Cook it · Shop it · Done</Text>
          <Text style={styles.headline}>From recipe to receipt, sorted.</Text>
          <Text style={styles.subtitle}>
            Pick a dish, and walk into the shop knowing what to buy, the cost, and the aisle.
          </Text>

          <Pressable style={styles.cta} onPress={getStarted}>
            <Text style={styles.ctaText}>Get started</Text>
          </Pressable>
          <Pressable onPress={signIn} hitSlop={8}>
            <Text style={styles.signInText}>I already have an account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, backgroundColor: palette.ink },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,15,10,0.55)' },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  logo: { fontFamily: fonts.display, fontSize: 20, color: palette.parchment },
  copy: { gap: spacing.sm },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: palette.parchment,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    color: palette.parchment,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.parchment,
    opacity: 0.85,
    marginBottom: spacing.md,
  },
  cta: {
    backgroundColor: palette.parchment,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: palette.ink },
  signInText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.parchment,
    opacity: 0.85,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
