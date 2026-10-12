import { unitInfo } from '../../../core/data/kitchen-units';
import { UnitCode } from '../../../core/models/UnitCode';

const FRACTIONS: [number, string][] = [
  [1 / 8, '⅛'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [3 / 8, '⅜'],
  [1 / 2, '½'],
  [5 / 8, '⅝'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [7 / 8, '⅞'],
];

/** 1.5 → "1 ½", 0.3333 → "⅓", 2.1 → "2.1". Uses a kitchen fraction when one is within 0.02. */
export function formatQuantity(value: number): string {
  const whole = Math.floor(value + 1e-9);
  const rest = value - whole;
  if (rest < 0.02) return String(whole);
  if (rest > 0.98) return String(whole + 1);
  const fraction = FRACTIONS.find(([f]) => Math.abs(f - rest) < 0.02);
  if (fraction) return whole ? `${whole} ${fraction[1]}` : fraction[1];
  return String(Math.round(value * 100) / 100);
}

export function formatAmount(quantity: number | undefined, quantityMax: number | undefined, unit?: UnitCode): string {
  if (quantity === undefined) return '';
  const amount = quantityMax ? `${formatQuantity(quantity)}–${formatQuantity(quantityMax)}` : formatQuantity(quantity);
  if (!unit) return amount;
  const info = unitInfo(unit);
  const plural = (quantityMax ?? quantity) > 1;
  return `${amount} ${info ? (plural ? info.plural : info.singular) : unit}`;
}
