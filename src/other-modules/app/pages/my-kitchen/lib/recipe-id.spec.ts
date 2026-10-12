import { localDateString, newImageBaseName, newUid, slugify, uniqueId } from './recipe-id';

describe('slugify', () => {
  it.each([
    ["Grandma's Chicken & Dumplings", 'grandmas-chicken-dumplings'],
    ['  Smash Burgers!  ', 'smash-burgers'],
    ['Crème brûlée', 'creme-brulee'],
    ['___', ''],
  ])('%s → %s', (title, slug) => {
    expect(slugify(title)).toBe(slug);
  });

  it('caps the length without leaving a trailing dash', () => {
    const slug = slugify('a '.repeat(80));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('uniqueId', () => {
  it('adds a numeric suffix on collision', () => {
    expect(uniqueId('Ramen', [])).toBe('ramen');
    expect(uniqueId('Ramen', ['ramen'])).toBe('ramen-2');
    expect(uniqueId('Ramen', ['ramen', 'ramen-2'])).toBe('ramen-3');
  });

  it('falls back when the title has no usable characters', () => {
    expect(uniqueId('!!!', [])).toBe('recipe');
    expect(uniqueId('!!!', ['recipe'])).toBe('recipe-2');
  });
});

describe('ids', () => {
  it('makes distinct uids', () => {
    expect(newUid()).not.toBe(newUid());
  });

  it('makes image names that avoid existing files', () => {
    const base = newImageBaseName([]);
    expect(base).toMatch(/^img-[a-z0-9]{6}$/);
  });
});

describe('localDateString', () => {
  it('uses the local calendar date, not UTC', () => {
    // 11:30pm local on Jan 5 — toISOString() could report Jan 6 in negative-offset zones.
    expect(localDateString(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
