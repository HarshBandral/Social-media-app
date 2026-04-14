import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Spacing, FontSize, FontWeight } from '../constants';
import type { ThemeColors } from '../constants';
import type { Comment } from '../types';
import Avatar from './Avatar';
import { useColors } from '../store/themeStore';

interface CommentItemProps {
  comment: Comment;
  onReply: (comment: Comment) => void;
  onViewReplies: (comment: Comment) => void;
  onProfile: (userId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onViewReplies,
  onProfile,
}) => {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const timeAgo = getTimeAgo(comment.created_at);

  return (
    <View style={[styles.container, comment.parent_id && styles.reply]}>
      <Pressable onPress={() => onProfile(comment.user_id)}>
        <Avatar uri={comment.author_avatar} name={comment.author_username} size={34} />
      </Pressable>
      <View style={styles.content}>
        <View style={styles.bubble}>
          <Pressable onPress={() => onProfile(comment.user_id)}>
            <Text style={styles.username}>{comment.author_username}</Text>
          </Pressable>
          <Text style={styles.text}>{comment.content}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.time}>{timeAgo}</Text>
          {!comment.parent_id && (
            <Pressable onPress={() => onReply(comment)}>
              <Text style={styles.replyButton}>Reply</Text>
            </Pressable>
          )}
        </View>
        {comment.replies_count > 0 && !comment.parent_id && (
          <Pressable onPress={() => onViewReplies(comment)} style={styles.viewReplies}>
            <View style={styles.repliesLine} />
            <Text style={styles.viewRepliesText}>
              View {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  reply: {
    paddingLeft: Spacing.huge,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  bubble: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  username: {
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  text: {
    color: Colors.text,
    fontSize: FontSize.md,
    marginTop: 2,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingLeft: Spacing.md,
    gap: Spacing.md,
  },
  time: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  replyButton: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  viewReplies: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  repliesLine: {
    width: 24,
    height: 1,
    backgroundColor: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  viewRepliesText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});

export default React.memo(CommentItem);
