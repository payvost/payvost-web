import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from './utils/api/notifications';
import { trackScreenView } from '../lib/analytics';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

interface NotificationPreferences {
  push?: boolean;
  email?: boolean;
  sms?: boolean;
  transactionAlerts?: boolean;
  marketing?: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push: true,
    email: true,
    sms: false,
    transactionAlerts: true,
    marketing: false,
  });

  useEffect(() => {
    loadPreferences();
    trackScreenView('Settings');
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await getNotificationPreferences();
      if (data.preferences) {
        setPreferences(data.preferences);
      } else if (data.push !== undefined || data.email !== undefined) {
        // Handle case where preferences are returned directly
        setPreferences(data);
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      // Continue with defaults
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);

    setSaving(true);
    try {
      await updateNotificationPreferences(newPreferences);
    } catch (error: any) {
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', error.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const settingItems = [
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      icon: 'notifications-outline',
      value: preferences.push,
    },
    {
      id: 'email',
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: 'mail-outline',
      value: preferences.email,
    },
    {
      id: 'sms',
      title: 'SMS Notifications',
      description: 'Receive notifications via SMS',
      icon: 'chatbubble-outline',
      value: preferences.sms,
    },
    {
      id: 'transactionAlerts',
      title: 'Transaction Alerts',
      description: 'Get notified about transaction updates',
      icon: 'receipt-outline',
      value: preferences.transactionAlerts,
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive promotional offers and updates',
      icon: 'megaphone-outline',
      value: preferences.marketing,
    },
  ] as const;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TEXT_COLOR} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          {settingItems.map((item) => (
            <View key={item.id} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${PRIMARY_COLOR}15` }]}>
                  <Ionicons name={item.icon} size={24} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={item.value || false}
                onValueChange={() => handleToggle(item.id as keyof NotificationPreferences)}
                trackColor={{ false: '#e5e7eb', true: PRIMARY_COLOR }}
                thumbColor="white"
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={24} color={PRIMARY_COLOR} />
            <Text style={styles.menuItemText}>Change Password</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={MUTED_TEXT_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="finger-print-outline" size={24} color={PRIMARY_COLOR} />
            <Text style={styles.menuItemText}>Biometric Authentication</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={MUTED_TEXT_COLOR} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build Number</Text>
            <Text style={styles.infoValue}>1</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
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
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: TEXT_COLOR,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 16,
    color: TEXT_COLOR,
  },
  infoValue: {
    fontSize: 16,
    color: MUTED_TEXT_COLOR,
    fontWeight: '500',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: MUTED_TEXT_COLOR,
    fontSize: 14,
  },
});

