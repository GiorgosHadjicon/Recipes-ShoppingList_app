import type { Difficulty, Recipe } from '../types';
import recipesData from '../data/recipes.json';

const recipes = recipesData as Recipe[];

export async function getRecipes(): Promise<Recipe[]> {
  return recipes;
}

export async function getRecipesByDifficulty(difficulty: Difficulty): Promise<Recipe[]> {
  return recipes.filter((r) => r.difficulty === difficulty);
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  return recipes.find((r) => r.id === id) ?? null;
}
