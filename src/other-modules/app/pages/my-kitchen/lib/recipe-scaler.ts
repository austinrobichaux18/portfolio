import { unitInfo } from '../../../core/data/kitchen-units';
import { Recipe } from '../../../core/models/Recipe';
import { RecipeIngredient } from '../../../core/models/RecipeIngredient';
import { UnitCode } from '../../../core/models/UnitCode';
import { formatAmount } from './format';

/** Things you can only use whole: "1.5 eggs" isn't a real amount. */
const WHOLE_ITEM_UNITS: (UnitCode | undefined)[] = [undefined, 'clove', 'slice', 'piece', 'head', 'stalk', 'sprig'];
const METRIC_SMALL: UnitCode[] = ['g', 'ml'];
const METRIC_LARGE: UnitCode[] = ['kg', 'l'];

/** Factor to go from the recipe's servings to `target`; 1 when the recipe has no servings. */
export function scaleFactor(recipe: Recipe, target: number): number {
  return recipe.servings && target > 0 ? target / recipe.servings : 1;
}

/**
 * Display text for an ingredient at `factor` × the written amount. At ×1 (or for lines that
 * shouldn't scale) the line is shown exactly as written.
 */
export function scaleIngredient(item: RecipeIngredient, factor: number): string {
  if (!isScalable(item) || Math.abs(factor - 1) < 1e-9) return item.raw;

  const low = item.quantity! * factor;
  const high = item.quantityMax !== undefined ? item.quantityMax * factor : undefined;

  let amount: string;
  if (WHOLE_ITEM_UNITS.includes(item.unit) && (high ?? low) >= 1) {
    amount = wholeItemAmount(low, high, item.unit);
  } else {
    const roundedLow = roundKitchen(low, item.unit);
    const roundedHigh = high !== undefined ? roundKitchen(high, item.unit) : undefined;
    amount = formatAmount(roundedLow, roundedHigh !== roundedLow ? roundedHigh : undefined, item.unit);
  }

  // "1 large egg" ×2 → "2 large eggs". Only for unit-less items written as a single one.
  const becomesPlural = !item.unit && (item.quantityMax ?? item.quantity!) <= 1 && (high ?? low) > 1.15;
  const name = becomesPlural ? pluralize(item.name!) : item.name;
  const pkg = item.packageQuantity ? `(${formatAmount(item.packageQuantity, undefined, item.packageUnit)})` : '';
  const text = [amount, pkg, name].filter(Boolean).join(' ');
  return `${text}${item.prep ? `, ${item.prep}` : ''}${item.optional ? ' (optional)' : ''}`;
}

export function isScalable(item: RecipeIngredient): boolean {
  if (item.quantity === undefined || !item.name || item.scales === false || item.toTaste) return false;
  return !item.unit || unitInfo(item.unit)?.family !== 'imprecise';
}

/** Rounds to amounts you can actually measure: eighths/thirds when small, coarser as it grows. */
export function roundKitchen(value: number, unit?: UnitCode): number {
  if (value <= 0) return value;
  if (unit && METRIC_SMALL.includes(unit)) return value >= 50 ? Math.round(value / 5) * 5 : Math.max(1, Math.round(value));
  if (unit && METRIC_LARGE.includes(unit)) return Math.max(0.05, Math.round(value / 0.05) * 0.05);
  if (value >= 20) return Math.round(value);
  if (value >= 10) return Math.round(value * 2) / 2;
  const step = value >= 2 ? 4 : 8;
  const byFraction = Math.round(value * step) / step;
  const byThird = Math.round(value * 3) / 3;
  const best = Math.abs(byThird - value) < Math.abs(byFraction - value) - 1e-9 ? byThird : byFraction;
  return best > 0 ? Math.round(best * 10000) / 10000 : 1 / step;
}

/** Whole items: round when close, otherwise show a range ("1.5 eggs" → "1–2 eggs"). */
function wholeItemAmount(low: number, high: number | undefined, unit: UnitCode | undefined): string {
  const lowText = wholeRange(low);
  const highText = high !== undefined ? wholeRange(high) : undefined;
  const lo = lowText[0];
  const hi = highText ? highText[1] : lowText[1];
  return formatAmount(lo, lo === hi ? undefined : hi, unit);
}

function pluralize(name: string): string {
  if (/(s|x|z|ch|sh)$/i.test(name)) return /s$/i.test(name) ? name : `${name}es`;
  if (/[^aeiou]y$/i.test(name)) return `${name.slice(0, -1)}ies`;
  if (/[^aeiou]o$/i.test(name)) return `${name}es`;
  return `${name}s`;
}

function wholeRange(value: number): [number, number] {
  const nearest = Math.max(1, Math.round(value));
  if (Math.abs(value - nearest) <= 0.15) return [nearest, nearest];
  return [Math.max(1, Math.floor(value)), Math.ceil(value)];
}
