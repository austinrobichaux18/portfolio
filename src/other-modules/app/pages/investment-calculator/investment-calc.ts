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
function monthlyGrowthFactor(annualRatePercent: number, compoundFrequency: CompoundFrequency): number {
  const r = annualRatePercent / 100;
  if (compoundFrequency === 'continuously') return Math.exp(r / 12);
  const n = COMPOUNDS_PER_YEAR[compoundFrequency];
  return Math.pow(1 + r / n, n / 12);
}

export function calculateInvestment(inputs: InvestmentInputs): InvestmentResult {
  const totalMonths = Math.max(0, Math.round(inputs.years * 12 + inputs.months));
  const growth = monthlyGrowthFactor(inputs.annualInterestRatePercent, inputs.compoundFrequency);

  let balance = inputs.startingAmount;
  let totalContributions = 0;
  let yearStartBalance = balance;
  let yearDeposit = 0;
  const yearRows: InvestmentYearRow[] = [];

  for (let month = 1; month <= totalMonths; month++) {
    const monthInYear = ((month - 1) % 12) + 1;
    const isYearEnd = monthInYear === 12 || month === totalMonths;

    let contributionNow = 0;
    if (inputs.contributionFrequency === 'monthly') {
      contributionNow = inputs.contributionAmount;
    } else if (
      (inputs.contributionTiming === 'beginning' && monthInYear === 1) ||
      (inputs.contributionTiming === 'end' && isYearEnd)
    ) {
      contributionNow = inputs.contributionAmount;
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
      yearRows.push({
        year: Math.ceil(month / 12),
        depositThisYear: yearDeposit,
        interestThisYear: balance - yearStartBalance - yearDeposit,
        endingBalance: balance,
      });
      yearStartBalance = balance;
      yearDeposit = 0;
    }
  }

  return {
    startingAmount: inputs.startingAmount,
    endingBalance: balance,
    totalContributions,
    totalInterest: balance - inputs.startingAmount - totalContributions,
    yearRows,
  };
}
