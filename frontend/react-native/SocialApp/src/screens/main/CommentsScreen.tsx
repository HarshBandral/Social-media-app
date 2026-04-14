import React, { useState, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../../constants';
import type { ThemeColors } from '../../constants';
import { getComments, createComment, getReplies, replyToComment } from '../../services/comments';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../store/themeStore';
import CommentItem from '../../components/CommentItem';
import Avatar from '../../components/Avatar';
import type { MainStackParamList } from '../../navigation/types';
import type { Comment } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Comments'>;

const CommentsScreen: React.FC<Props> = ({ navigation, route }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const { postId } = route.params;
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [sending, setSending] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, Comment[]>>({});

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getComments(postId),
  });

  const handleSend = async () => {
    const text = newComment.trim();
    if (!text) return;
    setSending(true);
    try {
      if (replyingTo) {
        await replyToComment(postId, replyingTo.id, text);
        // Refresh replies for this comment
        const replies = await getReplies(postId, replyingTo.id);
        setExpandedReplies((prev) => ({ ...prev, [replyingTo.id]: replies }));
      } else {
        await createComment(postId, text);
      }
      await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setNewComment('');
      setReplyingTo(null);
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.author_username} `);
  }, []);

  const handleViewReplies = useCallback(
    async (comment: Comment) => {
      try {
        const replies = await getReplies(postId, comment.id);
        setExpandedReplies((prev) => ({ ...prev, [comment.id]: replies }));
      } catch { /* ignore */ }
    },
    [postId]
  );

  const handleProfile = useCallback(
    (userId: string) => {
      navigation.navigate('UserProfile', { userId });
    },
    [navigation]
  );

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <View>
        <CommentItem
          comment={item}
          onReply={handleReply}
          onViewReplies={handleViewReplies}
          onProfile={handleProfile}
        />
        {expandedReplies[item.id]?.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            onReply={handleReply}
            onViewReplies={handleViewReplies}
            onProfile={handleProfile}
          />
        ))}
      </View>
    ),
    [handleReply, handleViewReplies, handleProfile, expandedReplies]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['comments', postId] })}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to comment</Text>
            </View>
          }
        />
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <View style={styles.replyIndicator}>
          <Text style={styles.replyingText}>
            Replying to <Text style={styles.replyingName}>{replyingTo.author_username}</Text>
          </Text>
          <Pressable onPress={() => { setReplyingTo(null); setNewComment(''); }}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <Avatar uri={user?.avatar_url || null} name={user?.username || 'U'} size={32} />
        <TextInput
          style={styles.input}
          placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
          placeholderTextColor={Colors.placeholder}
          value={newComment}
          onChangeText={setNewComment}
          selectionColor={Colors.primary}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!newComment.trim() || sending}
          style={[styles.sendButton, !newComment.trim() && styles.sendDisabled]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons
              name="send"
              size={22}
              color={newComment.trim() ? Colors.primary : Colors.textMuted}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  loader: {
    flex: 1,
  },
  list: {
    paddingVertical: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge * 2,
  },
  emptyText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  replyingName: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    padding: Spacing.sm,
  },
  sendDisabled: {
    opacity: 0.5,
  },
});

export default CommentsScreen;
