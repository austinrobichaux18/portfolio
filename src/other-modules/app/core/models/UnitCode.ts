/** Canonical unit codes; the ingredient parser maps aliases ("T", "Tbsp", "tablespoons") onto these. */
export type UnitCode =
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'floz'
  | 'pt'
  | 'qt'
  | 'gal'
  | 'ml'
  | 'l'
  | 'oz'
  | 'lb'
  | 'g'
  | 'kg'
  | 'pinch'
  | 'dash'
  | 'handful'
  | 'clove'
  | 'slice'
  | 'can'
  | 'jar'
  | 'package'
  | 'bag'
  | 'box'
  | 'block'
  | 'stick'
  | 'bunch'
  | 'head'
  | 'stalk'
  | 'sprig'
  | 'leaf'
  | 'sheet'
  | 'inch'
  | 'piece';

export type UnitFamily = 'volume' | 'weight' | 'count' | 'imprecise';

export interface UnitInfo {
  code: UnitCode;
  family: UnitFamily;
  singular: string;
  plural: string;
}
