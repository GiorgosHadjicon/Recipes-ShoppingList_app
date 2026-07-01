import nutritionData from '../data/nutrition.json';

interface NutritionEntry {
  kcal100: number;
  protein100: number;
  carbs100: number;
  fat100: number;
  liquid?: boolean; // only liquids offer a unit switcher (tbsp/ml); everything else stays fixed
  units: Record<string, number>; // grams per one unit
}

// ponytail: seasonings/herbs (salt, pepper, oregano, etc.) aren't in this table —
// their macro contribution is negligible at recipe quantities, treated as 0.
const nutrition = nutritionData as Record<string, NutritionEntry>;

export interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const ZERO_MACROS: Macros = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

function getEntry(ingredientName: string): NutritionEntry | undefined {
  return nutrition[ingredientName.toLowerCase().trim()];
}

export function getAvailableUnits(ingredientName: string, currentUnit: string): string[] {
  const entry = getEntry(ingredientName);
  if (!entry?.liquid) return [currentUnit];
  const units = Object.keys(entry.units);
  return units.includes(currentUnit) ? units : [currentUnit, ...units];
}

const KNOWN_INGREDIENTS = Object.keys(nutrition).sort();

// For the recipe-builder search box: known ingredient names matching a query, and
// the full unit list for one (unlike getAvailableUnits, not restricted to liquids).
export function searchIngredients(query: string, limit = 6): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return KNOWN_INGREDIENTS.filter((name) => name.includes(q)).slice(0, limit);
}

export function isKnownIngredient(ingredientName: string): boolean {
  return getEntry(ingredientName) !== undefined;
}

export function getUnitsForIngredient(ingredientName: string): string[] {
  return Object.keys(getEntry(ingredientName)?.units ?? {});
}

// Converts a quantity+unit of a known ingredient to grams, or null if either the
// ingredient or that specific unit isn't in the table. Shared by macro math and pricing.
export function convertToGrams(ingredientName: string, quantity: number, unit: string): number | null {
  const entry = getEntry(ingredientName);
  const gramsPerUnit = entry?.units[unit];
  if (!entry || gramsPerUnit === undefined || !Number.isFinite(quantity)) return null;
  return quantity * gramsPerUnit;
}

export function computeMacros(ingredientName: string, quantity: number, unit: string): Macros {
  const entry = getEntry(ingredientName);
  const grams = convertToGrams(ingredientName, quantity, unit);
  if (!entry || grams === null) {
    return ZERO_MACROS;
  }
  const scale = grams / 100;
  return {
    calories: entry.kcal100 * scale,
    proteinG: entry.protein100 * scale,
    carbsG: entry.carbs100 * scale,
    fatG: entry.fat100 * scale,
  };
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { ...ZERO_MACROS },
  );
}
