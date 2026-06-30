import { AISLE_LABELS, AISLE_ORDER, type ShoppingList, type ShoppingListGroup, type ShoppingListItem } from '../types';
import { getRecipeById } from './recipeService';
import { matchIngredientToProduct } from './productService';

export async function buildShoppingList(
  recipeId: string,
  supermarketId: string,
): Promise<ShoppingList | null> {
  const recipe = await getRecipeById(recipeId);
  if (!recipe) return null;

  const itemsWithProducts = await Promise.all(
    recipe.ingredients.map(async (ingredient): Promise<ShoppingListItem> => {
      const product = await matchIngredientToProduct(ingredient, supermarketId);
      return { ingredient, product, checked: false };
    }),
  );

  // Group by aisle, preserving aisle order
  const grouped = new Map<string, ShoppingListItem[]>();
  for (const item of itemsWithProducts) {
    const aisle = item.product?.aisle ?? 'pantry';
    if (!grouped.has(aisle)) grouped.set(aisle, []);
    grouped.get(aisle)!.push(item);
  }

  const groups: ShoppingListGroup[] = AISLE_ORDER.filter((a) => grouped.has(a)).map((aisle) => ({
    aisle,
    aisleLabel: AISLE_LABELS[aisle],
    items: grouped.get(aisle)!,
  }));

  const totalEur = itemsWithProducts.reduce(
    (sum, item) => sum + (item.product?.priceEur ?? 0),
    0,
  );

  return {
    recipeId,
    recipeTitle: recipe.title,
    supermarketId,
    groups,
    totalEur,
  };
}
