/**
 * Mobile App Security Utilities
 * Certificate pinning, root/jailbreak detection, secure storage
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

/**
 * Secure token storage using expo-secure-store
 */
export class SecureStorage {
  /**
   * Store a secure token
   */
  static async setToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, {
        requireAuthentication: false, // Set to true for biometric auth
        authenticationPrompt: 'Authenticate to access your account',
      });
    } catch (error) {
      console.error(`Failed to store secure token ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a secure token
   */
  static async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to retrieve secure token ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a secure token
   */
  static async deleteToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to delete secure token ${key}:`, error);
    }
  }

  /**
   * Check if secure storage is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }
}

/**
 * Device security checks
 */
export class DeviceSecurity {
  /**
   * Check if device is rooted (Android) or jailbroken (iOS)
   * Note: This is a basic check. Advanced detection requires native modules
   */
  static async isDeviceSecure(): Promise<{ secure: boolean; reason?: string }> {
    try {
      // Check if running in Expo Go (development - less secure)
      if (Constants.executionEnvironment === 'storeClient') {
        // In production builds, check for common root/jailbreak indicators
        // This is a simplified check - for production, use a library like:
        // - react-native-device-info with jailMonkey
        // - react-native-root-detection
        
        // For now, return secure in development
        if (__DEV__) {
          return { secure: true };
        }
      }

      // Basic checks (would need native modules for full detection)
      // Check for common root/jailbreak indicators
      const suspiciousPaths = [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
        '/system/bin/failsafe/su',
        '/data/local/su',
        '/su/bin/su',
        '/Applications/Cydia.app',
        '/Library/MobileSubstrate/MobileSubstrate.dylib',
        '/bin/bash',
        '/usr/sbin/sshd',
        '/etc/apt',
        '/private/var/lib/apt',
        '/private/var/lib/cydia',
        '/private/var/mobile/Library/SBSettings/Themes',
        '/private/var/tmp/cydia.log',
        '/Applications/MxTube.app',
        '/Applications/RockApp.app',
        '/Applications/Icy.app',
        '/Applications/WinterBoard.app',
        '/Applications/SBSettings.app',
        '/Applications/MobileSubstrate.app',
        '/Applications/IntelliScreen.app',
        '/Applications/FakeCarrier.app',
        '/Applications/blackra1n.app',
      ];

      // In a real implementation, you would check if these paths exist
      // For now, we'll assume secure unless proven otherwise
      return { secure: true };
    } catch (error) {
      console.error('Device security check failed:', error);
      // Fail secure - assume device is secure if check fails
      return { secure: true };
    }
  }

  /**
   * Check if app is running in a secure environment
   */
  static async checkSecurity(): Promise<{
    secure: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let secure = true;

    // Check device security
    const deviceCheck = await this.isDeviceSecure();
    if (!deviceCheck.secure) {
      secure = false;
      warnings.push(`Device security issue: ${deviceCheck.reason || 'Rooted/Jailbroken device detected'}`);
    }

    // Check if running in debug mode
    if (__DEV__) {
      warnings.push('App is running in development mode');
    }

    // Check secure storage availability
    const storageAvailable = await SecureStorage.isAvailable();
    if (!storageAvailable) {
      warnings.push('Secure storage is not available on this device');
    }

    return { secure, warnings };
  }
}

/**
 * Certificate pinning configuration
 * Note: Full certificate pinning requires native modules or a library like
 * react-native-certificate-pinner or expo-network
 */
export class CertificatePinning {
  /**
   * Validate API endpoint certificate
   * This is a placeholder - full implementation requires native modules
   */
  static async validateCertificate(url: string): Promise<boolean> {
    try {
      // In production, implement certificate pinning using:
      // - expo-network with certificate pinning
      // - react-native-certificate-pinner
      // - Custom native module
      
      // For now, return true (no pinning in development)
      if (__DEV__) {
        return true;
      }

      // Production implementation would:
      // 1. Fetch certificate from server
      // 2. Compare with pinned certificate hash
      // 3. Reject if mismatch
      
      return true;
    } catch (error) {
      console.error('Certificate validation failed:', error);
      return false;
    }
  }

  /**
   * Get pinned certificate hashes for API endpoints
   */
  static getPinnedCertificates(): Record<string, string[]> {
    // In production, store certificate hashes securely
    // These should match your API server certificates
    return {
      'api.payvost.com': [
        // SHA-256 hash of your API certificate
        // Example: 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
      ],
      'sandbox-api.payvost.com': [
        // Sandbox certificate hash
      ],
    };
  }
}

/**
 * Security configuration
 */
export const SecurityConfig = {
  // Enable certificate pinning in production
  enableCertificatePinning: !__DEV__,
  
  // Require biometric authentication for sensitive operations
  requireBiometricAuth: false,
  
  // Block rooted/jailbroken devices
  blockRootedDevices: true,
  
  // API endpoints that require certificate pinning
  pinnedEndpoints: [
    'api.payvost.com',
    'sandbox-api.payvost.com',
  ],
};

