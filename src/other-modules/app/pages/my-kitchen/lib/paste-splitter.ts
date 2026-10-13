import { Nutrition } from '../../../core/models/Nutrition';
import { parseIngredientLine } from './ingredient-parser';

/*
 * Quick add: turns a whole recipe copied from a web page, doc or note into the editor's text
 * format. Real pages are full of clutter — unit toggles, "Cook Mode", star ratings, photo captions,
 * photo credits, tips, nutrition panels — so this keeps what's needed to cook (plus servings, times
 * and nutrition, which fill the form) and drops the rest. Intros and life stories are dropped on
 * purpose.
 */

export interface PastedRecipe {
  title?: string;
  ingredientsText: string;
  stepsText: string;
  notesText: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  totalMinutes?: number;
  nutrition?: Nutrition;
}

type Section = 'preamble' | 'ingredients' | 'steps' | 'notes' | 'nutrition';

const SECTION_HEADINGS: [RegExp, Section][] = [
  [/^(?:ingredients?|what you'?ll need)\s*:?$/i, 'ingredients'],
  [/^(?:instructions|directions|method|steps|preparation|how to make it)\s*:?$/i, 'steps'],
  [
    /^(?:notes?|tips?|recipe tips?|pro tips?|cook'?s notes?|storage|to store|storing|make ahead|equipment|substitutions)\s*:?$/i,
    'notes',
  ],
  [/^nutrition(?:al)?(?: facts| information| info)?(?: \(per serving\))?\s*:?$/i, 'nutrition'],
];

/** Page furniture that is never part of a recipe. */
const JUNK_RES = [
  /^(?:us customary|metric)(?:\s*[-–|/]\s*(?:us customary|metric))?$/i,
  /^\d+(?:\/\d+)?\s*x$/i, // "1x", "1/2x" scale toggles
  /^(?:print|pin|save|share|rate|jump to)(?: this)?(?: recipe)?$/i,
  /^cook mode\b/i,
  /^prevent your screen from going dark$/i,
  /^(?:\d\s*stars?\s*)+$/i, // "5 Stars 4 Stars 3 Stars…"
  /^[\d.]+\s+from\s+[\d,]+\s+(?:reviews?|ratings?|votes?)$/i,
  /^(?:hide|show) full nutrition label$/i,
  /^description$/i,
];

const STEP_NUMBER_RE = /^(?:step\s*)?\d+\s*[.):]\s*|^step\s*\d+\s*/i;
const BULLET_RE = /^[-*•▢□✓]\s*/;
const FOOTNOTE_RE = /\s*[*†‡¹²³⁴⁵]+$/;

export function splitPastedRecipe(text: string): PastedRecipe {
  const result: PastedRecipe = { ingredientsText: '', stepsText: '', notesText: '' };
  const lines = takeMetadata(
    text
      .split(/\r?\n/)
      .map((l) => l.trim().replace(FOOTNOTE_RE, ''))
      .filter((l) => l.length > 0),
    result,
  ).filter((l) => !JUNK_RES.some((re) => re.test(l)));

  const sections: Record<Section, string[]> = { preamble: [], ingredients: [], steps: [], notes: [], nutrition: [] };
  let section: Section = 'preamble';
  let sawHeading = false;
  for (const line of lines) {
    const heading = SECTION_HEADINGS.find(([re]) => re.test(line));
    if (heading) {
      section = heading[1];
      sawHeading = true;
    } else {
      sections[section].push(line);
    }
  }

  if (!sawHeading) return { ...result, ...guessUnheadedRecipe(lines) };

  const nutrition = parseNutrition(sections.nutrition.join('\n'));
  if (nutrition) result.nutrition = nutrition;

  const steps = cleanSteps(sections.steps);
  return {
    ...result,
    title: sections.preamble.find((l) => l.length <= 120 && !/[.!?]$/.test(l)),
    ingredientsText: ingredientLines(sections.ingredients).join('\n'),
    stepsText: steps.steps.join('\n\n'),
    notesText: [...steps.tips, ...sections.notes].join('\n'),
  };
}

/** Reads servings and times (and removes those lines); handles "Prep Time:" with the value on the next line. */
function takeMetadata(lines: string[], result: PastedRecipe): string[] {
  const kept: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // "Prep Time:" / "15 mins" split over two lines.
    if (/^(?:prep|cook|total|active)\s*time\s*:?$|^(?:servings|serves|yield)\s*:?$/i.test(line) && lines[i + 1]) {
      line = `${line.replace(/:$/, '')}: ${lines[++i]}`;
    }

    const time = /^(prep|cook|total|active)\s*time\s*:?\s*(.+)$/i.exec(line);
    const minutes = time ? parseDuration(time[2]) : undefined;
    if (time && minutes !== undefined) {
      const kind = time[1].toLowerCase();
      if (kind === 'prep') result.prepMinutes = minutes;
      else if (kind === 'cook' || kind === 'active') result.cookMinutes ??= minutes;
      else result.totalMinutes = minutes;
      continue;
    }

    const servings =
      /^(?:servings|serves|yield|yields)\s*:?\s*(\d+)(?:\s*(?:servings?|people|portions?))?$/i.exec(line) ??
      /yields?\s+(\d+)\s+servings?/i.exec(line);
    if (servings) {
      result.servings ??= Number(servings[1]);
      continue;
    }
    kept.push(line);
  }
  return kept;
}

/** "1 hour 15 mins", "45 minutes", "1 hr" → minutes. */
export function parseDuration(text: string): number | undefined {
  const hours = /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b/i.exec(text);
  const mins = /(\d+)\s*(?:m|min|mins|minutes?)\b/i.exec(text);
  if (!hours && !mins) return undefined;
  return Math.round((hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0));
}

/** Ingredient lines, with group headings ("Broth", "For the Toppings", "Sauce:") turned into "## Name". */
function ingredientLines(lines: string[]): string[] {
  return lines.map((line, i) => {
    if (isColonHeading(line)) return `## ${line.slice(0, -1).trim()}`;
    if (isIngredientHeading(line, lines[i + 1])) return `## ${line}`;
    return line.replace(BULLET_RE, '');
  });
}

function isIngredientHeading(line: string, next: string | undefined): boolean {
  if (!next) return false;
  if (/^for\b/i.test(line) && line.length <= 60 && parseIngredientLine(line).quantity === undefined) return true;
  return looksLikeTitleHeading(line) && !looksLikeTitleHeading(next);
}

/** "Broth", "Mushrooms & Chicken" — short, Title Case, no amount, no bullet, no notes. */
function looksLikeTitleHeading(line: string): boolean {
  if (line.length > 40 || /[\d(),:;.▢□•*-]/.test(line[0]) || /[\d(),;]/.test(line)) return false;
  const words = line.split(/\s+/);
  if (words.length > 4) return false;
  return words.every((w) => /^[A-Z&]/.test(w) || /^(?:and|of|the|for|with|or)$/i.test(w));
}

function isColonHeading(line: string): boolean {
  return line.endsWith(':') && line.length <= 60 && !/\d/.test(line);
}

/** Steps without photo captions/credits; section names become "## Name"; "Tip:" lines go to notes. */
function cleanSteps(lines: string[]): { steps: string[]; tips: string[] } {
  const steps: string[] = [];
  const tips: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(BULLET_RE, '');
    if (isPhotoCaption(line)) continue;
    if (/^[\w'’ ]{0,24}\btips?\s*:/i.test(line)) {
      tips.push(line);
      continue;
    }
    if (isColonHeading(line)) {
      steps.push(`## ${line.slice(0, -1).trim()}`);
      continue;
    }
    if (isStepHeading(line)) {
      steps.push(`## ${line}`);
      continue;
    }
    const step = line.replace(STEP_NUMBER_RE, '').trim();
    if (step) steps.push(step);
  }
  return { steps, tips };
}

/** "To Make the Soup Broth", "Before You Start" — short, no ending punctuation. */
function isStepHeading(line: string): boolean {
  if (line.length > 50 || /[.!?)]$/.test(line) || /\d/.test(line)) return false;
  return /^(?:to|for|make|before|after|prepare|assemble)\b/i.test(line) && /^[A-Z]/.test(line);
}

function isPhotoCaption(line: string): boolean {
  return (
    // "Two panels show…", "A collage shows…", "Side-by-side images…", "Close-up of hands…"
    /^(?:(?:a|an|two|three|four|five|the)\s+)?(?:[\w-]+\s+)?(?:panels?|images?|photos?|collage|close-ups?|sequence|pictures?)\b/i.test(
      line,
    ) ||
    /^(?:side-by-side|two-panel|three-panel|close-up)\b/i.test(line) ||
    /\bon the left\b.*\bon the right\b/i.test(line) ||
    // Photo credits: "Jen Causey / Food Styling: …"
    /\b(?:food styling|prop styling|photo(?:graphy)?|credit)\s*:/i.test(line) ||
    // Lowercase, unpunctuated alt text: "noodles boiling in a saucepan"
    (/^[a-z]/.test(line) && !/[.!?:)]$/.test(line))
  );
}

/** No headings: lines that start with an amount are ingredients, the rest are steps. */
function guessUnheadedRecipe(lines: string[]): Omit<PastedRecipe, 'notesText'> & { notesText: string } {
  const ingredients: string[] = [];
  const steps: string[] = [];
  let title: string | undefined;
  lines.forEach((line, i) => {
    const looksLikeIngredient = line.length <= 100 && parseIngredientLine(line).quantity !== undefined;
    if (i === 0 && !looksLikeIngredient && line.length <= 120) title = line;
    else if (looksLikeIngredient && !STEP_NUMBER_RE.test(line)) ingredients.push(line.replace(BULLET_RE, ''));
    else steps.push(line);
  });
  const cleaned = cleanSteps(steps);
  return {
    title,
    ingredientsText: ingredients.join('\n'),
    stepsText: cleaned.steps.join('\n\n'),
    notesText: cleaned.tips.join('\n'),
  };
}

const NUTRITION_LABELS: [Exclude<keyof Nutrition, 'servingSize'>, string][] = [
  ['calories', 'calories'],
  ['proteinG', 'protein'],
  ['carbsG', '(?:total )?carbohydrates?|carbs'],
  ['fatG', '(?:total )?fat'],
  ['saturatedFatG', 'saturated fat'],
  ['sugarG', '(?:total )?sugars?'],
  ['fiberG', '(?:dietary )?fiber'],
  ['sodiumMg', 'sodium'],
  ['cholesterolMg', 'cholesterol'],
];

/** "Calories: 511kcal, Protein: 27g, …" or one "Total Fat 10g 13%" per line. Per serving, as given. */
export function parseNutrition(text: string): Nutrition | undefined {
  const nutrition: Nutrition = {};
  for (const [key, label] of NUTRITION_LABELS) {
    // Anchored to a line start or comma so "Fat" doesn't match inside "Saturated Fat"; the value
    // must be on the same line ("Calories\n10g" in a summary panel is two different facts).
    const match = new RegExp(`(?:^|[,|]|\\n)[ \\t]*(?:${label})[ \\t]*:?[ \\t]*(\\d+(?:\\.\\d+)?)[ \\t]*(?:kcal|g|mg)?\\b`, 'i').exec(
      text,
    );
    if (match) nutrition[key] = Number(match[1]);
  }
  return Object.keys(nutrition).length ? nutrition : undefined;
}
