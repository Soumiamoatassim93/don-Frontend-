import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const colors = {
  primary: '#6366f1',
};

export const LoadingSpinner = ({ size = 'large', color = colors.primary }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});