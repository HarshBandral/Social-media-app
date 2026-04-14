import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize, FontWeight } from '../constants';
import type { ThemeColors } from '../constants';
import Avatar from './Avatar';
import { useColors } from '../store/themeStore';

interface StoryCircleProps {
  username: string;
  avatarUrl: string | null;
  hasStory: boolean;
  isOwn?: boolean;
  onPress: () => void;
}

const StoryCircle: React.FC<StoryCircleProps> = ({
  username,
  avatarUrl,
  hasStory,
  isOwn = false,
  onPress,
}) => {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {hasStory ? (
        <LinearGradient
          colors={[Colors.accent, Colors.gradientWarm, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={styles.innerBorder}>
            <Avatar uri={avatarUrl} name={username} size={60} />
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.noBorder}>
          <Avatar uri={avatarUrl} name={username} size={60} />
          {isOwn && (
            <View style={styles.addButton}>
              <Ionicons name="add" size={16} color={Colors.white} />
            </View>
          )}
        </View>
      )}
      <Text style={styles.username} numberOfLines={1}>
        {isOwn ? 'Your story' : username}
      </Text>
    </Pressable>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 76,
  },
  gradientBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noBorder: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  username: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

export default React.memo(StoryCircle);
