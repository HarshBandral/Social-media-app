import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow, API_URL } from '../../constants';
import type { ThemeColors } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../store/themeStore';
import { getUserPosts } from '../../services/posts';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Avatar from '../../components/Avatar';
import GradientButton from '../../components/GradientButton';
import type { MainStackParamList } from '../../navigation/types';
import type { Post } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const IMAGE_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

type NavProp = NativeStackNavigationProp<MainStackParamList>;

const ProfileScreen: React.FC = () => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);
  const loadUser = useAuthStore((s) => s.loadUser);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: () => getUserPosts(user!.id),
    enabled: !!user,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUser();
    await queryClient.invalidateQueries({ queryKey: ['userPosts', user?.id] });
    setRefreshing(false);
  }, [queryClient, user, loadUser]);

  const renderHeader = useCallback(
    () => (
      <View>
        {/* Profile Header with gradient */}
        <LinearGradient
          colors={[Colors.primaryDark, Colors.background]}
          style={styles.headerGradient}
        >
          <View style={styles.profileHeader}>
            <Avatar
              uri={user?.avatar_url || null}
              name={user?.full_name || 'U'}
              size={90}
              showBorder
              borderColor="gradient"
            />
            <Text style={styles.fullName}>{user?.full_name}</Text>
            <Text style={styles.username}>@{user?.username}</Text>
            {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{user?.post_count || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <Pressable
            style={styles.stat}
            onPress={() => navigation.navigate('FriendsList')}
          >
            <Text style={styles.statNumber}>{user?.friends_count || 0}</Text>
            <Text style={[styles.statLabel, styles.statLabelTappable]}>Friends</Text>
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <GradientButton
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            variant="outline"
            size="medium"
            style={styles.editButton}
          />
          <Pressable
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.text} />
          </Pressable>
        </View>

        {/* Grid label */}
        <View style={styles.gridLabel}>
          <Ionicons name="grid-outline" size={20} color={Colors.primary} />
          <Text style={styles.gridLabelText}>Posts</Text>
        </View>
      </View>
    ),
    [user, navigation, Colors, styles]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => {
      const imageUrl = item.image_url.startsWith('http')
        ? item.image_url
        : `${API_URL}${item.image_url}`;
      const isMiddle = index % 3 === 1;
      return (
        <Pressable
          onPress={() => navigation.navigate('Comments', { postId: item.id })}
          style={[styles.gridItem, isMiddle && styles.gridItemMiddle]}
        >
          <Image source={{ uri: imageUrl }} style={styles.gridImage} />
          <View style={styles.gridOverlay}>
            <View style={styles.gridStat}>
              <Ionicons name="heart" size={14} color={Colors.white} />
              <Text style={styles.gridStatText}>{item.likes_count}</Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [navigation, Colors, styles]
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
          refreshing={refreshing}
          onRefresh={onRefresh}
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
  headerGradient: {
    paddingTop: Spacing.huge + Spacing.xl,
    paddingBottom: Spacing.xxl,
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
    paddingHorizontal: Spacing.xxl,
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
  statLabelTappable: {
    color: Colors.primaryLight,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  editButton: {
    flex: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
    position: 'relative',
  },
  gridItemMiddle: {
    marginHorizontal: GRID_GAP,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  gridStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridStatText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});

export default ProfileScreen;
