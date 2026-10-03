import { HouseholdPreset } from '../models/HouseholdBudget';

/**
 * Quick-fill household presets. Cost-of-living figures build off the BLS 2024 Consumer
 * Expenditure Survey national average ($78,535/year for the average 2.4-person, 0.6-child
 * consumer unit — https://www.bls.gov/news.release/pdf/cesan.pdf), scaled to household
 * composition with the OECD modified equivalence scale (1.0 first adult, +0.5 each additional
 * adult, applied here for the second adult — see
 * https://www.brookings.edu/articles/whats-in-an-equivalence-scale-maybe-more-than-you-think/),
 * plus the USDA/Brookings estimated cost of raising a child (~$17,800/year per child in 2026 —
 * https://www.brookings.edu/wp-content/uploads/2022/08/Brookings_Cost-to-raise-a-child_inflation-adjusted-2.pdf)
 * added per child rather than the OECD child weight, since it's a more direct, current estimate.
 *
 * Income defaults come from Census household income medians by composition
 * (https://www.visualcapitalist.com/charted-median-income-by-household-size-in-the-u-s/):
 * single-person ~$42,124/year, and a ~$70k/$40k split approximating the ~$110,000 dual-income
 * married-couple median. The single-parent presets reuse the single-person income median with
 * the same per-child cost added. All figures are starting points — every field stays editable.
 */
export const HOUSEHOLD_PRESETS: HouseholdPreset[] = [
  { id: 'single', label: 'Single', incomes: [42_124], monthlyCostOfLiving: 4_140 },
  {
    id: 'marriedDualIncome',
    label: 'Married, dual income',
    incomes: [70_000, 40_000],
    monthlyCostOfLiving: 6_210,
  },
  {
    id: 'marriedStayAtHome',
    label: 'Married, stay-at-home partner',
    incomes: [90_465, 0],
    monthlyCostOfLiving: 6_210,
  },
  {
    id: 'married1Child',
    label: 'Married + 1 child',
    incomes: [70_000, 40_000],
    monthlyCostOfLiving: 7_700,
  },
  {
    id: 'married2Children',
    label: 'Married + 2 children',
    incomes: [70_000, 40_000],
    monthlyCostOfLiving: 9_180,
  },
  {
    id: 'married3Children',
    label: 'Married + 3 children',
    incomes: [70_000, 40_000],
    monthlyCostOfLiving: 10_660,
  },
  {
    id: 'single1Child',
    label: 'Single + 1 child',
    incomes: [42_124],
    monthlyCostOfLiving: 5_630,
  },
  {
    id: 'single2Children',
    label: 'Single + 2 children',
    incomes: [42_124],
    monthlyCostOfLiving: 7_110,
  },
  {
    id: 'single3Children',
    label: 'Single + 3 children',
    incomes: [42_124],
    monthlyCostOfLiving: 8_590,
  },
];
