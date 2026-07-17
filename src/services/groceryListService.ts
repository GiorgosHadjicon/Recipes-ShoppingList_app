import { AISLE_LABELS, AISLE_ORDER, type Ingredient, type ShoppingList, type ShoppingListGroup, type ShoppingListItem } from '../types';
import { getRecipeById } from './recipeService';
import { matchIngredientToProduct } from './productService';

async function toShoppingListItems(ingredients: Ingredient[]): Promise<ShoppingListItem[]> {
  return Promise.all(
    ingredients.map(async (ingredient): Promise<ShoppingListItem> => ({
      ingredient,
      product: await matchIngredientToProduct(ingredient.name),
      checked: false,
    })),
  );
}

function groupByAisle(items: ShoppingListItem[]): ShoppingListGroup[] {
  const grouped = new Map<string, ShoppingListItem[]>();
  for (const item of items) {
    const aisle = item.product?.aisle ?? 'pantry';
    if (!grouped.has(aisle)) grouped.set(aisle, []);
    grouped.get(aisle)!.push(item);
  }
  return AISLE_ORDER.filter((a) => grouped.has(a)).map((aisle) => ({
    aisle,
    aisleLabel: AISLE_LABELS[aisle],
    items: grouped.get(aisle)!,
  }));
}

function sumEur(items: ShoppingListItem[]): number {
  return items.reduce((sum, item) => sum + (item.product?.priceEur ?? 0), 0);
}

export async function buildShoppingList(recipeId: string): Promise<ShoppingList | null> {
  const recipe = await getRecipeById(recipeId);
  if (!recipe) return null;

  const items = await toShoppingListItems(recipe.ingredients);

  return {
    recipeId,
    recipeTitle: recipe.title,
    groups: groupByAisle(items),
    totalEur: sumEur(items),
  };
}
