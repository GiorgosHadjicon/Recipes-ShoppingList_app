import { supabase } from '../lib/supabase';
import type { DietaryTag, Difficulty, Ingredient, Recipe } from '../types';

const NOT_CONFIGURED_MESSAGE = 'The community recipe backend isn’t set up yet.';

// Maps the snake_case Postgres row (see supabase/schema.sql) to our camelCase Recipe type.
interface RecipeRow {
  id: string;
  author_id: string;
  title: string;
  cuisine: string;
  difficulty: Difficulty;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  estimated_cost_eur: number;
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  dietary_tags: DietaryTag[];
  possible_additions: string[];
  calorie_reductions: string[];
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  profiles: { display_name: string | null } | null;
}

function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    cuisine: row.cuisine,
    difficulty: row.difficulty,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    servings: row.servings,
    estimatedCostEur: row.estimated_cost_eur,
    totalCalories: row.total_calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    dietaryTags: row.dietary_tags,
    possibleAdditions: row.possible_additions,
    calorieReductions: row.calorie_reductions,
    description: row.description,
    ingredients: row.ingredients,
    instructions: row.instructions,
    authorId: row.author_id,
    authorName: row.profiles?.display_name ?? undefined,
  };
}

export async function getCommunityRecipes(): Promise<Recipe[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('recipes').select('*, profiles(display_name)');
  if (error) throw error;
  return (data as RecipeRow[]).map(rowToRecipe);
}

export async function createRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  const { data: userData } = await supabase.auth.getUser();
  const authorId = userData.user?.id;
  if (!authorId) throw new Error('You must be signed in to add a recipe.');

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      author_id: authorId,
      title: recipe.title,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      prep_time_minutes: recipe.prepTimeMinutes,
      cook_time_minutes: recipe.cookTimeMinutes,
      servings: recipe.servings,
      estimated_cost_eur: recipe.estimatedCostEur,
      total_calories: recipe.totalCalories,
      protein_g: recipe.proteinG,
      carbs_g: recipe.carbsG,
      fat_g: recipe.fatG,
      dietary_tags: recipe.dietaryTags,
      possible_additions: recipe.possibleAdditions,
      calorie_reductions: recipe.calorieReductions,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
    })
    .select('*, profiles(display_name)')
    .single();
  if (error) throw error;
  return rowToRecipe(data as RecipeRow);
}

export async function deleteRecipe(id: string): Promise<void> {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}
