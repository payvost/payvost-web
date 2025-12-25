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
import { getWallets, fundWallet, type Wallet, type FundWalletRequest } from './utils/api/wallet';
import { trackUserAction } from '../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

export default function FundWalletScreen() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CRYPTO'>('CARD');
  const [loading, setLoading] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const walletsData = await getWallets();
      setWallets(walletsData);
      if (walletsData.length > 0 && !selectedWalletId) {
        setSelectedWalletId(walletsData[0].id);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load wallets');
    } finally {
      setLoadingWallets(false);
    }
  };

  const handleFund = async () => {
    if (!selectedWalletId) {
      Alert.alert('Error', 'Please select a wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
      const fundData: FundWalletRequest = {
        accountId: selectedWalletId,
        amount: parseFloat(amount),
        currency: selectedWallet?.currency || 'USD',
        paymentMethod: paymentMethod,
      };

      const result = await fundWallet(fundData);
      await trackUserAction.walletFunded(parseFloat(amount), selectedWallet?.currency || 'USD');
      
      Alert.alert(
        'Success',
        `Wallet funded successfully! ${result.message || ''}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fund wallet');
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

  const paymentMethods = [
    { id: 'CARD', label: 'Card', icon: 'card-outline' },
    { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'business-outline' },
    { id: 'WALLET', label: 'Other Wallet', icon: 'wallet-outline' },
    { id: 'CRYPTO', label: 'Crypto', icon: 'logo-bitcoin' },
  ] as const;

  if (loadingWallets) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading wallets...</Text>
      </View>
    );
  }

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

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
          <Text style={styles.title}>Fund Wallet</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Select Wallet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletSelector}>
              {wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[
                    styles.walletOption,
                    selectedWalletId === wallet.id && styles.walletOptionSelected,
                  ]}
                  onPress={() => setSelectedWalletId(wallet.id)}
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
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>{selectedWallet?.currency || 'USD'}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={MUTED_TEXT_COLOR}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentMethodsGrid}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === method.id && styles.paymentMethodOptionSelected,
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <Ionicons
                    name={method.icon}
                    size={24}
                    color={paymentMethod === method.id ? 'white' : PRIMARY_COLOR}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method.id && styles.paymentMethodTextSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleFund}
            disabled={loading || !selectedWalletId || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Fund Wallet</Text>
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
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentMethodOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    gap: 8,
  },
  paymentMethodOptionSelected: {
    backgroundColor: PRIMARY_COLOR,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  paymentMethodTextSelected: {
    color: 'white',
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

