import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants';
import type { ThemeColors } from '../../constants';
import { searchUsers } from '../../services/users';
import { getConversations } from '../../services/chat';
import api from '../../services/api';
import { useColors } from '../../store/themeStore';
import Avatar from '../../components/Avatar';
import type { MainStackParamList } from '../../navigation/types';
import type { User, Conversation } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'NewChat'>;

const NewChatScreen: React.FC<Props> = ({ navigation }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const users = await searchUsers(text.trim());
      setResults(users);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleSelectUser = useCallback(
    async (selectedUser: User) => {
      if (startingChat) return;
      setStartingChat(selectedUser.id);
      try {
        // Check if conversation already exists
        const conversations = await getConversations();
        const existing = conversations.find(
          (c: Conversation) => c.other_user_id === selectedUser.id
        );

        if (existing) {
          navigation.replace('ChatScreen', {
            conversationId: existing.id,
            otherUserId: existing.other_user_id,
            otherUsername: existing.other_username,
            otherAvatar: existing.other_avatar,
          });
          return;
        }

        // Create new conversation with first message
        const { data: conv } = await api.post<Conversation>('/chat/conversations', {
          user_id: selectedUser.id,
          message: 'Hey! 👋',
        });
        await queryClient.invalidateQueries({ queryKey: ['conversations'] });
        navigation.replace('ChatScreen', {
          conversationId: conv.id,
          otherUserId: conv.other_user_id,
          otherUsername: conv.other_username,
          otherAvatar: conv.other_avatar,
        });
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
        if (__DEV__) console.log('NewChat error:', axiosErr.response?.data || axiosErr.message);
        Alert.alert('Error', axiosErr.response?.data?.detail || 'Failed to start conversation.');
        setStartingChat(null);
      }
    },
    [navigation, queryClient, startingChat]
  );

  const renderItem = useCallback(
    ({ item }: { item: User }) => {
      const isStarting = startingChat === item.id;
      return (
        <Pressable
          style={({ pressed }) => [styles.userCard, pressed && styles.userCardPressed]}
          onPress={() => handleSelectUser(item)}
          disabled={!!startingChat}
        >
          <Avatar uri={item.avatar_url} name={item.full_name} size={48} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.fullName}>{item.full_name}</Text>
          </View>
          {isStarting ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              style={styles.chatIconBtn}
            >
              <Ionicons name="chatbubble" size={16} color={Colors.white} />
            </LinearGradient>
          )}
        </Pressable>
      );
    },
    [handleSelectUser, startingChat, Colors, styles]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Message</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor={Colors.placeholder}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoFocus
            selectionColor={Colors.primary}
          />
          {query.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, results.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>Try a different username</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search-outline" size={48} color={Colors.primaryLight} />
                </View>
                <Text style={styles.emptyTitle}>Find Someone</Text>
                <Text style={styles.emptySubtext}>
                  Search by username to start a conversation
                </Text>
              </View>
            )
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
  searchContainer: {
    padding: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  loader: {
    marginTop: Spacing.huge,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.small,
  },
  userCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  userInfo: {
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
  chatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge * 2,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
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
    marginTop: Spacing.sm,
  },
});

export default NewChatScreen;
