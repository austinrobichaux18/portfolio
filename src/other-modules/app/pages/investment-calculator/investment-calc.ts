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

export function calculateInvestment(inputs: InvestmentInputs): InvestmentResult {
  const totalMonths = Math.max(0, Math.round(inputs.years * 12 + inputs.months));
  const growth = monthlyGrowthFactor(inputs.annualInterestRatePercent, inputs.compoundFrequency);
  const inflationRatePercent = inputs.inflationRatePercent ?? 0;

  const sortedBoosts = [...(inputs.contributionBoosts ?? [])].sort(
    (a, b) => a.startYear - b.startYear,
  );
  let nextBoostIndex = 0;
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

    // Apply any boosts that kick in at the start of this year.
    if (monthInYear === 1) {
      while (
        nextBoostIndex < sortedBoosts.length &&
        sortedBoosts[nextBoostIndex].startYear <= currentYear
      ) {
        activeBoostMonthly += sortedBoosts[nextBoostIndex].additionalMonthly;
        nextBoostIndex++;
      }
    }

    const effectiveMonthlyContribution = inputs.contributionAmount + activeBoostMonthly;

    let contributionNow = 0;
    if (inputs.contributionFrequency === 'monthly') {
      contributionNow = effectiveMonthlyContribution;
    } else if (
      (inputs.contributionTiming === 'beginning' && monthInYear === 1) ||
      (inputs.contributionTiming === 'end' && isYearEnd)
    ) {
      contributionNow = effectiveMonthlyContribution;
    }

    // While building savings/checking buffers, the contribution is diverted there instead.
    if (month <= (inputs.contributionDelayMonths ?? 0)) {
      contributionNow = 0;
    }

    if (inputs.contributionTiming === 'beginning') {
      balance += contributionNow;
      totalContributions += contributionNow;
      yearDeposit += contributionNow;
    }

    balance *= growth;

    if (inputs.contributionTiming === 'end') {
      balance += contributionNow;
      totalContributions += contributionNow;
      yearDeposit += contributionNow;
    }

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
