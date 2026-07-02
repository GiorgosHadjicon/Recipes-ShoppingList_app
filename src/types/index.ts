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
  totalCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  dietaryTags: DietaryTag[];
  possibleAdditions: string[];
  calorieReductions: string[];
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  authorId?: string; // present only for community recipes, absent for the bundled ones
  authorName?: string;
  createdAt?: string; // ISO timestamp — present only for community recipes
}

export interface Product {
  id: string;
  ingredientKey: string;
  supermarketId: string;
  displayName: string;
  priceEur: number;
  priceUnit: string;
  aisle: Aisle;
  estimated?: boolean; // true when priceEur is a fallback average, not a real price at this store
  packageQuantity?: number; // how much one package/unit of priceEur actually buys, e.g. 1000 for "per kg"
  packageUnit?: string; // unit packageQuantity is expressed in — must resolve via nutrition.json for the same ingredient
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
  supermarketName: string;
  groups: ShoppingListGroup[];
  totalEur: number;
}

export interface Supermarket {
  id: string;
  name: string;
  country: string;
  accentColor: string;
}
