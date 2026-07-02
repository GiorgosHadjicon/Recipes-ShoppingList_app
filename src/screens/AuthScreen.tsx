import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { fonts, radius, spacing, type Colors } from '../theme';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn, signUp, signInWithProvider } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  async function handleProvider(provider: 'google' | 'apple') {
    setOauthLoading(provider);
    setError(null);
    setNotice(null);
    const err = await signInWithProvider(provider);
    setOauthLoading(null);
    if (err) {
      setError(err);
      return;
    }
    navigation.goBack();
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    if (mode === 'signin') {
      const err = await signIn(email.trim(), password);
      setSubmitting(false);
      if (err) {
        setError(err);
        return;
      }
      navigation.goBack();
    } else {
      const err = await signUp(email.trim(), password);
      setSubmitting(false);
      if (err) {
        setError(err);
        return;
      }
      setMode('signin');
      setNotice('Account created. Check your email to confirm it, then sign in below.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin' ? 'Sign in to add your own recipes.' : 'Join to start adding your own recipes.'}
        </Text>

        {notice && <Text style={styles.notice}>{notice}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={styles.providerButton}
          onPress={() => handleProvider('google')}
          disabled={oauthLoading !== null}
        >
          {oauthLoading === 'google' ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.providerButtonText}>Continue with Google</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.providerButton}
          onPress={() => handleProvider('apple')}
          disabled={oauthLoading !== null}
        >
          {oauthLoading === 'apple' ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.providerButtonText}>Continue with Apple</Text>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
        />

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.toggleRow}
          onPress={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError(null);
            setNotice(null);
          }}
        >
          <Text style={styles.toggleText}>
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </Pressable>

        <Pressable style={styles.cancel} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.xs },
    title: { fontFamily: fonts.display, fontSize: 26, color: colors.text, textAlign: 'center' },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    notice: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.primary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    error: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.difficulty.Hard,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    providerButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 999,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    providerButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
    dividerText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
    label: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
      marginTop: spacing.sm,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.text,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: '#fff' },
    toggleRow: { alignItems: 'center', paddingVertical: spacing.md },
    toggleText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
    cancel: { alignItems: 'center', paddingVertical: spacing.sm },
    cancelText: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary },
  });
}
