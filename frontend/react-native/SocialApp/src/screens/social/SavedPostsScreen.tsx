import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight } from '../../constants';
import type { ThemeColors } from '../../constants';
import { getSavedPosts, likePost, unlikePost, bookmarkPost, unbookmarkPost } from '../../services/posts';
import { useColors } from '../../store/themeStore';
import PostCard from '../../components/PostCard';
import EmptyState from '../../components/EmptyState';
import type { MainStackParamList } from '../../navigation/types';
import type { Post } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'SavedPosts'>;

const SavedPostsScreen: React.FC<Props> = ({ navigation }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['savedPosts'],
    queryFn: () => getSavedPosts(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleLike = useCallback(async (postId: string) => {
    try { await likePost(postId); } catch { /* optimistic */ }
  }, []);

  const handleUnlike = useCallback(async (postId: string) => {
    try { await unlikePost(postId); } catch { /* optimistic */ }
  }, []);

  const handleBookmark = useCallback(async (postId: string) => {
    try { await bookmarkPost(postId); } catch { /* optimistic */ }
  }, []);

  const handleUnbookmark = useCallback(async (postId: string) => {
    try {
      await unbookmarkPost(postId);
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    } catch { /* optimistic */ }
  }, [queryClient]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onLike={handleLike}
        onUnlike={handleUnlike}
        onBookmark={handleBookmark}
        onUnbookmark={handleUnbookmark}
        onComment={(postId) => navigation.navigate('Comments', { postId })}
        onProfile={(userId) => navigation.navigate('UserProfile', { userId })}
      />
    ),
    [handleLike, handleUnlike, handleBookmark, handleUnbookmark, navigation]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Posts</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, posts.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              title="No Saved Posts"
              message="Tap the bookmark icon on posts to save them here"
            />
          }
        />
      )}
    </View>
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
    paddingTop: Spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
});

export default SavedPostsScreen;
