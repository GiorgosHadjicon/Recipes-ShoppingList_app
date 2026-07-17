export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type DietaryTag = 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Dairy-Free';

export type Aisle = 'produce' | 'dairy' | 'meat' | 'bakery' | 'pantry' | 'herbs' | 'frozen';

export const AISLE_LABELS: Record<Aisle, string> = {
  produce: 'Fresh Produce',
  dairy: 'Dairy & Eggs',
  meat: 'Meat & Fish',
  bakery: 'Bakery',
  pantry: 'Pantry & Dry Goods',
  herbs: 'Herbs & Spices',
  frozen: 'Frozen',
};

export const AISLE_ORDER: Aisle[] = ['produce', 'dairy', 'meat', 'bakery', 'pantry', 'herbs', 'frozen'];

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
  difficulty: DifficultyLevel;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  estimatedCostEur: number;
  dietaryTags: DietaryTag[];
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
}

export interface Product {
  id: string;
  ingredientKey: string;
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
  groups: ShoppingListGroup[];
  totalEur: number;
}
