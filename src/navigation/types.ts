import { NavigatorScreenParams } from '@react-navigation/native';

export type RecipesStackParamList = {
  RecipeBrowse: undefined;
  RecipeDetail: { recipeId: string };
};

export type TabParamList = {
  RecipesTab: NavigatorScreenParams<RecipesStackParamList>;
  ShoppingListTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
};
