import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShoppingListProvider } from './src/context/ShoppingListContext';
import type { RootStackParamList, TabParamList, RecipesStackParamList } from './src/navigation/types';
import { RecipeBrowseScreen } from './src/screens/RecipeBrowseScreen';
import { RecipeDetailScreen } from './src/screens/RecipeDetailScreen';
import { ShoppingListScreen } from './src/screens/ShoppingListScreen';
import { SupermarketSelectorModal } from './src/screens/SupermarketSelectorModal';
import { WeeklyPlannerScreen } from './src/screens/WeeklyPlannerScreen';
import { colors } from './src/theme';

const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Root = createNativeStackNavigator<RootStackParamList>();

function RecipesNavigator() {
  return (
    <RecipesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <RecipesStack.Screen name="RecipeBrowse" component={RecipeBrowseScreen} options={{ headerShown: false }} />
      <RecipesStack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Recipe' }} />
    </RecipesStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="RecipesTab"
        component={RecipesNavigator}
        options={{
          tabBarLabel: 'Recipes',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🍳</Text>,
        }}
      />
      <Tab.Screen
        name="PlannerTab"
        component={WeeklyPlannerScreen}
        options={{
          tabBarLabel: 'Planner',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="ShoppingListTab"
        component={ShoppingListScreen}
        options={{
          tabBarLabel: 'My List',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛒</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ShoppingListProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Root.Navigator screenOptions={{ headerShown: false }}>
            <Root.Screen name="MainTabs" component={MainTabs} />
            <Root.Screen
              name="SupermarketSelector"
              component={SupermarketSelectorModal}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Root.Navigator>
        </NavigationContainer>
      </ShoppingListProvider>
    </SafeAreaProvider>
  );
}
