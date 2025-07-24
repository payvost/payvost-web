
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './screens/DashboardScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import WalletsScreen from './screens/WalletsScreen';
import CardsScreen from './screens/CardsScreen';
import MoreScreen from './screens/MoreScreen';

const Tab = createBottomTabNavigator();

const PRIMARY_COLOR = '#16a34a'; // A nice green shade
const MUTED_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Dashboard') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Payments') {
              iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
            } else if (route.name === 'Wallets') {
                iconName = focused ? 'wallet' : 'wallet-outline';
            } else if (route.name === 'Cards') {
                iconName = focused ? 'card' : 'card-outline';
            } else if (route.name === 'More') {
              iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: PRIMARY_COLOR,
          tabBarInactiveTintColor: MUTED_COLOR,
          headerStyle: {
            backgroundColor: BACKGROUND_COLOR,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          tabBarStyle: {
            backgroundColor: BACKGROUND_COLOR,
          }
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Payments" component={PaymentsScreen} />
        <Tab.Screen name="Wallets" component={WalletsScreen} />
        <Tab.Screen name="Cards" component={CardsScreen} />
        <Tab.Screen name="More" component={MoreScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
