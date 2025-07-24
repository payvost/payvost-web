
import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#16a34a';
const SECONDARY_COLOR = '#e9f5ee';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

const walletBalances = [
  { currency: 'USD', balance: '$1,250.75', flag: '🇺🇸' },
  { currency: 'NGN', balance: '₦1,850,000.00', flag: '🇳🇬' },
  { currency: 'GBP', balance: '£850.00', flag: '🇬🇧' },
];

const recentTransactions = [
  { id: 'txn_01', recipient: 'John Doe', amount: '-$250.00', status: 'Completed', type: 'Transfer' },
  { id: 'txn_02', recipient: 'MTN Airtime', amount: '-$10.00', status: 'Completed', type: 'Bill Payment' },
  { id: 'txn_03', recipient: 'Adebayo Adekunle', amount: '-$50.00', status: 'Failed', type: 'Transfer' },
  { id: 'txn_04', recipient: 'Received from Jane', amount: '+$500.00', status: 'Completed', type: 'Deposit' },
];

const QuickActionButton = ({ icon, label }: { icon: any; label: string }) => (
    <TouchableOpacity style={styles.quickAction}>
        <View style={[styles.quickActionIconContainer, { backgroundColor: SECONDARY_COLOR }]}>
             <Ionicons name={icon} size={24} color={PRIMARY_COLOR} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
);

const TransactionItem = ({ item }: { item: typeof recentTransactions[0] }) => {
    const isDebit = item.amount.startsWith('-');
    return (
        <View style={styles.transactionItem}>
            <View style={[styles.transactionIcon, {backgroundColor: isDebit ? '#fee2e2' : '#dcfce7'}]}>
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
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>Alice</Text>
        </View>
        <TouchableOpacity>
            <Ionicons name="notifications-outline" size={26} color={TEXT_COLOR} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Balance</Text>
        <Text style={styles.totalBalance}>$4,350.50</Text>
        <View style={styles.walletPreview}>
          {walletBalances.map(wallet => (
            <Text key={wallet.currency} style={styles.walletBalanceText}>{wallet.flag} {wallet.balance}</Text>
          ))}
        </View>
      </View>

        <View style={styles.quickActionsContainer}>
            <QuickActionButton icon="arrow-up-outline" label="Send" />
            <QuickActionButton icon="add-outline" label="Fund" />
            <QuickActionButton icon="receipt-outline" label="Bills" />
            <QuickActionButton icon="ellipsis-horizontal" label="More" />
        </View>

        <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
        </View>
        <FlatList
            data={recentTransactions}
            renderItem={TransactionItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
        />
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
});
