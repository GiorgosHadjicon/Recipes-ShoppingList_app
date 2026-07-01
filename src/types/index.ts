export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type DietaryTag = 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Dairy-Free';

export type Aisle =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'bakery'
  | 'pantry'
  | 'deli'
  | 'frozen'
  | 'beverages'
  | 'condiments';

export const AISLE_LABELS: Record<Aisle, string> = {
  produce: '🥦 Produce',
  dairy: '🧀 Dairy & Eggs',
  meat: '🥩 Meat & Poultry',
  bakery: '🍞 Bakery',
  pantry: '🫙 Pantry & Dry Goods',
  deli: '🧆 Deli',
  frozen: '🧊 Frozen',
  beverages: '🍷 Beverages',
  condiments: '🫒 Condiments & Oils',
};

export const AISLE_ORDER: Aisle[] = [
  'produce',
  'dairy',
  'meat',
  'deli',
  'bakery',
  'pantry',
  'condiments',
  'beverages',
  'frozen',
];

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  difficulty: Difficulty;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  estimatedCostEur: number;
  healthy: boolean;
  totalCalories: number;
  dietaryTags: DietaryTag[];
  possibleAdditions: string[];
  calorieReductions: string[];
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
}

export interface Product {
  id: string;
  ingredientKey: string;
  supermarketId: string;
  displayName: string;
  priceEur: number;
  priceUnit: string;
  aisle: Aisle;
}

export interface ShoppingListItem {
  ingredient: Ingredient;
  product: Product | null;
  checked: boolean;
}

export interface ShoppingListGroup {
  aisle: Aisle;
  aisleLabel: string;
  items: ShoppingListItem[];
}

export interface ShoppingList {
  recipeId: string;
  recipeTitle: string;
  supermarketId: string;
  groups: ShoppingListGroup[];
  totalEur: number;
}

export interface Supermarket {
  id: string;
  name: string;
  country: string;
  accentColor: string;
}
