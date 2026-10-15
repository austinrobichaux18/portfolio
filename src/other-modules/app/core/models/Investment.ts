import { HouseholdBudgetSnapshot } from './HouseholdBudget';

export type ContributionFrequency = 'monthly' | 'annually';

export type ContributionTiming = 'beginning' | 'end';

export type CompoundFrequency =
  'annually' | 'semiannually' | 'quarterly' | 'monthly' | 'daily' | 'continuously';

export interface ContributionBoost {
  id: string;
  /** The age at which this boost starts (used when currentAge is set). */
  atAge: number | null;
  /** The year-from-now at which this boost starts (fallback when currentAge is null). */
  atYear: number | null;
  /** Optional age at which this boost stops (used when currentAge is set). */
  endAtAge?: number | null;
  /** Optional year-from-now at which this boost stops (fallback when currentAge is null). */
  endAtYear?: number | null;
  /** Stored per month whether entered monthly or yearly; for a one-time boost, the lump sum. */
  additionalMonthlyAmount: number;
  /** When true, the boost is kept but left out of the projection (to compare with/without it). */
  disabled?: boolean;
  /** The unit the amount is shown/entered in; defaults to monthly. */
  amountFrequency?: 'monthly' | 'yearly' | 'once';
  label: string;
}

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
  /** Future step-ups in monthly contribution that start at a specific year in the simulation. */
  /**
   * Each boost is active from startYear up to (not including) endYear, when given. A oneTime boost
   * instead adds additionalMonthly once, as a lump sum, at the start of startYear.
   */
  contributionBoosts?: ContributionBoostSchedule[];
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
  /**
   * The full scenario as share-link query params (holds, today's-$ toggle, contribution boosts,
   * and everything else). Older saves lack it and load from the fields above instead.
   */
  scenario?: string;
}

/** A contribution boost as the calculation engine sees it (years counted from now). */
export interface ContributionBoostSchedule {
  startYear: number;
  endYear?: number;
  additionalMonthly: number;
  oneTime?: boolean;
}
