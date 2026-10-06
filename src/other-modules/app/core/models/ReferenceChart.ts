export interface FuriganaSegment {
  text: string;
  /** Reading shown above this segment as furigana. Omit for a segment with no reading of its own (e.g. punctuation). */
  reading?: string;
}

/** A plain string renders as-is; a FuriganaSegment[] renders as kanji with furigana, segment by segment. */
export type ReferenceCellValue = string | FuriganaSegment[];

/** How wide a tile renders in the chart grid. Omit to default to 'full'. */
export type TileSize = 'full' | 'half' | 'third' | 'quarter';

export interface ReferenceTableColumn {
  key: string;
  label: ReferenceCellValue;
  /** English translation shown as a hover tooltip, for a label written in Japanese. */
  tooltip?: string;
}

export interface ReferenceTableRow {
  [columnKey: string]: ReferenceCellValue;
}

export interface ReferenceTable {
  id: string;
  title: string;
  description?: string;
  columns: ReferenceTableColumn[];
  rows: ReferenceTableRow[];
  /** Column key used as the flashcard front in practice mode; the row's other columns form the back. Omit to leave this table's rows out of practice mode. */
  practiceFrontKey?: string;
  /** Tile width in the chart grid. Omit for 'full'. */
  size?: TileSize;
}

export interface ReferenceMnemonic {
  term: string;
  title: string;
  body: string;
}

export interface ReferenceCategory {
  id: string;
  label: string;
  description?: string;
  tables: ReferenceTable[];
  mnemonics?: ReferenceMnemonic[];
  /** Tile width of the mnemonics tile in the chart grid. Omit for 'full'. */
  mnemonicsSize?: TileSize;
  /** Id of the table tile the mnemonics tile should immediately follow in the grid. Omit to place it after every table. */
  mnemonicsAfterTableId?: string;
}
