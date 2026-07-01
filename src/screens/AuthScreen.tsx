import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { radius, spacing, type Colors } from '../theme';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 6;

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
    title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    notice: {
      fontSize: 13,
      color: colors.primary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    error: {
      fontSize: 13,
      color: colors.difficulty.Hard,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, marginTop: spacing.sm },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.text,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
    toggleRow: { alignItems: 'center', paddingVertical: spacing.md },
    toggleText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
    cancel: { alignItems: 'center', paddingVertical: spacing.sm },
    cancelText: { fontSize: 15, color: colors.textSecondary },
  });
}
