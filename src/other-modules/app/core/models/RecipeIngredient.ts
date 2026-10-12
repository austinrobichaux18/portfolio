import { UnitCode } from './UnitCode';

export interface RecipeIngredient {
  /** The line exactly as written ("1 (14 oz) can diced tomatoes, drained") — never thrown away. */
  raw: string;
  quantity?: number;
  /** Upper end of a range, e.g. 3 in "2–3 cloves". */
  quantityMax?: number;
  unit?: UnitCode;
  /** 14 in "1 (14 oz) can". */
  packageQuantity?: number;
  packageUnit?: UnitCode;
  name?: string;
  /** "drained", "minced", "softened". */
  prep?: string;
  optional?: boolean;
  /** "salt to taste" — excluded from cost/nutrition/pantry math. */
  toTaste?: boolean;
  /** `[no-scale]` — the scaler leaves this amount alone. */
  scales?: false;
  /** Link to a pantry item (v2) / ingredient catalog (later). */
  ingredientId?: string;
  /** The ingredient is another recipe ("1 batch pizza dough"). */
  recipeRef?: string;
}

export interface IngredientGroup {
  name?: string;
  items: RecipeIngredient[];
}
