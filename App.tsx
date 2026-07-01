import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ShoppingListProvider } from './src/context/ShoppingListContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import type { RootStackParamList, TabParamList, RecipesStackParamList } from './src/navigation/types';
import { AddRecipeScreen } from './src/screens/AddRecipeScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { RecipeBrowseScreen } from './src/screens/RecipeBrowseScreen';
import { RecipeDetailScreen } from './src/screens/RecipeDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ShoppingListScreen } from './src/screens/ShoppingListScreen';
import { SupermarketSelectorModal } from './src/screens/SupermarketSelectorModal';
import { WeeklyPlannerScreen } from './src/screens/WeeklyPlannerScreen';

const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Root = createNativeStackNavigator<RootStackParamList>();

function RecipesNavigator() {
  const { colors } = useTheme();
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
      <RecipesStack.Screen name="AddRecipe" component={AddRecipeScreen} options={{ title: 'Add Recipe' }} />
    </RecipesStack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();
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
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { scheme } = useTheme();
  return (
    <NavigationContainer>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Root.Navigator screenOptions={{ headerShown: false }}>
        <Root.Screen name="MainTabs" component={MainTabs} />
        <Root.Screen
          name="SupermarketSelector"
          component={SupermarketSelectorModal}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Root.Screen
          name="AuthScreen"
          component={AuthScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Root.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ShoppingListProvider>
            <RootNavigator />
          </ShoppingListProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
