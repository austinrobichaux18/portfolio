const MAX_SLUG_LENGTH = 60;

/** "Grandma's Chicken & Dumplings" → "grandmas-chicken-dumplings". */
export function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return slug;
}

/** Slug from the title, with "-2", "-3"… on collision. Never starts with "_" (reserved for _trash etc.). */
export function uniqueId(text: string, existing: Iterable<string>, fallback = 'recipe'): string {
  const taken = new Set(existing);
  const base = slugify(text) || fallback;
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export function newUid(): string {
  return crypto.randomUUID();
}

/** Short random id like "k3f9a2". */
export function shortRandomId(length = 6): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** Image base name, e.g. "img-k3f9a2" → files "img-k3f9a2.webp" + "img-k3f9a2.thumb.webp". */
export function newImageBaseName(existingFiles: Iterable<string>): string {
  const taken = new Set(existingFiles);
  for (;;) {
    const base = `img-${shortRandomId()}`;
    if (!taken.has(`${base}.webp`) && !taken.has(`${base}.jpg`)) return base;
  }
}

/** Local calendar date as YYYY-MM-DD (never via toISOString, which is UTC). */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
