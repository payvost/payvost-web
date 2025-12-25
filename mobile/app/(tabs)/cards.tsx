import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

export default function CardsScreen() {
  const [cards] = useState<any[]>([]); // TODO: Load cards from API

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Virtual Cards</Text>
        <Text style={styles.subtitle}>Create and manage your cards</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            // TODO: Navigate to create card
            console.log('Create card');
          }}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Create New Card</Text>
        </TouchableOpacity>
      </View>

      {cards.length > 0 ? (
        <View style={styles.cardsContainer}>
          {cards.map((card) => (
            <View key={card.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="card" size={24} color="white" />
                <Text style={styles.cardType}>{card.type}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardNumber}>{card.number}</Text>
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.cardLabel}>Cardholder</Text>
                    <Text style={styles.cardValue}>{card.cardholder}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>Expires</Text>
                    <Text style={styles.cardValue}>{card.expiry}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="card-outline" size={64} color={MUTED_TEXT_COLOR} />
          <Text style={styles.emptyTitle}>No Cards Yet</Text>
          <Text style={styles.emptyText}>
            Create a virtual card to start making secure online payments
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Features</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={PRIMARY_COLOR} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Secure Payments</Text>
              <Text style={styles.featureDescription}>
                Your card details are encrypted and secure
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash-outline" size={24} color={PRIMARY_COLOR} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Instant Creation</Text>
              <Text style={styles.featureDescription}>
                Get your virtual card ready in seconds
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="globe-outline" size={24} color={PRIMARY_COLOR} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Global Acceptance</Text>
              <Text style={styles.featureDescription}>
                Use your card anywhere in the world
              </Text>
            </View>
          </View>
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
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  cardType: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
    textAlign: 'center',
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
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
  },
});

