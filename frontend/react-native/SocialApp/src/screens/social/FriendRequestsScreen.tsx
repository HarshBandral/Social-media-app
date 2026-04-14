import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants';
import type { ThemeColors } from '../../constants';
import {
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
  cancelFriendRequest,
} from '../../services/friends';
import { useColors } from '../../store/themeStore';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import type { MainStackParamList } from '../../navigation/types';
import type { FriendRequest } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'FriendRequests'>;
type Tab = 'received' | 'sent';

const FriendRequestsScreen: React.FC<Props> = ({ navigation }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('received');

  const { data: received = [], isLoading: receivedLoading } = useQuery({
    queryKey: ['friendRequests', 'received'],
    queryFn: getReceivedRequests,
  });

  const { data: sent = [], isLoading: sentLoading } = useQuery({
    queryKey: ['friendRequests', 'sent'],
    queryFn: getSentRequests,
  });

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    await queryClient.invalidateQueries({ queryKey: ['friends'] });
    await queryClient.invalidateQueries({ queryKey: ['friendStatus'] });
  }, [queryClient]);

  const handleAccept = useCallback(
    async (requestId: string) => {
      try {
        await acceptRequest(requestId);
        await invalidateAll();
      } catch {
        Alert.alert('Error', 'Failed to accept request');
      }
    },
    [invalidateAll]
  );

  const handleReject = useCallback(
    async (requestId: string) => {
      try {
        await rejectRequest(requestId);
        await invalidateAll();
      } catch {
        Alert.alert('Error', 'Failed to reject request');
      }
    },
    [invalidateAll]
  );

  const handleCancel = useCallback(
    async (requestId: string) => {
      try {
        await cancelFriendRequest(requestId);
        await invalidateAll();
      } catch {
        Alert.alert('Error', 'Failed to cancel request');
      }
    },
    [invalidateAll]
  );

  const renderReceivedItem = useCallback(
    ({ item }: { item: FriendRequest }) => (
      <Pressable
        style={({ pressed }) => [styles.requestCard, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.from_user_id })}
      >
        <View style={styles.userInfo}>
          <Avatar uri={item.from_avatar} name={item.from_username} size={50} />
          <View style={styles.userText}>
            <Text style={styles.username}>{item.from_username}</Text>
            <Text style={styles.subtitle}>Wants to be your friend</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.acceptBtn, pressed && styles.btnPressed]}
            onPress={() => handleAccept(item.id)}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={styles.acceptText}>Accept</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.rejectBtn, pressed && styles.btnPressed]}
            onPress={() => handleReject(item.id)}
          >
            <Ionicons name="close" size={18} color={Colors.text} />
            <Text style={styles.rejectText}>Decline</Text>
          </Pressable>
        </View>
      </Pressable>
    ),
    [navigation, handleAccept, handleReject, Colors, styles]
  );

  const renderSentItem = useCallback(
    ({ item }: { item: FriendRequest }) => (
      <Pressable
        style={({ pressed }) => [styles.requestCard, styles.sentCard, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.to_user_id })}
      >
        <Avatar uri={item.to_avatar} name={item.to_username} size={44} />
        <View style={styles.sentInfo}>
          <Text style={styles.username}>{item.to_username}</Text>
          <Text style={styles.subtitle}>Pending</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.withdrawBtn, pressed && styles.btnPressed]}
          onPress={() => handleCancel(item.id)}
        >
          <Ionicons name="close" size={14} color={Colors.textMuted} />
        </Pressable>
      </Pressable>
    ),
    [navigation, handleCancel, styles, Colors]
  );

  const isLoading = activeTab === 'received' ? receivedLoading : sentLoading;
  const data = activeTab === 'received' ? received : sent;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Friend Requests</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Received
          </Text>
          {received.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{received.length}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent
          </Text>
          {sent.length > 0 && (
            <View style={[styles.badge, styles.badgeMuted]}>
              <Text style={styles.badgeText}>{sent.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          renderItem={activeTab === 'received' ? renderReceivedItem : renderSentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, data.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={invalidateAll}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === 'received' ? 'people-outline' : 'paper-plane-outline'}
              title={activeTab === 'received' ? 'No Requests' : 'No Sent Requests'}
              message={
                activeTab === 'received'
                  ? "You don't have any pending friend requests"
                  : "You haven't sent any friend requests"
              }
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  activeTabText: {
    color: Colors.white,
  },
  badge: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeMuted: {
    backgroundColor: Colors.textMuted,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  loader: {
    flex: 1,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  requestCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.small,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  username: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  acceptBtn: {},
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    gap: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  acceptText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  rejectText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  btnPressed: {
    opacity: 0.7,
  },
  sentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sentInfo: {
    flex: 1,
  },
  withdrawBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FriendRequestsScreen;
