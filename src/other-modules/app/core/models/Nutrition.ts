/** Per-serving nutrition as provided by a recipe site's JSON-LD; kept as-is, not calculated by us. */
export interface Nutrition {
  servingSize?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  saturatedFatG?: number;
  sugarG?: number;
  fiberG?: number;
  sodiumMg?: number;
  cholesterolMg?: number;
}
