import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import type { ThemeColors } from '../constants';
import { useColors } from '../store/themeStore';

const LoadingScreen: React.FC = () => {
  const Colors = useColors();
  const styles = makeStyles(Colors);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});

export default LoadingScreen;
