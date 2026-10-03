import { calculateHouseholdBudget } from './household-budget-calc';
import { HouseholdBudgetInputs } from '../../core/models/HouseholdBudget';

const baseInputs: HouseholdBudgetInputs = {
  incomes: [],
  stateTaxRatePercent: 0,
  annualWithholdings: 0,
  monthlyCostOfLiving: 0,
};

describe('calculateHouseholdBudget', () => {
  it('owes no tax and has no discretionary income with zero inputs', () => {
    const result = calculateHouseholdBudget(baseInputs);
    expect(result.grossHouseholdIncome).toBe(0);
    expect(result.federalTax).toBe(0);
    expect(result.ficaTax).toBe(0);
    expect(result.discretionaryAnnual).toBe(0);
  });

  it('uses single filing status and brackets with a single income entry', () => {
    const result = calculateHouseholdBudget({ ...baseInputs, incomes: [80_000] });
    expect(result.filingStatus).toBe('single');
    // Taxable income: 80,000 - 15,750 = 64,250, spanning the 10/12/22% brackets.
    const expectedFederalTax = 11_925 * 0.1 + (48_475 - 11_925) * 0.12 + (64_250 - 48_475) * 0.22;
    expect(result.federalTax).toBeCloseTo(expectedFederalTax, 2);
  });

  it('switches to married-filing-jointly brackets once a second income entry is added', () => {
    const result = calculateHouseholdBudget({ ...baseInputs, incomes: [80_000, 60_000] });
    expect(result.filingStatus).toBe('marriedFilingJointly');
    expect(result.grossHouseholdIncome).toBe(140_000);
  });

  it('ignores zero-value income entries when counting earners', () => {
    const result = calculateHouseholdBudget({ ...baseInputs, incomes: [80_000, 0, 0] });
    expect(result.filingStatus).toBe('single');
    expect(result.grossHouseholdIncome).toBe(80_000);
  });

  it('caps Social Security tax at the wage base independently per income entry', () => {
    const result = calculateHouseholdBudget({ ...baseInputs, incomes: [200_000, 200_000] });
    // Each earner's Social Security portion caps at 176,100 * 6.2%; Medicare is uncapped at 1.45%.
    const ficaPerEarner = 176_100 * 0.062 + 200_000 * 0.0145;
    expect(result.ficaTax).toBeCloseTo(ficaPerEarner * 2, 2);
  });

  it('sums more than two income entries for gross household income', () => {
    const result = calculateHouseholdBudget({
      ...baseInputs,
      incomes: [50_000, 30_000, 20_000, 10_000],
    });
    expect(result.grossHouseholdIncome).toBe(110_000);
  });

  it('applies the state rate as a flat percentage of gross household income', () => {
    const result = calculateHouseholdBudget({
      ...baseInputs,
      incomes: [100_000],
      stateTaxRatePercent: 5,
    });
    expect(result.stateTax).toBeCloseTo(5_000, 2);
  });

  it('subtracts withholdings and cost of living from post-tax income', () => {
    const result = calculateHouseholdBudget({
      ...baseInputs,
      incomes: [100_000],
      annualWithholdings: 10_000,
      monthlyCostOfLiving: 3_000,
    });
    expect(result.annualCostOfLiving).toBe(36_000);
    expect(result.discretionaryAnnual).toBeCloseTo(result.postTaxIncome - 10_000 - 36_000, 2);
    expect(result.discretionaryMonthly).toBeCloseTo(result.discretionaryAnnual / 12, 2);
  });

  it('allows discretionary income to go negative when expenses exceed take-home pay', () => {
    const result = calculateHouseholdBudget({
      ...baseInputs,
      incomes: [30_000],
      monthlyCostOfLiving: 5_000,
    });
    expect(result.discretionaryAnnual).toBeLessThan(0);
  });
});
