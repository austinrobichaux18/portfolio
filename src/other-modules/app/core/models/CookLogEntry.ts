import { UnitCode } from './UnitCode';

export interface PantryDeduction {
  pantryItemId: string;
  amount: number;
  unit?: UnitCode;
}

export interface CookLogEntry {
  id: string;
  /** Local YYYY-MM-DD — never from toISOString(), which shifts evening cooks into tomorrow (UTC). */
  date: string;
  servingsMade?: number;
  /** Which version was made ("with egg + chashu"). May reference since-deleted options. */
  optionIds: string[];
  /** This attempt only; never changes the recipe's overall rating. */
  rating?: number;
  note?: string;
  images?: string[];
  /** v2: what was subtracted from the pantry, so editing/deleting the entry can reverse it. */
  pantryDeductions?: PantryDeduction[];
}
