---
paths:
  - "src/components/**/*.tsx"
  - "src/screens/**/*.tsx"
---

# React Native Component Rules

## Component Template

```tsx
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
}: ButtonProps): JSX.Element {
  const handlePress = useCallback(() => {
    if (!disabled && !loading) onPress();
  }, [disabled, loading, onPress]);

  return (
    <Pressable
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      <Text style={[styles.label, styles[`${variant}Label`]]}>
        {loading ? 'Loading...' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  label: { ...typography.button },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.primary },
  dangerLabel: { color: colors.white },
});
```

## Screen Template

```tsx
import { useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';
import { useUser } from '@/hooks/useUser';
import { colors, spacing } from '@/constants';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export default function ProfileScreen({ route, navigation }: Props): JSX.Element {
  const { userId } = route.params;
  const { data: user, isLoading, error } = useUser(userId);

  useEffect(() => {
    if (user) navigation.setOptions({ title: user.name });
  }, [user, navigation]);

  if (isLoading) return <LoadingSpinner />;
  if (error || !user) return <ErrorView message="Failed to load profile" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* screen content */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
});
```

## List Rendering

```tsx
import { FlatList, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list'; // preferred for large lists

// CORRECT — FlatList for lists
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <ItemCard item={item} onPress={handlePress} />}
  getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={5}
/>

// WRONG — never ScrollView + map for dynamic lists
<ScrollView>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</ScrollView>
```

## Rules

1. **`StyleSheet.create()`** for all styles — no inline style objects
2. **`Pressable` over `TouchableOpacity`** for new components (more flexible)
3. **`FlatList` or `FlashList`** for any dynamic list — never `ScrollView + map`
4. **Accessibility required**: `accessibilityRole`, `accessibilityLabel`, `accessibilityState`
5. **`React.memo()`** on list item components — prevents re-renders on FlatList scroll
6. **Design tokens** from `@/constants` — never hardcoded colors or pixel values
7. **Platform checks** with `Platform.select()` — not `Platform.OS === 'ios' ? ... : ...` inline
8. **`SafeAreaView`** as screen root — handles notches and system bars
