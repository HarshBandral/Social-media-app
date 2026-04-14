import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight, STORY_DURATION_MS, API_URL } from '../../constants';
import type { ThemeColors } from '../../constants';
import { useColors } from '../../store/themeStore';
import Avatar from '../../components/Avatar';
import type { MainStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainStackParamList, 'StoryViewer'>;

const StoryViewerScreen: React.FC<Props> = ({ navigation, route }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const { storyGroup } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStory = storyGroup.stories[currentIndex];

  const startTimer = useCallback(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      useNativeDriver: false,
    }).start();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (currentIndex < storyGroup.stories.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        navigation.goBack();
      }
    }, STORY_DURATION_MS);
  }, [currentIndex, navigation, progressAnim, storyGroup.stories.length]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const handlePress = (side: 'left' | 'right') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (side === 'right') {
      if (currentIndex < storyGroup.stories.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        navigation.goBack();
      }
    } else {
      if (currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }
  };

  const imageUrl = currentStory.image_url.startsWith('http')
    ? currentStory.image_url
    : `${API_URL}${currentStory.image_url}`;

  const timeAgo = getTimeAgo(currentStory.created_at);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image source={{ uri: imageUrl }} style={styles.storyImage} resizeMode="cover" />

      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {storyGroup.stories.map((_, idx) => (
          <View key={idx} style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                        ? progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar
            uri={storyGroup.avatar_url}
            name={storyGroup.username}
            size={36}
          />
          <Text style={styles.username}>{storyGroup.username}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </Pressable>
      </View>

      {/* Touch zones */}
      <View style={styles.touchContainer}>
        <Pressable style={styles.touchLeft} onPress={() => handlePress('left')} />
        <Pressable style={styles.touchRight} onPress={() => handlePress('right')} />
      </View>
    </View>
  );
};

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  storyImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.huge + Spacing.sm,
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  username: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  time: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  touchContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 2,
  },
});

export default StoryViewerScreen;
