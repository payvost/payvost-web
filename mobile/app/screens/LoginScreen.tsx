import * as React from 'react';
import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { login } from '../utils/api/user';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await login(email, password);
      await SecureStore.setItemAsync('jwt', res.data.token);
      setError('');
      // navigate or update UI
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
