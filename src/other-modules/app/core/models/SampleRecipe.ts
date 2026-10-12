import { Nutrition } from './Nutrition';
import { RecipeFrequency, RecipeTrust } from './Recipe';

/** Demo-mode recipe content, written in the same plain-text format as the editor. */
export interface SampleRecipe {
  id: string;
  title: string;
  servings?: number;
  yieldText?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  restMinutes?: number;
  tags: string[];
  /** One ingredient per line; "## Name" starts a group. */
  ingredientsText: string;
  /** Steps separated by blank lines; "## Name" starts a group. */
  stepsText: string;
  options?: SampleOptionGroup[];
  rating?: number;
  frequency: RecipeFrequency;
  trust: RecipeTrust;
  notes?: string;
  /** Cook log dates as "days before today", so suggestions look alive whenever the demo is opened. */
  cookedDaysAgo: number[];
  sourceNutrition?: Nutrition;
}

export interface SampleOptionGroup {
  id: string;
  name: string;
  kind: 'pickOne' | 'pickAny';
  options: {
    id: string;
    name: string;
    ingredientsText: string;
    stepsText?: string;
    note?: string;
    isDefault?: boolean;
  }[];
}
