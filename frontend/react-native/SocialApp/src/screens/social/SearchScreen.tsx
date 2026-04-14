import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants';
import type { ThemeColors } from '../../constants';
import { searchUsers, getRecommendedUsers } from '../../services/users';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '../../store/themeStore';
import Avatar from '../../components/Avatar';
import type { MainStackParamList } from '../../navigation/types';
import type { User } from '../../types';

type NavProp = NativeStackNavigationProp<MainStackParamList>;

const SearchScreen: React.FC = () => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const { data: recommended = [], isLoading: recLoading } = useQuery({
    queryKey: ['recommendedUsers'],
    queryFn: getRecommendedUsers,
  });

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

  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <Pressable
        style={({ pressed }) => [styles.userCard, pressed && styles.userCardPressed]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <Avatar uri={item.avatar_url} name={item.full_name} size={50} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.fullName}>{item.full_name}</Text>
        </View>
        {item.is_private && (
          <Ionicons name="lock-closed" size={16} color={Colors.textMuted} />
        )}
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </Pressable>
    ),
    [navigation, Colors, styles]
  );

  const displayData = searched ? results : [];
  const showRecommendations = !searched && !query;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={Colors.placeholder}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
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
      ) : showRecommendations ? (
        <FlatList
          data={recommended}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['recommendedUsers'] })}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            recommended.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Suggested for you</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            recLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-circle-outline" size={64} color={Colors.primaryLight} />
                <Text style={styles.emptyTitle}>Discover People</Text>
                <Text style={styles.emptyText}>Search by username or name</Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.md,
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
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingLeft: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
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
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge * 2,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
  },
});

export default SearchScreen;
