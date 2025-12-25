/**
 * Analytics Service
 * 
 * Wrapper around Firebase Analytics for tracking user events and app usage.
 */

import { analytics } from './firebase';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';

interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
}

/**
 * Log a custom event to Firebase Analytics
 */
export const trackEvent = async (eventName: string, parameters?: Record<string, any>) => {
  try {
    if (analytics) {
      await logEvent(analytics, eventName, parameters);
      console.log(`📊 Analytics: ${eventName}`, parameters);
    } else {
      // Fallback for platforms where analytics is not supported
      console.log(`[Analytics] ${eventName}`, parameters);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

/**
 * Set the user ID for analytics
 */
export const setAnalyticsUserId = async (userId: string) => {
  try {
    if (analytics) {
      await setUserId(analytics, userId);
      console.log(`📊 Analytics: User ID set to ${userId}`);
    }
  } catch (error) {
    console.error('Error setting analytics user ID:', error);
  }
};

/**
 * Set user properties for analytics
 */
export const setAnalyticsUserProperties = async (properties: Record<string, any>) => {
  try {
    if (analytics) {
      await setUserProperties(analytics, properties);
      console.log(`📊 Analytics: User properties set`, properties);
    }
  } catch (error) {
    console.error('Error setting analytics user properties:', error);
  }
};

/**
 * Track screen views
 */
export const trackScreenView = async (screenName: string, screenClass?: string) => {
  await trackEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
};

/**
 * Track user actions
 */
export const trackUserAction = {
  login: (method: string = 'email') => trackEvent('login', { method }),
  signup: (method: string = 'email') => trackEvent('sign_up', { method }),
  logout: () => trackEvent('logout'),
  
  // Payment events
  paymentInitiated: (amount: number, currency: string, type: string) =>
    trackEvent('payment_initiated', { amount, currency, payment_type: type }),
  paymentCompleted: (amount: number, currency: string, type: string) =>
    trackEvent('payment_completed', { amount, currency, payment_type: type }),
  paymentFailed: (amount: number, currency: string, type: string, reason?: string) =>
    trackEvent('payment_failed', { amount, currency, payment_type: type, reason }),
  
  // Wallet events
  walletCreated: (currency: string) =>
    trackEvent('wallet_created', { currency }),
  walletFunded: (amount: number, currency: string) =>
    trackEvent('wallet_funded', { amount, currency }),
  walletWithdrawn: (amount: number, currency: string) =>
    trackEvent('wallet_withdrawn', { amount, currency }),
  
  // Card events
  cardCreated: (cardType: string) =>
    trackEvent('card_created', { card_type: cardType }),
  
  // Navigation events
  screenOpened: (screenName: string) =>
    trackEvent('screen_opened', { screen_name: screenName }),
};

