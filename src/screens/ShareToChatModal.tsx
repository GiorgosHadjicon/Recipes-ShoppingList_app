import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { getChats, sendMessage, type Chat } from '../services/chatService';
import { fonts, spacing, type Colors } from '../theme';

export function ShareToChatModal() {
  const route = useRoute<RouteProp<RootStackParamList, 'ShareToChat'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { recipeId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [chats, setChats] = useState<Chat[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    if (user) getChats().then(setChats).catch(() => {});
  }, [user]);

  async function handleShare(chat: Chat) {
    if (sendingTo) return;
    setSendingTo(chat.id);
    try {
      await sendMessage(chat.id, { recipeRef: recipeId });
      navigation.goBack();
    } catch (err) {
      setSendingTo(null);
      Alert.alert('Could not share', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Share to chat</Text>

      {!user ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Sign in to share recipes with friends.</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              navigation.goBack();
              navigation.navigate('AuthScreen');
            }}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.chatRow, pressed && { opacity: 0.85 }]}
              onPress={() => handleShare(item)}
              disabled={sendingTo !== null}
            >
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.shareHint}>{sendingTo === item.id ? 'Sharing…' : 'Share ›'}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No chats yet — create one from the Community tab first.
            </Text>
          }
        />
      )}

      <Pressable style={styles.cancel} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
    title: {
      fontFamily: fonts.display,
      fontSize: 24,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
    chatRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    chatName: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.text },
    shareHint: { fontFamily: fonts.body, fontSize: 14, color: colors.primary },
    emptyText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.xl,
      lineHeight: 20,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    primaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#fff' },
    cancel: { alignItems: 'center', paddingVertical: spacing.md },
    cancelText: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary },
  });
}
