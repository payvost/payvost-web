import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trackUserAction } from '../../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

interface PaymentOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: string;
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'transfer',
    title: 'Send Money',
    description: 'Transfer money to anyone',
    icon: 'arrow-forward-outline',
    color: PRIMARY_COLOR,
  },
  {
    id: 'airtime',
    title: 'Airtime Top-up',
    description: 'Top up mobile airtime',
    icon: 'phone-portrait-outline',
    color: '#3b82f6',
  },
  {
    id: 'data',
    title: 'Data Bundle',
    description: 'Purchase data plans',
    icon: 'wifi-outline',
    color: '#8b5cf6',
  },
  {
    id: 'bills',
    title: 'Pay Bills',
    description: 'Utility bills & services',
    icon: 'receipt-outline',
    color: '#f59e0b',
  },
  {
    id: 'giftcards',
    title: 'Gift Cards',
    description: 'Buy digital gift cards',
    icon: 'gift-outline',
    color: '#ec4899',
  },
  {
    id: 'bulk',
    title: 'Bulk Transfer',
    description: 'Send to multiple recipients',
    icon: 'people-outline',
    color: '#14b8a6',
  },
];

export default function PaymentsScreen() {
  const router = useRouter();

  const handlePaymentOption = async (option: PaymentOption) => {
    // Track the action
    await trackUserAction.screenOpened(option.title);
    
    // Show coming soon for now - in production, navigate to specific flows
    switch (option.id) {
      case 'transfer':
        Alert.alert('Coming Soon', 'Money transfer feature coming soon');
        break;
      case 'airtime':
        Alert.alert('Coming Soon', 'Airtime top-up feature coming soon');
        break;
      case 'data':
        Alert.alert('Coming Soon', 'Data bundle feature coming soon');
        break;
      case 'bills':
        Alert.alert('Coming Soon', 'Bill payment feature coming soon');
        break;
      case 'giftcards':
        Alert.alert('Coming Soon', 'Gift cards feature coming soon');
        break;
      case 'bulk':
        Alert.alert('Coming Soon', 'Bulk transfer feature coming soon');
        break;
      default:
        console.log('Selected payment option:', option.id);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>Choose a payment option</Text>
      </View>

      <View style={styles.optionsContainer}>
        {paymentOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={() => handlePaymentOption(option)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
              <Ionicons name={option.icon} size={28} color={option.color} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color={MUTED_TEXT_COLOR} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={MUTED_TEXT_COLOR} />
          <Text style={styles.emptyText}>No recent payments</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: MUTED_TEXT_COLOR,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
  },
  section: {
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 12,
    color: MUTED_TEXT_COLOR,
    fontSize: 14,
  },
});

