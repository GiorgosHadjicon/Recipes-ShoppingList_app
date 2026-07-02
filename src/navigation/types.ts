import { NavigatorScreenParams } from '@react-navigation/native';
import type { Ingredient } from '../types';

export type RecipesStackParamList = {
  RecipeBrowse: undefined;
  RecipeDetail: { recipeId: string };
  AddRecipe: undefined;
};

export type CommunityStackParamList = {
  Feed: undefined;
  ChatList: undefined;
  ChatThread: { chatId: string; chatName: string };
  RecipeDetail: { recipeId: string };
};

export type TabParamList = {
  RecipesTab: NavigatorScreenParams<RecipesStackParamList>;
  CommunityTab: NavigatorScreenParams<CommunityStackParamList>;
  PlannerTab: undefined;
  ShoppingListTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  SupermarketSelector: { recipeId: string; ingredients?: Ingredient[] } | { recipeIds: string[] };
  AuthScreen: undefined;
  ShareToChat: { recipeId: string };
};
