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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ShoppingListProvider } from './src/context/ShoppingListContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import type {
  CommunityStackParamList,
  RecipesStackParamList,
  RootStackParamList,
  TabParamList,
} from './src/navigation/types';
import { AddRecipeScreen } from './src/screens/AddRecipeScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ChatListScreen } from './src/screens/ChatListScreen';
import { ChatThreadScreen } from './src/screens/ChatThreadScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { RecipeBrowseScreen } from './src/screens/RecipeBrowseScreen';
import { RecipeDetailScreen } from './src/screens/RecipeDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ShoppingListScreen } from './src/screens/ShoppingListScreen';
import { ShareToChatModal } from './src/screens/ShareToChatModal';
import { SupermarketSelectorModal } from './src/screens/SupermarketSelectorModal';
import { WeeklyPlannerScreen } from './src/screens/WeeklyPlannerScreen';

const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const CommunityStack = createNativeStackNavigator<CommunityStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Root = createNativeStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = 'has-onboarded';

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
      <RecipesStack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ headerShown: false }} />
      <RecipesStack.Screen name="AddRecipe" component={AddRecipeScreen} options={{ title: 'Add Recipe' }} />
    </RecipesStack.Navigator>
  );
}

function CommunityNavigator() {
  const { colors } = useTheme();
  return (
    <CommunityStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <CommunityStack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
      <CommunityStack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats' }} />
      <CommunityStack.Screen name="ChatThread" component={ChatThreadScreen} options={{ headerShown: false }} />
      <CommunityStack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ headerShown: false }} />
    </CommunityStack.Navigator>
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
        name="CommunityTab"
        component={CommunityNavigator}
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🌍</Text>,
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

function RootNavigator({ initialRoute }: { initialRoute: 'Onboarding' | 'MainTabs' }) {
  const { scheme } = useTheme();
  return (
    <NavigationContainer>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Root.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Root.Screen name="Onboarding">
          {() => <OnboardingScreen onDone={() => AsyncStorage.setItem(ONBOARDING_KEY, 'true')} />}
        </Root.Screen>
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
        <Root.Screen
          name="ShareToChat"
          component={ShareToChatModal}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
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
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'MainTabs' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => setInitialRoute(v === 'true' ? 'MainTabs' : 'Onboarding'));
  }, []);

  useEffect(() => {
    if (fontsLoaded && initialRoute) SplashScreen.hideAsync();
  }, [fontsLoaded, initialRoute]);

  if (!fontsLoaded || !initialRoute) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ShoppingListProvider>
            <RootNavigator initialRoute={initialRoute} />
          </ShoppingListProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
