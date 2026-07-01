import { AISLE_LABELS, AISLE_ORDER, type Ingredient, type ShoppingList, type ShoppingListGroup, type ShoppingListItem } from '../types';
import { getRecipeById } from './recipeService';
import { matchIngredientToProduct } from './productService';

async function toShoppingListItems(
  ingredients: Ingredient[],
  supermarketId: string,
): Promise<ShoppingListItem[]> {
  return Promise.all(
    ingredients.map(async (ingredient): Promise<ShoppingListItem> => {
      const product = await matchIngredientToProduct(ingredient, supermarketId);
      return { ingredient, product, checked: false };
    }),
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

export async function buildShoppingList(
  recipeId: string,
  supermarketId: string,
): Promise<ShoppingList | null> {
  const recipe = await getRecipeById(recipeId);
  if (!recipe) return null;

  const itemsWithProducts = await toShoppingListItems(recipe.ingredients, supermarketId);

  return {
    recipeId,
    recipeTitle: recipe.title,
    supermarketId,
    groups: groupByAisle(itemsWithProducts),
    totalEur: sumEur(itemsWithProducts),
  };
}

export async function buildWeeklyShoppingList(
  recipeIds: string[],
  supermarketId: string,
): Promise<ShoppingList | null> {
  const recipes = (await Promise.all(recipeIds.map((id) => getRecipeById(id)))).filter(
    (r): r is NonNullable<typeof r> => r !== null,
  );
  if (recipes.length === 0) return null;

  // Merge ingredients across recipes, summing quantities for the same name+unit
  const merged = new Map<string, Ingredient>();
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = `${ingredient.name.toLowerCase().trim()}|${ingredient.unit}`;
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += ingredient.quantity;
      } else {
        merged.set(key, { ...ingredient });
      }
    }
  }

  const itemsWithProducts = await toShoppingListItems(Array.from(merged.values()), supermarketId);

  return {
    recipeId: 'weekly-plan',
    recipeTitle: `This Week's Basket (${recipes.length} meal${recipes.length > 1 ? 's' : ''})`,
    supermarketId,
    groups: groupByAisle(itemsWithProducts),
    totalEur: sumEur(itemsWithProducts),
  };
}
