import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createWallet, type CreateWalletRequest } from '../app/utils/api/wallet';
import { trackUserAction } from '../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';

interface CreateWalletModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
];

export default function CreateWalletModal({ visible, onClose, onSuccess }: CreateWalletModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [walletType, setWalletType] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!selectedCurrency) {
      Alert.alert('Error', 'Please select a currency');
      return;
    }

    setLoading(true);
    try {
      const data: CreateWalletRequest = {
        currency: selectedCurrency,
        type: walletType,
      };

      await createWallet(data);
      await trackUserAction.walletCreated(selectedCurrency);
      Alert.alert('Success', 'Wallet created successfully!');
      onSuccess();
      onClose();
      setSelectedCurrency('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Create New Wallet</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={TEXT_COLOR} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.label}>Select Currency</Text>
            <View style={styles.currencyGrid}>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyOption,
                    selectedCurrency === currency.code && styles.currencyOptionSelected,
                  ]}
                  onPress={() => setSelectedCurrency(currency.code)}
                >
                  <Text style={styles.currencyFlag}>{currency.flag}</Text>
                  <Text style={styles.currencyCode}>{currency.code}</Text>
                  <Text style={styles.currencyName}>{currency.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Wallet Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeOption, walletType === 'PERSONAL' && styles.typeOptionSelected]}
                onPress={() => setWalletType('PERSONAL')}
              >
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={walletType === 'PERSONAL' ? 'white' : PRIMARY_COLOR}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    walletType === 'PERSONAL' && styles.typeOptionTextSelected,
                  ]}
                >
                  Personal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, walletType === 'BUSINESS' && styles.typeOptionSelected]}
                onPress={() => setWalletType('BUSINESS')}
              >
                <Ionicons
                  name="business-outline"
                  size={24}
                  color={walletType === 'BUSINESS' ? 'white' : PRIMARY_COLOR}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    walletType === 'BUSINESS' && styles.typeOptionTextSelected,
                  ]}
                >
                  Business
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.createButton, !selectedCurrency && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={loading || !selectedCurrency}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createButtonText}>Create Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 12,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  currencyOption: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  currencyOptionSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: '#e9f5ee',
  },
  currencyFlag: {
    fontSize: 32,
    marginBottom: 4,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  currencyName: {
    fontSize: 10,
    color: MUTED_TEXT_COLOR,
    textAlign: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    gap: 8,
  },
  typeOptionSelected: {
    backgroundColor: PRIMARY_COLOR,
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  typeOptionTextSelected: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  createButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

