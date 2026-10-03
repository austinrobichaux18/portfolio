import { calculateInvestment } from './investment-calc';
import { InvestmentInputs } from '../../core/models/Investment';

const baseInputs: InvestmentInputs = {
  startingAmount: 1000,
  contributionAmount: 0,
  contributionFrequency: 'monthly',
  contributionTiming: 'end',
  annualInterestRatePercent: 0,
  compoundFrequency: 'annually',
  years: 5,
  months: 0,
};

describe('calculateInvestment', () => {
  it('leaves the balance unchanged with no interest and no contributions', () => {
    const result = calculateInvestment(baseInputs);
    expect(result.endingBalance).toBeCloseTo(1000);
    expect(result.totalContributions).toBe(0);
    expect(result.totalInterest).toBeCloseTo(0);
    expect(result.yearRows).toHaveLength(5);
  });

  it('compounds annually at a flat rate with no contributions', () => {
    const result = calculateInvestment({
      ...baseInputs,
      annualInterestRatePercent: 10,
      years: 1,
    });
    expect(result.endingBalance).toBeCloseTo(1100, 2);
    expect(result.totalInterest).toBeCloseTo(100, 2);
  });

  it('sums monthly contributions made at the end of each period with no growth', () => {
    const result = calculateInvestment({
      ...baseInputs,
      contributionAmount: 100,
      contributionFrequency: 'monthly',
      years: 1,
    });
    expect(result.totalContributions).toBeCloseTo(1200, 2);
    expect(result.endingBalance).toBeCloseTo(1000 + 1200, 2);
  });

  it('earns more interest when contributions land at the beginning of the period', () => {
    const endTiming = calculateInvestment({
      ...baseInputs,
      annualInterestRatePercent: 12,
      compoundFrequency: 'monthly',
      contributionAmount: 100,
      contributionFrequency: 'monthly',
      contributionTiming: 'end',
      years: 1,
    });
    const beginningTiming = calculateInvestment({
      ...baseInputs,
      annualInterestRatePercent: 12,
      compoundFrequency: 'monthly',
      contributionAmount: 100,
      contributionFrequency: 'monthly',
      contributionTiming: 'beginning',
      years: 1,
    });
    expect(beginningTiming.totalInterest).toBeGreaterThan(endTiming.totalInterest);
    expect(beginningTiming.totalContributions).toBeCloseTo(endTiming.totalContributions, 2);
  });

  it('produces year rows whose deposits and interest roll up to the totals', () => {
    const result = calculateInvestment({
      ...baseInputs,
      annualInterestRatePercent: 6,
      contributionAmount: 50,
      contributionFrequency: 'monthly',
      years: 3,
    });
    const depositSum = result.yearRows.reduce((sum, row) => sum + row.depositThisYear, 0);
    const interestSum = result.yearRows.reduce((sum, row) => sum + row.interestThisYear, 0);
    expect(depositSum).toBeCloseTo(result.totalContributions, 2);
    expect(interestSum).toBeCloseTo(result.totalInterest, 2);
    expect(result.yearRows[result.yearRows.length - 1].endingBalance).toBeCloseTo(
      result.endingBalance,
      2,
    );
  });

  it('handles a partial final year from a non-whole number of months', () => {
    const result = calculateInvestment({
      ...baseInputs,
      years: 1,
      months: 6,
    });
    expect(result.yearRows).toHaveLength(2);
    expect(result.yearRows[1].year).toBe(2);
  });

  it('withholds contributions during the delay window, then resumes normally after', () => {
    const result = calculateInvestment({
      ...baseInputs,
      contributionAmount: 100,
      contributionFrequency: 'monthly',
      years: 1,
      contributionDelayMonths: 6,
    });
    // 6 months withheld, 6 months contributed: 600 invested, not the full 1200.
    expect(result.totalContributions).toBeCloseTo(600, 2);
    expect(result.endingBalance).toBeCloseTo(1000 + 600, 2);
  });

  it('still grows the starting amount during the contribution delay window', () => {
    const result = calculateInvestment({
      ...baseInputs,
      annualInterestRatePercent: 12,
      compoundFrequency: 'monthly',
      contributionAmount: 100,
      contributionFrequency: 'monthly',
      years: 1,
      contributionDelayMonths: 12,
    });
    // No contributions land at all (delay covers the whole horizon), but interest still accrues.
    expect(result.totalContributions).toBeCloseTo(0, 2);
    expect(result.endingBalance).toBeGreaterThan(1000);
  });
});
