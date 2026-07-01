import type { Difficulty, Recipe } from '../types';
import recipesData from '../data/recipes.json';
import { getCommunityRecipes } from './recipeBackendService';

const recipes = recipesData as Recipe[];

// ponytail: single ratio, no calorie/fat ceiling — a protein-dense but rich dish
// (e.g. slow-roasted lamb) can still qualify. Add a calorie cap if that's ever unwanted.
const HEALTHY_PROTEIN_CALORIE_SHARE = 0.2; // >=20% of calories from protein
const HIGH_PROTEIN_GRAMS_PER_SERVING = 25;

export function isHealthy(recipe: Recipe): boolean {
  const proteinCalories = recipe.proteinG * 4;
  return proteinCalories / recipe.totalCalories >= HEALTHY_PROTEIN_CALORIE_SHARE;
}

export function isHighProtein(recipe: Recipe): boolean {
  return recipe.proteinG / recipe.servings >= HIGH_PROTEIN_GRAMS_PER_SERVING;
}

export function isOwnRecipe(recipe: Recipe, userId: string | null): boolean {
  return userId !== null && recipe.authorId === userId;
}

export async function getRecipes(): Promise<Recipe[]> {
  const community = await getCommunityRecipes();
  return [...recipes, ...community];
}

export async function getRecipesByDifficulty(difficulty: Difficulty): Promise<Recipe[]> {
  const all = await getRecipes();
  return all.filter((r) => r.difficulty === difficulty);
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const all = await getRecipes();
  return all.find((r) => r.id === id) ?? null;
}
