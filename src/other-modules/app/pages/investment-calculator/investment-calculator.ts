import { Component, HostListener, afterNextRender, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CompoundFrequency,
  ContributionFrequency,
  ContributionTiming,
  InvestmentRun,
} from '../../core/models/Investment';
import {
  HouseholdBudgetSnapshot,
  IncomeEntry,
  IncomeMode,
  PayFrequency,
} from '../../core/models/HouseholdBudget';
import { STATE_TAX_RATES } from '../../core/data/state-tax-rates';
import { HOUSEHOLD_PRESETS } from '../../core/data/household-presets';
import { calculateInvestment } from './investment-calc';
import { calculateHouseholdBudget, incomeEntryAnnualAmount } from './household-budget-calc';
import { loadHistory, saveHistory } from './investment-storage';

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

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const CHART_MARGIN = { top: 16, right: 16, bottom: 24, left: 56 };

const PIE_SIZE = 180;
const PIE_RADIUS = 80;
const PIE_CENTER = PIE_SIZE / 2;

const MILESTONES = [1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 10_000_000];

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
  incomeAfterTaxes: number;
  annualExpenditures: number;
}

/**
 * Mean income before taxes, mean income after taxes, and mean annual expenditures per consumer
 * unit, by quintile of the income-before-taxes distribution — U.S. Bureau of Labor Statistics
 * Consumer Expenditure Survey, 2023 annual averages (the latest year with after-tax income
 * published; https://www.bls.gov/cex/, via FRED series CXUINCBEFTXLB01*, CXUINCAFTTXLB01*,
 * CXUTOTALEXPLB01*). Breaking the national averages out by income bracket, rather than blending
 * everyone into one figure, keeps a handful of very high earners from skewing what a typical
 * household at a given income level actually makes and spends. The lowest quintile's after-tax
 * income exceeds its before-tax income because refundable credits (EITC, Child Tax Credit) count
 * as negative taxes in BLS's methodology — not a data error.
 */
const INCOME_VS_SPENDING_BY_QUINTILE: QuintileStat[] = [
  { label: '0–20%', incomeBeforeTaxes: 15_596, incomeAfterTaxes: 16_171, annualExpenditures: 33_776 },
  { label: '20–40%', incomeBeforeTaxes: 40_751, incomeAfterTaxes: 40_621, annualExpenditures: 48_923 },
  { label: '40–60%', incomeBeforeTaxes: 71_057, incomeAfterTaxes: 66_606, annualExpenditures: 65_487 },
  { label: '60–80%', incomeBeforeTaxes: 116_717, incomeAfterTaxes: 104_559, annualExpenditures: 87_922 },
  { label: '80–100%', incomeBeforeTaxes: 264_518, incomeAfterTaxes: 211_042, annualExpenditures: 150_093 },
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

/** Reformats a number textbox with thousands separators once the user finishes typing (on blur). */
function formatNumberInputOnBlur(event: Event): void {
  const input = event.target as HTMLInputElement;
  const normalized = input.value.replace(/,/g, '').trim();
  if (normalized === '') return;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return;
  input.value = value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** Same as formatNumberInputOnBlur, but for whole-number fields (years, months) — no decimal places. */
function formatIntegerInputOnBlur(event: Event): void {
  const input = event.target as HTMLInputElement;
  const normalized = input.value.replace(/,/g, '').trim();
  if (normalized === '') return;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return;
  input.value = Math.round(value).toLocaleString('en-US');
}

@Component({
  selector: 'app-investment-calculator',
  imports: [DatePipe],
  templateUrl: './investment-calculator.html',
  styleUrl: './investment-calculator.scss',
})
export class InvestmentCalculator {
  readonly formatCurrency = formatCurrency;

  readonly formatNumberInputOnBlur = formatNumberInputOnBlur;

  readonly formatIntegerInputOnBlur = formatIntegerInputOnBlur;

  readonly ssAverageAnnualBenefit = SS_AVERAGE_ANNUAL_BENEFIT;

  readonly incomeVsSpendingByQuintile = INCOME_VS_SPENDING_BY_QUINTILE.map((q) => ({
    ...q,
    discretionaryIncome: q.incomeAfterTaxes - q.annualExpenditures,
  }));

  constructor() {
    afterNextRender(() => this.formatAllNumericInputsSoon());
  }

  startingAmount = signal(0);

  contributionAmount = signal(774);

  contributionFrequency = signal<ContributionFrequency>('monthly');

  contributionTiming = signal<ContributionTiming>('end');

  annualInterestRatePercent = signal(10);

  compoundFrequency = signal<CompoundFrequency>('annually');

  years = signal(37);

  months = signal(0);

  /** Historical long-run U.S. inflation is roughly 3%; used to show balances in today's dollars. */
  inflationRatePercent = signal(3);

  withdrawalRatePercent = signal(3.5);

  currentAge = signal<number | null>(30);

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

  result = computed(() =>
    calculateInvestment({
      startingAmount: this.startingAmount(),
      contributionAmount: this.contributionAmount(),
      contributionFrequency: this.contributionFrequency(),
      contributionTiming: this.contributionTiming(),
      annualInterestRatePercent: this.annualInterestRatePercent(),
      compoundFrequency: this.compoundFrequency(),
      years: this.years(),
      months: this.months(),
      contributionDelayMonths: this.contributionDelayMonths(),
      inflationRatePercent: this.inflationRatePercent(),
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
    const total = r.endingBalance;
    if (total <= 0) return null;

    const segments = [
      { label: 'Starting Amount', value: r.startingAmount, color: '#49c6ff' },
      { label: 'Contributions', value: r.totalContributions, color: '#a78bfa' },
      { label: 'Interest', value: r.totalInterest, color: '#4ade80' },
    ].filter((seg) => seg.value > 0);

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
    const maxBalance = rows[rows.length - 1].endingBalance;

    const slot = plotWidth / rows.length;
    const barWidth = Math.min(48, slot * 0.6);

    let cumulativeContributions = this.startingAmount();
    const bars: ChartBar[] = rows.map((row, i) => {
      cumulativeContributions += row.depositThisYear;
      const contributionsHeight =
        maxBalance > 0 ? (cumulativeContributions / maxBalance) * plotHeight : 0;
      const totalHeight = maxBalance > 0 ? (row.endingBalance / maxBalance) * plotHeight : 0;
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

  setContributionAmount(raw: string): void {
    this.contributionAmount.set(toNonNegativeNumber(raw));
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

  setYears(raw: string): void {
    this.years.set(toNonNegativeInt(raw));
  }

  setMonths(raw: string): void {
    this.months.set(Math.min(11, toNonNegativeInt(raw)));
  }

  /** Current age plus the time horizon, rounded to a whole age for the Retirement Age box. */
  goalRetirementAge = computed<number | null>(() => {
    const age = this.currentAge();
    if (age === null) return null;
    return Math.round(age + this.years() + this.months() / 12);
  });

  /** Editing the goal retirement age re-derives years/months from the gap to current age. */
  setRetirementAge(raw: string): void {
    const age = this.currentAge();
    if (age === null) return;
    const totalMonths = Math.max(0, (toNonNegativeInt(raw) - age) * 12);
    this.years.set(Math.floor(totalMonths / 12));
    this.months.set(totalMonths % 12);
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

  costOfLivingCoveredTitle(year: number, endingBalance: number): string {
    return (
      `Withdrawal (${formatCurrency(this.totalWithdrawal(year, endingBalance))}) covers your ` +
      `${formatCurrency(this.yearlyCostOfLiving())}/year cost of living`
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

  /** Maps each year that first crosses a milestone balance to the milestone(s) it crossed. */
  milestoneYears = computed<Map<number, number[]>>(() => {
    const rows = this.result().yearRows;
    const map = new Map<number, number[]>();
    for (const milestone of MILESTONES) {
      const row = rows.find((r) => r.endingBalance >= milestone);
      if (row) {
        map.set(row.year, [...(map.get(row.year) ?? []), milestone]);
      }
    }
    return map;
  });

  isMilestoneYear(year: number): boolean {
    return this.milestoneYears().has(year);
  }

  milestoneTitleFor(year: number): string {
    const milestones = this.milestoneYears().get(year) ?? [];
    return `${milestones.map((m) => formatCurrency(m)).join(', ')} reached`;
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
    this.formatAllNumericInputsSoon();
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
    this.formatAllNumericInputsSoon();
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

  /**
   * Reformats every number textbox with thousands separators once Angular has pushed a
   * programmatic (non-typed) value into the DOM — e.g. after a preset/state prefill, loading a
   * history entry, or a reset. Deferred so it runs after the current change-detection pass has
   * already written the raw values into the inputs.
   */
  private formatAllNumericInputsSoon(): void {
    if (typeof document === 'undefined') return;
    setTimeout(() => {
      document.querySelectorAll<HTMLInputElement>('input[data-numeric]').forEach((el) => {
        this.formatNumberInputOnBlur({ target: el } as unknown as Event);
      });
    });
  }

  /** Fills the main contribution field with the estimated monthly leftover from the budget widget. */
  useDiscretionaryIncomeAsContribution(): void {
    const monthly = Math.max(0, Math.round(this.householdBudget().discretionaryMonthly));
    this.contributionAmount.set(monthly);
    this.contributionFrequency.set('monthly');
    this.formatAllNumericInputsSoon();

    const contributionInput =
      typeof document !== 'undefined' ? document.getElementById('contribution-amount') : null;
    contributionInput?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }

  reset(): void {
    this.startingAmount.set(0);
    this.contributionAmount.set(774);
    this.contributionFrequency.set('monthly');
    this.contributionTiming.set('end');
    this.annualInterestRatePercent.set(10);
    this.compoundFrequency.set('annually');
    this.years.set(37);
    this.months.set(0);
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

    this.formatAllNumericInputsSoon();
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
    this.years.set(run.inputs.years);
    this.months.set(run.inputs.months);
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
    this.formatAllNumericInputsSoon();
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
