import { loadHistory, saveHistory } from './investment-storage';
import { InvestmentRun } from '../../core/models/Investment';

const HISTORY_KEY = 'other-modules-investment:history';

function makeRun(timestamp: string): InvestmentRun {
  return {
    timestamp,
    inputs: {
      startingAmount: 1000,
      contributionAmount: 200,
      contributionFrequency: 'monthly',
      contributionTiming: 'end',
      annualInterestRatePercent: 10,
      compoundFrequency: 'annually',
      years: 20,
      months: 0,
    },
    withdrawalRatePercent: 3.5,
    currentAge: 30,
    endingBalance: 150000,
  };
}

describe('investment history persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a saved history list', () => {
    const run = makeRun('2026-01-01T00:00:00.000Z');
    saveHistory([run]);
    expect(loadHistory()).toEqual([run]);
  });

  it('returns an empty list when nothing has been saved', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('drops malformed entries rather than rejecting the whole list', () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([makeRun('2026-01-01T00:00:00.000Z'), { bogus: true }]),
    );
    expect(loadHistory()).toHaveLength(1);
  });

  it('ignores malformed JSON', () => {
    localStorage.setItem(HISTORY_KEY, 'not json');
    expect(loadHistory()).toEqual([]);
  });
});
