import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { RecipeCard } from '../components/RecipeCard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { CommunityStackParamList } from '../navigation/types';
import {
  addMember,
  addReaction,
  getMessages,
  removeReaction,
  sendMessage,
  subscribeToMessages,
  type ChatMessage,
} from '../services/chatService';
import { getRecipes } from '../services/recipeService';
import { fonts, radius, spacing, type Colors } from '../theme';
import type { Recipe } from '../types';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function ChatThreadScreen() {
  const route = useRoute<RouteProp<CommunityStackParamList, 'ChatThread'>>();
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { chatId, chatName } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipesById, setRecipesById] = useState<Map<string, Recipe>>(new Map());
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const loadMessages = useCallback(() => {
    getMessages(chatId).then(setMessages).catch(() => {});
  }, [chatId]);

  useEffect(() => {
    loadMessages();
    getRecipes()
      .then((all) => setRecipesById(new Map(all.map((r) => [r.id, r]))))
      .catch(() => {});
    return subscribeToMessages(chatId, loadMessages);
  }, [chatId, loadMessages]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendMessage(chatId, { body });
      setDraft('');
      loadMessages();
    } catch (err) {
      Alert.alert('Could not send', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleToggleReaction(message: ChatMessage, emoji: string) {
    setPickerFor(null);
    const mine = message.reactions.some((r) => r.emoji === emoji && r.mine);
    try {
      if (mine) {
        await removeReaction(message.id, emoji);
      } else {
        await addReaction(chatId, message.id, emoji);
      }
      loadMessages();
    } catch (err) {
      Alert.alert('Could not react', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  async function handleInvite() {
    const identifier = inviteEmail.trim();
    if (!identifier) return;
    try {
      const addedName = await addMember(chatId, identifier);
      setInviteEmail('');
      setInviteOpen(false);
      Alert.alert('Member added', `@${addedName} is now in this chat.`);
    } catch (err) {
      Alert.alert('Could not add member', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  const renderMessage = useMemo(
    () =>
      function MessageBubble({ item }: { item: ChatMessage }) {
        const mine = item.senderId === user?.id;
        const recipe = item.recipeRef ? recipesById.get(item.recipeRef) : undefined;
        return (
          <View style={[styles.messageRow, mine && styles.messageRowMine]}>
            {!mine && (
              <View style={styles.senderRow}>
                <Avatar emoji={item.senderAvatarEmoji} color={item.senderAvatarColor} size={22} />
                <Text style={styles.sender}>@{item.senderName}</Text>
              </View>
            )}
            <Pressable onLongPress={() => setPickerFor((v) => (v === item.id ? null : item.id))}>
              {item.recipeRef ? (
                recipe ? (
                  <View style={styles.recipeBubble}>
                    <RecipeCard
                      recipe={recipe}
                      onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                    />
                  </View>
                ) : (
                  <Text style={styles.unavailable}>Recipe no longer available</Text>
                )
              ) : (
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                </View>
              )}
            </Pressable>
            {pickerFor === item.id && (
              <View style={styles.pickerRow}>
                {REACTION_EMOJIS.map((emoji) => (
                  <Pressable key={emoji} onPress={() => handleToggleReaction(item, emoji)} hitSlop={4}>
                    <Text style={styles.pickerEmoji}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {item.reactions.length > 0 && (
              <View style={styles.reactionRow}>
                {item.reactions.map((r) => (
                  <Pressable
                    key={r.emoji}
                    style={[styles.reactionPill, r.mine && styles.reactionPillMine]}
                    onPress={() => handleToggleReaction(item, r.emoji)}
                  >
                    <Text style={styles.reactionPillText}>
                      {r.emoji} {r.count}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <Text style={styles.timestamp}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        );
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, recipesById, styles, navigation, pickerFor],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{chatName}</Text>
        <Pressable onPress={() => setInviteOpen((v) => !v)} hitSlop={12}>
          <Text style={styles.inviteText}>{inviteOpen ? '✕' : '+ Invite'}</Text>
        </Pressable>
      </View>

      {inviteOpen && (
        <View style={styles.inviteRow}>
          <TextInput
            style={styles.inviteInput}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="username or email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          <Pressable style={styles.inviteButton} onPress={handleInvite}>
            <Text style={styles.inviteButtonText}>Add</Text>
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyFlip}>
              <Text style={styles.emptyText}>No messages yet — say hi 👋</Text>
            </View>
          }
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable
            style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || sending}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    backText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.primary },
    headerTitle: {
      flex: 1,
      fontFamily: fonts.display,
      fontSize: 20,
      color: colors.text,
      textAlign: 'center',
    },
    inviteText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },
    inviteRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    inviteInput: {
      flex: 1,
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
    inviteButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
    },
    inviteButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#fff' },
    list: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    messageRow: { marginBottom: spacing.md, alignItems: 'flex-start' },
    messageRowMine: { alignItems: 'flex-end' },
    senderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
    sender: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.textMuted },
    bubble: {
      maxWidth: '80%',
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    bubbleTheirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    bubbleMine: { backgroundColor: colors.primary },
    bubbleText: { fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 20 },
    bubbleTextMine: { color: '#fff' },
    recipeBubble: {
      width: '90%',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingTop: spacing.md,
    },
    unavailable: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
    timestamp: { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, marginTop: 2 },
    pickerRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginTop: spacing.xs,
    },
    pickerEmoji: { fontSize: 22 },
    reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
    reactionPill: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    reactionPillMine: { borderColor: colors.primary },
    reactionPillText: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
    // Inverted list flips children; flip the empty state back upright.
    emptyFlip: { transform: [{ scaleY: -1 }], paddingTop: spacing.xl, alignItems: 'center' },
    emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      maxHeight: 100,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.text,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    sendDisabled: { opacity: 0.5 },
    sendText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#fff' },
  });
}
