import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { CommunityStackParamList } from '../navigation/types';
import { addMember, createChat, getChats, type Chat } from '../services/chatService';
import { fonts, radius, spacing, type Colors } from '../theme';

export function ChatListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [chats, setChats] = useState<Chat[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [name, setName] = useState('');
  const [emails, setEmails] = useState('');
  const [creating, setCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) getChats().then(setChats).catch(() => {});
    }, [user]),
  );

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const chat = await createChat(name.trim());
      const failures: string[] = [];
      for (const identifier of emails.split(',').map((e) => e.trim()).filter(Boolean)) {
        try {
          await addMember(chat.id, identifier);
        } catch (err) {
          failures.push(`${identifier} — ${err instanceof Error ? err.message : 'failed'}`);
        }
      }
      if (failures.length > 0) {
        Alert.alert("Couldn't add some members", failures.join('\n'));
      }
      setName('');
      setEmails('');
      setComposerOpen(false);
      navigation.navigate('ChatThread', { chatId: chat.id, chatName: chat.name });
    } catch (err) {
      Alert.alert('Could not create chat', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setCreating(false);
    }
  }

  if (!user) {
    return (
      <View style={styles.signInPrompt}>
        <Text style={styles.signInText}>Sign in to chat with friends and share recipes.</Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('AuthScreen' as never)}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.newChatToggle} onPress={() => setComposerOpen((v) => !v)}>
        <Text style={styles.newChatToggleText}>{composerOpen ? '✕ Cancel' : '+ New chat'}</Text>
      </Pressable>

      {composerOpen && (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Chat name, e.g. Sunday cooks"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={styles.input}
            value={emails}
            onChangeText={setEmails}
            placeholder="Friends' usernames or emails, comma-separated"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          <Pressable
            style={[styles.primaryButton, !name.trim() && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={!name.trim() || creating}
          >
            <Text style={styles.primaryButtonText}>{creating ? 'Creating…' : 'Create chat'}</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.chatRow, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate('ChatThread', { chatId: item.id, chatName: item.name })}
          >
            <Text style={styles.chatName}>{item.name}</Text>
            <Text style={styles.chatMeta}>created {new Date(item.createdAt).toLocaleDateString()}</Text>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No chats yet. Start one and invite friends by username or email.
          </Text>
        }
      />
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    signInPrompt: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    signInText: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    primaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#fff' },
    buttonDisabled: { opacity: 0.5 },
    newChatToggle: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    newChatToggleText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },
    composer: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.text,
    },
    list: { paddingBottom: spacing.xl },
    chatRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 2,
    },
    chatName: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.text },
    chatMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
    emptyText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.xl,
      lineHeight: 20,
    },
  });
}
