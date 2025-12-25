import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getWallets, type Wallet } from './utils/api/wallet';
import { executeTransfer, getExchangeRate, type TransferRequest } from './utils/api/payments';
import { trackUserAction } from '../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';
const ERROR_COLOR = '#ef4444';

export default function TransferScreen() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [fromWalletId, setFromWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  useEffect(() => {
    loadWallets();
  }, []);

  useEffect(() => {
    if (fromWalletId && toWalletId && amount && parseFloat(amount) > 0) {
      calculateExchangeRate();
    } else {
      setExchangeRate(null);
      setConvertedAmount(null);
    }
  }, [fromWalletId, toWalletId, amount]);

  const loadWallets = async () => {
    try {
      const walletsData = await getWallets();
      setWallets(walletsData);
      if (walletsData.length > 0 && !fromWalletId) {
        setFromWalletId(walletsData[0].id);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load wallets');
    } finally {
      setLoadingWallets(false);
    }
  };

  const calculateExchangeRate = async () => {
    const fromWallet = wallets.find((w) => w.id === fromWalletId);
    const toWallet = wallets.find((w) => w.id === toWalletId);

    if (!fromWallet || !toWallet || fromWallet.currency === toWallet.currency) {
      setExchangeRate(1);
      setConvertedAmount(parseFloat(amount));
      return;
    }

    try {
      const rateData = await getExchangeRate({
        fromCurrency: fromWallet.currency,
        toCurrency: toWallet.currency,
        amount: parseFloat(amount),
      });
      setExchangeRate(rateData.rate);
      setConvertedAmount(rateData.convertedAmount || null);
    } catch (error) {
      console.error('Error calculating exchange rate:', error);
      // Continue without rate display
    }
  };

  const handleTransfer = async () => {
    if (!fromWalletId || !toWalletId) {
      Alert.alert('Error', 'Please select both source and destination wallets');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const fromWallet = wallets.find((w) => w.id === fromWalletId);
    if (fromWallet && parseFloat(fromWallet.balance.toString()) < parseFloat(amount)) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds in the selected wallet');
      return;
    }

    setLoading(true);
    try {
      const transferData: TransferRequest = {
        fromAccountId: fromWalletId,
        toAccountId: toWalletId,
        amount: parseFloat(amount),
        currency: fromWallet?.currency || 'USD',
        description: description || undefined,
      };

      const result = await executeTransfer(transferData);
      await trackUserAction.paymentCompleted(parseFloat(amount), fromWallet?.currency || 'USD', 'transfer');
      
      Alert.alert(
        'Success',
        `Transfer of ${amount} ${fromWallet?.currency} completed successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to execute transfer');
      await trackUserAction.paymentFailed(
        parseFloat(amount),
        wallets.find((w) => w.id === fromWalletId)?.currency || 'USD',
        'transfer',
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

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

  if (loadingWallets) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading wallets...</Text>
      </View>
    );
  }

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={TEXT_COLOR} />
          </TouchableOpacity>
          <Text style={styles.title}>Send Money</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>From Wallet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletSelector}>
              {wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[
                    styles.walletOption,
                    fromWalletId === wallet.id && styles.walletOptionSelected,
                  ]}
                  onPress={() => setFromWalletId(wallet.id)}
                >
                  <Text style={styles.walletFlag}>{getCurrencyFlag(wallet.currency)}</Text>
                  <Text style={styles.walletCurrency}>{wallet.currency}</Text>
                  <Text style={styles.walletBalance}>
                    {formatCurrency(parseFloat(wallet.balance.toString()), wallet.currency)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>To Wallet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletSelector}>
              {wallets
                .filter((w) => w.id !== fromWalletId)
                .map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    style={[
                      styles.walletOption,
                      toWalletId === wallet.id && styles.walletOptionSelected,
                    ]}
                    onPress={() => setToWalletId(wallet.id)}
                  >
                    <Text style={styles.walletFlag}>{getCurrencyFlag(wallet.currency)}</Text>
                    <Text style={styles.walletCurrency}>{wallet.currency}</Text>
                    <Text style={styles.walletBalance}>
                      {formatCurrency(parseFloat(wallet.balance.toString()), wallet.currency)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            {wallets.filter((w) => w.id !== fromWalletId).length === 0 && (
              <Text style={styles.hintText}>Create another wallet to transfer to</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>{fromWallet?.currency || 'USD'}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={MUTED_TEXT_COLOR}
              />
            </View>
            {fromWallet && (
              <Text style={styles.balanceText}>
                Available: {formatCurrency(parseFloat(fromWallet.balance.toString()), fromWallet.currency)}
              </Text>
            )}
            {exchangeRate && convertedAmount && toWallet && fromWallet && fromWallet.currency !== toWallet.currency && (
              <View style={styles.exchangeInfo}>
                <Ionicons name="swap-horizontal" size={16} color={MUTED_TEXT_COLOR} />
                <Text style={styles.exchangeText}>
                  ≈ {formatCurrency(convertedAmount, toWallet.currency)} @ {exchangeRate.toFixed(4)} rate
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add a note for this transfer"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor={MUTED_TEXT_COLOR}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleTransfer}
            disabled={loading || !fromWalletId || !toWalletId || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Send Money</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 12,
  },
  walletSelector: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  walletOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  walletOptionSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: '#e9f5ee',
  },
  walletFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  walletCurrency: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 12,
    color: MUTED_TEXT_COLOR,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    paddingVertical: 16,
  },
  balanceText: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
    marginTop: 8,
  },
  exchangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  exchangeText: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: TEXT_COLOR,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
    fontStyle: 'italic',
    marginTop: 8,
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

