import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontSize, FontWeight } from '../constants';
import type { ThemeColors } from '../constants';
import { API_URL } from '../constants';
import { useColors } from '../store/themeStore';

interface AvatarProps {
  uri: string | null;
  name: string;
  size?: number;
  showBorder?: boolean;
  borderColor?: 'gradient' | 'online' | 'none';
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 44,
  showBorder = false,
  borderColor = 'none',
}) => {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const imageUrl = uri ? (uri.startsWith('http') ? uri : `${API_URL}${uri}`) : null;

  const avatarContent = imageUrl ? (
    <Image source={{ uri: imageUrl }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
  ) : (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );

  if (showBorder && borderColor === 'gradient') {
    return (
      <LinearGradient
        colors={[Colors.gradientStart, Colors.accent, Colors.gradientWarm]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBorder, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]}
      >
        <View style={[styles.borderInner, { width: size + 2, height: size + 2, borderRadius: (size + 2) / 2 }]}>
          {avatarContent}
        </View>
      </LinearGradient>
    );
  }

  if (showBorder && borderColor === 'online') {
    return (
      <View style={[styles.onlineBorder, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
        {avatarContent}
      </View>
    );
  }

  return avatarContent;
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  image: {
    backgroundColor: Colors.surface,
  },
  placeholder: {
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  gradientBorder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderInner: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBorder: {
    borderWidth: 2,
    borderColor: Colors.online,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(Avatar);
