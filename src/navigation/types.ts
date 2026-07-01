import { NavigatorScreenParams } from '@react-navigation/native';

export type RecipesStackParamList = {
  RecipeBrowse: undefined;
  RecipeDetail: { recipeId: string };
};

export type TabParamList = {
  RecipesTab: NavigatorScreenParams<RecipesStackParamList>;
  PlannerTab: undefined;
  ShoppingListTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  SupermarketSelector: { recipeId: string } | { recipeIds: string[] };
};
