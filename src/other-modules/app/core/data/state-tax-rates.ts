import { StateTaxRate } from '../models/HouseholdBudget';

/**
 * Each state's top (or flat, for the many states that use one) marginal individual income tax
 * rate, per the Tax Foundation's 2025 State Individual Income Tax Rates report
 * (https://taxfoundation.org/data/all/state/state-income-tax-rates/). States with no wage income
 * tax (including Washington, whose tax applies only to capital gains) are listed at 0.
 *
 * This is a flat-rate approximation, not a bracket calculation — it overstates the burden for
 * states with graduated brackets (e.g. California, New York) at incomes below their top bracket.
 * The field this prefills stays editable so users can correct it.
 *
 * `avgMonthlyCostOfLiving` scales the national average household expenditure — $78,535/year per
 * the BLS Consumer Expenditure Survey, 2024 (https://www.bls.gov/news.release/pdf/cesan.pdf) — by
 * each state's Q2 2026 Cost of Living Index from the Missouri Economic Research and Information
 * Center (https://meric.mo.gov/data/cost-living-data-series), rounded to the nearest $10. It's a
 * rough, state-level average, not a city- or household-size-specific figure — the field it
 * prefills stays editable.
 */
export const STATE_TAX_RATES: StateTaxRate[] = [
  { code: 'AL', name: 'Alabama', rate: 5.0, avgMonthlyCostOfLiving: 5630 },
  { code: 'AK', name: 'Alaska', rate: 0, avgMonthlyCostOfLiving: 8150 },
  { code: 'AZ', name: 'Arizona', rate: 2.5, avgMonthlyCostOfLiving: 7110 },
  { code: 'AR', name: 'Arkansas', rate: 3.9, avgMonthlyCostOfLiving: 5820 },
  { code: 'CA', name: 'California', rate: 13.3, avgMonthlyCostOfLiving: 9180 },
  { code: 'CO', name: 'Colorado', rate: 4.4, avgMonthlyCostOfLiving: 6720 },
  { code: 'CT', name: 'Connecticut', rate: 6.99, avgMonthlyCostOfLiving: 6780 },
  { code: 'DE', name: 'Delaware', rate: 6.6, avgMonthlyCostOfLiving: 6580 },
  { code: 'DC', name: 'District of Columbia', rate: 10.75, avgMonthlyCostOfLiving: 8760 },
  { code: 'FL', name: 'Florida', rate: 0, avgMonthlyCostOfLiving: 6600 },
  { code: 'GA', name: 'Georgia', rate: 5.39, avgMonthlyCostOfLiving: 5900 },
  { code: 'HI', name: 'Hawaii', rate: 11.0, avgMonthlyCostOfLiving: 12160 },
  { code: 'ID', name: 'Idaho', rate: 5.695, avgMonthlyCostOfLiving: 6510 },
  { code: 'IL', name: 'Illinois', rate: 4.95, avgMonthlyCostOfLiving: 6180 },
  { code: 'IN', name: 'Indiana', rate: 3.0, avgMonthlyCostOfLiving: 5870 },
  { code: 'IA', name: 'Iowa', rate: 3.8, avgMonthlyCostOfLiving: 5630 },
  { code: 'KS', name: 'Kansas', rate: 5.58, avgMonthlyCostOfLiving: 5700 },
  { code: 'KY', name: 'Kentucky', rate: 4.0, avgMonthlyCostOfLiving: 6150 },
  { code: 'LA', name: 'Louisiana', rate: 3.0, avgMonthlyCostOfLiving: 5980 },
  { code: 'ME', name: 'Maine', rate: 7.15, avgMonthlyCostOfLiving: 7390 },
  { code: 'MD', name: 'Maryland', rate: 5.75, avgMonthlyCostOfLiving: 7770 },
  { code: 'MA', name: 'Massachusetts', rate: 9.0, avgMonthlyCostOfLiving: 9690 },
  { code: 'MI', name: 'Michigan', rate: 4.25, avgMonthlyCostOfLiving: 6030 },
  { code: 'MN', name: 'Minnesota', rate: 9.85, avgMonthlyCostOfLiving: 6110 },
  { code: 'MS', name: 'Mississippi', rate: 4.4, avgMonthlyCostOfLiving: 5720 },
  { code: 'MO', name: 'Missouri', rate: 4.7, avgMonthlyCostOfLiving: 5770 },
  { code: 'MT', name: 'Montana', rate: 5.9, avgMonthlyCostOfLiving: 6940 },
  { code: 'NE', name: 'Nebraska', rate: 5.2, avgMonthlyCostOfLiving: 5900 },
  { code: 'NV', name: 'Nevada', rate: 0, avgMonthlyCostOfLiving: 6900 },
  { code: 'NH', name: 'New Hampshire', rate: 0, avgMonthlyCostOfLiving: 7100 },
  { code: 'NJ', name: 'New Jersey', rate: 10.75, avgMonthlyCostOfLiving: 7800 },
  { code: 'NM', name: 'New Mexico', rate: 5.9, avgMonthlyCostOfLiving: 5900 },
  { code: 'NY', name: 'New York', rate: 10.9, avgMonthlyCostOfLiving: 8680 },
  { code: 'NC', name: 'North Carolina', rate: 4.25, avgMonthlyCostOfLiving: 6330 },
  { code: 'ND', name: 'North Dakota', rate: 2.5, avgMonthlyCostOfLiving: 5920 },
  { code: 'OH', name: 'Ohio', rate: 3.5, avgMonthlyCostOfLiving: 6090 },
  { code: 'OK', name: 'Oklahoma', rate: 4.75, avgMonthlyCostOfLiving: 5430 },
  { code: 'OR', name: 'Oregon', rate: 9.9, avgMonthlyCostOfLiving: 7230 },
  { code: 'PA', name: 'Pennsylvania', rate: 3.07, avgMonthlyCostOfLiving: 6240 },
  { code: 'RI', name: 'Rhode Island', rate: 5.99, avgMonthlyCostOfLiving: 7260 },
  { code: 'SC', name: 'South Carolina', rate: 6.2, avgMonthlyCostOfLiving: 6070 },
  { code: 'SD', name: 'South Dakota', rate: 0, avgMonthlyCostOfLiving: 6120 },
  { code: 'TN', name: 'Tennessee', rate: 0, avgMonthlyCostOfLiving: 5870 },
  { code: 'TX', name: 'Texas', rate: 0, avgMonthlyCostOfLiving: 5940 },
  { code: 'UT', name: 'Utah', rate: 4.55, avgMonthlyCostOfLiving: 6440 },
  { code: 'VT', name: 'Vermont', rate: 8.75, avgMonthlyCostOfLiving: 7420 },
  { code: 'VA', name: 'Virginia', rate: 5.75, avgMonthlyCostOfLiving: 6480 },
  { code: 'WA', name: 'Washington', rate: 0, avgMonthlyCostOfLiving: 7530 },
  { code: 'WV', name: 'West Virginia', rate: 4.82, avgMonthlyCostOfLiving: 5690 },
  { code: 'WI', name: 'Wisconsin', rate: 7.65, avgMonthlyCostOfLiving: 6260 },
  { code: 'WY', name: 'Wyoming', rate: 0, avgMonthlyCostOfLiving: 6180 },
];
