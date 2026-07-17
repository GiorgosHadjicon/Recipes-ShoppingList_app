import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { Newsreader_400Regular, Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShoppingListProvider } from './src/context/ShoppingListContext';
import { lightColors } from './src/theme';
import type { RecipesStackParamList, RootStackParamList, TabParamList } from './src/navigation/types';
import { RecipeBrowseScreen } from './src/screens/RecipeBrowseScreen';
import { RecipeDetailScreen } from './src/screens/RecipeDetailScreen';
import { ShoppingListScreen } from './src/screens/ShoppingListScreen';

const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Root = createNativeStackNavigator<RootStackParamList>();

function RecipesNavigator() {
  return (
    <RecipesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: lightColors.background },
        headerTintColor: lightColors.primary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: lightColors.background },
      }}
    >
      <RecipesStack.Screen name="RecipeBrowse" component={RecipeBrowseScreen} options={{ headerShown: false }} />
      <RecipesStack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ headerShown: false }} />
    </RecipesStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: lightColors.primary,
        tabBarInactiveTintColor: lightColors.textMuted,
        tabBarStyle: {
          backgroundColor: lightColors.card,
          borderTopColor: lightColors.border,
        },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="RecipesTab"
        component={RecipesNavigator}
        options={{
          tabBarLabel: 'Browse',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🍳</Text>,
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

function RootNavigator() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Root.Navigator screenOptions={{ headerShown: false }}>
        <Root.Screen name="MainTabs" component={MainTabs} />
      </Root.Navigator>
    </NavigationContainer>
  );
}

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ShoppingListProvider>
        <RootNavigator />
      </ShoppingListProvider>
    </SafeAreaProvider>
  );
}
