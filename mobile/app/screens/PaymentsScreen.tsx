
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PaymentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payments</Text>
      <Text style={styles.subtitle}>Send money, pay bills, and more.</Text>
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
