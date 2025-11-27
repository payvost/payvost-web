import * as React from 'react';
import { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { login } from '../utils/api/user';
import { SecureStorage, DeviceSecurity } from '../utils/security';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Check device security
    const securityCheck = await DeviceSecurity.checkSecurity();
    if (!securityCheck.secure && securityCheck.warnings.length > 0) {
      Alert.alert(
        'Security Warning',
        `Your device may not be secure: ${securityCheck.warnings.join(', ')}`,
        [{ text: 'Continue Anyway' }, { text: 'Cancel', style: 'cancel' }]
      );
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await login(email, password);
      
      // Store token securely
      if (res.data.token) {
        await SecureStorage.setToken('auth_token', res.data.token);
      }
      
      // Store user ID if provided
      if (res.data.userId) {
        await SecureStorage.setToken('user_id', res.data.userId);
      }
      
      setError('');
      // Navigate to dashboard or update UI
      // navigation.navigate('Dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Payvost</Text>
      <TextInput 
        style={styles.input}
        value={email} 
        onChangeText={setEmail} 
        placeholder="Email" 
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput 
        style={styles.input}
        value={password} 
        onChangeText={setPassword} 
        placeholder="Password" 
        secureTextEntry 
      />
      <Button 
        title={loading ? "Logging in..." : "Login"} 
        onPress={handleLogin}
        disabled={loading}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  error: {
    color: '#ef4444',
    marginTop: 10,
    textAlign: 'center',
  },
});
