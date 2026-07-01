import type { Ingredient, Product } from '../types';
import productsData from '../data/products.json';
import { convertToGrams } from './nutritionService';

const products = productsData as Product[];

// Product prices are per-package (e.g. "€1.99 per kg"), not per-recipe-quantity. Scale
// the listed price by how much of the package the recipe actually needs, so changing an
// ingredient's amount changes its cost. Falls back to the flat listed price whenever we
// can't convert both sides to a common unit (no package data, or ingredient not in nutrition.json).
export function scalePriceForQuantity(product: Product, ingredient: Ingredient): number {
  if (product.packageQuantity === undefined || !product.packageUnit) return product.priceEur;
  const neededGrams = convertToGrams(ingredient.name, ingredient.quantity, ingredient.unit);
  const packageGrams = convertToGrams(ingredient.name, product.packageQuantity, product.packageUnit);
  if (neededGrams === null || !packageGrams) return product.priceEur;
  return (neededGrams / packageGrams) * product.priceEur;
}

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

// For stores we have no real pricing for (anything outside the 3 known supermarkets):
// average what the known supermarkets charge for this ingredient as a stand-in estimate.
export async function estimateProductForIngredient(ingredient: Ingredient): Promise<Product | null> {
  const key = ingredient.name.toLowerCase().trim();
  const matches = products.filter((p) => p.ingredientKey === key);
  if (matches.length === 0) return null;

  const avgPrice = matches.reduce((sum, p) => sum + p.priceEur, 0) / matches.length;
  const reference = matches[0];
  return {
    id: `estimated-${key}`,
    ingredientKey: key,
    supermarketId: 'estimated',
    displayName: `${ingredient.name} (est.)`,
    priceEur: Math.round(avgPrice * 100) / 100,
    priceUnit: reference.priceUnit,
    aisle: reference.aisle,
    estimated: true,
  };
}
