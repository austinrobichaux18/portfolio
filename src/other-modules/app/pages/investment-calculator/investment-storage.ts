import {
  CompoundFrequency,
  ContributionFrequency,
  ContributionTiming,
  InvestmentInputs,
  InvestmentRun,
} from '../../core/models/Investment';

const HISTORY_KEY = 'other-modules-investment:history';

const CONTRIBUTION_FREQUENCIES: ContributionFrequency[] = ['monthly', 'annually'];
const CONTRIBUTION_TIMINGS: ContributionTiming[] = ['beginning', 'end'];
const COMPOUND_FREQUENCIES: CompoundFrequency[] = [
  'annually',
  'semiannually',
  'quarterly',
  'monthly',
  'daily',
  'continuously',
];

function isValidInputs(item: unknown): item is InvestmentInputs {
  if (typeof item !== 'object' || item === null) return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i['startingAmount'] === 'number' &&
    typeof i['contributionAmount'] === 'number' &&
    CONTRIBUTION_FREQUENCIES.includes(i['contributionFrequency'] as ContributionFrequency) &&
    CONTRIBUTION_TIMINGS.includes(i['contributionTiming'] as ContributionTiming) &&
    typeof i['annualInterestRatePercent'] === 'number' &&
    COMPOUND_FREQUENCIES.includes(i['compoundFrequency'] as CompoundFrequency) &&
    typeof i['years'] === 'number' &&
    typeof i['months'] === 'number'
  );
}

function isValidRun(item: unknown): item is InvestmentRun {
  if (typeof item !== 'object' || item === null) return false;
  const r = item as Record<string, unknown>;
  return (
    typeof r['timestamp'] === 'string' &&
    isValidInputs(r['inputs']) &&
    typeof r['withdrawalRatePercent'] === 'number' &&
    (r['currentAge'] === null || typeof r['currentAge'] === 'number') &&
    typeof r['endingBalance'] === 'number'
  );
}

export function loadHistory(): InvestmentRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidRun) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: InvestmentRun[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // History just won't persist across sessions — not worth surfacing to the user.
  }
}
