import { NavigatorScreenParams } from '@react-navigation/native';
import type { Ingredient } from '../types';

export type RecipesStackParamList = {
  RecipeBrowse: undefined;
  RecipeDetail: { recipeId: string };
  AddRecipe: undefined;
};

export type TabParamList = {
  RecipesTab: NavigatorScreenParams<RecipesStackParamList>;
  PlannerTab: undefined;
  ShoppingListTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  SupermarketSelector: { recipeId: string; ingredients?: Ingredient[] } | { recipeIds: string[] };
  AuthScreen: undefined;
};
