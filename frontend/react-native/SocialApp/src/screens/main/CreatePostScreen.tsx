import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight, BorderRadius, MAX_CAPTION_LENGTH } from '../../constants';
import type { ThemeColors } from '../../constants';
import { createPost } from '../../services/posts';
import { createStory } from '../../services/stories';
import { useColors } from '../../store/themeStore';
import GradientButton from '../../components/GradientButton';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'CreatePost'>;

const CreatePostScreen: React.FC<Props> = ({ navigation, route }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const isStory = route.params?.isStory ?? false;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: isStory ? [9, 16] : [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    setLoading(true);
    try {
      if (isStory) {
        await createStory(imageUri);
        await queryClient.invalidateQueries({ queryKey: ['stories'] });
      } else {
        await createPost(imageUri, caption || undefined);
        await queryClient.invalidateQueries({ queryKey: ['feed'] });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to upload. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isStory ? 'New Story' : 'New Post'}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={[styles.preview, isStory && styles.storyPreview]}
              resizeMode="cover"
            />
            <Pressable style={styles.changeImageButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={20} color={Colors.white} />
              <Text style={styles.changeImageText}>Change</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={pickImage} style={styles.pickContainer}>
            <LinearGradient
              colors={[Colors.surface, Colors.surfaceLight]}
              style={styles.pickGradient}
            >
              <Ionicons name="image-outline" size={48} color={Colors.primaryLight} />
              <Text style={styles.pickText}>Tap to select an image</Text>
              <Text style={styles.pickSubtext}>
                {isStory ? 'Best ratio: 9:16' : 'Best ratio: 1:1'}
              </Text>
            </LinearGradient>
          </Pressable>
        )}

        {!isStory && (
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor={Colors.placeholder}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={MAX_CAPTION_LENGTH}
              selectionColor={Colors.primary}
            />
            <Text style={styles.charCount}>
              {caption.length}/{MAX_CAPTION_LENGTH}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <GradientButton
          title={isStory ? 'Share Story' : 'Share Post'}
          onPress={handleSubmit}
          loading={loading}
          disabled={!imageUri}
          variant={isStory ? 'accent' : 'primary'}
        />
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
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
    flex: 1,
    padding: Spacing.xl,
  },
  pickContainer: {
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  pickGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  pickText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.lg,
  },
  pickSubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
  },
  storyPreview: {
    aspectRatio: 9 / 16,
    maxHeight: 400,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    gap: Spacing.xs,
  },
  changeImageText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  captionContainer: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  captionInput: {
    color: Colors.text,
    fontSize: FontSize.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

export default CreatePostScreen;
