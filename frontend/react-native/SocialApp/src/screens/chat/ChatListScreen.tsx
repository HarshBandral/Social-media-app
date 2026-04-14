import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants';
import type { ThemeColors } from '../../constants';
import { getConversations, createChatWebSocket } from '../../services/chat';
import { useColors } from '../../store/themeStore';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import type { MainStackParamList } from '../../navigation/types';
import type { Conversation } from '../../types';

type NavProp = NativeStackNavigationProp<MainStackParamList>;

const ChatListScreen: React.FC = () => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const wsRef = useRef<ReturnType<typeof createChatWebSocket> | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  // WebSocket for real-time updates  check
  useEffect(() => {
    const chatWs = createChatWebSocket((data) => {
      if (data.type === 'new_message') {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });
    wsRef.current = chatWs;
    chatWs.connect();

    return () => {
      chatWs.disconnect();
    };
  }, [queryClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setRefreshing(false);
  }, [queryClient]);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <Pressable
        style={styles.chatCard}
        onPress={() =>
          navigation.navigate('ChatScreen', {
            conversationId: item.id,
            otherUserId: item.other_user_id,
            otherUsername: item.other_username,
            otherAvatar: item.other_avatar,
          })
        }
      >
        <View style={styles.avatarContainer}>
          <Avatar uri={item.other_avatar} name={item.other_username} size={52} />
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unread_count > 9 ? '9+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text
              style={[styles.username, item.unread_count > 0 && styles.unreadUsername]}
              numberOfLines={1}
            >
              {item.other_username}
            </Text>
            {item.last_message_time && (
              <Text style={styles.time}>{getTimeAgo(item.last_message_time)}</Text>
            )}
          </View>
          {item.last_message && (
            <Text
              style={[
                styles.lastMessage,
                item.unread_count > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.last_message}
            </Text>
          )}
        </View>
      </Pressable>
    ),
    [navigation, styles]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable
          style={styles.newChatBtn}
          onPress={() => navigation.navigate('NewChat')}
        >
          <Ionicons name="create-outline" size={24} color={Colors.white} />
        </Pressable>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            conversations.length === 0 && styles.emptyList,
          ]}
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
              icon="chatbubbles-outline"
              title="No Messages"
              message="Start a conversation with your friends"
              actionLabel="New Message"
              onAction={() => navigation.navigate('NewChat')}
            />
          }
        />
      )}
    </View>
  );
};

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
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
  newChatBtn: {
    padding: Spacing.xs,
  },
  loader: {
    flex: 1,
  },
  list: {
    padding: Spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.small,
  },
  avatarContainer: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  unreadText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  chatInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  unreadUsername: {
    fontWeight: FontWeight.bold,
  },
  time: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginLeft: Spacing.sm,
  },
  lastMessage: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  unreadMessage: {
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});

export default ChatListScreen;
