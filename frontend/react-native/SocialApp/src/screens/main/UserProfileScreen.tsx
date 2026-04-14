import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow, API_URL } from '../../constants';
import type { ThemeColors } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../store/themeStore';
import { getUser } from '../../services/users';
import { getUserPosts } from '../../services/posts';
import {
  sendFriendRequest,
  cancelFriendRequest,
  getFriendshipStatus,
  removeFriend,
  acceptRequest,
} from '../../services/friends';
import Avatar from '../../components/Avatar';
import GradientButton from '../../components/GradientButton';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import type { Post } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const IMAGE_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

type Props = NativeStackScreenProps<MainStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const { userId } = route.params;
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  const { data: profileUser, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => getUserPosts(userId),
    enabled: !!profileUser,
  });

  const { data: friendStatus } = useQuery({
    queryKey: ['friendStatus', userId],
    queryFn: () => getFriendshipStatus(userId),
    enabled: !isOwnProfile,
  });

  const invalidateFriendData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['friendStatus', userId] });
    await queryClient.invalidateQueries({ queryKey: ['friends'] });
    await queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
  }, [queryClient, userId]);

  const handleAddFriend = useCallback(async () => {
    setActionLoading(true);
    try {
      await sendFriendRequest(userId);
      await invalidateFriendData();
    } catch {
      Alert.alert('Error', 'Failed to send request');
    }
    setActionLoading(false);
  }, [userId, invalidateFriendData]);

  const handleCancelRequest = useCallback(async () => {
    if (!friendStatus?.request_id) return;
    setActionLoading(true);
    try {
      await cancelFriendRequest(friendStatus.request_id);
      await invalidateFriendData();
    } catch {
      Alert.alert('Error', 'Failed to cancel request');
    }
    setActionLoading(false);
  }, [friendStatus, invalidateFriendData]);

  const handleAcceptRequest = useCallback(async () => {
    if (!friendStatus?.request_id) return;
    setActionLoading(true);
    try {
      await acceptRequest(friendStatus.request_id);
      await invalidateFriendData();
    } catch {
      Alert.alert('Error', 'Failed to accept request');
    }
    setActionLoading(false);
  }, [friendStatus, invalidateFriendData]);

  const handleRemoveFriend = useCallback(async () => {
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await removeFriend(userId);
            await invalidateFriendData();
          } catch {
            Alert.alert('Error', 'Failed to remove friend');
          }
          setActionLoading(false);
        },
      },
    ]);
  }, [userId, invalidateFriendData]);

  const handleMessage = useCallback(() => {
    navigation.navigate('NewChat');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => {
      const imageUrl = item.image_url.startsWith('http')
        ? item.image_url
        : `${API_URL}${item.image_url}`;
      const isMiddle = index % 3 === 1;
      return (
        <Pressable
          onPress={() => navigation.navigate('Comments', { postId: item.id })}
          style={({ pressed }) => [
            styles.gridItem,
            isMiddle && styles.gridItemMiddle,
            pressed && styles.gridItemPressed,
          ]}
        >
          <Image source={{ uri: imageUrl }} style={styles.gridImage} />
        </Pressable>
      );
    },
    [navigation, styles]
  );

  if (userLoading || !profileUser) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderFriendButton = () => {
    if (isOwnProfile) return null;
    const status = friendStatus?.status || 'none';

    switch (status) {
      case 'none':
        return (
          <View style={styles.actionRow}>
            <GradientButton
              title="Add Friend"
              onPress={handleAddFriend}
              loading={actionLoading}
              size="medium"
              style={styles.actionBtn}
            />
            <Pressable style={styles.messageBtn} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            </Pressable>
          </View>
        );
      case 'pending_sent':
        return (
          <View style={styles.actionRow}>
            <GradientButton
              title="Cancel Request"
              onPress={handleCancelRequest}
              loading={actionLoading}
              variant="outline"
              size="medium"
              style={styles.actionBtn}
            />
            <Pressable style={styles.messageBtn} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            </Pressable>
          </View>
        );
      case 'pending_received':
        return (
          <View style={styles.actionRow}>
            <GradientButton
              title="Accept Request"
              onPress={handleAcceptRequest}
              loading={actionLoading}
              variant="accent"
              size="medium"
              style={styles.actionBtn}
            />
            <Pressable style={styles.messageBtn} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            </Pressable>
          </View>
        );
      case 'friends':
        return (
          <View style={styles.actionRow}>
            <GradientButton
              title="Friends"
              onPress={handleRemoveFriend}
              loading={actionLoading}
              variant="outline"
              size="medium"
              style={styles.actionBtn}
            />
            <Pressable style={styles.messageBtn} onPress={handleMessage}>
              <Ionicons name="chatbubble" size={20} color={Colors.primary} />
            </Pressable>
          </View>
        );
    }
  };

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.background]}
        style={styles.headerGradient}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <View style={styles.profileHeader}>
          <Avatar
            uri={profileUser.avatar_url}
            name={profileUser.full_name}
            size={90}
            showBorder
            borderColor="gradient"
          />
          <Text style={styles.fullName}>{profileUser.full_name}</Text>
          <Text style={styles.username}>@{profileUser.username}</Text>
          {profileUser.bio && <Text style={styles.bio}>{profileUser.bio}</Text>}
          {profileUser.is_private &&
            friendStatus?.status !== 'friends' &&
            !isOwnProfile && (
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                <Text style={styles.privateText}>Private Account</Text>
              </View>
            )}
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{profileUser.post_count}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{profileUser.friends_count}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionContainer}>{renderFriendButton()}</View>

      <View style={styles.gridLabel}>
        <Ionicons name="grid-outline" size={20} color={Colors.primary} />
        <Text style={styles.gridLabelText}>Posts</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={3}
      ListHeaderComponent={renderHeader}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
            queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
            queryClient.invalidateQueries({ queryKey: ['friendStatus', userId] });
          }}
          tintColor={Colors.primary}
        />
      }
    />
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGradient: {
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.xxl,
  },
  backButton: {
    padding: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  fullName: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
  },
  username: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  bio: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  privateText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    ...Shadow.small,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  statNumber: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  actionContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
  },
  messageBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  gridLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  gridLabelText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  gridItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  gridItemMiddle: {
    marginHorizontal: GRID_GAP,
  },
  gridItemPressed: {
    opacity: 0.7,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
  },
});

export default UserProfileScreen;
