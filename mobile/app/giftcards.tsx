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
import { purchaseGiftCard, getGiftCardProducts, type GiftCardRequest } from './utils/api/payments';
import { trackUserAction } from '../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

interface GiftCardProduct {
  id: string;
  productName: string;
  countryCode: string;
  currency: string;
  minAmount?: number;
  maxAmount?: number;
  logo?: string;
}

export default function GiftCardsScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState<string>('NG');
  const [selectedProduct, setSelectedProduct] = useState<GiftCardProduct | null>(null);
  const [products, setProducts] = useState<GiftCardProduct[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [countryCode]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await getGiftCardProducts(countryCode);
      setProducts(data.products || data || []);
    } catch (error: any) {
      console.error('Error loading gift card products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a gift card product');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (selectedProduct.minAmount && amountNum < selectedProduct.minAmount) {
      Alert.alert('Error', `Minimum amount is ${selectedProduct.minAmount} ${selectedProduct.currency}`);
      return;
    }
    if (selectedProduct.maxAmount && amountNum > selectedProduct.maxAmount) {
      Alert.alert('Error', `Maximum amount is ${selectedProduct.maxAmount} ${selectedProduct.currency}`);
      return;
    }

    setLoading(true);
    try {
      const giftCardData: GiftCardRequest = {
        productId: selectedProduct.id,
        amount: amountNum,
        countryCode: countryCode,
        currency: selectedProduct.currency,
        recipientEmail: recipientEmail || undefined,
      };

      const result = await purchaseGiftCard(giftCardData);
      await trackUserAction.paymentCompleted(amountNum, selectedProduct.currency, 'giftcard');
      
      Alert.alert(
        'Success',
        `Gift card purchased successfully!${result.redemptionCode ? `\n\nRedemption Code: ${result.redemptionCode}` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to purchase gift card');
      await trackUserAction.paymentFailed(
        amountNum,
        selectedProduct.currency,
        'giftcard',
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
          <Text style={styles.title}>Gift Cards</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Select Gift Card</Text>
            {loadingProducts ? (
              <ActivityIndicator size="small" color={PRIMARY_COLOR} style={styles.loader} />
            ) : products.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productSelector}>
                {products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productOption,
                      selectedProduct?.id === product.id && styles.productOptionSelected,
                    ]}
                    onPress={() => setSelectedProduct(product)}
                  >
                    <Ionicons name="gift-outline" size={32} color={PRIMARY_COLOR} />
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.productName}
                    </Text>
                    <Text style={styles.productCurrency}>{product.currency}</Text>
                    {product.minAmount && product.maxAmount && (
                      <Text style={styles.productRange}>
                        {product.minAmount} - {product.maxAmount}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.hintText}>No gift card products available</Text>
            )}
          </View>

          {selectedProduct && (
            <>
              <View style={styles.section}>
                <Text style={styles.label}>Amount</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>{selectedProduct.currency}</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholderTextColor={MUTED_TEXT_COLOR}
                  />
                </View>
                {selectedProduct.minAmount && selectedProduct.maxAmount && (
                  <Text style={styles.hintText}>
                    Range: {selectedProduct.minAmount} - {selectedProduct.maxAmount} {selectedProduct.currency}
                  </Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Recipient Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={MUTED_TEXT_COLOR}
                />
                <Text style={styles.hintText}>
                  Leave empty to receive the gift card code yourself
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.submitButton, (loading || !selectedProduct) && styles.submitButtonDisabled]}
            onPress={handlePurchase}
            disabled={loading || !selectedProduct || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Purchase Gift Card</Text>
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
  productSelector: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  productOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  productOptionSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: '#e9f5ee',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginTop: 8,
    textAlign: 'center',
  },
  productCurrency: {
    fontSize: 12,
    color: MUTED_TEXT_COLOR,
    marginTop: 4,
  },
  productRange: {
    fontSize: 10,
    color: MUTED_TEXT_COLOR,
    marginTop: 4,
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
  hintText: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
    marginTop: 8,
  },
});

