import type { Product } from '../types';
import productsData from '../data/products.json';

const products = productsData as Product[];

export async function matchIngredientToProduct(ingredientName: string): Promise<Product | null> {
  const key = ingredientName.toLowerCase().trim();
  return products.find((p) => p.ingredientKey === key) ?? null;
}
