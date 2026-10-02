import { Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CompoundFrequency,
  ContributionFrequency,
  ContributionTiming,
  InvestmentRun,
} from '../../core/models/Investment';
import { calculateInvestment } from './investment-calc';
import { loadHistory, saveHistory } from './investment-storage';

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const CHART_MARGIN = { top: 16, right: 16, bottom: 24, left: 56 };

const PIE_SIZE = 180;
const PIE_RADIUS = 80;
const PIE_CENTER = PIE_SIZE / 2;

const MILESTONES = [1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 10_000_000];

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
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function toNonNegativeNumber(raw: string): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function toNonNegativeIntOrNull(raw: string): number | null {
  const trimmed = raw.trim();
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

@Component({
  selector: 'app-investment-calculator',
  imports: [DatePipe],
  templateUrl: './investment-calculator.html',
  styleUrl: './investment-calculator.scss',
})
export class InvestmentCalculator {
  readonly formatCurrency = formatCurrency;

  startingAmount = signal(1000);

  contributionAmount = signal(200);

  contributionFrequency = signal<ContributionFrequency>('monthly');

  contributionTiming = signal<ContributionTiming>('end');

  annualInterestRatePercent = signal(10);

  compoundFrequency = signal<CompoundFrequency>('annually');

  years = signal(20);

  months = signal(0);

  withdrawalRatePercent = signal(3.5);

  currentAge = signal<number | null>(null);

  history = signal<InvestmentRun[]>(loadHistory());

  historyDescending = computed(() =>
    [...this.history()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  );

  hoveredBarYear = signal<number | null>(null);

  contributionBreakdown = computed(() => {
    const amount = this.contributionAmount();
    return this.contributionFrequency() === 'monthly'
      ? { monthly: amount, yearly: amount * 12 }
      : { monthly: amount / 12, yearly: amount };
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
    this.years.set(toNonNegativeNumber(raw));
  }

  setMonths(raw: string): void {
    this.months.set(Math.min(11, toNonNegativeNumber(raw)));
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

  reset(): void {
    this.startingAmount.set(1000);
    this.contributionAmount.set(200);
    this.contributionFrequency.set('monthly');
    this.contributionTiming.set('end');
    this.annualInterestRatePercent.set(10);
    this.compoundFrequency.set('annually');
    this.years.set(20);
    this.months.set(0);
    this.withdrawalRatePercent.set(3.5);
    this.currentAge.set(null);
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
      },
      withdrawalRatePercent: this.withdrawalRatePercent(),
      currentAge: this.currentAge(),
      endingBalance: this.result().endingBalance,
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
    this.withdrawalRatePercent.set(run.withdrawalRatePercent);
    this.currentAge.set(run.currentAge);
  }

  deleteFromHistory(timestamp: string): void {
    const updated = this.history().filter((r) => r.timestamp !== timestamp);
    this.history.set(updated);
    saveHistory(updated);
  }

  summaryFor(run: InvestmentRun): string {
    const i = run.inputs;
    const contributionFreq = i.contributionFrequency === 'monthly' ? '/mo' : '/yr';
    const horizon = i.months > 0 ? `${i.years}y ${i.months}m` : `${i.years}y`;
    return (
      `${formatCurrency(i.startingAmount)} start + ${formatCurrency(i.contributionAmount)}` +
      `${contributionFreq} @ ${i.annualInterestRatePercent}% for ${horizon}`
    );
  }

  clearHistory(): void {
    const confirmed = confirm('Clear all saved investment scenarios? This cannot be undone.');
    if (!confirmed) return;

    this.history.set([]);
    saveHistory([]);
  }
}
