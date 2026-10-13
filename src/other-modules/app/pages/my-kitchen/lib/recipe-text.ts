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
    .map((group, i) => {
      const lines = group.items.map((item) => item.raw);
      const heading = groupHeading(group.name, i);
      return heading ? [heading, ...lines].join('\n') : lines.join('\n');
    })
    .filter((block) => block.length > 0)
    .join('\n\n');
}

/**
 * "## Name" for named groups. An unnamed group after the first needs a bare "##", or it would be
 * read back as part of the group above it.
 */
function groupHeading(name: string | undefined, index: number): string | null {
  if (name) return `## ${name}`;
  return index > 0 ? '##' : null;
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
    .map((group, i) => {
      const steps = group.steps.map((step) => step.text);
      const heading = groupHeading(group.name, i);
      return heading ? [heading, ...steps].join('\n\n') : steps.join('\n\n');
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
