import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spacing, FontSize, FontWeight, MAX_BIO_LENGTH } from '../../constants';
import type { ThemeColors } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../store/themeStore';
import { updateProfile, uploadAvatar } from '../../services/users';
import Input from '../../components/Input';
import Avatar from '../../components/Avatar';
import GradientButton from '../../components/GradientButton';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const updated = await uploadAvatar(result.assets[0].uri);
        setUser(updated);
      } catch {
        Alert.alert('Error', 'Failed to upload avatar');
      }
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !username.trim()) {
      Alert.alert('Error', 'Name and username are required');
      return;
    }
    setLoading(true);
    try {
      const updated = await updateProfile({
        full_name: fullName.trim(),
        username: username.trim(),
        bio: bio.trim() || undefined,
      });
      setUser(updated);
      await queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update profile. Username may be taken.');
    }
    setLoading(false);
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <Pressable onPress={handlePickAvatar} style={styles.avatarContainer}>
          <Avatar
            uri={user?.avatar_url || null}
            name={user?.full_name || 'U'}
            size={100}
            showBorder
            borderColor="gradient"
          />
          <View style={styles.cameraButton}>
            <Ionicons name="camera" size={18} color={Colors.white} />
          </View>
        </Pressable>
        <Pressable onPress={handlePickAvatar}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </Pressable>

        {/* Fields */}
        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={fullName}
            onChangeText={setFullName}
            icon="person-outline"
          />
          <Input
            label="Username"
            placeholder="Your username"
            value={username}
            onChangeText={setUsername}
            icon="at-outline"
          />
          <Input
            label="Bio"
            placeholder="Tell us about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={MAX_BIO_LENGTH}
            icon="document-text-outline"
          />
          <Text style={styles.charCount}>
            {bio.length}/{MAX_BIO_LENGTH}
          </Text>
        </View>

        <GradientButton
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        />
      </ScrollView>
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
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginTop: Spacing.xl,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  changePhotoText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  form: {
    width: '100%',
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
  },
  saveButton: {
    width: '100%',
    marginTop: Spacing.md,
  },
});

export default EditProfileScreen;
