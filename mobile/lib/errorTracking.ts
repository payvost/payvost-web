/**
 * Error Tracking Service
 * 
 * Tracks and reports errors to Firebase Crashlytics (via Analytics) and console.
 * For production, consider integrating Sentry or Firebase Crashlytics native module.
 */

import { trackEvent } from './analytics';

interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Track and report an error
 */
export const trackError = async (
  error: Error | string,
  context?: ErrorContext
) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  // Log to console
  console.error('❌ Error tracked:', {
    message: errorMessage,
    stack: errorStack,
    context,
  });

  // Track as analytics event (Firebase Analytics can track errors)
  await trackEvent('app_error', {
    error_message: errorMessage,
    error_stack: errorStack?.substring(0, 500), // Limit stack trace length
    screen: context?.screen,
    action: context?.action,
    user_id: context?.userId,
    ...context?.additionalData,
  });

  // In production, you would also send to:
  // - Sentry
  // - Firebase Crashlytics (requires native module)
  // - Custom error reporting service
};

/**
 * Track unhandled promise rejections
 */
export const setupErrorTracking = () => {
  // Track unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      trackError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        {
          action: 'unhandled_promise_rejection',
        }
      );
    });

    // Track global errors
    window.addEventListener('error', (event) => {
      trackError(event.error || new Error(event.message), {
        action: 'global_error',
      });
    });
  }
};

/**
 * Wrapper for async functions to automatically track errors
 */
export const withErrorTracking = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      await trackError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw error;
    }
  }) as T;
};

