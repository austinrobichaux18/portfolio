import { FuriganaSegment, ReferenceCellValue } from '../models/ReferenceChart';
import { REFERENCE_CATEGORIES } from './reference-charts';

function isSegments(value: ReferenceCellValue): value is FuriganaSegment[] {
  return Array.isArray(value);
}

function isNonEmptyCell(value: ReferenceCellValue | undefined): boolean {
  if (value === undefined) return false;
  if (isSegments(value)) return value.length > 0 && value.every((s) => s.text.trim().length > 0);
  return value.trim().length > 0;
}

describe('reference charts data', () => {
  it('has a non-empty id and label for every category', () => {
    for (const category of REFERENCE_CATEGORIES) {
      expect(category.id.trim().length).toBeGreaterThan(0);
      expect(category.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('has unique category ids', () => {
    const ids = REFERENCE_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a non-empty id and title, at least one column, and at least one row for every table', () => {
    for (const category of REFERENCE_CATEGORIES) {
      for (const table of category.tables) {
        expect(table.id.trim().length).toBeGreaterThan(0);
        expect(table.title.trim().length).toBeGreaterThan(0);
        expect(table.columns.length).toBeGreaterThan(0);
        expect(table.rows.length).toBeGreaterThan(0);
      }
    }
  });

  it('has unique table ids within each category', () => {
    for (const category of REFERENCE_CATEGORIES) {
      const ids = category.tables.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('fills every non-note column of every row with a non-empty cell', () => {
    for (const category of REFERENCE_CATEGORIES) {
      for (const table of category.tables) {
        const requiredKeys = table.columns.map((c) => c.key).filter((key) => key !== 'note');
        for (const row of table.rows) {
          for (const key of requiredKeys) {
            expect(isNonEmptyCell(row[key])).toBe(true);
          }
        }
      }
    }
  });

  it('points practiceFrontKey at one of the table\'s own column keys', () => {
    for (const category of REFERENCE_CATEGORIES) {
      for (const table of category.tables) {
        if (!table.practiceFrontKey) continue;
        const keys = table.columns.map((c) => c.key);
        expect(keys).toContain(table.practiceFrontKey);
      }
    }
  });

  it('points mnemonicsAfterTableId at a table id within the same category', () => {
    for (const category of REFERENCE_CATEGORIES) {
      if (!category.mnemonicsAfterTableId) continue;
      const tableIds = category.tables.map((t) => t.id);
      expect(tableIds).toContain(category.mnemonicsAfterTableId);
    }
  });

  it('has a non-empty term, title, and body for every mnemonic', () => {
    for (const category of REFERENCE_CATEGORIES) {
      for (const mnemonic of category.mnemonics ?? []) {
        expect(mnemonic.term.trim().length).toBeGreaterThan(0);
        expect(mnemonic.title.trim().length).toBeGreaterThan(0);
        expect(mnemonic.body.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
