import type { InvestmentCalculator } from './investment-calculator';

/**
 * One calculator input as a URL query parameter. The same table drives the shareable link, the
 * WebMCP tools AI agents call, and the parameter docs, so they can't drift apart.
 */
export interface ShareParam {
  key: string;
  description: string;
  /** Allowed values, for enum-like params. */
  values?: readonly string[];
  /** The current value as a string, or null to leave it out of the link (empty/unused). */
  read: (c: InvestmentCalculator) => string | null;
  apply: (c: InvestmentCalculator, raw: string, all: ReadonlyMap<string, string>) => void;
}

const num = (value: number): string => String(Math.round(value * 100) / 100);

const nonZero = (value: number): string | null => (value > 0 ? num(value) : null);

const goalHoldTargetKey: Record<string, string | undefined> = {
  age: 'retirementAge',
  amount: 'goalAmount',
  withdrawal: 'goalWithdrawal',
};

/** Listed in apply order — later params can depend on earlier ones (e.g. age before boosts). */
export const SHARE_PARAMS: readonly ShareParam[] = [
  {
    key: 'startingAmount',
    description: 'Starting balance in dollars.',
    read: (c) => num(c.startingAmount()),
    apply: (c, raw) => c.setStartingAmount(raw),
  },
  {
    key: 'contribution',
    description:
      'Contribution amount in dollars, per contributionFrequency. Negative withdraws that much ' +
      'each period instead (the balance stops at $0).',
    read: (c) => num(c.contributionAmount()),
    apply: (c, raw) => c.setContributionAmount(raw),
  },
  {
    key: 'contributionFrequency',
    description: 'How often the contribution is made.',
    values: ['monthly', 'annually'],
    read: (c) => c.contributionFrequency(),
    apply: (c, raw) => c.setContributionFrequency(raw),
  },
  {
    key: 'contributionTiming',
    description: 'Whether contributions land at the start or end of each period.',
    values: ['end', 'beginning'],
    read: (c) => c.contributionTiming(),
    apply: (c, raw) => c.setContributionTiming(raw),
  },
  {
    key: 'interestRate',
    description: 'Annual return, in percent (10 = 10%).',
    read: (c) => num(c.annualInterestRatePercent()),
    apply: (c, raw) => c.setAnnualInterestRatePercent(raw),
  },
  {
    key: 'compounding',
    description: 'Compounding frequency.',
    values: ['annually', 'semiannually', 'quarterly', 'monthly', 'daily', 'continuously'],
    read: (c) => c.compoundFrequency(),
    apply: (c, raw) => c.setCompoundFrequency(raw),
  },
  {
    key: 'inflationRate',
    description: "Annual inflation, in percent, used for today's-dollars figures.",
    read: (c) => num(c.inflationRatePercent()),
    apply: (c, raw) => c.setInflationRatePercent(raw),
  },
  {
    key: 'withdrawalRate',
    description: 'Yearly withdrawal rate in retirement, in percent of the balance.',
    read: (c) => num(c.withdrawalRatePercent()),
    apply: (c, raw) => c.setWithdrawalRatePercent(raw),
  },
  {
    key: 'currentAge',
    description: 'Current age in years. Empty to clear it.',
    read: (c) => {
      const age = c.currentAge();
      return age === null ? '' : String(age);
    },
    apply: (c, raw) => c.setCurrentAge(raw),
  },
  {
    key: 'incomes',
    description:
      'Household incomes, comma-separated. Each is yearly:<amount>, monthly:<amount>, or ' +
      'hourly:<rate>:<hoursPerWeek>:<weeksPerYear>.',
    read: (c) => c.incomeSpecs(),
    apply: (c, raw) => c.setIncomesFromSpecs(raw),
  },
  {
    key: 'state',
    description:
      "Two-letter U.S. state code. Fills that state's tax rate and average cost of living " +
      '(stateTaxRate/costOfLiving override them).',
    read: (c) => c.selectedStateCode() || null,
    apply: (c, raw) => c.onStateSelected(raw.toUpperCase()),
  },
  {
    key: 'stateTaxRate',
    description: 'State income tax rate, in percent.',
    read: (c) => num(c.stateTaxRatePercent()),
    apply: (c, raw) => c.setStateTaxRatePercent(raw),
  },
  {
    key: 'withholdings',
    description: 'Paycheck withholdings (401k, insurance, etc.) per withholdingsFrequency.',
    read: (c) => nonZero(c.withholdingsAmount()),
    apply: (c, raw) => c.setWithholdingsAmount(raw),
  },
  {
    key: 'withholdingsFrequency',
    description: 'Pay period the withholdings amount is per.',
    values: ['weekly', 'biweekly', 'semimonthly', 'monthly', 'annually'],
    read: (c) => (c.withholdingsAmount() > 0 ? c.withholdingsFrequency() : null),
    apply: (c, raw) => c.setWithholdingsFrequency(raw),
  },
  {
    key: 'costOfLiving',
    description: 'Monthly cost of living in dollars.',
    read: (c) => num(c.monthlyCostOfLiving()),
    apply: (c, raw) => c.setMonthlyCostOfLiving(raw),
  },
  {
    key: 'checking',
    description: 'Current checking balance (toward a 3-month buffer).',
    read: (c) => nonZero(c.currentCheckingBalance()),
    apply: (c, raw) => c.setCurrentCheckingBalance(raw),
  },
  {
    key: 'savings',
    description: 'Current HYSA/savings balance (toward a 6-month buffer).',
    read: (c) => nonZero(c.currentSavingsBalance()),
    apply: (c, raw) => c.setCurrentSavingsBalance(raw),
  },
  {
    key: 'ignoreSaved',
    description: '1 to skip the checking/HYSA buffers so contributions invest from day one.',
    values: ['0', '1'],
    read: (c) => (c.ignoreAlreadySaved() ? '1' : null),
    apply: (c, raw) => c.setIgnoreAlreadySaved(raw === '1' || raw === 'true'),
  },
  {
    key: 'boosts',
    description:
      'Future contribution increases, |-separated. Each is age:<age>:<extraMonthly>:<label> or ' +
      'year:<yearsFromNow>:<extraMonthly>:<label>; add -<end> to stop it; suffix the amount with y for yearly, e.g. age:50-60:6000y:Side job.',
    read: (c) => c.boostSpecs(),
    apply: (c, raw) => c.setBoostsFromSpecs(raw),
  },
  {
    key: 'years',
    description: 'Time horizon, whole years (max 200).',
    read: (c) => String(c.years()),
    apply: (c, raw) => c.setYears(raw),
  },
  {
    key: 'months',
    description: 'Extra months on top of years (0-11).',
    read: (c) => String(c.months()),
    apply: (c, raw) => c.setMonths(raw),
  },
  {
    key: 'todaysDollars',
    description: "1 to read goalAmount/goalWithdrawal in today's (inflation-adjusted) dollars.",
    values: ['0', '1'],
    read: (c) => (c.goalsInTodaysDollars() ? '1' : null),
    apply: (c, raw) => c.setGoalsInTodaysDollars(raw === '1' || raw === 'true'),
  },
  {
    key: 'retirementAge',
    description:
      'Target retirement age. Setting it holds the age fixed and derives the time horizon ' +
      '(needs currentAge).',
    read: (c) => (c.heldGoal() === 'age' ? String(c.retirementAgeDisplay()) : null),
    apply: (c, raw) => c.setRetirementAge(raw),
  },
  {
    key: 'goalAmount',
    description:
      'Target balance in dollars. Setting it holds the goal fixed and solves for the time ' +
      'horizon needed to reach it.',
    read: (c) => (c.heldGoal() === 'amount' ? String(c.goalAmountDisplay()) : null),
    apply: (c, raw) => c.setGoalAmount(raw),
  },
  {
    key: 'goalWithdrawal',
    description:
      'Target yearly withdrawal in dollars (excludes Social Security). Setting it holds the goal ' +
      'fixed and solves for the time horizon.',
    read: (c) => (c.heldGoal() === 'withdrawal' ? String(c.goalWithdrawalDisplay()) : null),
    apply: (c, raw) => c.setGoalWithdrawal(raw),
  },
  {
    key: 'hold',
    description:
      'Which linked field stays fixed when other inputs change. Implied by retirementAge/' +
      'goalAmount/goalWithdrawal; on its own it locks in that field\'s current value.',
    values: ['horizon', 'age', 'amount', 'withdrawal'],
    read: (c) => (c.heldGoal() === 'horizon' ? null : c.heldGoal()),
    apply: (c, raw, all) => {
      const targetKey = goalHoldTargetKey[raw];
      if (raw === 'horizon') c.setHeldGoal('horizon', true);
      else if (targetKey && !all.has(targetKey)) {
        c.setHeldGoal(raw as 'age' | 'amount' | 'withdrawal', true);
      }
    },
  },
];

const SHARE_KEYS = new Set(SHARE_PARAMS.map((p) => p.key));

/** The calculator's current inputs as query parameters, in schema order, skipping unused ones. */
export function buildShareParams(c: InvestmentCalculator): URLSearchParams {
  const params = new URLSearchParams();
  for (const p of SHARE_PARAMS) {
    const value = p.read(c);
    if (value !== null) params.set(p.key, value);
  }
  return params;
}

/**
 * Applies whichever known params are present, leaving everything else as-is. Unknown keys and
 * out-of-range enum values are ignored. Returns the keys that were applied.
 */
export function applyShareParams(
  c: InvestmentCalculator,
  input: URLSearchParams | Record<string, unknown>,
): string[] {
  const entries =
    input instanceof URLSearchParams
      ? [...input.entries()]
      : Object.entries(input).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)]);
  const all = new Map(entries.filter(([k]) => SHARE_KEYS.has(k)) as [string, string][]);

  const applied: string[] = [];
  for (const p of SHARE_PARAMS) {
    const raw = all.get(p.key);
    if (raw === undefined) continue;
    const value = raw.trim();
    if (p.values && !p.values.includes(value)) continue;
    p.apply(c, value, all);
    applied.push(p.key);
  }
  return applied;
}
