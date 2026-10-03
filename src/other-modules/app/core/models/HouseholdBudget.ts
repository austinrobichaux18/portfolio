export type FilingStatus = 'single' | 'marriedFilingJointly';

export interface StateTaxRate {
  code: string;
  name: string;
  /** Percent (e.g. 5 for 5%), not a decimal — the state's top/flat marginal income tax rate. */
  rate: number;
  /** Rough average household cost of living for the state, scaled from a national baseline. */
  avgMonthlyCostOfLiving: number;
}

export type IncomeMode = 'yearly' | 'monthly' | 'hourly';

export interface IncomeEntry {
  id: string;
  mode: IncomeMode;
  yearlyAmount: number;
  monthlyAmount: number;
  hourlyRate: number;
  hoursPerWeek: number;
  weeksPerYear: number;
}

export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'annually';

/** A snapshot of the "How Much Can You Invest?" widget, saved alongside a history run. */
export interface HouseholdBudgetSnapshot {
  incomeEntries: IncomeEntry[];
  selectedStateCode: string;
  stateTaxRatePercent: number;
  withholdingsAmount: number;
  withholdingsFrequency: PayFrequency;
  monthlyCostOfLiving: number;
  currentCheckingBalance: number;
  currentSavingsBalance: number;
  /** When true, the checking/HYSA buffers are ignored and contributions never get delayed. */
  ignoreAlreadySaved?: boolean;
}

export interface HouseholdPreset {
  id: string;
  label: string;
  /** Yearly amount for each income entry the preset creates — one entry per value. */
  incomes: number[];
  monthlyCostOfLiving: number;
}

export interface HouseholdBudgetInputs {
  /** Each entry's own annual income — treated as a separate earner for FICA's per-person cap. */
  incomes: number[];
  stateTaxRatePercent: number;
  annualWithholdings: number;
  monthlyCostOfLiving: number;
}

export interface HouseholdBudgetResult {
  filingStatus: FilingStatus;
  grossHouseholdIncome: number;
  federalTax: number;
  federalEffectiveRatePercent: number;
  ficaTax: number;
  stateTax: number;
  /** (federalTax + ficaTax + stateTax) / grossHouseholdIncome — the household's real all-in tax bite. */
  totalEffectiveTaxRatePercent: number;
  postTaxIncome: number;
  annualWithholdings: number;
  annualCostOfLiving: number;
  discretionaryAnnual: number;
  discretionaryMonthly: number;
}
