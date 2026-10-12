import { CookLogEntry } from './CookLogEntry';
import { Nutrition } from './Nutrition';
import { IngredientGroup, RecipeIngredient } from './RecipeIngredient';

export const RECIPE_SCHEMA_VERSION = 1;

export type ContentOrigin = 'imported' | 'own' | 'adapted';

export type RecipeTrust = 'untested' | 'tested' | 'ours';

export type RecipeFrequency =
  | 'staple'
  | 'regular'
  | 'occasional'
  | 'rare'
  | 'want-to-try'
  | 'retired';

/** Steps are objects (not strings) so timers, photos and inline amounts can be added without a migration. */
export interface RecipeStep {
  text: string;
  image?: string;
  timerMinutes?: number;
}

export interface StepGroup {
  name?: string;
  steps: RecipeStep[];
}

export interface RecipeOption {
  /** Stable within its group, e.g. "soft-egg". */
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  note?: string;
}

export interface RecipeOptionGroup {
  /** Stable within the recipe, e.g. "toppings". */
  id: string;
  name: string;
  /** `pickOne` = swap (protein), `pickAny` = add-ins (toppings). */
  kind: 'pickOne' | 'pickAny';
  defaultOptionIds: string[];
  options: RecipeOption[];
}

export interface RecipeImage {
  /** Named by id, never by role: "img-k3f9a2.webp". */
  file: string;
  thumb: string;
  caption?: string;
  isCover?: boolean;
  origin: ContentOrigin;
}

export interface RecipeSource {
  url?: string;
  siteName?: string;
  author?: string;
}

/** Our family's take on a recipe. With other users this moves to a per-household record keyed by `uid`. */
export interface HouseholdRecipeData {
  /** Integer 1–10, the overall opinion; set by hand. */
  rating?: number;
  frequency: RecipeFrequency;
  trust: RecipeTrust;
  favoriteOptionIds?: string[];
  notes?: string;
  cookLog: CookLogEntry[];
}

/** Shareable recipe content plus `household`. */
export interface Recipe {
  schemaVersion: number;
  /** Stable slug = folder name; never changes after creation. */
  id: string;
  /** Random, globally unique. */
  uid: string;
  /** Fork of another recipe for a materially different dish. */
  parentId?: string;
  origin: ContentOrigin;
  title: string;
  description?: string;
  source?: RecipeSource;
  servings?: number;
  servingsMax?: number;
  yieldText?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  restMinutes?: number;
  totalMinutes?: number;
  ingredientGroups: IngredientGroup[];
  stepGroups: StepGroup[];
  optionGroups: RecipeOptionGroup[];
  /** Lowercase, prefixed: cuisine:, meal:, equip:, diet:, effort:. */
  tags: string[];
  images: RecipeImage[];
  sourceNutrition?: Nutrition;
  household: HouseholdRecipeData;
  createdAt: string;
  updatedAt: string;
}
