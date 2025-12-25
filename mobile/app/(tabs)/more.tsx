import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';

const PRIMARY_COLOR = '#16a34a';
const TEXT_COLOR = '#1a1a1a';
const MUTED_TEXT_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/LoginScreen');
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      color: PRIMARY_COLOR,
      onPress: () => {
        // TODO: Navigate to profile
        console.log('Profile');
      },
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      icon: 'receipt-outline',
      color: '#3b82f6',
      onPress: () => {
        // TODO: Navigate to transactions
        console.log('Transactions');
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      color: '#8b5cf6',
      onPress: () => {
        // TODO: Navigate to settings
        console.log('Settings');
      },
    },
    {
      id: 'support',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      color: '#f59e0b',
      onPress: () => {
        // TODO: Navigate to support
        console.log('Support');
      },
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      color: '#14b8a6',
      onPress: () => {
        // TODO: Navigate to about
        console.log('About');
      },
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={PRIMARY_COLOR} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.name || user?.displayName || 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={MUTED_TEXT_COLOR} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Version 1.0.0</Text>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e9f5ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: MUTED_TEXT_COLOR,
  },
  menuContainer: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: TEXT_COLOR,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    color: MUTED_TEXT_COLOR,
  },
});

