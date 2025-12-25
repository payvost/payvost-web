/**
 * Expo App Configuration
 * 
 * SECURITY: Firebase configuration MUST come from environment variables.
 * Set these in your .env file or Expo environment configuration.
 * 
 * Required environment variables:
 * - EXPO_PUBLIC_FIREBASE_API_KEY
 * - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - EXPO_PUBLIC_FIREBASE_PROJECT_ID
 * - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - EXPO_PUBLIC_FIREBASE_APP_ID
 * - EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
 */

// Validate required environment variables
const requiredEnvVars = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for missing required variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
    'Please set these in your .env file or Expo environment configuration.'
  );
}

export default {
  expo: {
    name: 'mobile',
    slug: 'payvost-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mobile',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.payvost.payvost',
      buildNumber: '1',
      infoPlist: {
        NSUserTrackingUsageDescription: 'This app uses tracking to improve your experience.',
        NSCameraUsageDescription: 'This app needs access to your camera for KYC verification.',
        NSPhotoLibraryUsageDescription: 'This app needs access to your photo library for KYC verification.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.payvost.payvost',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
      config: {
        firebase: {
          apiKey: requiredEnvVars.apiKey,
          authDomain: requiredEnvVars.authDomain,
          databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL,
          projectId: requiredEnvVars.projectId,
          storageBucket: requiredEnvVars.storageBucket,
          messagingSenderId: requiredEnvVars.messagingSenderId,
          appId: requiredEnvVars.appId,
          measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        },
      },
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/notification-icon.png',
          color: '#16a34a',
          mode: 'production',
        },
      ],
    ],
    notification: {
      icon: './assets/images/notification-icon.png',
      color: '#16a34a',
      iosDisplayInForeground: true,
      androidMode: 'default',
      androidCollapsedTitle: '#{unread_notifications} new notifications',
    },
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '74a3ef3a-a7e6-4249-8999-f1fb83725409',
      },
    },
  },
};