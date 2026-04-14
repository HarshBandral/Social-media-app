import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants';
import type { ThemeColors } from '../../constants';
import { getMessages, sendMessage, createChatWebSocket } from '../../services/chat';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../store/themeStore';
import Avatar from '../../components/Avatar';
import type { MainStackParamList } from '../../navigation/types';
import type { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const { conversationId, otherUsername, otherAvatar } = route.params;
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<ReturnType<typeof createChatWebSocket> | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    refetchInterval: 10000,
  });

  // WebSocket for real-time
  useEffect(() => {
    const chatWs = createChatWebSocket((data) => {
      if (data.type === 'new_message' && data.message?.conversation_id === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
      if (data.type === 'typing' && data.conversation_id === conversationId) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });
    wsRef.current = chatWs;
    chatWs.connect();

    return () => {
      chatWs.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, queryClient]);

  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text || sending) return;
    setSending(true);
    setNewMessage('');
    try {
      await sendMessage(conversationId, text);
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch {
      setNewMessage(text);
    }
    setSending(false);
  }, [newMessage, sending, conversationId, queryClient]);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    const filename = uri.split('/').pop() || 'image.jpg';
    setSending(true);
    try {
      // Send image as a message with the URI as content placeholder
      await sendMessage(conversationId, `📷 Photo: ${filename}`);
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      Alert.alert('Sent', 'Image reference shared!');
    } catch {
      Alert.alert('Error', 'Failed to send image');
    }
    setSending(false);
  }, [conversationId, queryClient]);

  const handleTextChange = useCallback(
    (text: string) => {
      setNewMessage(text);
      wsRef.current?.sendTyping(conversationId);
    },
    [conversationId]
  );

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isMe = item.sender_id === user?.id;
      return (
        <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
          {!isMe && (
            <Avatar uri={item.sender_avatar} name={item.sender_username} size={30} />
          )}
          <View
            style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
          >
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
              {formatTime(item.created_at)}
              {isMe && (
                <Text> {item.is_read ? '  ✓✓' : '  ✓'}</Text>
              )}
            </Text>
          </View>
        </View>
      );
    },
    [user?.id, styles]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Pressable
          style={styles.headerUser}
          onPress={() =>
            navigation.navigate('UserProfile', { userId: route.params.otherUserId })
          }
        >
          <Avatar uri={otherAvatar} name={otherUsername} size={36} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerUsername}>{otherUsername}</Text>
            {isTyping && <Text style={styles.typingText}>typing...</Text>}
          </View>
        </Pressable>
      </View>

      {/* Messages */}
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={styles.emptyChatIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.primaryLight} />
              </View>
              <Text style={styles.emptyChatText}>
                Say hello to {otherUsername}!
              </Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <Pressable onPress={handlePickImage} style={styles.attachButton}>
          <Ionicons name="image-outline" size={24} color={Colors.primary} />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.placeholder}
          value={newMessage}
          onChangeText={handleTextChange}
          selectionColor={Colors.primary}
          multiline
          maxLength={1000}
        />
        <Pressable
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
          style={[styles.sendButton, newMessage.trim() && styles.sendButtonActive]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() ? Colors.white : Colors.textMuted}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: Spacing.md,
  },
  headerUsername: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  typingText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
  loader: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
    maxWidth: '80%',
    gap: Spacing.sm,
  },
  messageRowMe: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageBubble: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    maxWidth: '100%',
    ...Shadow.small,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surfaceLight,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 20,
  },
  messageTextMe: {
    color: Colors.white,
  },
  messageTime: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.6)',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge * 3,
  },
  emptyChatIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyChatText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attachButton: {
    padding: Spacing.sm,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
});

export default ChatScreen;
