import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { setupErrorTracking } from '../lib/errorTracking';
import { setupNotificationListeners, initializePushNotifications } from '../lib/notifications';
import '../lib/firebase'; // Initialize Firebase
import LoginScreen from './auth/LoginScreen';

const PRIMARY_COLOR = '#16a34a';

function RootLayoutNav() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize push notifications when user is authenticated
      initializePushNotifications();

      // Set up notification listeners
      const listeners = setupNotificationListeners(
        // Notification received
        (notification) => {
          console.log('Notification received:', notification);
        },
        // Notification tapped
        (response) => {
          const data = response.notification.request.content.data;
          // Handle deep linking based on notification data
          if (data?.screen) {
            router.push(data.screen as any);
          } else if (data?.type === 'payment') {
            router.push('/payments');
          } else if (data?.type === 'transaction') {
            router.push('/wallets');
          }
        }
      );

      notificationListener.current = listeners;

      return () => {
        listeners.remove();
      };
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/LoginScreen" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Set up global error tracking
    setupErrorTracking();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
