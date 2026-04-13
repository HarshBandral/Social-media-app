---
paths:
  - "src/navigation/**/*.tsx"
  - "src/navigation/**/*.ts"
  - "src/screens/**/*.tsx"
---

# React Navigation Rules

## Type Definitions

```typescript
// src/navigation/types.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Root navigator — unauthenticated vs authenticated
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

// Authenticated bottom tab navigator
export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  Profile: { userId: string };
  Settings: undefined;
};

// Nested stack within a tab
export type HomeStackParamList = {
  HomeScreen: undefined;
  ArticleDetail: { articleId: string; title: string };
};

// Typed screen props helper
export type HomeScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>,
  BottomTabScreenProps<AppTabParamList>
>;

// Typed useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

## Navigator Setup

```tsx
// src/navigation/AppNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from './types';
import HomeStack from './HomeStack';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator(): JSX.Element {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ userId: '' }}
      />
    </Tab.Navigator>
  );
}
```

## Screen Navigation Usage

```tsx
// In a screen component
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

export default function HomeScreen(): JSX.Element {
  const navigation = useNavigation<NavigationProp>();

  const goToArticle = useCallback((articleId: string, title: string) => {
    navigation.navigate('ArticleDetail', { articleId, title });
  }, [navigation]);

  // ...
}
```

## Auth Guard Pattern

```tsx
// src/navigation/RootNavigator.tsx
import { useAuthStore } from '@/store/authStore';

export default function RootNavigator(): JSX.Element {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

## Rules

1. **Type all param lists** — `ParamList` type for every navigator
2. **Typed screen props** — use `NativeStackScreenProps<ParamList, 'ScreenName'>`
3. **`useNavigation` with generic** — `useNavigation<NavigationProp>()` not bare
4. **Deep linking** — configure `linking` prop on `NavigationContainer` for URL support
5. **No string literals for screen names** — TypeScript will catch typos in typed navigation
6. **Auth guard in root navigator** — swap stacks based on auth state, not conditional renders in screens
7. **`useFocusEffect`** for re-fetching data on screen focus (not `useEffect` with navigation listener)
