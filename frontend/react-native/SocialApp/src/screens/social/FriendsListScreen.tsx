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
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants';
import type { ThemeColors } from '../../constants';
import { getFriends } from '../../services/friends';
import { useColors } from '../../store/themeStore';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import type { MainStackParamList } from '../../navigation/types';
import type { Friend } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'FriendsList'>;

const FriendsListScreen: React.FC<Props> = ({ navigation }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['friends'] });
    setRefreshing(false);
  }, [queryClient]);

  const renderItem = useCallback(
    ({ item }: { item: Friend }) => (
      <Pressable
        style={({ pressed }) => [styles.friendCard, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <Avatar uri={item.avatar_url} name={item.full_name} size={50} />
        <View style={styles.friendInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.fullName}>{item.full_name}</Text>
        </View>
        <Pressable
          style={styles.chatBtn}
          onPress={() => navigation.navigate('NewChat')}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
        </Pressable>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </Pressable>
    ),
    [navigation, Colors, styles]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Friends</Text>
        <Pressable
          onPress={() => navigation.navigate('FriendRequests')}
          style={styles.backButton}
        >
          <Ionicons name="person-add-outline" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={friends}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, friends.length === 0 && styles.emptyList]}
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
              icon="people-outline"
              title="No Friends Yet"
              message="Search for people and send them a friend request"
              actionLabel="Find People"
              onAction={() => navigation.navigate('MainTabs')}
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
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.small,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  friendInfo: {
    flex: 1,
  },
  username: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  fullName: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default FriendsListScreen;
