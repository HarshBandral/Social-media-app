import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions, Animated, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants';
import type { ThemeColors } from '../constants';
import { API_URL } from '../constants';
import type { Post } from '../types';
import Avatar from './Avatar';
import { useColors } from '../store/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onUnbookmark: (postId: string) => void;
  onComment: (postId: string) => void;
  onProfile: (userId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onUnlike,
  onBookmark,
  onUnbookmark,
  onComment,
  onProfile,
}) => {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked);
  const heartScale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;
  const doubleTapHeart = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  const animateHeart = useCallback(() => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
  }, [heartScale]);

  const showDoubleTapHeart = useCallback(() => {
    Animated.sequence([
      Animated.timing(doubleTapHeart, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(doubleTapHeart, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [doubleTapHeart]);

  const handleLike = useCallback(() => {
    if (liked) {
      setLiked(false);
      setLikesCount((c) => c - 1);
      onUnlike(post.id);
    } else {
      setLiked(true);
      setLikesCount((c) => c + 1);
      onLike(post.id);
      animateHeart();
    }
  }, [liked, post.id, onLike, onUnlike, animateHeart]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) {
        setLiked(true);
        setLikesCount((c) => c + 1);
        onLike(post.id);
      }
      animateHeart();
      showDoubleTapHeart();
    }
    lastTap.current = now;
  }, [liked, post.id, onLike, animateHeart, showDoubleTapHeart]);

  const handleBookmark = useCallback(() => {
    if (bookmarked) {
      setBookmarked(false);
      onUnbookmark(post.id);
    } else {
      setBookmarked(true);
      onBookmark(post.id);
      Animated.sequence([
        Animated.spring(bookmarkScale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
        Animated.spring(bookmarkScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
      ]).start();
    }
  }, [bookmarked, post.id, onBookmark, onUnbookmark, bookmarkScale]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out this post by @${post.author_username}${post.caption ? ': ' + post.caption : ''}\n\n📸 Shared from Social App`,
      });
    } catch {
      // User cancelled share
    }
  }, [post.author_username, post.caption]);

  const imageUrl = post.image_url.startsWith('http')
    ? post.image_url
    : `${API_URL}${post.image_url}`;

  const timeAgo = getTimeAgo(post.created_at);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        onPress={() => onProfile(post.user_id)}
      >
        <Avatar uri={post.author_avatar} name={post.author_username} size={38} />
        <View style={styles.headerText}>
          <Text style={styles.username}>{post.author_username}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </Pressable>

      {/* Image with double-tap */}
      <Pressable onPress={handleDoubleTap}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        <Animated.View
          style={[
            styles.doubleTapHeart,
            {
              opacity: doubleTapHeart,
              transform: [
                {
                  scale: doubleTapHeart.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.3, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="heart" size={80} color={Colors.white} />
        </Animated.View>
      </Pressable>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Pressable onPress={handleLike} style={styles.actionButton}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={26}
                color={liked ? Colors.like : Colors.text}
              />
            </Animated.View>
          </Pressable>
          <Pressable onPress={() => onComment(post.id)} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color={Colors.text} />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color={Colors.text} />
          </Pressable>
        </View>
        <Pressable onPress={handleBookmark} style={styles.actionButton}>
          <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={bookmarked ? Colors.primary : Colors.text}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* Likes */}
      <Text style={styles.likesCount}>
        {likesCount} {likesCount === 1 ? 'like' : 'likes'}
      </Text>

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionRow}>
          <Text style={styles.captionUsername}>{post.author_username}</Text>
          <Text style={styles.caption}> {post.caption}</Text>
        </View>
      )}

      {/* Comments link */}
      {post.comments_count > 0 && (
        <Pressable onPress={() => onComment(post.id)}>
          <Text style={styles.viewComments}>
            View all {post.comments_count} comments
          </Text>
        </Pressable>
      )}
    </View>
  );
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  headerPressed: { opacity: 0.7 },
  headerText: { marginLeft: Spacing.md, flex: 1 },
  username: { color: Colors.text, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  time: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  image: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: Colors.surface },
  doubleTapHeart: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md,
  },
  leftActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { marginRight: Spacing.lg, padding: Spacing.xs },
  likesCount: {
    color: Colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.md,
    paddingHorizontal: Spacing.lg, marginTop: Spacing.sm,
  },
  captionRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg, marginTop: Spacing.xs,
  },
  captionUsername: { color: Colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  caption: { color: Colors.text, fontSize: FontSize.md, flex: 1 },
  viewComments: {
    color: Colors.textMuted, fontSize: FontSize.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, paddingBottom: Spacing.md,
  },
});

export default React.memo(PostCard);
