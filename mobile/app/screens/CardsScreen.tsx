
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CardsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Virtual Cards</Text>
      <Text style={styles.subtitle}>Create and manage your virtual cards.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
  },
});
