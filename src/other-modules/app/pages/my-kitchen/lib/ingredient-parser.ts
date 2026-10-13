import { CASE_SENSITIVE_UNIT_ALIASES, UNIT_ALIASES } from '../../../core/data/kitchen-units';
import { RecipeIngredient } from '../../../core/models/RecipeIngredient';
import { UnitCode } from '../../../core/models/UnitCode';

const UNICODE_FRACTIONS: Record<string, string> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
};

/** Mixed numbers ("1 1/2", "1-1/2") are listed first so they win over a bare whole number. */
const NUMBER = String.raw`(?:\d+\s+\d+\/\d+|\d+-\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|\.\d+)`;
const QUANTITY_RE = new RegExp(String.raw`^(${NUMBER})(?:\s*(?:-|–|—|to)\s*(${NUMBER}))?`, 'i');
const PACKAGE_RE = new RegExp(String.raw`^\(\s*(${NUMBER})\s*-?\s*([a-zA-Z][a-zA-Z. ]*?)\.?\s*\)\s*`);

const MULTI_WORD_ALIASES = Object.keys(UNIT_ALIASES)
  .filter((alias) => alias.includes(' '))
  .sort((a, b) => b.length - a.length);

const SALT_AND_PEPPER_RE =
  /^(?:kosher |sea |fine )?salt\s*(?:and|&|\/)\s*(?:freshly[- ]ground |fresh |ground )?(?:black )?pepper$/i;

/** Parses one ingredient line. Never throws: anything it can't understand stays in `raw` and `name`. */
export function parseIngredientLine(line: string): RecipeIngredient {
  const raw = line.trim();
  const result: RecipeIngredient = { raw };
  // Bullets/checkboxes copied from recipe sites, and trailing footnote marks ("skin-on)*", "¹").
  let text = normalizeFractions(raw)
    .replace(/^[-*•▢□✓]\s*/, '')
    .replace(/\s*[*†‡¹²³⁴⁵]+$/, '');

  if (/\[no-scale\]/i.test(text)) {
    result.scales = false;
    text = text.replace(/\s*\[no-scale\]\s*/gi, ' ');
  }

  if (/\(\s*optional\s*\)|,\s*optional\s*$|^optional\s*:/i.test(text)) {
    result.optional = true;
    text = text
      .replace(/\s*\(\s*optional\s*\)\s*/gi, ' ')
      .replace(/,\s*optional\s*$/i, '')
      .replace(/^optional\s*:\s*/i, '');
  }

  if (/\bto (?:taste|season)\b/i.test(text)) {
    result.toTaste = true;
    text = text
      .replace(/\s*\(\s*to (?:taste|season)\s*\)/gi, '')
      .replace(/,?\s*\bto (?:taste|season)\b/gi, '');
  }

  text = text.replace(/\s+/g, ' ').trim();

  const quantityMatch = QUANTITY_RE.exec(text);
  if (quantityMatch) {
    const low = parseNumber(quantityMatch[1]);
    const high = quantityMatch[2] ? parseNumber(quantityMatch[2]) : undefined;
    if (low !== undefined) {
      result.quantity = low;
      if (high !== undefined && high > low) result.quantityMax = high;
      text = text.slice(quantityMatch[0].length).trim();
    }
  } else {
    const article = /^(?:a|an|one)\s+/i.exec(text);
    const afterArticle = article ? text.slice(article[0].length) : text;
    const unitAhead = matchUnit(afterArticle);
    // "a pinch of salt", "Handful of spinach", "a can tomatoes": an amount of 1 without a digit.
    if (unitAhead && (article || /^\s*of\s/i.test(afterArticle.slice(unitAhead.length)))) {
      result.quantity = 1;
      text = afterArticle;
    }
  }

  text = takePackage(text, result);

  if (result.quantity !== undefined) {
    const unitMatch = matchUnit(text);
    if (unitMatch) {
      result.unit = unitMatch.unit;
      text = text.slice(unitMatch.length).trim();
      text = takePackage(text, result);
    }
  }

  text = text.replace(/^of\s+/i, '').trim();

  // "3 blocks (one package) Ty Ling noodles": a note right after the amount isn't part of the name.
  let leadingNote = '';
  const note = /^\(([^()]+)\)\s*/.exec(text);
  if (note && result.quantity !== undefined) {
    leadingNote = note[1].trim();
    text = text.slice(note[0].length);
  }

  // "¾ tsp EACH: onion powder, mustard powder" — one amount for several things; keep them together.
  const each = /^each\s*:\s*/i.exec(text);
  const { name, prep } = each ? { name: text.slice(each[0].length).trim(), prep: 'each' } : splitNameAndPrep(text);
  if (name) result.name = name;
  const allPrep = [leadingNote, prep].filter(Boolean).join(', ');
  if (allPrep) result.prep = allPrep;

  if (result.name && SALT_AND_PEPPER_RE.test(result.name)) result.toTaste = true;

  return result;
}

function normalizeFractions(text: string): string {
  return text
    .replace(/⁄/g, '/')
    .replace(/(\d)?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, (_m, whole: string | undefined, frac: string) =>
      whole ? `${whole} ${UNICODE_FRACTIONS[frac]}` : UNICODE_FRACTIONS[frac],
    );
}

function parseNumber(text: string): number | undefined {
  const mixed = /^(\d+)[\s-]+(\d+)\/(\d+)$/.exec(text);
  let value: number;
  if (mixed) {
    value = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  } else if (text.includes('/')) {
    const [num, den] = text.split('/').map(Number);
    value = num / den;
  } else {
    value = Number(text);
  }
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value * 10000) / 10000;
}

/** Matches a unit word at the start of `text`. `length` covers the word plus a trailing period. */
function matchUnit(text: string): { unit: UnitCode; length: number } | null {
  const lower = text.toLowerCase();
  for (const alias of MULTI_WORD_ALIASES) {
    if (lower.startsWith(alias) && isWordBoundary(lower, alias.length)) {
      const length = lower[alias.length] === '.' ? alias.length + 1 : alias.length;
      return { unit: UNIT_ALIASES[alias], length };
    }
  }

  const word = /^([A-Za-z]+)(\.?)(?=[\s,(]|$)/.exec(text);
  if (!word) return null;
  const unit = CASE_SENSITIVE_UNIT_ALIASES[word[1]] ?? UNIT_ALIASES[word[1].toLowerCase()];
  return unit ? { unit, length: word[0].length } : null;
}

function isWordBoundary(text: string, index: number): boolean {
  return index >= text.length || /[\s.,(]/.test(text[index]);
}

/** Consumes a "(14 oz)" package size at the start of `text`, if present. */
function takePackage(text: string, result: RecipeIngredient): string {
  if (result.packageQuantity !== undefined) return text;
  const match = PACKAGE_RE.exec(text);
  if (!match) return text;
  const quantity = parseNumber(match[1]);
  const unit = matchUnit(match[2].trim());
  if (quantity === undefined || !unit) return text;
  result.packageQuantity = quantity;
  result.packageUnit = unit.unit;
  return text.slice(match[0].length).trim();
}

/** Splits at the first comma outside parentheses; a trailing "(...)" becomes the prep note if there's no comma. */
function splitNameAndPrep(text: string): { name: string; prep: string } {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) {
      return { name: text.slice(0, i).trim(), prep: text.slice(i + 1).trim() };
    }
  }
  const trailing = /^(.*\S)\s*\(([^()]+)\)$/.exec(text);
  if (trailing) return { name: trailing[1].trim(), prep: trailing[2].trim() };
  return { name: text.trim(), prep: '' };
}
