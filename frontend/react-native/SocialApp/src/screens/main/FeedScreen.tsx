import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight } from '../../constants';
import type { ThemeColors } from '../../constants';
import { getFeed } from '../../services/posts';
import { likePost, unlikePost, bookmarkPost, unbookmarkPost } from '../../services/posts';
import { getStoriesFeed } from '../../services/stories';
import { useAuthStore } from '../../store/authStore';
import { useColors, useThemeStore } from '../../store/themeStore';
import PostCard from '../../components/PostCard';
import StoryCircle from '../../components/StoryCircle';
import EmptyState from '../../components/EmptyState';
import type { MainStackParamList } from '../../navigation/types';
import type { Post, StoryGroup } from '../../types';

type NavProp = NativeStackNavigationProp<MainStackParamList>;

const FeedScreen: React.FC = () => {
  const Colors = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const styles = makeStyles(Colors);
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: posts = [], isLoading: postsLoading, refetch: refetchFeed } = useQuery({
    queryKey: ['feed'],
    queryFn: () => getFeed(),
    staleTime: 30 * 1000,
  });

  // Refetch feed when screen gains focus (e.g. after login switch, returning from comments)
  useFocusEffect(
    useCallback(() => {
      refetchFeed();
    }, [refetchFeed])
  );

  const { data: storyGroups = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: getStoriesFeed,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
    await queryClient.invalidateQueries({ queryKey: ['stories'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleLike = useCallback(async (postId: string) => {
    try {
      await likePost(postId);
    } catch { /* optimistic update already applied */ }
  }, []);

  const handleUnlike = useCallback(async (postId: string) => {
    try {
      await unlikePost(postId);
    } catch { /* optimistic update already applied */ }
  }, []);

  const handleBookmark = useCallback(async (postId: string) => {
    try {
      await bookmarkPost(postId);
    } catch { /* optimistic */ }
  }, []);

  const handleUnbookmark = useCallback(async (postId: string) => {
    try {
      await unbookmarkPost(postId);
    } catch { /* optimistic */ }
  }, []);

  const handleComment = useCallback(
    (postId: string) => {
      navigation.navigate('Comments', { postId });
    },
    [navigation]
  );

  const handleProfile = useCallback(
    (userId: string) => {
      navigation.navigate('UserProfile', { userId });
    },
    [navigation]
  );

  const handleStoryPress = useCallback(
    (group: StoryGroup) => {
      navigation.navigate('StoryViewer', { storyGroup: group });
    },
    [navigation]
  );

  const renderStories = useCallback(() => {
    const hasOwnStory = storyGroups.some((g) => g.user_id === user?.id);
    return (
      <View style={styles.storiesContainer}>
        <FlatList
          data={storyGroups}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesList}
          keyExtractor={(item) => item.user_id}
          ListHeaderComponent={
            !hasOwnStory ? (
              <StoryCircle
                username={user?.username || ''}
                avatarUrl={user?.avatar_url || null}
                hasStory={false}
                isOwn
                onPress={() => navigation.navigate('CreatePost', { isStory: true })}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <StoryCircle
              username={item.username}
              avatarUrl={item.avatar_url}
              hasStory
              isOwn={item.user_id === user?.id}
              onPress={() => handleStoryPress(item)}
            />
          )}
        />
      </View>
    );
  }, [storyGroups, user, navigation, handleStoryPress, styles]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onLike={handleLike}
        onUnlike={handleUnlike}
        onBookmark={handleBookmark}
        onUnbookmark={handleUnbookmark}
        onComment={handleComment}
        onProfile={handleProfile}
      />
    ),
    [handleLike, handleUnlike, handleBookmark, handleUnbookmark, handleComment, handleProfile]
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Social</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerButton}
              onPress={() => navigation.navigate('CreatePost', { isStory: false })}
            >
              <Ionicons name="add-circle-outline" size={26} color={Colors.white} />
            </Pressable>
            <Pressable
              style={styles.headerButton}
              onPress={() => navigation.navigate('FriendRequests')}
            >
              <Ionicons name="people-outline" size={26} color={Colors.white} />
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderStories}
        ListEmptyComponent={
          postsLoading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.loader}
            />
          ) : (
            <EmptyState
              icon="images-outline"
              title="No Posts Yet"
              message="Follow people or add friends to see their posts here"
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 && styles.emptyList}
      />
    </View>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    overflow: 'hidden',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.heavy,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  storiesContainer: {
    backgroundColor: Colors.card,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  storiesList: {
    paddingHorizontal: Spacing.lg,
  },
  loader: {
    paddingVertical: Spacing.huge,
  },
  emptyList: {
    flexGrow: 1,
  },
});

export default FeedScreen;
