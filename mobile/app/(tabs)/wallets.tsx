import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getWallets, type Wallet as WalletType } from '../utils/api/wallet';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

const getCurrencyFlag = (currency: string): string => {
  const flags: Record<string, string> = {
    USD: '🇺🇸',
    NGN: '🇳🇬',
    GBP: '🇬🇧',
    EUR: '🇪🇺',
    GHS: '🇬🇭',
    KES: '🇰🇪',
    ZAR: '🇿🇦',
    CAD: '🇨🇦',
    AUD: '🇦🇺',
  };
  return flags[currency] || '💳';
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function WalletsScreen() {
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWallets = async () => {
    try {
      const walletsData = await getWallets();
      setWallets(walletsData);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWallets();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading wallets...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Wallets</Text>
        <Text style={styles.subtitle}>Manage your multi-currency wallets</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => {
          // TODO: Navigate to create wallet
          console.log('Create wallet');
        }}>
          <Ionicons name="add-circle-outline" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.actionButtonText}>Create Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => {
          // TODO: Navigate to fund wallet
          console.log('Fund wallet');
        }}>
          <Ionicons name="arrow-down-circle-outline" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.actionButtonText}>Fund Wallet</Text>
        </TouchableOpacity>
      </View>

      {wallets.length > 0 ? (
        <View style={styles.walletsContainer}>
          {wallets.map((wallet) => (
            <TouchableOpacity
              key={wallet.id}
              style={styles.walletCard}
              onPress={() => {
                // TODO: Navigate to wallet details
                console.log('Wallet details:', wallet.id);
              }}
            >
              <View style={styles.walletHeader}>
                <View style={styles.walletIcon}>
                  <Text style={styles.walletFlag}>{getCurrencyFlag(wallet.currency)}</Text>
                </View>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletCurrency}>{wallet.currency}</Text>
                  <Text style={styles.walletType}>{wallet.type}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={MUTED_TEXT_COLOR} />
              </View>
              <View style={styles.walletBalance}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <Text style={styles.balanceAmount}>
                  {formatCurrency(parseFloat(wallet.balance.toString()), wallet.currency)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={MUTED_TEXT_COLOR} />
          <Text style={styles.emptyTitle}>No Wallets Yet</Text>
          <Text style={styles.emptyText}>Create your first wallet to get started</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => {
            // TODO: Navigate to create wallet
            console.log('Create wallet');
          }}>
            <Text style={styles.createButtonText}>Create Wallet</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  walletsContainer: {
    paddingHorizontal: 20,
  },
  walletCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9f5ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletFlag: {
    fontSize: 24,
  },
  walletInfo: {
    flex: 1,
  },
  walletCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  walletType: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
    textTransform: 'capitalize',
  },
  walletBalance: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: MUTED_TEXT_COLOR,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_COLOR,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: MUTED_TEXT_COLOR,
    fontSize: 14,
  },
});

