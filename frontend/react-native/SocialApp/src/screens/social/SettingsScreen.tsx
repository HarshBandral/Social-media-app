import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants';
import type { ThemeColors } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useColors, useThemeStore } from '../../store/themeStore';
import { updatePrivacy } from '../../services/users';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  Colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  label,
  subtitle,
  onPress,
  rightElement,
  danger,
  Colors,
  styles,
}) => (
  <Pressable style={styles.settingRow} onPress={onPress}>
    <View
      style={[styles.settingIcon, danger && styles.settingIconDanger]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? Colors.error : Colors.primary}
      />
    </View>
    <View style={styles.settingText}>
      <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || (
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    )}
  </Pressable>
);

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);

  const handleTogglePrivacy = async (value: boolean) => {
    setIsPrivate(value);
    try {
      const updated = await updatePrivacy(value);
      setUser(updated);
    } catch {
      setIsPrivate(!value);
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <SettingRow
            icon="person-outline"
            label="Edit Profile"
            subtitle="Name, username, bio, avatar"
            onPress={() => navigation.navigate('EditProfile')}
            Colors={Colors}
            styles={styles}
          />
          <SettingRow
            icon="lock-closed-outline"
            label="Change Password"
            subtitle="Update your password"
            onPress={() => navigation.navigate('ChangePassword')}
            Colors={Colors}
            styles={styles}
          />
        </View>

        {/* Content Section */}
        <Text style={styles.sectionTitle}>Content</Text>
        <View style={styles.section}>
          <SettingRow
            icon="bookmark-outline"
            label="Saved Posts"
            subtitle="Posts you've bookmarked"
            onPress={() => navigation.navigate('SavedPosts')}
            Colors={Colors}
            styles={styles}
          />
        </View>

        {/* Privacy Section */}
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.section}>
          <SettingRow
            icon="eye-off-outline"
            label="Private Account"
            subtitle="Only friends can see your posts"
            rightElement={
              <Switch
                value={isPrivate}
                onValueChange={handleTogglePrivacy}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={isPrivate ? Colors.primary : Colors.textMuted}
              />
            }
            Colors={Colors}
            styles={styles}
          />
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.section}>
          <SettingRow
            icon={isDark ? 'moon' : 'sunny-outline'}
            label="Dark Mode"
            subtitle={isDark ? 'Dark theme active' : 'Light theme active'}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={isDark ? Colors.primary : Colors.textMuted}
              />
            }
            Colors={Colors}
            styles={styles}
          />
        </View>

        {/* Social Section */}
        <Text style={styles.sectionTitle}>Social</Text>
        <View style={styles.section}>
          <SettingRow
            icon="people-outline"
            label="Friend Requests"
            subtitle="View pending requests"
            onPress={() => navigation.navigate('FriendRequests')}
            Colors={Colors}
            styles={styles}
          />
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Session</Text>
        <View style={styles.section}>
          <SettingRow
            icon="log-out-outline"
            label="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            danger
            Colors={Colors}
            styles={styles}
          />
        </View>

        <Text style={styles.version}>Social App v1.0.0</Text>
      </ScrollView>
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
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.small,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingIconDanger: {
    backgroundColor: `${Colors.error}15`,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  settingSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  dangerText: {
    color: Colors.error,
  },
  version: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});

export default SettingsScreen;
