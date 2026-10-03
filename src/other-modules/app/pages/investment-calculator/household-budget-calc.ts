import {
  FilingStatus,
  HouseholdBudgetInputs,
  HouseholdBudgetResult,
  IncomeEntry,
} from '../../core/models/HouseholdBudget';

export function incomeEntryAnnualAmount(entry: IncomeEntry): number {
  switch (entry.mode) {
    case 'yearly':
      return entry.yearlyAmount;
    case 'monthly':
      return entry.monthlyAmount * 12;
    case 'hourly':
      return entry.hourlyRate * entry.hoursPerWeek * entry.weeksPerYear;
  }
}

interface TaxBracket {
  rate: number;
  upTo: number;
}

/** 2025 IRS federal income tax brackets (https://taxfoundation.org/data/all/federal/2025-tax-brackets/). */
const FEDERAL_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { rate: 0.1, upTo: 11_925 },
    { rate: 0.12, upTo: 48_475 },
    { rate: 0.22, upTo: 103_350 },
    { rate: 0.24, upTo: 197_300 },
    { rate: 0.32, upTo: 250_525 },
    { rate: 0.35, upTo: 626_350 },
    { rate: 0.37, upTo: Infinity },
  ],
  marriedFilingJointly: [
    { rate: 0.1, upTo: 23_850 },
    { rate: 0.12, upTo: 96_950 },
    { rate: 0.22, upTo: 206_700 },
    { rate: 0.24, upTo: 394_600 },
    { rate: 0.32, upTo: 501_050 },
    { rate: 0.35, upTo: 751_600 },
    { rate: 0.37, upTo: Infinity },
  ],
};

/** 2025 standard deduction amounts (same source as the brackets above). */
const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15_750,
  marriedFilingJointly: 31_500,
};

/** 2025 Social Security wage base and FICA rates (SSA; employee share only). */
const SOCIAL_SECURITY_WAGE_BASE = 176_100;
const SOCIAL_SECURITY_RATE = 0.062;
const MEDICARE_RATE = 0.0145;

function computeBracketTax(taxableIncome: number, brackets: TaxBracket[]): number {
  let tax = 0;
  let previousThreshold = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= previousThreshold) break;
    tax += (Math.min(taxableIncome, bracket.upTo) - previousThreshold) * bracket.rate;
    previousThreshold = bracket.upTo;
  }
  return tax;
}

/** Social Security is capped per earner at the wage base; Medicare is not. */
function computeFica(wage: number): number {
  return Math.min(wage, SOCIAL_SECURITY_WAGE_BASE) * SOCIAL_SECURITY_RATE + wage * MEDICARE_RATE;
}

/**
 * Treats each nonzero income entry as its own earner — accurate for FICA's per-person Social
 * Security cap, and a reasonable stand-in for filing status (2+ incomes implies a joint
 * household), though it will overstate a single person's deduction/brackets if they split one
 * income across multiple entries (e.g. a job plus a side hustle) rather than one entry per person.
 */
export function calculateHouseholdBudget(inputs: HouseholdBudgetInputs): HouseholdBudgetResult {
  const earners = inputs.incomes.filter((income) => income > 0);
  const filingStatus: FilingStatus = earners.length > 1 ? 'marriedFilingJointly' : 'single';
  const grossHouseholdIncome = earners.reduce((sum, income) => sum + income, 0);

  const taxableIncome = Math.max(0, grossHouseholdIncome - STANDARD_DEDUCTION[filingStatus]);
  const federalTax = computeBracketTax(taxableIncome, FEDERAL_BRACKETS[filingStatus]);
  const federalEffectiveRatePercent =
    grossHouseholdIncome > 0 ? Math.round((federalTax / grossHouseholdIncome) * 100) : 0;

  const ficaTax = earners.reduce((sum, income) => sum + computeFica(income), 0);
  const stateTax = grossHouseholdIncome * (inputs.stateTaxRatePercent / 100);

  const totalTax = federalTax + ficaTax + stateTax;
  const totalEffectiveTaxRatePercent =
    grossHouseholdIncome > 0 ? Math.round((totalTax / grossHouseholdIncome) * 1000) / 10 : 0;

  const postTaxIncome = Math.max(0, grossHouseholdIncome - federalTax - ficaTax - stateTax);
  const annualCostOfLiving = inputs.monthlyCostOfLiving * 12;
  const discretionaryAnnual = postTaxIncome - inputs.annualWithholdings - annualCostOfLiving;

  return {
    filingStatus,
    grossHouseholdIncome,
    federalTax,
    federalEffectiveRatePercent,
    ficaTax,
    stateTax,
    totalEffectiveTaxRatePercent,
    postTaxIncome,
    annualWithholdings: inputs.annualWithholdings,
    annualCostOfLiving,
    discretionaryAnnual,
    discretionaryMonthly: discretionaryAnnual / 12,
  };
}
