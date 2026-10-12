import { IngredientGroup, RecipeIngredient } from '../../../core/models/RecipeIngredient';
import { RecipeStep, StepGroup } from '../../../core/models/Recipe';
import { parseIngredientLine } from './ingredient-parser';

/*
 * The editor is text-first: ingredients are one per line, steps are separated by blank lines, and
 * "## Name" starts a group. Text is the source of truth, but re-parsing must never wipe per-line
 * settings (pantry links, manual fixes), so each line is matched back to its previous version by
 * its exact text and that version is kept as-is.
 */

const HEADING_RE = /^##\s*(.*)$/;

export function ingredientsToText(groups: IngredientGroup[]): string {
  return groups
    .map((group) => {
      const lines = group.items.map((item) => item.raw);
      return group.name ? [`## ${group.name}`, ...lines].join('\n') : lines.join('\n');
    })
    .filter((block) => block.length > 0)
    .join('\n\n');
}

export function parseIngredientsText(
  text: string,
  previous: IngredientGroup[] = [],
): IngredientGroup[] {
  const pool = poolBy(
    previous.flatMap((g) => g.items),
    (item) => item.raw,
  );
  const groups: IngredientGroup[] = [];
  let current: IngredientGroup | null = null;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const heading = HEADING_RE.exec(trimmed);
    if (heading) {
      current = heading[1].trim() ? { name: heading[1].trim(), items: [] } : { items: [] };
      groups.push(current);
      continue;
    }
    if (!current) {
      current = { items: [] };
      groups.push(current);
    }
    current.items.push(takeFromPool(pool, trimmed) ?? parseIngredientLine(trimmed));
  }
  return groups;
}

/** Options have a flat ingredient list; "##" lines are ignored there. */
export function parseOptionIngredientsText(
  text: string,
  previous: RecipeIngredient[] = [],
): RecipeIngredient[] {
  return parseIngredientsText(text, [{ items: previous }]).flatMap((g) => g.items);
}

export function optionIngredientsToText(items: RecipeIngredient[]): string {
  return items.map((item) => item.raw).join('\n');
}

export function stepsToText(groups: StepGroup[]): string {
  return groups
    .map((group) => {
      const steps = group.steps.map((step) => step.text);
      return group.name ? [`## ${group.name}`, ...steps].join('\n\n') : steps.join('\n\n');
    })
    .filter((block) => block.length > 0)
    .join('\n\n');
}

export function parseStepsText(text: string, previous: StepGroup[] = []): StepGroup[] {
  const pool = poolBy(
    previous.flatMap((g) => g.steps),
    (step) => step.text,
  );
  const groups: StepGroup[] = [];
  let current: StepGroup | null = null;

  for (const block of splitBlocks(text)) {
    const lines = block.split('\n');
    const heading = HEADING_RE.exec(lines[0]);
    if (heading) {
      current = heading[1].trim() ? { name: heading[1].trim(), steps: [] } : { steps: [] };
      groups.push(current);
      lines.shift();
    }
    const stepText = lines.join('\n').trim();
    if (!stepText) continue;
    if (!current) {
      current = { steps: [] };
      groups.push(current);
    }
    current.steps.push(takeFromPool(pool, stepText) ?? { text: stepText });
  }
  return groups;
}

export function parseOptionStepsText(text: string, previous: RecipeStep[] = []): RecipeStep[] {
  return parseStepsText(text, [{ steps: previous }]).flatMap((g) => g.steps);
}

export function optionStepsToText(steps: RecipeStep[]): string {
  return steps.map((step) => step.text).join('\n\n');
}

export interface PastedRecipe {
  title?: string;
  ingredientsText: string;
  stepsText: string;
  notesText: string;
}

const INGREDIENTS_HEADING_RE = /^(?:ingredients?|what you'?ll need)\s*:?$/i;
const STEPS_HEADING_RE = /^(?:instructions|directions|method|steps|preparation|how to make it)\s*:?$/i;
const NOTES_HEADING_RE = /^(?:notes?|tips?|cook'?s notes?)\s*:?$/i;
const STEP_NUMBER_RE = /^(?:step\s*)?\d+\s*[.):]\s*|^step\s*\d+\s*/i;

/**
 * Splits a whole pasted recipe into the editor's text format. Anything before the first section
 * heading other than the title (intros, life stories) is dropped on purpose.
 */
export function splitPastedRecipe(text: string): PastedRecipe {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  type Section = 'preamble' | 'ingredients' | 'steps' | 'notes';
  const sections: Record<Section, string[]> = { preamble: [], ingredients: [], steps: [], notes: [] };
  let section: Section = 'preamble';
  let sawHeading = false;

  for (const line of lines) {
    if (INGREDIENTS_HEADING_RE.test(line)) {
      section = 'ingredients';
      sawHeading = true;
    } else if (STEPS_HEADING_RE.test(line)) {
      section = 'steps';
      sawHeading = true;
    } else if (NOTES_HEADING_RE.test(line)) {
      section = 'notes';
      sawHeading = true;
    } else {
      sections[section].push(line);
    }
  }

  if (!sawHeading) return guessUnheadedRecipe(lines);

  const title = sections.preamble.find((l) => l.length <= 120);
  return {
    title,
    ingredientsText: sections.ingredients.map(toIngredientLine).join('\n'),
    stepsText: sections.steps.map(toStepBlock).join('\n\n'),
    notesText: sections.notes.join('\n'),
  };
}

/** No headings: lines that start with an amount are ingredients, the rest are steps. */
function guessUnheadedRecipe(lines: string[]): PastedRecipe {
  const ingredients: string[] = [];
  const steps: string[] = [];
  let title: string | undefined;
  lines.forEach((line, i) => {
    const looksLikeIngredient = line.length <= 100 && parseIngredientLine(line).quantity !== undefined;
    if (i === 0 && !looksLikeIngredient && line.length <= 120) title = line;
    else if (looksLikeIngredient && !STEP_NUMBER_RE.test(line)) ingredients.push(line);
    else steps.push(line);
  });
  return {
    title,
    ingredientsText: ingredients.join('\n'),
    stepsText: steps.map(toStepBlock).join('\n\n'),
    notesText: '',
  };
}

function isSubheading(line: string): boolean {
  return line.endsWith(':') && line.length <= 60 && !/\d/.test(line);
}

function toIngredientLine(line: string): string {
  return isSubheading(line) ? `## ${line.slice(0, -1).trim()}` : line;
}

function toStepBlock(line: string): string {
  if (isSubheading(line)) return `## ${line.slice(0, -1).trim()}`;
  return line.replace(/^[-*•▢□✓]\s*/, '').replace(STEP_NUMBER_RE, '').trim();
}

function splitBlocks(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((b) =>
      b
        .split('\n')
        .map((l) => l.trim())
        .join('\n')
        .trim(),
    )
    .filter((b) => b.length > 0);
}

function poolBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const pool = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = pool.get(k);
    if (list) list.push(item);
    else pool.set(k, [item]);
  }
  return pool;
}

function takeFromPool<T>(pool: Map<string, T[]>, key: string): T | undefined {
  const item = pool.get(key)?.shift();
  return item === undefined ? undefined : structuredClone(item);
}
