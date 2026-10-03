import { HouseholdBudgetSnapshot } from './HouseholdBudget';

export type ContributionFrequency = 'monthly' | 'annually';

export type ContributionTiming = 'beginning' | 'end';

export type CompoundFrequency =
  'annually' | 'semiannually' | 'quarterly' | 'monthly' | 'daily' | 'continuously';

export interface InvestmentInputs {
  startingAmount: number;
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  contributionTiming: ContributionTiming;
  annualInterestRatePercent: number;
  compoundFrequency: CompoundFrequency;
  years: number;
  months: number;
  /** Months where the contribution is diverted to savings/checking buffers instead of invested. */
  contributionDelayMonths?: number;
  /** Annual inflation rate used to express balances in today's purchasing power. */
  inflationRatePercent?: number;
}

export interface InvestmentYearRow {
  year: number;
  depositThisYear: number;
  interestThisYear: number;
  endingBalance: number;
  /** Ending balance discounted by inflation back to today's purchasing power. */
  endingBalanceReal: number;
}

export interface InvestmentResult {
  startingAmount: number;
  endingBalance: number;
  /** Ending balance discounted by inflation back to today's purchasing power. */
  endingBalanceReal: number;
  totalContributions: number;
  totalInterest: number;
  yearRows: InvestmentYearRow[];
}

export interface InvestmentRun {
  timestamp: string;
  inputs: InvestmentInputs;
  withdrawalRatePercent: number;
  currentAge: number | null;
  endingBalance: number;
  /** Only present when the "How Much Can You Invest?" widget had something entered. */
  householdBudget?: HouseholdBudgetSnapshot;
}
