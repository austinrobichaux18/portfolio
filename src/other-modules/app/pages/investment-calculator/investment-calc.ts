import {
  CompoundFrequency,
  InvestmentInputs,
  InvestmentResult,
  InvestmentYearRow,
} from '../../core/models/Investment';

const COMPOUNDS_PER_YEAR: Record<Exclude<CompoundFrequency, 'continuously'>, number> = {
  annually: 1,
  semiannually: 2,
  quarterly: 4,
  monthly: 12,
  daily: 365,
};

/** Growth factor for one month, derived from the annual rate and compounding frequency. */
function monthlyGrowthFactor(
  annualRatePercent: number,
  compoundFrequency: CompoundFrequency,
): number {
  const r = annualRatePercent / 100;
  if (compoundFrequency === 'continuously') return Math.exp(r / 12);
  const n = COMPOUNDS_PER_YEAR[compoundFrequency];
  return Math.pow(1 + r / n, n / 12);
}

/** Discounts a future balance back to today's purchasing power at the given annual inflation rate. */
function toRealValue(nominalValue: number, inflationRatePercent: number, years: number): number {
  if (inflationRatePercent === 0) return nominalValue;
  return nominalValue / Math.pow(1 + inflationRatePercent / 100, years);
}

/**
 * Smallest whole number of months for the ending balance to reach `targetBalance`, or null if it
 * can't within `maxMonths`. With `inTodaysDollars`, the inflation-adjusted balance is compared
 * instead. Binary-searches over calculateInvestment, relying on the balance only ever growing with
 * time (rates are non-negative, and so are contributions unless set negative to withdraw). That
 * holds for the real balance too unless returns trail inflation. When the balance can peak and
 * fall (withdrawals, or real returns below zero), it scans month by month instead.
 */
export function monthsToReachBalance(
  inputs: Omit<InvestmentInputs, 'years' | 'months'>,
  targetBalance: number,
  maxMonths: number,
  inTodaysDollars = false,
): number | null {
  const balanceAt = (totalMonths: number) => {
    const result = calculateInvestment({ ...inputs, years: 0, months: totalMonths });
    return inTodaysDollars ? result.endingBalanceReal : result.endingBalance;
  };

  const yearlyGrowth = Math.pow(
    monthlyGrowthFactor(inputs.annualInterestRatePercent, inputs.compoundFrequency),
    12,
  );
  const realBalanceCanFall =
    inTodaysDollars && yearlyGrowth < 1 + (inputs.inflationRatePercent ?? 0) / 100;
  if (inputs.contributionAmount < 0 || realBalanceCanFall) {
    for (let month = 0; month <= maxMonths; month++) {
      if (balanceAt(month) >= targetBalance) return month;
    }
    return null;
  }

  if (balanceAt(maxMonths) < targetBalance) return null;
  let low = 0;
  let high = maxMonths;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (balanceAt(mid) >= targetBalance) high = mid;
    else low = mid + 1;
  }
  return low;
}

/** Longest horizon the calculator will simulate, so a huge entered number can't hang the page. */
export const MAX_HORIZON_YEARS = 200;

export function calculateInvestment(inputs: InvestmentInputs): InvestmentResult {
  const totalMonths = Math.min(
    MAX_HORIZON_YEARS * 12,
    Math.max(0, Math.round(inputs.years * 12 + inputs.months)),
  );
  const growth = monthlyGrowthFactor(inputs.annualInterestRatePercent, inputs.compoundFrequency);
  const inflationRatePercent = inputs.inflationRatePercent ?? 0;

  const boosts = inputs.contributionBoosts ?? [];
  let activeBoostMonthly = 0;

  let balance = inputs.startingAmount;
  let totalContributions = 0;
  let yearStartBalance = balance;
  let yearDeposit = 0;
  const yearRows: InvestmentYearRow[] = [];

  for (let month = 1; month <= totalMonths; month++) {
    const monthInYear = ((month - 1) % 12) + 1;
    const currentYear = Math.ceil(month / 12);
    const isYearEnd = monthInYear === 12 || month === totalMonths;

    // Boosts switch on/off at the start of a year: active from startYear until endYear (if any).
    if (monthInYear === 1) {
      activeBoostMonthly = boosts
        .filter(
          (b) => b.startYear <= currentYear && (b.endYear === undefined || currentYear < b.endYear),
        )
        .reduce((sum, b) => sum + b.additionalMonthly, 0);
    }

    let contributionNow = 0;
    if (inputs.contributionFrequency === 'monthly') {
      contributionNow = inputs.contributionAmount + activeBoostMonthly;
    } else if (
      (inputs.contributionTiming === 'beginning' && monthInYear === 1) ||
      (inputs.contributionTiming === 'end' && isYearEnd)
    ) {
      // Boosts are monthly amounts, so a once-a-year contribution gets 12 months' worth.
      contributionNow = inputs.contributionAmount + activeBoostMonthly * 12;
    }

    // While building savings/checking buffers, the contribution is diverted there instead.
    if (month <= (inputs.contributionDelayMonths ?? 0)) {
      contributionNow = 0;
    }

    // A negative contribution is a withdrawal, capped at what's left so the balance stops at $0.
    const deposit = () => {
      const amount = Math.max(contributionNow, -balance);
      balance += amount;
      totalContributions += amount;
      yearDeposit += amount;
    };

    if (inputs.contributionTiming === 'beginning') deposit();

    balance *= growth;

    if (inputs.contributionTiming === 'end') deposit();

    if (isYearEnd) {
      const year = Math.ceil(month / 12);
      yearRows.push({
        year,
        depositThisYear: yearDeposit,
        interestThisYear: balance - yearStartBalance - yearDeposit,
        endingBalance: balance,
        endingBalanceReal: toRealValue(balance, inflationRatePercent, year),
      });
      yearStartBalance = balance;
      yearDeposit = 0;
    }
  }

  return {
    startingAmount: inputs.startingAmount,
    endingBalance: balance,
    endingBalanceReal: toRealValue(balance, inflationRatePercent, totalMonths / 12),
    totalContributions,
    totalInterest: balance - inputs.startingAmount - totalContributions,
    yearRows,
  };
}
