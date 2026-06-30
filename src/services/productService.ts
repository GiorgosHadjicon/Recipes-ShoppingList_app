import type { Ingredient, Product } from '../types';
import productsData from '../data/products.json';

const products = productsData as Product[];

export async function matchIngredientToProduct(
  ingredient: Ingredient,
  supermarketId: string,
): Promise<Product | null> {
  const key = ingredient.name.toLowerCase().trim();
  return (
    products.find(
      (p) => p.ingredientKey === key && p.supermarketId === supermarketId,
    ) ?? null
  );
}

export async function getProductsForSupermarket(supermarketId: string): Promise<Product[]> {
  return products.filter((p) => p.supermarketId === supermarketId);
}
