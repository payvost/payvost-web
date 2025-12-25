import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SecureStorage } from '../../utils/security';
import { getProfile } from '../utils/api/user';
import { getWallets, type Wallet as WalletType } from '../utils/api/wallet';
import { getTransactions, type Transaction as TransactionType } from '../utils/api/transactions';
import { useAuth } from '../../../hooks/useAuth';
import { trackScreenView, trackUserAction } from '../../../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const SECONDARY_COLOR = '#e9f5ee';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

interface WalletDisplay {
  currency: string;
  balance: number;
  flag?: string;
}

interface TransactionDisplay {
  id: string;
  recipient: string;
  amount: string;
  status: string;
  type: string;
}

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

const QuickActionButton = ({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIconContainer, { backgroundColor: SECONDARY_COLOR }]}>
      <Ionicons name={icon} size={24} color={PRIMARY_COLOR} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const TransactionItem = ({ item }: { item: TransactionDisplay }) => {
  const isDebit = item.amount.startsWith('-');
  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: isDebit ? '#fee2e2' : '#dcfce7' }]}>
        <Ionicons name={isDebit ? "arrow-up" : "arrow-down"} size={20} color={isDebit ? '#ef4444' : '#22c55e'} />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionRecipient}>{item.recipient}</Text>
        <Text style={styles.transactionType}>{item.type}</Text>
      </View>
      <View style={styles.transactionAmountContainer}>
        <Text style={[styles.transactionAmount, { color: isDebit ? TEXT_COLOR : PRIMARY_COLOR }]}>{item.amount}</Text>
        <Text style={[
          styles.transactionStatus,
          item.status === 'Completed' && { color: PRIMARY_COLOR },
          item.status === 'Failed' && { color: '#ef4444' }
        ]}>
          {item.status}
        </Text>
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [wallets, setWallets] = useState<WalletDisplay[]>([]);
  const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const loadDashboardData = async () => {
    try {
      const token = await SecureStorage.getToken('auth_token');
      if (!token) {
        setError('Please login to view your dashboard');
        setLoading(false);
        return;
      }

      // Load wallets
      try {
        const walletsData = await getWallets();
        const walletDisplays: WalletDisplay[] = walletsData.map((wallet: WalletType) => ({
          currency: wallet.currency,
          balance: parseFloat(wallet.balance.toString()),
          flag: getCurrencyFlag(wallet.currency),
        }));

        setWallets(walletDisplays);

        // Calculate total balance (convert to USD for display - simplified)
        const total = walletDisplays.reduce((sum, wallet) => {
          // Simple conversion - in production, use actual FX rates
          if (wallet.currency === 'USD') return sum + wallet.balance;
          if (wallet.currency === 'NGN') return sum + wallet.balance / 1450; // Approximate rate
          if (wallet.currency === 'GBP') return sum + wallet.balance * 1.27; // Approximate rate
          return sum + wallet.balance; // Fallback
        }, 0);
        setTotalBalance(total);
      } catch (walletError: any) {
        console.error('Failed to load wallets:', walletError);
        setWallets([]);
        setTotalBalance(0);
      }

      // Load recent transactions
      try {
        const transactionsData = await getTransactions(5, 0);
        const transactionDisplays: TransactionDisplay[] = transactionsData.map((tx: TransactionType) => {
          const isDebit = tx.type === 'TRANSFER' || tx.type === 'PAYMENT' || tx.type === 'WITHDRAWAL';
          const amount = isDebit ? -tx.amount : tx.amount;
          const formattedAmount = formatCurrency(Math.abs(amount), tx.currency);

          return {
            id: tx.id,
            recipient: tx.description || (isDebit ? 'Sent' : 'Received'),
            amount: `${isDebit ? '-' : '+'}${formattedAmount}`,
            status: tx.status === 'COMPLETED' ? 'Completed' : tx.status,
            type: tx.type === 'TRANSFER' ? 'Transfer' : tx.type,
          };
        });
        setTransactions(transactionDisplays);
      } catch (transactionError: any) {
        console.error('Failed to load transactions:', transactionError);
        setTransactions([]);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    trackScreenView('Dashboard');
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    refreshUser();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.centerContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || user?.displayName || user?.email || 'User'}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={26} color={TEXT_COLOR} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Balance</Text>
        <Text style={styles.totalBalance}>
          {totalBalance > 0 ? formatCurrency(totalBalance, 'USD') : '$0.00'}
        </Text>
        {wallets.length > 0 ? (
          <View style={styles.walletPreview}>
            {wallets.slice(0, 3).map((wallet, index) => (
              <Text key={`${wallet.currency}-${index}`} style={styles.walletBalanceText}>
                {wallet.flag || getCurrencyFlag(wallet.currency)} {formatCurrency(wallet.balance, wallet.currency)}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No wallets yet. Create your first wallet to get started.</Text>
        )}
      </View>

      <View style={styles.quickActionsContainer}>
        <QuickActionButton icon="arrow-up-outline" label="Send" onPress={() => router.push('/payments')} />
        <QuickActionButton icon="add-outline" label="Fund" onPress={() => router.push('/wallets')} />
        <QuickActionButton icon="receipt-outline" label="Bills" onPress={() => router.push('/payments')} />
        <QuickActionButton icon="ellipsis-horizontal" label="More" onPress={() => router.push('/more')} />
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {transactions.length > 0 && (
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      {transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={({ item }) => <TransactionItem item={item} />}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={MUTED_TEXT_COLOR} />
          <Text style={styles.emptyText}>No recent transactions</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: MUTED_TEXT_COLOR,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
  },
  totalBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginVertical: 8,
  },
  walletPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  walletBalanceText: {
    fontSize: 12,
    color: MUTED_TEXT_COLOR,
    marginRight: 10,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: TEXT_COLOR,
    fontWeight: '500',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  viewAll: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionRecipient: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_COLOR,
  },
  transactionType: {
    fontSize: 12,
    color: MUTED_TEXT_COLOR,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionStatus: {
    fontSize: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: MUTED_TEXT_COLOR,
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: MUTED_TEXT_COLOR,
    fontSize: 14,
  },
});
