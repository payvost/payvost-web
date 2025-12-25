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
import { payBill, getBillers, type BillPaymentRequest } from './utils/api/payments';
import { trackUserAction } from '../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

interface Biller {
  id: string;
  name: string;
  countryCode: string;
  currency: string;
  category?: string;
  logo?: string;
}

export default function BillsScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState<string>('NG');
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [billers, setBillers] = useState<Biller[]>([]);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingBillers, setLoadingBillers] = useState(false);

  useEffect(() => {
    loadBillers();
  }, [countryCode]);

  const loadBillers = async () => {
    setLoadingBillers(true);
    try {
      const data = await getBillers(countryCode);
      setBillers(data.billers || data || []);
    } catch (error: any) {
      console.error('Error loading billers:', error);
    } finally {
      setLoadingBillers(false);
    }
  };

  const handlePayBill = async () => {
    if (!selectedBiller) {
      Alert.alert('Error', 'Please select a biller');
      return;
    }

    if (!accountNumber) {
      Alert.alert('Error', 'Please enter your account number');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const billData: BillPaymentRequest = {
        billerId: selectedBiller.id,
        amount: parseFloat(amount),
        accountNumber: accountNumber,
        countryCode: countryCode,
        currency: selectedBiller.currency,
      };

      const result = await payBill(billData);
      await trackUserAction.paymentCompleted(parseFloat(amount), selectedBiller.currency, 'bill');
      
      Alert.alert(
        'Success',
        `Bill payment of ${amount} ${selectedBiller.currency} completed successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pay bill');
      await trackUserAction.paymentFailed(
        parseFloat(amount),
        selectedBiller.currency,
        'bill',
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>Pay Bills</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Select Biller</Text>
            {loadingBillers ? (
              <ActivityIndicator size="small" color={PRIMARY_COLOR} style={styles.loader} />
            ) : billers.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.billerSelector}>
                {billers.map((biller) => (
                  <TouchableOpacity
                    key={biller.id}
                    style={[
                      styles.billerOption,
                      selectedBiller?.id === biller.id && styles.billerOptionSelected,
                    ]}
                    onPress={() => setSelectedBiller(biller)}
                  >
                    <Ionicons name="receipt-outline" size={32} color={PRIMARY_COLOR} />
                    <Text style={styles.billerName} numberOfLines={2}>
                      {biller.name}
                    </Text>
                    {biller.category && (
                      <Text style={styles.billerCategory}>{biller.category}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.hintText}>No billers available for this country</Text>
            )}
          </View>

          {selectedBiller && (
            <>
              <View style={styles.section}>
                <Text style={styles.label}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your account number"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="default"
                  placeholderTextColor={MUTED_TEXT_COLOR}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Amount</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>{selectedBiller.currency}</Text>
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
            </>
          )}

          <TouchableOpacity
            style={[styles.submitButton, (loading || !selectedBiller) && styles.submitButtonDisabled]}
            onPress={handlePayBill}
            disabled={loading || !selectedBiller || !accountNumber || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Pay Bill</Text>
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
  loader: {
    marginVertical: 20,
  },
  billerSelector: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  billerOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  billerOptionSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: '#e9f5ee',
  },
  billerName: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginTop: 8,
    textAlign: 'center',
  },
  billerCategory: {
    fontSize: 12,
    color: MUTED_TEXT_COLOR,
    marginTop: 4,
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
  },
});

