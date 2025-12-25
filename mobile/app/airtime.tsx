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
import {
  sendAirtimeTopup,
  getOperators,
  autoDetectOperator,
  type AirtimeTopupRequest,
} from './utils/api/payments';
import { trackUserAction } from '../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

interface Operator {
  id: string;
  name: string;
  countryCode: string;
  currency: string;
  logo?: string;
}

export default function AirtimeScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('NG'); // Default to Nigeria
  const [amount, setAmount] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const presetAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    loadOperators();
  }, [countryCode]);

  const loadOperators = async () => {
    setLoadingOperators(true);
    try {
      const data = await getOperators(countryCode);
      setOperators(data.operators || data || []);
    } catch (error: any) {
      console.error('Error loading operators:', error);
      // Continue without operators - user can still enter manually
    } finally {
      setLoadingOperators(false);
    }
  };

  const handleAutoDetect = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setDetecting(true);
    try {
      const result = await autoDetectOperator(phoneNumber, countryCode);
      if (result.operator) {
        setSelectedOperator(result.operator);
        Alert.alert('Operator Detected', `Detected: ${result.operator.name}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not detect operator');
    } finally {
      setDetecting(false);
    }
  };

  const handleTopup = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (!selectedOperator) {
      Alert.alert('Error', 'Please select an operator');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const topupData: AirtimeTopupRequest = {
        operatorId: selectedOperator.id,
        amount: parseFloat(amount),
        recipientPhone: phoneNumber,
        countryCode: countryCode,
        currency: selectedOperator.currency,
      };

      const result = await sendAirtimeTopup(topupData);
      await trackUserAction.paymentCompleted(parseFloat(amount), selectedOperator.currency, 'airtime');
      
      Alert.alert(
        'Success',
        `Airtime top-up of ${amount} ${selectedOperator.currency} sent successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send airtime top-up');
      await trackUserAction.paymentFailed(
        parseFloat(amount),
        selectedOperator.currency,
        'airtime',
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
          <Text style={styles.title}>Airtime Top-up</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneContainer}>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor={MUTED_TEXT_COLOR}
              />
              <TouchableOpacity
                style={styles.detectButton}
                onPress={handleAutoDetect}
                disabled={detecting || !phoneNumber}
              >
                {detecting ? (
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                ) : (
                  <Ionicons name="search" size={20} color={PRIMARY_COLOR} />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>We'll auto-detect the operator</Text>
          </View>

          {operators.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Select Operator</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.operatorSelector}>
                {operators.map((operator) => (
                  <TouchableOpacity
                    key={operator.id}
                    style={[
                      styles.operatorOption,
                      selectedOperator?.id === operator.id && styles.operatorOptionSelected,
                    ]}
                    onPress={() => setSelectedOperator(operator)}
                  >
                    <Text style={styles.operatorName}>{operator.name}</Text>
                    <Text style={styles.operatorCurrency}>{operator.currency}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>
                {selectedOperator?.currency || 'NGN'}
              </Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={MUTED_TEXT_COLOR}
              />
            </View>
            <View style={styles.presetAmounts}>
              {presetAmounts.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    amount === preset.toString() && styles.presetButtonSelected,
                  ]}
                  onPress={() => setAmount(preset.toString())}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      amount === preset.toString() && styles.presetButtonTextSelected,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleTopup}
            disabled={loading || !phoneNumber || !selectedOperator || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Top Up Airtime</Text>
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
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: TEXT_COLOR,
    paddingVertical: 16,
  },
  detectButton: {
    padding: 8,
  },
  hintText: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
    marginTop: 8,
  },
  operatorSelector: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  operatorOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  operatorOptionSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: '#e9f5ee',
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  operatorCurrency: {
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
    marginBottom: 12,
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
  presetAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  presetButtonSelected: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  presetButtonTextSelected: {
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
});

