export type ContributionFrequency = 'monthly' | 'annually';

export type ContributionTiming = 'beginning' | 'end';

export type CompoundFrequency =
  | 'annually'
  | 'semiannually'
  | 'quarterly'
  | 'monthly'
  | 'daily'
  | 'continuously';

export interface InvestmentInputs {
  startingAmount: number;
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  contributionTiming: ContributionTiming;
  annualInterestRatePercent: number;
  compoundFrequency: CompoundFrequency;
  years: number;
  months: number;
}

export interface InvestmentYearRow {
  year: number;
  depositThisYear: number;
  interestThisYear: number;
  endingBalance: number;
}

export interface InvestmentResult {
  startingAmount: number;
  endingBalance: number;
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
}
