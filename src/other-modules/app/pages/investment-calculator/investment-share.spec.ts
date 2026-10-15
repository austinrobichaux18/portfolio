import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { InvestmentCalculator } from './investment-calculator';
import { applyShareParams, buildShareParams } from './investment-share';
import { buildInvestmentAgentTools } from './investment-agent-tools';

function createCalculator(queryParams: Record<string, string> = {}): InvestmentCalculator {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [InvestmentCalculator],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
      },
    ],
  });
  return TestBed.createComponent(InvestmentCalculator).componentInstance;
}

describe('investment share links', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips every input through the query string', () => {
    const source = createCalculator();
    source.setStartingAmount('25000');
    source.setContributionAmount('1500');
    source.setContributionFrequency('annually');
    source.setAnnualInterestRatePercent('7.5');
    source.setCompoundFrequency('monthly');
    source.setCurrentAge('35');
    source.setIncomesFromSpecs('yearly:90000,hourly:25:30:50');
    source.onStateSelected('TX');
    source.setWithholdingsAmount('200');
    source.setWithholdingsFrequency('biweekly');
    source.setCurrentCheckingBalance('4000');
    source.setBoostsFromSpecs('age:50:800:Mortgage paid off|year:5:100:Raise');
    source.setGoalsInTodaysDollars(true);
    source.setGoalAmount('2,000,000');

    const params = buildShareParams(source);
    const target = createCalculator(Object.fromEntries(params));

    expect(buildShareParams(target).toString()).toBe(params.toString());
    expect(target.heldGoal()).toBe('amount');
    expect(target.goalAmountDisplay()).toBe(2_000_000);
    expect(target.result().endingBalance).toBeCloseTo(source.result().endingBalance);
    expect(target.contributionBoosts().map((b) => b.label)).toEqual(['Mortgage paid off', 'Raise']);
  });

  it('leaves params it does not recognize, and invalid enum values, alone', () => {
    const c = createCalculator({ contributionFrequency: 'weekly', foo: 'bar', contribution: '900' });
    expect(c.contributionFrequency()).toBe('monthly');
    expect(c.contributionAmount()).toBe(900);
  });

  it('treats a bare number in incomes as a yearly salary', () => {
    const c = createCalculator();
    c.setIncomesFromSpecs('85000, monthly:2000');
    expect(c.incomeAnnualAmounts()).toEqual([85_000, 24_000]);
  });

  it('locks in the value after the other inputs when only hold is given', () => {
    const c = createCalculator();
    const expected = createCalculator();
    expected.setStartingAmount('100000');

    applyShareParams(c, { hold: 'amount', startingAmount: 100000 });
    expect(c.heldGoal()).toBe('amount');
    expect(c.goalAmountDisplay()).toBe(Math.floor(expected.result().endingBalance));
  });
});

describe('investment agent tools', () => {
  beforeEach(() => localStorage.clear());

  const run = async (c: InvestmentCalculator, name: string, input: Record<string, unknown> = {}) => {
    const tool = buildInvestmentAgentTools(c).find((t) => t.name === name)!;
    return JSON.parse((await tool.execute(input)).content[0].text);
  };

  it('reports the current scenario', async () => {
    const c = createCalculator();
    const summary = await run(c, 'get_investment_scenario');
    expect(summary.inputs.contribution).toBe('774');
    expect(summary.results.endingBalance).toBe(Math.round(c.result().endingBalance));
    expect(summary.shareLink).toContain('contribution=774');
  });

  it('changes only the inputs passed, and reports which were ignored', async () => {
    const c = createCalculator();
    const out = await run(c, 'set_investment_inputs', { interestRate: 6, nonsense: 1 });
    expect(c.annualInterestRatePercent()).toBe(6);
    expect(c.contributionAmount()).toBe(774);
    expect(out.applied).toEqual(['interestRate']);
    expect(out.ignored).toEqual(['nonsense']);
  });

  it('resets everything to defaults', async () => {
    const c = createCalculator();
    c.setStartingAmount('5000');
    await run(c, 'reset_investment_calculator');
    expect(c.startingAmount()).toBe(0);
  });

  it('round-trips a contribution boost end age', () => {
    const c = createCalculator();
    c.setCurrentAge('30');
    c.setBoostsFromSpecs('age:50-60:500:Side job');
    expect(c.contributionBoosts()[0]).toMatchObject({ atAge: 50, endAtAge: 60, label: 'Side job' });
    expect(c.boostSpecs()).toBe('age:50-60:500:Side job');
    expect(c.calcContributionBoosts()).toEqual([{ startYear: 20, endYear: 30, additionalMonthly: 500 }]);
  });

  it('accepts a negative contribution', () => {
    const c = createCalculator({ contribution: '-200' });
    expect(c.contributionAmount()).toBe(-200);
  });

  it('stores a yearly boost amount per month and shows it back in yearly', () => {
    const c = createCalculator();
    c.addContributionBoost();
    const id = c.contributionBoosts()[0].id;
    c.setBoostAmountFrequency(id, 'yearly');
    c.setBoostAmount(id, '6000');
    expect(c.contributionBoosts()[0].additionalMonthlyAmount).toBe(500);
    expect(c.boostDisplayAmount(c.contributionBoosts()[0])).toBe(6000);
  });

  it('round-trips a yearly boost amount through the share link', () => {
    const c = createCalculator();
    c.setBoostsFromSpecs('age:50-60:6000y:Side job');
    expect(c.contributionBoosts()[0]).toMatchObject({
      additionalMonthlyAmount: 500,
      amountFrequency: 'yearly',
    });
    expect(c.boostSpecs()).toBe('age:50-60:6000y:Side job');
  });

  it('leaves a switched-off boost out of the projection, and keeps it in the share link', () => {
    const c = createCalculator();
    c.setCurrentAge('30');
    c.setBoostsFromSpecs('age:40:500:Raise');
    const withBoost = c.result().endingBalance;
    const id = c.contributionBoosts()[0].id;

    c.setBoostEnabled(id, false);
    expect(c.result().endingBalance).toBeLessThan(withBoost);
    expect(c.boostSpecs()).toBe('off:age:40:500:Raise');

    const copy = createCalculator(Object.fromEntries(buildShareParams(c)));
    expect(copy.contributionBoosts()[0].disabled).toBe(true);
    copy.setBoostEnabled(copy.contributionBoosts()[0].id, true);
    expect(copy.result().endingBalance).toBeCloseTo(withBoost);
  });

  it('links a boost end age and its number of years', () => {
    const c = createCalculator();
    c.setCurrentAge('30');
    c.setBoostsFromSpecs('age:50:500:Side job');
    const id = c.contributionBoosts()[0].id;

    c.setBoostDurationYears(id, '10');
    expect(c.contributionBoosts()[0].endAtAge).toBe(60);

    c.setBoostEndAtAge(id, '65');
    expect(c.boostDurationYears(c.contributionBoosts()[0])).toBe(15);

    c.setBoostDurationYears(id, '');
    expect(c.contributionBoosts()[0].endAtAge).toBeNull();
  });

  it('uses years-from-now for the boost duration when no age is entered', () => {
    const c = createCalculator();
    c.setCurrentAge('');
    c.setBoostsFromSpecs('year:5:200:Raise');
    c.setBoostDurationYears(c.contributionBoosts()[0].id, '3');
    expect(c.contributionBoosts()[0].endAtYear).toBe(8);
  });

  it('treats a one-time boost as a single lump sum and ignores its end', () => {
    const c = createCalculator();
    c.setCurrentAge('30');
    c.setBoostsFromSpecs('age:40:500:Raise');
    const id = c.contributionBoosts()[0].id;

    c.setBoostAmountFrequency(id, 'once');
    expect(c.boostDisplayAmount(c.contributionBoosts()[0])).toBe(500);
    c.setBoostAmount(id, '50000');
    c.setBoostEndAtAge(id, '45');
    expect(c.calcContributionBoosts()).toEqual([
      { startYear: 10, additionalMonthly: 50000, oneTime: true },
    ]);
    expect(c.boostSpecs()).toBe('age:40-45:50000once:Raise');

    // Back to yearly keeps the shown number, now as a yearly amount.
    c.setBoostAmountFrequency(id, 'yearly');
    expect(c.boostDisplayAmount(c.contributionBoosts()[0])).toBe(50000);
  });

  it('round-trips a one-time boost through the share link', () => {
    const c = createCalculator();
    c.setBoostsFromSpecs('age:55:50000once:Inheritance');
    expect(c.contributionBoosts()[0]).toMatchObject({
      additionalMonthlyAmount: 50000,
      amountFrequency: 'once',
    });
    expect(c.boostSpecs()).toBe('age:55:50000once:Inheritance');
  });

  it('saves and restores holds, the today\'s-$ toggle, and boosts in a saved scenario', () => {
    const c = createCalculator();
    c.setCurrentAge('30');
    c.setBoostsFromSpecs('age:45-55:6000y:Side job|off:age:60:50000once:Bonus');
    c.setGoalsInTodaysDollars(true);
    c.setGoalAmount('1,500,000');
    const before = buildShareParams(c).toString();
    c.saveCurrentToHistory();
    const run = c.history()[0];
    expect(c.summaryFor(run)).toContain('2 boosts · goal amount held (today\'s $)');

    c.reset();
    expect(c.contributionBoosts()).toEqual([]);
    c.loadFromHistory(run);

    expect(buildShareParams(c).toString()).toBe(before);
    expect(c.heldGoal()).toBe('amount');
    expect(c.goalsInTodaysDollars()).toBe(true);
    expect(c.contributionBoosts().map((b) => b.disabled ?? false)).toEqual([false, true]);
  });

  it('clears boosts the saved scenario did not have when loading it', () => {
    const c = createCalculator();
    c.saveCurrentToHistory();
    c.setBoostsFromSpecs('age:45:500:Raise');
    c.loadFromHistory(c.history()[0]);
    expect(c.contributionBoosts()).toEqual([]);
  });

  it('still loads older saved scenarios that predate the full scenario field', () => {
    const c = createCalculator();
    c.saveCurrentToHistory();
    const { scenario: _scenario, ...legacyRun } = c.history()[0];
    c.setStartingAmount('5000');
    c.loadFromHistory({ ...legacyRun, inputs: { ...legacyRun.inputs, startingAmount: 1234 } });
    expect(c.startingAmount()).toBe(1234);
  });
});
