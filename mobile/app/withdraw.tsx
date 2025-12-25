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
import { getWallets, withdrawFromWallet, type Wallet, type WithdrawWalletRequest } from './utils/api/wallet';
import { trackUserAction } from '../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

export default function WithdrawScreen() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [destinationType, setDestinationType] = useState<'BANK_ACCOUNT' | 'MOBILE_MONEY' | 'CRYPTO'>('BANK_ACCOUNT');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [bankCode, setBankCode] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [cryptoAddress, setCryptoAddress] = useState<string>('');
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

  const handleWithdraw = async () => {
    if (!selectedWalletId) {
      Alert.alert('Error', 'Please select a wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
    if (selectedWallet && parseFloat(selectedWallet.balance.toString()) < parseFloat(amount)) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds in the selected wallet');
      return;
    }

    let destination: any = {};
    if (destinationType === 'BANK_ACCOUNT') {
      if (!accountNumber) {
        Alert.alert('Error', 'Please enter account number');
        return;
      }
      destination = { accountNumber, bankCode: bankCode || undefined };
    } else if (destinationType === 'MOBILE_MONEY') {
      if (!mobileNumber) {
        Alert.alert('Error', 'Please enter mobile number');
        return;
      }
      destination = { mobileNumber };
    } else if (destinationType === 'CRYPTO') {
      if (!cryptoAddress) {
        Alert.alert('Error', 'Please enter crypto address');
        return;
      }
      destination = { cryptoAddress };
    }

    setLoading(true);
    try {
      const withdrawData: WithdrawWalletRequest = {
        accountId: selectedWalletId,
        amount: parseFloat(amount),
        currency: selectedWallet?.currency || 'USD',
        destination: {
          type: destinationType,
          ...destination,
        },
      };

      const result = await withdrawFromWallet(withdrawData);
      await trackUserAction.walletWithdrawn(parseFloat(amount), selectedWallet?.currency || 'USD');
      
      Alert.alert(
        'Success',
        `Withdrawal initiated successfully! ${result.message || ''}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to withdraw from wallet');
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
          <Text style={styles.title}>Withdraw</Text>
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
            {selectedWallet && (
              <Text style={styles.balanceText}>
                Available: {formatCurrency(parseFloat(selectedWallet.balance.toString()), selectedWallet.currency)}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Withdraw To</Text>
            <View style={styles.destinationTypes}>
              <TouchableOpacity
                style={[
                  styles.destinationTypeOption,
                  destinationType === 'BANK_ACCOUNT' && styles.destinationTypeOptionSelected,
                ]}
                onPress={() => setDestinationType('BANK_ACCOUNT')}
              >
                <Ionicons
                  name="business-outline"
                  size={24}
                  color={destinationType === 'BANK_ACCOUNT' ? 'white' : PRIMARY_COLOR}
                />
                <Text
                  style={[
                    styles.destinationTypeText,
                    destinationType === 'BANK_ACCOUNT' && styles.destinationTypeTextSelected,
                  ]}
                >
                  Bank
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.destinationTypeOption,
                  destinationType === 'MOBILE_MONEY' && styles.destinationTypeOptionSelected,
                ]}
                onPress={() => setDestinationType('MOBILE_MONEY')}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color={destinationType === 'MOBILE_MONEY' ? 'white' : PRIMARY_COLOR}
                />
                <Text
                  style={[
                    styles.destinationTypeText,
                    destinationType === 'MOBILE_MONEY' && styles.destinationTypeTextSelected,
                  ]}
                >
                  Mobile Money
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.destinationTypeOption,
                  destinationType === 'CRYPTO' && styles.destinationTypeOptionSelected,
                ]}
                onPress={() => setDestinationType('CRYPTO')}
              >
                <Ionicons
                  name="logo-bitcoin"
                  size={24}
                  color={destinationType === 'CRYPTO' ? 'white' : PRIMARY_COLOR}
                />
                <Text
                  style={[
                    styles.destinationTypeText,
                    destinationType === 'CRYPTO' && styles.destinationTypeTextSelected,
                  ]}
                >
                  Crypto
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {destinationType === 'BANK_ACCOUNT' && (
            <>
              <View style={styles.section}>
                <Text style={styles.label}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                  placeholderTextColor={MUTED_TEXT_COLOR}
                />
              </View>
              <View style={styles.section}>
                <Text style={styles.label}>Bank Code (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter bank code"
                  value={bankCode}
                  onChangeText={setBankCode}
                  keyboardType="default"
                  placeholderTextColor={MUTED_TEXT_COLOR}
                />
              </View>
            </>
          )}

          {destinationType === 'MOBILE_MONEY' && (
            <View style={styles.section}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                placeholderTextColor={MUTED_TEXT_COLOR}
              />
            </View>
          )}

          {destinationType === 'CRYPTO' && (
            <View style={styles.section}>
              <Text style={styles.label}>Crypto Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter crypto wallet address"
                value={cryptoAddress}
                onChangeText={setCryptoAddress}
                keyboardType="default"
                placeholderTextColor={MUTED_TEXT_COLOR}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleWithdraw}
            disabled={
              loading ||
              !selectedWalletId ||
              !amount ||
              parseFloat(amount) <= 0 ||
              (destinationType === 'BANK_ACCOUNT' && !accountNumber) ||
              (destinationType === 'MOBILE_MONEY' && !mobileNumber) ||
              (destinationType === 'CRYPTO' && !cryptoAddress)
            }
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Withdraw</Text>
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
  destinationTypes: {
    flexDirection: 'row',
    gap: 12,
  },
  destinationTypeOption: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    gap: 8,
  },
  destinationTypeOptionSelected: {
    backgroundColor: PRIMARY_COLOR,
  },
  destinationTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  destinationTypeTextSelected: {
    color: 'white',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: TEXT_COLOR,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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

