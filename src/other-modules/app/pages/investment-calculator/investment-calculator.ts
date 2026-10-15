import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CompoundFrequency,
  ContributionBoost,
  ContributionFrequency,
  ContributionTiming,
  ContributionBoostSchedule,
  InvestmentRun,
  InvestmentYearRow,
} from '../../core/models/Investment';
import {
  HouseholdBudgetSnapshot,
  IncomeEntry,
  IncomeMode,
  PayFrequency,
} from '../../core/models/HouseholdBudget';
import { STATE_TAX_RATES } from '../../core/data/state-tax-rates';
import { HOUSEHOLD_PRESETS } from '../../core/data/household-presets';
import { MAX_HORIZON_YEARS, calculateInvestment, monthsToReachBalance } from './investment-calc';
import { calculateHouseholdBudget, incomeEntryAnnualAmount } from './household-budget-calc';
import { loadHistory, saveHistory } from './investment-storage';
import { NumericValue } from './numeric-value';
import { applyShareParams, buildShareParams } from './investment-share';
import { registerInvestmentAgentTools } from './investment-agent-tools';

const MAX_INCOME_ENTRIES = 10;

function createIncomeEntry(yearlyAmount = 0): IncomeEntry {
  return {
    id: `income-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`,
    mode: 'yearly',
    yearlyAmount,
    monthlyAmount: 0,
    hourlyRate: 0,
    hoursPerWeek: 40,
    weeksPerYear: 52,
  };
}

function createBoostId(): string {
  return `boost-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const CHART_MARGIN = { top: 16, right: 16, bottom: 24, left: 56 };

const PIE_SIZE = 180;
const PIE_RADIUS = 80;
const PIE_CENTER = PIE_SIZE / 2;

const MILESTONES =[1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 10_000_000];

/** Social Security full retirement age for most people today, and its rough average annual benefit. */
const SS_FULL_RETIREMENT_AGE = 67;
const SS_AVERAGE_ANNUAL_BENEFIT = 25_000;

/** Average top marginal state income tax rate across all 50 states + DC, used as the default. */
const AVERAGE_STATE_TAX_RATE_PERCENT =
  STATE_TAX_RATES.reduce((sum, state) => sum + state.rate, 0) / STATE_TAX_RATES.length;

/** Default income and spending the budget widget starts with. */
const DEFAULT_YEARLY_INCOME = 70_000;
const DEFAULT_MONTHLY_COST_OF_LIVING = 45_000 / 12;

interface QuintileStat {
  label: string;
  incomeBeforeTaxes: number;
  effectiveTaxRatePercent: number;
  annualExpenditures: number;
}

/**
 * Mean income before taxes and mean annual expenditures per consumer unit, by quintile of the
 * income-before-taxes distribution — U.S. Bureau of Labor Statistics Consumer Expenditure Survey,
 * 2023 annual averages (https://www.bls.gov/cex/, via FRED series CXUINCBEFTXLB01*,
 * CXUTOTALEXPLB01*). Breaking the national averages out by income bracket, rather than blending
 * everyone into one figure, keeps a handful of very high earners from skewing what a typical
 * household at a given income level actually makes and spends.
 *
 * After-tax income isn't BLS's own after-tax series — that series prices before-tax and after-tax
 * quintiles independently rather than taxing the same households, which produces oddities like the
 * lowest quintile's after-tax income exceeding its before-tax income. Instead, each bracket's
 * before-tax income is reduced by a representative effective tax rate (combined federal income
 * tax, payroll tax, and average state tax) that rises with income, in line with published
 * effective-rate estimates (e.g. Tax Policy Center, ITEP).
 */
const INCOME_VS_SPENDING_BY_QUINTILE: QuintileStat[] = [
  { label: '0–20%', incomeBeforeTaxes: 15_596, effectiveTaxRatePercent: 11, annualExpenditures: 33_776 },
  { label: '20–40%', incomeBeforeTaxes: 40_751, effectiveTaxRatePercent: 15, annualExpenditures: 48_923 },
  { label: '40–60%', incomeBeforeTaxes: 71_057, effectiveTaxRatePercent: 18, annualExpenditures: 65_487 },
  { label: '60–80%', incomeBeforeTaxes: 116_717, effectiveTaxRatePercent: 21, annualExpenditures: 87_922 },
  { label: '80–100%', incomeBeforeTaxes: 264_518, effectiveTaxRatePercent: 25, annualExpenditures: 150_093 },
];

type InfoPopoverKey =
  | 'withholdings'
  | 'costOfLiving'
  | 'quickFill'
  | 'effectiveTaxRate'
  | 'inflationRate'
  | 'discretionaryIncome';

type StateSortOrder = 'alphabetical' | 'taxRateAsc';

const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  annually: 1,
};

interface ChartBar {
  year: number;
  x: number;
  barWidth: number;
  contributionsY: number;
  contributionsHeight: number;
  interestY: number;
  interestHeight: number;
  principalAndContributions: number;
  interest: number;
  interestPercentOfTotal: number;
  endingBalance: number;
}

interface GrowthChart {
  bars: ChartBar[];
  width: number;
  height: number;
  left: number;
  gridLines: { y: number; label: string }[];
}

interface PieSlice {
  label: string;
  value: number;
  percent: number;
  color: string;
  path: string;
  isFullCircle: boolean;
}

interface PieChart {
  slices: PieSlice[];
  size: number;
  center: number;
  radius: number;
}

/** Degrees measured clockwise from 12 o'clock, matching how pie slices are conventionally drawn. */
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

/** Parses a non-negative number from a text input, capped to 2 decimal places. */
function toNonNegativeNumber(raw: string): number {
  const value = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100) / 100;
}

/** Parses a number that may be negative (e.g. a contribution used as a withdrawal), 2 decimals. */
function toNumber(raw: string): number {
  const value = Number(raw.replace(/,/g, ''));
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

/** Parses a non-negative whole number from a text input (no decimal places). */
function toNonNegativeInt(raw: string): number {
  const value = Number(raw.replace(/,/g, ''));
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function toNonNegativeIntOrNull(raw: string): number | null {
  const trimmed = raw.replace(/,/g, '').trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

/** Which of the four linked horizon/goal fields stays fixed while other inputs change. */
export type HeldGoal = 'horizon' | 'age' | 'amount' | 'withdrawal';

@Component({
  selector: 'app-investment-calculator',
  imports: [DatePipe, NgTemplateOutlet, RouterLink, NumericValue],
  templateUrl: './investment-calculator.html',
  styleUrl: './investment-calculator.scss',
})
export class InvestmentCalculator {
  readonly formatCurrency = formatCurrency;

  readonly ssAverageAnnualBenefit = SS_AVERAGE_ANNUAL_BENEFIT;

  readonly incomeVsSpendingByQuintile = INCOME_VS_SPENDING_BY_QUINTILE.map((q) => {
    const incomeAfterTaxes = Math.round(q.incomeBeforeTaxes * (1 - q.effectiveTaxRatePercent / 100));
    return {
      ...q,
      incomeAfterTaxes,
      discretionaryIncome: incomeAfterTaxes - q.annualExpenditures,
    };
  });

  startingAmount = signal(0);

  contributionAmount = signal(774);

  contributionFrequency = signal<ContributionFrequency>('monthly');

  contributionTiming = signal<ContributionTiming>('end');

  annualInterestRatePercent = signal(10);

  compoundFrequency = signal<CompoundFrequency>('annually');

  /** The horizon as last typed into years/months — used directly while the horizon is held. */
  private manualHorizonMonths = signal(37 * 12);

  heldGoal = signal<HeldGoal>('horizon');

  /** The target kept fixed for the age/amount/withdrawal fields while that field is held. */
  private heldRetirementAge = signal(0);

  private heldGoalAmount = signal(0);

  private heldGoalWithdrawal = signal(0);

  /**
   * When on, the goal amount/withdrawal fields are in today's dollars (inflation-adjusted). Shared
   * by both fields' toggles so they always agree.
   */
  goalsInTodaysDollars = signal(false);

  /**
   * Total months for the held field's target, or null when it can't be reached within
   * MAX_HORIZON_YEARS (or doesn't apply, e.g. age held with no current age).
   */
  private solvedHorizonMonths = computed<number | null>(() => {
    const maxMonths = MAX_HORIZON_YEARS * 12;
    switch (this.heldGoal()) {
      case 'horizon':
        return this.manualHorizonMonths();
      case 'age': {
        const age = this.currentAge();
        if (age === null) return null;
        return Math.min(maxMonths, Math.max(0, (this.heldRetirementAge() - age) * 12));
      }
      case 'amount':
        return monthsToReachBalance(
          this.projectionInputs(),
          this.heldGoalAmount(),
          maxMonths,
          this.goalsInTodaysDollars(),
        );
      case 'withdrawal': {
        const rate = this.withdrawalRatePercent() / 100;
        if (rate <= 0) return null;
        return monthsToReachBalance(
          this.projectionInputs(),
          this.heldGoalWithdrawal() / rate,
          maxMonths,
          this.goalsInTodaysDollars(),
        );
      }
    }
  });

  /** Falls back to the last manually entered horizon when the held goal can't be solved. */
  private horizonMonths = computed(
    () => this.solvedHorizonMonths() ?? this.manualHorizonMonths(),
  );

  years = computed(() => Math.floor(this.horizonMonths() / 12));

  months = computed(() => this.horizonMonths() % 12);

  /** Set when the held goal amount/withdrawal can't be reached within MAX_HORIZON_YEARS. */
  goalUnreachable = computed(
    () =>
      (this.heldGoal() === 'amount' || this.heldGoal() === 'withdrawal') &&
      this.solvedHorizonMonths() === null,
  );

  /** Historical long-run U.S. inflation is roughly 3%; used to show balances in today's dollars. */
  inflationRatePercent = signal(3);

  withdrawalRatePercent = signal(3.5);

  currentAge = signal<number | null>(30);

  contributionBoosts = signal<ContributionBoost[]>([]);

  history = signal<InvestmentRun[]>(loadHistory());

  historyDescending = computed(() =>
    [...this.history()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  );

  readonly stateTaxRates = STATE_TAX_RATES;

  readonly householdPresets = HOUSEHOLD_PRESETS;

  incomeEntries = signal<IncomeEntry[]>([createIncomeEntry(DEFAULT_YEARLY_INCOME)]);

  incomeAnnualAmounts = computed(() => this.incomeEntries().map(incomeEntryAnnualAmount));

  canAddIncomeEntry = computed(() => this.incomeEntries().length < MAX_INCOME_ENTRIES);

  canRemoveIncomeEntry = computed(() => this.incomeEntries().length > 1);

  selectedStateCode = signal('');

  stateSortOrder = signal<StateSortOrder>('alphabetical');

  sortedStateTaxRates = computed(() => {
    const sorted = [...this.stateTaxRates];
    return this.stateSortOrder() === 'taxRateAsc'
      ? sorted.sort((a, b) => a.rate - b.rate)
      : sorted.sort((a, b) => a.name.localeCompare(b.name));
  });

  stateTaxRatePercent = signal(AVERAGE_STATE_TAX_RATE_PERCENT);

  withholdingsAmount = signal(0);

  withholdingsFrequency = signal<PayFrequency>('monthly');

  annualWithholdings = computed(
    () => this.withholdingsAmount() * PERIODS_PER_YEAR[this.withholdingsFrequency()],
  );

  /** Withholdings as monthly/yearly figures, regardless of the pay-period unit entered. */
  withholdingsBreakdown = computed(() => {
    const yearly = this.annualWithholdings();
    return { monthly: yearly / 12, yearly };
  });

  monthlyCostOfLiving = signal(DEFAULT_MONTHLY_COST_OF_LIVING);

  costOfLivingFrequency = signal<'monthly' | 'yearly'>('monthly');

  /** The cost-of-living figure shown/entered in whichever unit is currently selected. */
  costOfLivingDisplayAmount = computed(() =>
    this.costOfLivingFrequency() === 'yearly'
      ? this.monthlyCostOfLiving() * 12
      : this.monthlyCostOfLiving(),
  );

  yearlyCostOfLiving = computed(() => this.monthlyCostOfLiving() * 12);

  /** Cost of living as monthly/yearly figures, regardless of which unit is currently selected. */
  costOfLivingBreakdown = computed(() => ({
    monthly: this.monthlyCostOfLiving(),
    yearly: this.yearlyCostOfLiving(),
  }));

  /** Squishes the "How Much Can You Invest?" card down to a thin strip; starts open. */
  budgetCollapsed = signal(false);

  toggleBudgetCollapsed(): void {
    this.budgetCollapsed.update((collapsed) => !collapsed);
  }

  openInfoPopover = signal<InfoPopoverKey | null>(null);

  openSsInfoYear = signal<number | null>(null);

  householdBudget = computed(() =>
    calculateHouseholdBudget({
      incomes: this.incomeAnnualAmounts(),
      stateTaxRatePercent: this.stateTaxRatePercent(),
      annualWithholdings: this.annualWithholdings(),
      monthlyCostOfLiving: this.monthlyCostOfLiving(),
    }),
  );

  hoveredBarYear = signal<number | null>(null);

  contributionBreakdown = computed(() => {
    const amount = this.contributionAmount();
    return this.contributionFrequency() === 'monthly'
      ? { monthly: amount, yearly: amount * 12 }
      : { monthly: amount / 12, yearly: amount };
  });

  currentCheckingBalance = signal(0);

  currentSavingsBalance = signal(0);

  /** When true, the checking/HYSA buffers below are ignored and contributions never get delayed. */
  ignoreAlreadySaved = signal(false);

  /** 3 months of cost of living for checking, 6 for a HYSA — the TL;DR's recommended buffers. */
  checkingBufferTarget = computed(() => this.monthlyCostOfLiving() * 3);

  savingsBufferTarget = computed(() => this.monthlyCostOfLiving() * 6);

  bufferGapRemaining = computed(() => {
    const checkingGap = Math.max(0, this.checkingBufferTarget() - this.currentCheckingBalance());
    const savingsGap = Math.max(0, this.savingsBufferTarget() - this.currentSavingsBalance());
    return checkingGap + savingsGap;
  });

  /** How many months the contribution gets diverted to filling the buffers before investing starts. */
  contributionDelayMonths = computed(() => {
    if (this.ignoreAlreadySaved()) return 0;
    const gap = this.bufferGapRemaining();
    const monthly = this.contributionBreakdown().monthly;
    if (gap <= 0 || monthly <= 0) return 0;
    return Math.ceil(gap / monthly);
  });

  calcContributionBoosts = computed(() => {
    const age = this.currentAge();
    return this.contributionBoosts()
      .map((b) => {
        const startYear =
          age !== null && b.atAge !== null ? b.atAge - age : b.atYear;
        if (b.disabled) return null;
        if (startYear === null || startYear <= 0 || b.additionalMonthlyAmount <= 0) return null;
        if (b.amountFrequency === 'once') {
          return { startYear, additionalMonthly: b.additionalMonthlyAmount, oneTime: true };
        }
        const end =
          age !== null && b.endAtAge != null ? b.endAtAge - age : (b.endAtYear ?? null);
        // An end at or before the start means the boost never runs.
        if (end !== null && end <= startYear) return null;
        return {
          startYear,
          ...(end !== null ? { endYear: end } : {}),
          additionalMonthly: b.additionalMonthlyAmount,
        };
      })
      .filter((b): b is ContributionBoostSchedule => b !== null);
  });

  /** Every calculation input except the time horizon, shared by result() and the goal solvers. */
  private projectionInputs = computed(() => ({
    startingAmount: this.startingAmount(),
    contributionAmount: this.contributionAmount(),
    contributionFrequency: this.contributionFrequency(),
    contributionTiming: this.contributionTiming(),
    annualInterestRatePercent: this.annualInterestRatePercent(),
    compoundFrequency: this.compoundFrequency(),
    contributionDelayMonths: this.contributionDelayMonths(),
    inflationRatePercent: this.inflationRatePercent(),
    contributionBoosts: this.calcContributionBoosts(),
  }));

  result = computed(() =>
    calculateInvestment({
      ...this.projectionInputs(),
      years: this.years(),
      months: this.months(),
    }),
  );

  /** Each category's share of the ending balance — 0% across the board when there's nothing to divide. */
  totalsBreakdown = computed(() => {
    const r = this.result();
    const total = r.endingBalance;
    const percentOf = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
    return {
      startingAmountPercent: percentOf(r.startingAmount),
      totalContributionsPercent: percentOf(r.totalContributions),
      totalInterestPercent: percentOf(r.totalInterest),
    };
  });

  pieChart = computed<PieChart | null>(() => {
    const r = this.result();
    // Negative pieces (net withdrawals, or a loss) can't be drawn as slices, so the pie splits
    // only the positive sources of money — the ending balance itself when there are none.
    const segments = [
      { label: 'Starting Amount', value: r.startingAmount, color: '#49c6ff' },
      { label: 'Contributions', value: r.totalContributions, color: '#a78bfa' },
      { label: 'Interest', value: r.totalInterest, color: '#4ade80' },
    ].filter((seg) => seg.value > 0);
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    if (r.endingBalance <= 0 || total <= 0) return null;

    let cumulativeAngle = 0;
    const slices: PieSlice[] = segments.map((seg) => {
      const percent = (seg.value / total) * 100;
      const angleSpan = (seg.value / total) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angleSpan;
      return {
        label: seg.label,
        value: seg.value,
        percent: Math.round(percent),
        color: seg.color,
        path: describeArc(PIE_CENTER, PIE_CENTER, PIE_RADIUS, startAngle, startAngle + angleSpan),
        isFullCircle: segments.length === 1,
      };
    });

    return { slices, size: PIE_SIZE, center: PIE_CENTER, radius: PIE_RADIUS };
  });

  growthChart = computed<GrowthChart | null>(() => {
    const rows = this.result().yearRows;
    if (rows.length === 0) return null;

    const { top, right, bottom, left } = CHART_MARGIN;
    const plotWidth = CHART_WIDTH - left - right;
    const plotHeight = CHART_HEIGHT - top - bottom;
    // Withdrawals can make the balance peak before the last year, so scale to the tallest bar.
    const maxBalance = Math.max(...rows.map((row) => row.endingBalance));

    const slot = plotWidth / rows.length;
    const barWidth = Math.min(48, slot * 0.6);

    let cumulativeContributions = this.startingAmount();
    const bars: ChartBar[] = rows.map((row, i) => {
      cumulativeContributions += row.depositThisYear;
      const totalHeight = maxBalance > 0 ? (row.endingBalance / maxBalance) * plotHeight : 0;
      // Net money put in, capped to the bar — withdrawals can push it below 0 or above the balance.
      const contributionsHeight =
        maxBalance > 0
          ? Math.min(totalHeight, Math.max(0, (cumulativeContributions / maxBalance) * plotHeight))
          : 0;
      const interestHeight = Math.max(0, totalHeight - contributionsHeight);
      const interest = row.endingBalance - cumulativeContributions;

      return {
        year: row.year,
        x: left + slot * i + (slot - barWidth) / 2,
        barWidth,
        contributionsY: top + plotHeight - contributionsHeight,
        contributionsHeight,
        interestY: top + plotHeight - totalHeight,
        interestHeight,
        principalAndContributions: cumulativeContributions,
        interest,
        interestPercentOfTotal:
          row.endingBalance > 0 ? Math.round((interest / row.endingBalance) * 100) : 0,
        endingBalance: row.endingBalance,
      };
    });

    const gridLines = [0, 0.5, 1].map((fraction) => ({
      y: top + (1 - fraction) * plotHeight,
      label: formatCurrency(maxBalance * fraction),
    }));

    return { bars, width: CHART_WIDTH, height: CHART_HEIGHT, left, gridLines };
  });

  hoveredBar = computed<ChartBar | null>(() => {
    const year = this.hoveredBarYear();
    if (year === null) return null;
    return this.growthChart()?.bars.find((b) => b.year === year) ?? null;
  });

  setStartingAmount(raw: string): void {
    this.startingAmount.set(toNonNegativeNumber(raw));
  }

  /** Negative amounts are allowed — they withdraw from the balance each period instead. */
  setContributionAmount(raw: string): void {
    this.contributionAmount.set(toNumber(raw));
  }

  setCurrentCheckingBalance(raw: string): void {
    this.currentCheckingBalance.set(toNonNegativeNumber(raw));
  }

  setCurrentSavingsBalance(raw: string): void {
    this.currentSavingsBalance.set(toNonNegativeNumber(raw));
  }

  setIgnoreAlreadySaved(value: boolean): void {
    this.ignoreAlreadySaved.set(value);
  }

  setAnnualInterestRatePercent(raw: string): void {
    this.annualInterestRatePercent.set(toNonNegativeNumber(raw));
  }

  setContributionFrequency(raw: string): void {
    this.contributionFrequency.set(raw as ContributionFrequency);
  }

  setContributionTiming(raw: string): void {
    this.contributionTiming.set(raw as ContributionTiming);
  }

  setCompoundFrequency(raw: string): void {
    this.compoundFrequency.set(raw as CompoundFrequency);
  }

  readonly maxHorizonYears = MAX_HORIZON_YEARS;

  setYears(raw: string): void {
    this.setHorizonMonths(toNonNegativeInt(raw) * 12 + this.months());
  }

  setMonths(raw: string): void {
    this.setHorizonMonths(this.years() * 12 + Math.min(11, toNonNegativeInt(raw)));
  }

  /** Sets the horizon from a total month count (capped at MAX_HORIZON_YEARS) and holds it. */
  private setHorizonMonths(totalMonths: number): void {
    this.manualHorizonMonths.set(Math.min(MAX_HORIZON_YEARS * 12, Math.max(0, totalMonths)));
    this.heldGoal.set('horizon');
  }

  /**
   * Moves the hold to another field. The current horizon is saved as the manual one first, so it
   * stays put if the newly held goal turns out to be unreachable or is later released.
   */
  private holdField(field: HeldGoal): void {
    if (this.heldGoal() === field) return;
    this.manualHorizonMonths.set(this.horizonMonths());
    this.heldGoal.set(field);
  }

  /**
   * Hold toggle for one of the four linked fields. Turning one on locks in its current value;
   * turning the held one off hands the hold back to the time horizon (which always has it by
   * default, so it can't be switched off itself).
   */
  setHeldGoal(field: HeldGoal, checked: boolean): void {
    if (!checked) {
      if (this.heldGoal() === field) this.holdField('horizon');
      return;
    }
    switch (field) {
      case 'age': {
        const age = this.goalRetirementAge();
        if (age === null) return;
        this.heldRetirementAge.set(age);
        break;
      }
      case 'amount':
        this.heldGoalAmount.set(Math.floor(this.goalBalance()));
        break;
      case 'withdrawal':
        this.heldGoalWithdrawal.set(
          Math.floor(this.withdrawalAmount(this.goalBalance())),
        );
        break;
    }
    this.holdField(field);
  }

  /** Current age plus the time horizon, rounded to a whole age for the Retirement Age box. */
  goalRetirementAge = computed<number | null>(() => {
    const age = this.currentAge();
    if (age === null) return null;
    return Math.round(age + this.years() + this.months() / 12);
  });

  /** Editing the goal retirement age holds it and re-derives the horizon from current age. */
  setRetirementAge(raw: string): void {
    if (this.currentAge() === null) return;
    this.heldRetirementAge.set(toNonNegativeInt(raw));
    this.holdField('age');
  }

  /** Portfolio-only withdrawal at the end of the horizon (excludes Social Security). */
  goalWithdrawal = computed(() => this.withdrawalAmount(this.result().endingBalance));

  /** Ending balance in whichever dollars (nominal or today's) the goal fields are set to use. */
  private goalBalance = computed(() =>
    this.goalsInTodaysDollars()
      ? this.result().endingBalanceReal
      : this.result().endingBalance,
  );

  /** Each goal field shows its fixed target while held, otherwise the value derived from the horizon. */
  retirementAgeDisplay = computed(() =>
    this.heldGoal() === 'age' ? this.heldRetirementAge() : (this.goalRetirementAge() ?? ''),
  );

  goalAmountDisplay = computed(() =>
    this.heldGoal() === 'amount'
      ? this.heldGoalAmount()
      : Math.round(this.goalBalance()),
  );

  goalWithdrawalDisplay = computed(() =>
    this.heldGoal() === 'withdrawal'
      ? this.heldGoalWithdrawal()
      : Math.round(this.withdrawalAmount(this.goalBalance())),
  );

  /** Editing the goal retirement amount holds it; the horizon becomes the time needed to reach it. */
  setGoalAmount(raw: string): void {
    this.heldGoalAmount.set(toNonNegativeNumber(raw));
    this.holdField('amount');
  }

  /**
   * Switches both goal fields between nominal and today's dollars. A held target keeps its number
   * and is re-solved under the new meaning (e.g. $3M nominal becomes $3M in today's money).
   */
  setGoalsInTodaysDollars(value: boolean): void {
    this.goalsInTodaysDollars.set(value);
  }

  /** Editing the goal withdrawal holds it; the needed balance is backed out at the withdrawal rate. */
  setGoalWithdrawal(raw: string): void {
    this.heldGoalWithdrawal.set(toNonNegativeNumber(raw));
    this.holdField('withdrawal');
  }

  /** Reverts the horizon to a fixed years/months value with the horizon held (reset, history load). */
  private restoreHorizon(years: number, months: number): void {
    this.manualHorizonMonths.set(years * 12 + months);
    this.heldGoal.set('horizon');
  }

  setInflationRatePercent(raw: string): void {
    this.inflationRatePercent.set(toNonNegativeNumber(raw));
  }

  setWithdrawalRatePercent(raw: string): void {
    this.withdrawalRatePercent.set(toNonNegativeNumber(raw));
  }

  withdrawalAmount(endingBalance: number): number {
    return endingBalance * (this.withdrawalRatePercent() / 100);
  }

  setCurrentAge(raw: string): void {
    this.currentAge.set(toNonNegativeIntOrNull(raw));
  }

  ageAtYear(year: number): number {
    return (this.currentAge() ?? 0) + year;
  }

  /** True once this year's age reaches Social Security full retirement age (requires an age entered). */
  isSsEligibleYear(year: number): boolean {
    return this.currentAge() !== null && this.ageAtYear(year) >= SS_FULL_RETIREMENT_AGE;
  }

  /** The portfolio withdrawal plus the average Social Security benefit, once age-eligible. */
  totalWithdrawal(year: number, endingBalance: number): number {
    const base = this.withdrawalAmount(endingBalance);
    return this.isSsEligibleYear(year) ? base + SS_AVERAGE_ANNUAL_BENEFIT : base;
  }

  /** True once this year's withdrawal is enough on its own to cover the entered cost of living. */
  coversCostOfLiving(year: number, endingBalance: number): boolean {
    const yearly = this.yearlyCostOfLiving();
    return yearly > 0 && this.totalWithdrawal(year, endingBalance) >= yearly;
  }

  /** The first year the withdrawal covers the entered cost of living, or null if none do. */
  firstCostOfLivingCoveredYear = computed<number | null>(() => {
    if (this.yearlyCostOfLiving() <= 0) return null;
    const row = this.result().yearRows.find((r) =>
      this.coversCostOfLiving(r.year, r.endingBalance),
    );
    return row?.year ?? null;
  });

  /** firstCostOfLivingCoveredYear() for the inflation-adjusted (today's $) withdrawal. */
  firstCostOfLivingCoveredYearReal = computed<number | null>(() => {
    if (this.yearlyCostOfLiving() <= 0) return null;
    const row = this.result().yearRows.find((r) =>
      this.coversCostOfLiving(r.year, r.endingBalanceReal),
    );
    return row?.year ?? null;
  });

  costOfLivingCoveredTitle(year: number, endingBalance: number, todaysDollars = false): string {
    const suffix = todaysDollars ? " in today's dollars" : '';
    return (
      `Withdrawal (${formatCurrency(this.totalWithdrawal(year, endingBalance))}${suffix}) ` +
      `covers your ${formatCurrency(this.yearlyCostOfLiving())}/year cost of living`
    );
  }

  /** Age at the final year of the horizon, or null when no age was entered. */
  finalAge = computed<number | null>(() => {
    const rows = this.result().yearRows;
    if (this.currentAge() === null || rows.length === 0) return null;
    return this.ageAtYear(rows[rows.length - 1].year);
  });

  /** Total withdrawal (portfolio + Social Security, once eligible) in the final year of the horizon. */
  finalYearWithdrawal = computed<number>(() => {
    const rows = this.result().yearRows;
    if (rows.length === 0) return 0;
    const lastRow = rows[rows.length - 1];
    return this.totalWithdrawal(lastRow.year, lastRow.endingBalance);
  });

  /**
   * finalYearWithdrawal() in today's dollars — the withdrawal rate applied to the inflation-adjusted
   * ending balance. Social Security is added as-is, since its benefit is already in today's dollars.
   */
  finalYearWithdrawalReal = computed<number>(() => {
    const rows = this.result().yearRows;
    if (rows.length === 0) return 0;
    const lastRow = rows[rows.length - 1];
    return this.totalWithdrawal(lastRow.year, lastRow.endingBalanceReal);
  });

  /** Maps each year that first crosses a milestone balance to the milestone(s) it crossed. */
  milestoneYears = computed(() => this.milestoneMap((r) => r.endingBalance));

  /** Same as milestoneYears, but for the inflation-adjusted (today's $) balance. */
  milestoneYearsReal = computed(() => this.milestoneMap((r) => r.endingBalanceReal));

  private milestoneMap(balanceOf: (row: InvestmentYearRow) => number): Map<number, number[]> {
    const rows = this.result().yearRows;
    const map = new Map<number, number[]>();
    for (const milestone of MILESTONES) {
      const row = rows.find((r) => balanceOf(r) >= milestone);
      if (row) {
        map.set(row.year, [...(map.get(row.year) ?? []), milestone]);
      }
    }
    return map;
  }

  isMilestoneYear(year: number, todaysDollars = false): boolean {
    return (todaysDollars ? this.milestoneYearsReal() : this.milestoneYears()).has(year);
  }

  milestoneTitleFor(year: number, todaysDollars = false): string {
    const map = todaysDollars ? this.milestoneYearsReal() : this.milestoneYears();
    const milestones = map.get(year) ?? [];
    const suffix = todaysDollars ? " in today's dollars" : '';
    return `${milestones.map((m) => formatCurrency(m)).join(', ')}${suffix} reached`;
  }

  private updateIncomeEntry(id: string, updater: (entry: IncomeEntry) => IncomeEntry): void {
    this.incomeEntries.update((entries) =>
      entries.map((entry) => (entry.id === id ? updater(entry) : entry)),
    );
  }

  addIncomeEntry(): void {
    if (!this.canAddIncomeEntry()) return;
    this.incomeEntries.update((entries) => [...entries, createIncomeEntry()]);
  }

  removeIncomeEntry(id: string): void {
    if (!this.canRemoveIncomeEntry()) return;
    this.incomeEntries.update((entries) => entries.filter((entry) => entry.id !== id));
  }

  setIncomeEntryMode(id: string, raw: string): void {
    this.updateIncomeEntry(id, (entry) => ({ ...entry, mode: raw as IncomeMode }));
  }

  setIncomeEntryYearlyAmount(id: string, raw: string): void {
    this.updateIncomeEntry(id, (entry) => ({ ...entry, yearlyAmount: toNonNegativeNumber(raw) }));
  }

  setIncomeEntryMonthlyAmount(id: string, raw: string): void {
    this.updateIncomeEntry(id, (entry) => ({ ...entry, monthlyAmount: toNonNegativeNumber(raw) }));
  }

  setIncomeEntryHourlyRate(id: string, raw: string): void {
    this.updateIncomeEntry(id, (entry) => ({ ...entry, hourlyRate: toNonNegativeNumber(raw) }));
  }

  setIncomeEntryHoursPerWeek(id: string, raw: string): void {
    this.updateIncomeEntry(id, (entry) => ({ ...entry, hoursPerWeek: toNonNegativeNumber(raw) }));
  }

  setIncomeEntryWeeksPerYear(id: string, raw: string): void {
    this.updateIncomeEntry(id, (entry) => ({ ...entry, weeksPerYear: toNonNegativeNumber(raw) }));
  }

  incomeEntryAnnualAmount(entry: IncomeEntry): number {
    return incomeEntryAnnualAmount(entry);
  }

  /** This income entry as monthly/yearly figures, regardless of which mode it's entered in. */
  incomeEntryBreakdown(entry: IncomeEntry): { monthly: number; yearly: number } {
    const yearly = incomeEntryAnnualAmount(entry);
    return { monthly: yearly / 12, yearly };
  }

  incomeEntryLabel(index: number): string {
    return index === 0 ? 'Your Annual Salary' : `Additional Income #${index + 1} (optional)`;
  }

  lastAppliedPresetId = signal<string | null>(null);

  lastAppliedPresetLabel = computed(() => {
    const id = this.lastAppliedPresetId();
    return this.householdPresets.find((p) => p.id === id)?.label ?? null;
  });

  applyHouseholdPreset(id: string): void {
    const preset = this.householdPresets.find((p) => p.id === id);
    if (!preset) return;
    this.incomeEntries.set(preset.incomes.map((amount) => createIncomeEntry(amount)));
    this.monthlyCostOfLiving.set(preset.monthlyCostOfLiving);
    this.lastAppliedPresetId.set(preset.id);
  }

  setStateSortOrder(raw: string): void {
    this.stateSortOrder.set(raw as StateSortOrder);
  }

  onStateSelected(code: string): void {
    this.selectedStateCode.set(code);
    const state = this.stateTaxRates.find((s) => s.code === code);
    if (state) {
      this.stateTaxRatePercent.set(state.rate);
      this.monthlyCostOfLiving.set(state.avgMonthlyCostOfLiving);
    }
  }

  setStateTaxRatePercent(raw: string): void {
    this.stateTaxRatePercent.set(toNonNegativeNumber(raw));
  }

  setWithholdingsAmount(raw: string): void {
    this.withholdingsAmount.set(toNonNegativeNumber(raw));
  }

  setWithholdingsFrequency(raw: string): void {
    this.withholdingsFrequency.set(raw as PayFrequency);
  }

  setMonthlyCostOfLiving(raw: string): void {
    this.monthlyCostOfLiving.set(toNonNegativeNumber(raw));
  }

  /** Writes the entered amount back as a monthly figure, converting down from yearly if needed. */
  setCostOfLivingAmount(raw: string): void {
    const value = toNonNegativeNumber(raw);
    this.monthlyCostOfLiving.set(this.costOfLivingFrequency() === 'yearly' ? value / 12 : value);
  }

  setCostOfLivingFrequency(raw: string): void {
    this.costOfLivingFrequency.set(raw as 'monthly' | 'yearly');
  }

  scrollToLongevityDetails(event: Event): void {
    event.preventDefault();
    document.getElementById('longevity-details')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToIncomeChart(event: Event): void {
    event.preventDefault();
    document.getElementById('income-vs-spending-chart')?.scrollIntoView({ behavior: 'smooth' });
  }

  addContributionBoost(): void {
    const id = createBoostId();
    this.contributionBoosts.update((list) => [
      ...list,
      { id, atAge: null, atYear: null, additionalMonthlyAmount: 0, label: '' },
    ]);
  }

  removeContributionBoost(id: string): void {
    this.contributionBoosts.update((list) => list.filter((b) => b.id !== id));
  }

  setBoostAtAge(id: string, raw: string): void {
    const val = toNonNegativeIntOrNull(raw);
    this.contributionBoosts.update((list) =>
      list.map((b) => (b.id === id ? { ...b, atAge: val } : b)),
    );
  }

  setBoostAtYear(id: string, raw: string): void {
    const val = toNonNegativeIntOrNull(raw);
    this.contributionBoosts.update((list) =>
      list.map((b) => (b.id === id ? { ...b, atYear: val } : b)),
    );
  }

  setBoostEndAtAge(id: string, raw: string): void {
    const val = toNonNegativeIntOrNull(raw);
    this.contributionBoosts.update((list) =>
      list.map((b) => (b.id === id ? { ...b, endAtAge: val } : b)),
    );
  }

  setBoostEndAtYear(id: string, raw: string): void {
    const val = toNonNegativeIntOrNull(raw);
    this.contributionBoosts.update((list) =>
      list.map((b) => (b.id === id ? { ...b, endAtYear: val } : b)),
    );
  }

  /** Writes the entered amount back as a monthly figure, converting down from yearly if needed. */
  setBoostAmount(id: string, raw: string): void {
    const val = toNonNegativeNumber(raw);
    this.contributionBoosts.update((list) =>
      list.map((b) =>
        b.id === id
          ? { ...b, additionalMonthlyAmount: b.amountFrequency === 'yearly' ? val / 12 : val }
          : b,
      ),
    );
  }

  /**
   * Monthly <-> yearly keeps the same per-month amount (so the shown number scales by 12), like
   * cost of living. Switching to or from one-time keeps the shown number as-is instead, since a
   * lump sum has no per-month equivalent.
   */
  setBoostAmountFrequency(id: string, raw: string): void {
    const amountFrequency = raw === 'yearly' || raw === 'once' ? raw : 'monthly';
    this.contributionBoosts.update((list) =>
      list.map((b) => {
        if (b.id !== id) return b;
        const involvesOnce = amountFrequency === 'once' || b.amountFrequency === 'once';
        const shown = this.boostDisplayAmount(b);
        const additionalMonthlyAmount = !involvesOnce
          ? b.additionalMonthlyAmount
          : amountFrequency === 'yearly'
            ? shown / 12
            : shown;
        return { ...b, amountFrequency, additionalMonthlyAmount };
      }),
    );
  }

  /** The boost amount in whichever unit (monthly/yearly) it's currently shown in. */
  boostDisplayAmount(boost: ContributionBoost): number {
    return boost.amountFrequency === 'yearly'
      ? Math.round(boost.additionalMonthlyAmount * 12 * 100) / 100
      : boost.additionalMonthlyAmount;
  }

  /** The boost's start in the unit the form shows: age when current age is set, else year. */
  boostStart(boost: ContributionBoost): number | null {
    return this.currentAge() !== null ? boost.atAge : boost.atYear;
  }

  /** How many years the boost runs (end minus start), or null without both / if end <= start. */
  boostDurationYears(boost: ContributionBoost): number | null {
    const start = this.boostStart(boost);
    const end = this.currentAge() !== null ? boost.endAtAge : boost.endAtYear;
    return start !== null && end != null && end > start ? end - start : null;
  }

  /** Entering a duration sets the end to start + years (the end and duration fields set each other). */
  setBoostDurationYears(id: string, raw: string): void {
    const years = toNonNegativeIntOrNull(raw);
    const byAge = this.currentAge() !== null;
    this.contributionBoosts.update((list) =>
      list.map((b) => {
        if (b.id !== id) return b;
        const start = this.boostStart(b);
        if (start === null) return b;
        const end = years === null ? null : start + years;
        return byAge ? { ...b, endAtAge: end } : { ...b, endAtYear: end };
      }),
    );
  }

  /** Turns a boost on/off without clearing it, to compare the projection with and without it. */
  setBoostEnabled(id: string, enabled: boolean): void {
    this.contributionBoosts.update((list) =>
      list.map((b) => (b.id === id ? { ...b, disabled: !enabled } : b)),
    );
  }

  setBoostLabel(id: string, val: string): void {
    this.contributionBoosts.update((list) =>
      list.map((b) => (b.id === id ? { ...b, label: val } : b)),
    );
  }

  isInfoPopoverOpen(key: InfoPopoverKey): boolean {
    return this.openInfoPopover() === key;
  }

  toggleInfoPopover(key: InfoPopoverKey): void {
    this.openInfoPopover.update((current) => (current === key ? null : key));
  }

  closeInfoPopover(): void {
    this.openInfoPopover.set(null);
  }

  isSsInfoOpen(year: number): boolean {
    return this.openSsInfoYear() === year;
  }

  toggleSsInfo(year: number): void {
    this.openSsInfoYear.update((current) => (current === year ? null : year));
  }

  closeSsInfo(): void {
    this.openSsInfoYear.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.openInfoPopover() === null && this.openSsInfoYear() === null) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.info-popover-wrap')) {
      this.openInfoPopover.set(null);
      this.openSsInfoYear.set(null);
    }
  }


  /** Fills the main contribution field with the estimated monthly leftover from the budget widget. */
  useDiscretionaryIncomeAsContribution(): void {
    const monthly = Math.max(0, Math.round(this.householdBudget().discretionaryMonthly));
    this.contributionAmount.set(monthly);
    this.contributionFrequency.set('monthly');

    const contributionInput =
      typeof document !== 'undefined' ? document.getElementById('contribution-amount') : null;
    contributionInput?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }

  // ---- Shareable link + AI agent access -------------------------------------------------------

  private readonly route = inject(ActivatedRoute);

  constructor() {
    // A shared link carries the scenario in its query string; apply it before first render.
    const query = this.route.snapshot?.queryParamMap;
    if (query) {
      const params = new URLSearchParams();
      for (const key of query.keys) params.set(key, query.get(key) ?? '');
      applyShareParams(this, params);
    }
    registerInvestmentAgentTools(this, inject(DestroyRef));
  }

  /** Feedback after a copy, e.g. "Link copied" — cleared after a few seconds. */
  shareStatus = signal<string | null>(null);

  /** Shown in a textbox to copy by hand when the clipboard API isn't available. */
  shareFallbackText = signal<string | null>(null);

  /** A link to this page with every current input in the query string. */
  shareLink(): string {
    const base = typeof location === 'undefined' ? '' : `${location.origin}${location.pathname}`;
    return `${base}?${buildShareParams(this).toString()}`;
  }

  /** The current inputs (as share params) and headline results, for AI assistants and agents. */
  scenarioSummary() {
    const r = this.result();
    return {
      page: 'Investment Calculator — projects investment growth and retirement withdrawals',
      shareLink: this.shareLink(),
      inputs: Object.fromEntries(buildShareParams(this)),
      results: {
        timeHorizon: `${this.years()} years, ${this.months()} months`,
        heldField: this.heldGoal(),
        goalUnreachable: this.goalUnreachable(),
        ageAtEnd: this.finalAge(),
        endingBalance: Math.round(r.endingBalance),
        endingBalanceTodaysDollars: Math.round(r.endingBalanceReal),
        totalContributions: Math.round(r.totalContributions),
        totalInterest: Math.round(r.totalInterest),
        yearlyWithdrawalAtEnd: Math.round(this.finalYearWithdrawal()),
        yearlyWithdrawalAtEndTodaysDollars: Math.round(this.finalYearWithdrawalReal()),
        firstYearWithdrawalCoversCostOfLiving: this.firstCostOfLivingCoveredYear(),
        monthlyLeftoverAfterTaxesAndCostOfLiving: Math.round(
          this.householdBudget().discretionaryMonthly,
        ),
        monthsFillingCheckingAndSavingsFirst: this.contributionDelayMonths(),
      },
    };
  }

  scenarioSummaryText(): string {
    return (
      'My investment calculator scenario. Inputs and results are below; open shareLink to see ' +
      'the full page, or change its query parameters to try a different scenario.\n\n' +
      JSON.stringify(this.scenarioSummary(), null, 2)
    );
  }

  copyShareLink(): Promise<void> {
    return this.copyToClipboard(this.shareLink(), 'Link copied');
  }

  copySummaryForAi(): Promise<void> {
    return this.copyToClipboard(
      this.scenarioSummaryText(),
      'Summary copied — paste it into any AI assistant',
    );
  }

  private shareStatusTimer: ReturnType<typeof setTimeout> | undefined;

  private async copyToClipboard(text: string, successMessage: string): Promise<void> {
    clearTimeout(this.shareStatusTimer);
    try {
      await navigator.clipboard.writeText(text);
      this.shareFallbackText.set(null);
      this.shareStatus.set(successMessage);
      this.shareStatusTimer = setTimeout(() => this.shareStatus.set(null), 4000);
    } catch {
      this.shareStatus.set(null);
      this.shareFallbackText.set(text);
    }
  }

  /** Incomes as share-param specs: yearly:<amt>, monthly:<amt>, or hourly:<rate>:<hrs>:<wks>. */
  incomeSpecs(): string {
    return this.incomeEntries()
      .map((e) => {
        switch (e.mode) {
          case 'monthly':
            return `monthly:${e.monthlyAmount}`;
          case 'hourly':
            return `hourly:${e.hourlyRate}:${e.hoursPerWeek}:${e.weeksPerYear}`;
          default:
            return `yearly:${e.yearlyAmount}`;
        }
      })
      .join(',');
  }

  /** Replaces the income list from comma-separated specs (a bare number counts as yearly). */
  setIncomesFromSpecs(raw: string): void {
    const entries = raw
      .split(',')
      .map((spec) => spec.trim())
      .filter(Boolean)
      .slice(0, MAX_INCOME_ENTRIES)
      .map((spec): IncomeEntry => {
        const [mode, a = '', b, c] = spec.split(':');
        const entry = createIncomeEntry();
        if (mode === 'monthly') {
          return { ...entry, mode: 'monthly', monthlyAmount: toNonNegativeNumber(a) };
        }
        if (mode === 'hourly') {
          return {
            ...entry,
            mode: 'hourly',
            hourlyRate: toNonNegativeNumber(a),
            hoursPerWeek: b ? toNonNegativeNumber(b) : entry.hoursPerWeek,
            weeksPerYear: c ? toNonNegativeNumber(c) : entry.weeksPerYear,
          };
        }
        return { ...entry, yearlyAmount: toNonNegativeNumber(mode === 'yearly' ? a : spec) };
      });
    if (entries.length > 0) this.incomeEntries.set(entries);
  }

  /**
   * Boosts as |-separated share-param specs: age:<start>[-<end>]:<extra>:<label> or
   * year:<start>[-<end>]:<extra>:<label>, where <extra> is monthly, yearly with a "y" suffix, or
   * a one-time lump sum with a "once" suffix.
   * A boost that's switched off is prefixed with "off:".
   */
  boostSpecs(): string | null {
    const specs = this.contributionBoosts()
      .filter((b) => b.atAge !== null || b.atYear !== null)
      .map((b) => {
        const [kind, start, end] =
          b.atAge !== null ? ['age', b.atAge, b.endAtAge] : ['year', b.atYear, b.endAtYear];
        const when = `${kind}:${start}${end != null ? `-${end}` : ''}`;
        const amount =
          b.amountFrequency === 'yearly'
            ? `${this.boostDisplayAmount(b)}y`
            : b.amountFrequency === 'once'
              ? `${b.additionalMonthlyAmount}once`
              : `${b.additionalMonthlyAmount}`;
        return `${b.disabled ? 'off:' : ''}${when}:${amount}:${b.label.replace(/\|/g, '/')}`;
      });
    return specs.length > 0 ? specs.join('|') : null;
  }

  /** Replaces the contribution boosts from |-separated specs; an empty string clears them. */
  setBoostsFromSpecs(raw: string): void {
    const boosts = raw
      .split('|')
      .map((spec) => spec.trim())
      .filter(Boolean)
      .flatMap((spec): ContributionBoost[] => {
        const disabled = spec.startsWith('off:');
        const [kind, at = '', amount = '', ...label] = (disabled ? spec.slice(4) : spec).split(':');
        const [startRaw, endRaw = ''] = at.split('-');
        const when = toNonNegativeIntOrNull(startRaw);
        const end = toNonNegativeIntOrNull(endRaw);
        const yearly = /y$/i.test(amount);
        const once = /once$/i.test(amount);
        if ((kind !== 'age' && kind !== 'year') || when === null) return [];
        return [
          {
            id: createBoostId(),
            atAge: kind === 'age' ? when : null,
            atYear: kind === 'year' ? when : null,
            endAtAge: kind === 'age' ? end : null,
            endAtYear: kind === 'year' ? end : null,
            additionalMonthlyAmount: once
              ? toNonNegativeNumber(amount.slice(0, -4))
              : yearly
                ? toNonNegativeNumber(amount.slice(0, -1)) / 12
                : toNonNegativeNumber(amount),
            amountFrequency: once ? 'once' : yearly ? 'yearly' : 'monthly',
            ...(disabled ? { disabled } : {}),
            label: label.join(':'),
          },
        ];
      });
    this.contributionBoosts.set(boosts);
  }

  reset(): void {
    this.startingAmount.set(0);
    this.contributionAmount.set(774);
    this.contributionFrequency.set('monthly');
    this.contributionTiming.set('end');
    this.annualInterestRatePercent.set(10);
    this.compoundFrequency.set('annually');
    this.restoreHorizon(37, 0);
    this.goalsInTodaysDollars.set(false);
    this.inflationRatePercent.set(3);
    this.withdrawalRatePercent.set(3.5);
    this.currentAge.set(30);

    this.incomeEntries.set([createIncomeEntry(DEFAULT_YEARLY_INCOME)]);
    this.selectedStateCode.set('');
    this.stateTaxRatePercent.set(AVERAGE_STATE_TAX_RATE_PERCENT);
    this.withholdingsAmount.set(0);
    this.withholdingsFrequency.set('monthly');
    this.monthlyCostOfLiving.set(DEFAULT_MONTHLY_COST_OF_LIVING);
    this.costOfLivingFrequency.set('monthly');
    this.currentCheckingBalance.set(0);
    this.currentSavingsBalance.set(0);
    this.ignoreAlreadySaved.set(false);
    this.lastAppliedPresetId.set(null);
    this.contributionBoosts.set([]);

  }

  /** True once the budget widget has anything other than its default single income entry. */
  householdBudgetEntered = computed(() => {
    const entries = this.incomeEntries();
    const incomeChanged =
      entries.length !== 1 ||
      entries[0].mode !== 'yearly' ||
      entries[0].yearlyAmount !== DEFAULT_YEARLY_INCOME;
    return (
      incomeChanged ||
      this.selectedStateCode() !== '' ||
      this.withholdingsAmount() > 0 ||
      this.monthlyCostOfLiving() !== DEFAULT_MONTHLY_COST_OF_LIVING ||
      this.currentCheckingBalance() > 0 ||
      this.currentSavingsBalance() > 0 ||
      this.ignoreAlreadySaved()
    );
  });

  private buildHouseholdBudgetSnapshot(): HouseholdBudgetSnapshot {
    return {
      incomeEntries: this.incomeEntries(),
      selectedStateCode: this.selectedStateCode(),
      stateTaxRatePercent: this.stateTaxRatePercent(),
      withholdingsAmount: this.withholdingsAmount(),
      withholdingsFrequency: this.withholdingsFrequency(),
      monthlyCostOfLiving: this.monthlyCostOfLiving(),
      currentCheckingBalance: this.currentCheckingBalance(),
      currentSavingsBalance: this.currentSavingsBalance(),
      ignoreAlreadySaved: this.ignoreAlreadySaved(),
    };
  }

  saveCurrentToHistory(): void {
    const existing = new Set(this.history().map((r) => r.timestamp));
    let timestamp = new Date().toISOString();
    while (existing.has(timestamp)) {
      timestamp = new Date(Date.parse(timestamp) + 1).toISOString();
    }

    const run: InvestmentRun = {
      timestamp,
      inputs: {
        startingAmount: this.startingAmount(),
        contributionAmount: this.contributionAmount(),
        contributionFrequency: this.contributionFrequency(),
        contributionTiming: this.contributionTiming(),
        annualInterestRatePercent: this.annualInterestRatePercent(),
        compoundFrequency: this.compoundFrequency(),
        years: this.years(),
        months: this.months(),
        inflationRatePercent: this.inflationRatePercent(),
      },
      withdrawalRatePercent: this.withdrawalRatePercent(),
      currentAge: this.currentAge(),
      endingBalance: this.result().endingBalance,
      householdBudget: this.householdBudgetEntered()
        ? this.buildHouseholdBudgetSnapshot()
        : undefined,
    };

    const updated = [...this.history(), run];
    this.history.set(updated);
    saveHistory(updated);
  }

  loadFromHistory(run: InvestmentRun): void {
    this.startingAmount.set(run.inputs.startingAmount);
    this.contributionAmount.set(run.inputs.contributionAmount);
    this.contributionFrequency.set(run.inputs.contributionFrequency);
    this.contributionTiming.set(run.inputs.contributionTiming);
    this.annualInterestRatePercent.set(run.inputs.annualInterestRatePercent);
    this.compoundFrequency.set(run.inputs.compoundFrequency);
    this.restoreHorizon(run.inputs.years, run.inputs.months);
    this.inflationRatePercent.set(run.inputs.inflationRatePercent ?? 3);
    this.withdrawalRatePercent.set(run.withdrawalRatePercent);
    this.currentAge.set(run.currentAge);

    const budget = run.householdBudget;
    if (budget) {
      this.incomeEntries.set(budget.incomeEntries);
      this.selectedStateCode.set(budget.selectedStateCode);
      this.stateTaxRatePercent.set(budget.stateTaxRatePercent);
      this.withholdingsAmount.set(budget.withholdingsAmount);
      this.withholdingsFrequency.set(budget.withholdingsFrequency);
      this.monthlyCostOfLiving.set(budget.monthlyCostOfLiving);
      this.currentCheckingBalance.set(budget.currentCheckingBalance);
      this.currentSavingsBalance.set(budget.currentSavingsBalance);
      this.ignoreAlreadySaved.set(budget.ignoreAlreadySaved ?? false);
    }
  }

  deleteFromHistory(timestamp: string): void {
    const updated = this.history().filter((r) => r.timestamp !== timestamp);
    this.history.set(updated);
    saveHistory(updated);
  }

  /** Age at the end of a saved run's horizon, or null when that run had no age entered. */
  finalAgeFor(run: InvestmentRun): number | null {
    if (run.currentAge === null) return null;
    return Math.round(run.currentAge + run.inputs.years + run.inputs.months / 12);
  }

  summaryFor(run: InvestmentRun): string {
    const i = run.inputs;
    const contributionFreq = i.contributionFrequency === 'monthly' ? '/mo' : '/yr';
    const horizon = i.months > 0 ? `${i.years}y ${i.months}m` : `${i.years}y`;
    const budgetSuffix = run.householdBudget ? ' · incl. budget' : '';
    return (
      `${formatCurrency(i.startingAmount)} start + ${formatCurrency(i.contributionAmount)}` +
      `${contributionFreq} @ ${i.annualInterestRatePercent}% for ${horizon}${budgetSuffix}`
    );
  }

  clearHistory(): void {
    const confirmed = confirm('Clear all saved investment scenarios? This cannot be undone.');
    if (!confirmed) return;

    this.history.set([]);
    saveHistory([]);
  }
}
