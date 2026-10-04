import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvestmentCalculator } from './investment-calculator';
import { STATE_TAX_RATES } from '../../core/data/state-tax-rates';

const AVERAGE_STATE_TAX_RATE_PERCENT =
  STATE_TAX_RATES.reduce((sum, state) => sum + state.rate, 0) / STATE_TAX_RATES.length;

describe('InvestmentCalculator', () => {
  let component: InvestmentCalculator;
  let fixture: ComponentFixture<InvestmentCalculator>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [InvestmentCalculator],
    }).compileComponents();
    fixture = TestBed.createComponent(InvestmentCalculator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('computes a result from the default inputs', () => {
    fixture.detectChanges();
    const result = component.result();
    expect(result.endingBalance).toBeGreaterThan(result.startingAmount);
    expect(result.yearRows).toHaveLength(component.years());
  });

  it('recomputes when an input signal changes', () => {
    const before = component.result().endingBalance;
    component.setContributionAmount('2000');
    const after = component.result().endingBalance;
    expect(after).toBeGreaterThan(before);
  });

  it('resets all inputs in both widgets to their defaults', () => {
    component.setStartingAmount('9999');
    component.setYears('1');
    component.setCurrentAge('85');
    component.setWithdrawalRatePercent('5');
    component.setInflationRatePercent('0');
    component.onStateSelected('CA');
    component.setWithholdingsAmount('500');
    component.setMonthlyCostOfLiving('9999');
    component.setCurrentCheckingBalance('1234');
    component.setCurrentSavingsBalance('1234');
    component.setIgnoreAlreadySaved(true);
    component.addIncomeEntry();

    component.reset();

    expect(component.startingAmount()).toBe(0);
    expect(component.years()).toBe(37);
    expect(component.currentAge()).toBe(30);
    expect(component.withdrawalRatePercent()).toBe(3.5);
    expect(component.inflationRatePercent()).toBe(3);

    expect(component.incomeEntries()).toHaveLength(1);
    expect(component.incomeAnnualAmounts()).toEqual([70000]);
    expect(component.selectedStateCode()).toBe('');
    expect(component.withholdingsAmount()).toBe(0);
    expect(component.monthlyCostOfLiving()).toBe(45_000 / 12);
    expect(component.currentCheckingBalance()).toBe(0);
    expect(component.currentSavingsBalance()).toBe(0);
    expect(component.ignoreAlreadySaved()).toBe(false);
    expect(component.householdBudgetEntered()).toBe(false);
  });

  it('feeds the inflation rate into the projection', () => {
    component.setInflationRatePercent('4');
    expect(component.result().endingBalanceReal).toBeLessThan(component.result().endingBalance);
  });

  it('hides the real-dollars stat once inflation is set to zero', () => {
    component.setInflationRatePercent('0');
    expect(component.result().endingBalanceReal).toBeCloseTo(component.result().endingBalance, 6);
  });

  it('computes the withdrawal amount as a percentage of the ending balance', () => {
    component.setWithdrawalRatePercent('4');
    expect(component.withdrawalAmount(100000)).toBeCloseTo(4000);
  });

  it('leaves current age unset until entered, then computes age per year', () => {
    component.setCurrentAge('');
    expect(component.currentAge()).toBeNull();
    component.setCurrentAge('30');
    expect(component.currentAge()).toBe(30);
    expect(component.ageAtYear(1)).toBe(31);
    expect(component.ageAtYear(5)).toBe(35);
  });

  it('computes the final age at the end of the horizon, or null with no age entered', () => {
    component.setCurrentAge('');
    expect(component.finalAge()).toBeNull();
    component.setCurrentAge('30');
    component.setYears('20');
    expect(component.finalAge()).toBe(50);
  });

  it('adds the average Social Security benefit to withdrawals once age 67 is reached', () => {
    component.setCurrentAge('60');
    expect(component.isSsEligibleYear(6)).toBe(false); // age 66
    expect(component.isSsEligibleYear(7)).toBe(true); // age 67

    const base = component.withdrawalAmount(1_000_000);
    expect(component.totalWithdrawal(6, 1_000_000)).toBeCloseTo(base, 2);
    expect(component.totalWithdrawal(7, 1_000_000)).toBeCloseTo(base + 25_000, 2);
  });

  it('never flags Social Security eligibility without an age entered', () => {
    component.setCurrentAge('');
    expect(component.currentAge()).toBeNull();
    expect(component.isSsEligibleYear(100)).toBe(false);
  });

  it('toggles the per-row Social Security info popover independently by year', () => {
    expect(component.isSsInfoOpen(10)).toBe(false);
    component.toggleSsInfo(10);
    expect(component.isSsInfoOpen(10)).toBe(true);
    expect(component.isSsInfoOpen(11)).toBe(false);
    component.closeSsInfo();
    expect(component.isSsInfoOpen(10)).toBe(false);
  });

  it('starts with a single yearly income entry defaulting to $70,000', () => {
    expect(component.incomeEntries()).toHaveLength(1);
    expect(component.incomeEntries()[0].mode).toBe('yearly');
    expect(component.incomeAnnualAmounts()).toEqual([70000]);
  });

  it('adds up to 10 income entries and no more', () => {
    for (let i = 0; i < 20; i++) component.addIncomeEntry();
    expect(component.incomeEntries()).toHaveLength(10);
    expect(component.canAddIncomeEntry()).toBe(false);
  });

  it('removes an income entry but never the last one', () => {
    component.addIncomeEntry();
    expect(component.incomeEntries()).toHaveLength(2);

    const [first, second] = component.incomeEntries();
    component.removeIncomeEntry(second.id);
    expect(component.incomeEntries()).toHaveLength(1);

    component.removeIncomeEntry(first.id);
    expect(component.incomeEntries()).toHaveLength(1);
    expect(component.canRemoveIncomeEntry()).toBe(false);
  });

  it('computes an hourly income entry as rate * hours/week * weeks/year', () => {
    const id = component.incomeEntries()[0].id;
    component.setIncomeEntryMode(id, 'hourly');
    component.setIncomeEntryHourlyRate(id, '25');
    component.setIncomeEntryHoursPerWeek(id, '40');
    component.setIncomeEntryWeeksPerYear(id, '50');
    expect(component.incomeAnnualAmounts()).toEqual([50_000]);
  });

  it('labels the first entry as the primary salary and the rest as additional income', () => {
    expect(component.incomeEntryLabel(0)).toBe('Your Annual Salary');
    expect(component.incomeEntryLabel(1)).toContain('Additional Income #2');
  });

  it('applies a household preset to income entries and cost of living', () => {
    component.applyHouseholdPreset('married2Children');
    expect(component.incomeAnnualAmounts()).toEqual([70_000, 40_000]);
    expect(component.monthlyCostOfLiving()).toBe(9_180);
  });

  it('ignores an unknown preset id', () => {
    const before = component.incomeAnnualAmounts();
    component.applyHouseholdPreset('not-a-real-preset');
    expect(component.incomeAnnualAmounts()).toEqual(before);
  });

  it('includes single-parent presets with a single income entry', () => {
    component.applyHouseholdPreset('single2Children');
    expect(component.incomeAnnualAmounts()).toEqual([42_124]);
    expect(component.monthlyCostOfLiving()).toBe(7_110);
  });

  it('tracks and labels the last-applied preset', () => {
    expect(component.lastAppliedPresetLabel()).toBeNull();
    component.applyHouseholdPreset('single');
    expect(component.lastAppliedPresetLabel()).toBe('Single');
    component.applyHouseholdPreset('not-a-real-preset');
    expect(component.lastAppliedPresetLabel()).toBe('Single');
  });

  it('displays and accepts cost of living as a yearly amount when toggled', () => {
    component.setMonthlyCostOfLiving('3000');
    expect(component.costOfLivingDisplayAmount()).toBe(3000);

    component.setCostOfLivingFrequency('yearly');
    expect(component.costOfLivingDisplayAmount()).toBe(36_000);

    component.setCostOfLivingAmount('24000');
    expect(component.monthlyCostOfLiving()).toBe(2000);
    expect(component.costOfLivingDisplayAmount()).toBe(24_000);
  });

  it('computes savings/checking buffer targets from monthly cost of living', () => {
    component.setMonthlyCostOfLiving('3000');
    expect(component.checkingBufferTarget()).toBe(9_000);
    expect(component.savingsBufferTarget()).toBe(18_000);
  });

  it('delays contributions until the savings/checking gap is filled', () => {
    component.setMonthlyCostOfLiving('1000'); // targets: 3,000 checking + 6,000 HYSA = 9,000 gap
    component.setContributionAmount('1000');
    component.contributionFrequency.set('monthly');
    expect(component.bufferGapRemaining()).toBe(9_000);
    expect(component.contributionDelayMonths()).toBe(9);
  });

  it('shrinks the delay as existing checking/HYSA balances are entered', () => {
    component.setMonthlyCostOfLiving('1000');
    component.setContributionAmount('1000');
    component.setCurrentCheckingBalance('3000');
    component.setCurrentSavingsBalance('6000');
    expect(component.bufferGapRemaining()).toBe(0);
    expect(component.contributionDelayMonths()).toBe(0);
  });

  it('ignores the buffer gap and delay entirely when the "ignore this" toggle is on', () => {
    component.setMonthlyCostOfLiving('1000'); // targets: 3,000 checking + 6,000 HYSA = 9,000 gap
    component.setContributionAmount('1000');
    component.contributionFrequency.set('monthly');
    expect(component.contributionDelayMonths()).toBe(9);

    component.setIgnoreAlreadySaved(true);
    expect(component.contributionDelayMonths()).toBe(0);
  });

  it('feeds the computed delay into the main investment projection', () => {
    component.setMonthlyCostOfLiving('1000');
    component.setContributionAmount('1000');
    component.contributionFrequency.set('monthly');
    component.setYears('1');
    expect(component.contributionDelayMonths()).toBe(9);
    // Only 3 of 12 months actually contribute (1,000 * 3 = 3,000) once the delay is applied.
    expect(component.result().totalContributions).toBeCloseTo(3_000, 2);
  });

  it('adds thousands separators to a number textbox once it loses focus', () => {
    const input = document.createElement('input');
    input.value = '1000000';
    component.formatNumberInputOnBlur({ target: input } as unknown as Event);
    expect(input.value).toBe('1,000,000');
  });

  it('strips existing commas before reformatting on blur, preserving decimals', () => {
    const input = document.createElement('input');
    input.value = '1,234.5';
    component.formatNumberInputOnBlur({ target: input } as unknown as Event);
    expect(input.value).toBe('1,234.5');
  });

  it('leaves an empty or invalid number textbox alone on blur', () => {
    const input = document.createElement('input');
    input.value = '';
    component.formatNumberInputOnBlur({ target: input } as unknown as Event);
    expect(input.value).toBe('');
  });

  it('parses a comma-formatted value back into a plain number', () => {
    component.setStartingAmount('12,500');
    expect(component.startingAmount()).toBe(12_500);
  });

  it('formats numeric inputs with commas on first load, before any user interaction', async () => {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const contributionAmountInput = fixture.nativeElement.querySelector(
      '#contribution-amount',
    ) as HTMLInputElement;
    const incomeInput = fixture.nativeElement.querySelector(
      `#income-${component.incomeEntries()[0].id}`,
    ) as HTMLInputElement;
    expect(contributionAmountInput.value).toBe('774');
    expect(incomeInput.value).toBe('70,000');
  });

  it('formats numeric inputs with commas after a prefill action, not just on blur', async () => {
    fixture.detectChanges();
    component.applyHouseholdPreset('married2Children');
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const costOfLivingInput = fixture.nativeElement.querySelector(
      '#cost-of-living',
    ) as HTMLInputElement;
    expect(costOfLivingInput.value).toBe('9,180');
  });

  it('clears current age when the field is emptied', () => {
    component.setCurrentAge('30');
    component.setCurrentAge('');
    expect(component.currentAge()).toBeNull();
  });

  it('saves the current inputs to history', () => {
    expect(component.history()).toHaveLength(0);
    component.setStartingAmount('5000');
    component.saveCurrentToHistory();
    expect(component.history()).toHaveLength(1);
    expect(component.history()[0].inputs.startingAmount).toBe(5000);
  });

  it('restores inputs from a saved history entry', () => {
    component.setStartingAmount('5000');
    component.setCurrentAge('40');
    component.saveCurrentToHistory();
    const saved = component.history()[0];

    component.reset();
    expect(component.startingAmount()).toBe(0);

    component.loadFromHistory(saved);
    expect(component.startingAmount()).toBe(5000);
    expect(component.currentAge()).toBe(40);
  });

  it('saves and restores the inflation rate with a history entry', () => {
    component.setInflationRatePercent('2');
    component.saveCurrentToHistory();
    const saved = component.history()[0];

    component.reset();
    expect(component.inflationRatePercent()).toBe(3);

    component.loadFromHistory(saved);
    expect(component.inflationRatePercent()).toBe(2);
  });

  it('defaults the inflation rate when loading an older history entry', () => {
    component.saveCurrentToHistory();
    const legacyRun = { ...component.history()[0] };
    const legacyInputs = { ...legacyRun.inputs } as Record<string, unknown>;
    delete legacyInputs['inflationRatePercent'];
    legacyRun.inputs = legacyInputs as unknown as typeof legacyRun.inputs;

    component.setInflationRatePercent('9');
    component.loadFromHistory(legacyRun);
    expect(component.inflationRatePercent()).toBe(3);
  });

  it('omits the household budget snapshot when that widget is untouched', () => {
    expect(component.householdBudgetEntered()).toBe(false);
    component.saveCurrentToHistory();
    expect(component.history()[0].householdBudget).toBeUndefined();
  });

  it('saves and restores the household budget widget once it has been entered', () => {
    component.onStateSelected('CA');
    component.setWithholdingsAmount('100');
    component.setMonthlyCostOfLiving('4000');
    component.setCurrentCheckingBalance('2000');
    expect(component.householdBudgetEntered()).toBe(true);

    component.saveCurrentToHistory();
    const saved = component.history()[0];
    expect(saved.householdBudget).toBeDefined();
    expect(saved.householdBudget?.selectedStateCode).toBe('CA');
    expect(saved.householdBudget?.monthlyCostOfLiving).toBe(4000);

    // Mutate the live state, then confirm loading the run restores the snapshot.
    component.onStateSelected('');
    component.setMonthlyCostOfLiving('3000');
    component.setCurrentCheckingBalance('0');

    component.loadFromHistory(saved);
    expect(component.selectedStateCode()).toBe('CA');
    expect(component.monthlyCostOfLiving()).toBe(4000);
    expect(component.currentCheckingBalance()).toBe(2000);
  });

  it('saves and restores the "ignore already saved" toggle with the household budget snapshot', () => {
    component.setIgnoreAlreadySaved(true);
    expect(component.householdBudgetEntered()).toBe(true);

    component.saveCurrentToHistory();
    const saved = component.history()[0];
    expect(saved.householdBudget?.ignoreAlreadySaved).toBe(true);

    component.setIgnoreAlreadySaved(false);
    component.loadFromHistory(saved);
    expect(component.ignoreAlreadySaved()).toBe(true);
  });

  it('flags only the year that first crosses each milestone balance', () => {
    component.setStartingAmount('0');
    component.setContributionAmount('200000');
    component.setContributionFrequency('annually');
    component.setContributionTiming('end');
    component.setAnnualInterestRatePercent('0');
    component.setYears('6');

    const milestoneYears = component.milestoneYears();
    expect(component.isMilestoneYear(5)).toBe(true);
    expect(milestoneYears.get(5)).toEqual([1_000_000]);
    expect(component.isMilestoneYear(4)).toBe(false);
    expect(component.isMilestoneYear(6)).toBe(false);
  });

  it('deletes a single history entry', () => {
    component.saveCurrentToHistory();
    component.setStartingAmount('5000');
    component.saveCurrentToHistory();
    expect(component.history()).toHaveLength(2);

    const [first] = component.history();
    component.deleteFromHistory(first.timestamp);
    expect(component.history()).toHaveLength(1);
    expect(component.history()[0].timestamp).not.toBe(first.timestamp);
  });

  it('prefills the state tax rate and cost of living when a state is selected', () => {
    expect(component.stateTaxRatePercent()).toBe(AVERAGE_STATE_TAX_RATE_PERCENT);
    component.onStateSelected('CA');
    expect(component.selectedStateCode()).toBe('CA');
    expect(component.stateTaxRatePercent()).toBe(13.3);
    expect(component.monthlyCostOfLiving()).toBe(9180);
  });

  it('sorts states alphabetically by default', () => {
    const names = component.sortedStateTaxRates().map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('sorts states by ascending tax rate when requested', () => {
    component.setStateSortOrder('taxRateAsc');
    const rates = component.sortedStateTaxRates().map((s) => s.rate);
    expect(rates).toEqual([...rates].sort((a, b) => a - b));
    expect(rates[0]).toBe(0);
  });

  it('converts withholdings to an annual figure based on the selected pay frequency', () => {
    component.setWithholdingsAmount('100');
    component.setWithholdingsFrequency('biweekly');
    expect(component.annualWithholdings()).toBe(2600);

    component.setWithholdingsFrequency('monthly');
    expect(component.annualWithholdings()).toBe(1200);
  });

  it('sends the estimated monthly discretionary income to the contribution field', () => {
    component.setIncomeEntryYearlyAmount(component.incomeEntries()[0].id, '120000');
    component.setMonthlyCostOfLiving('3000');
    component.contributionFrequency.set('annually');

    const expectedMonthly = Math.max(
      0,
      Math.round(component.householdBudget().discretionaryMonthly),
    );
    component.useDiscretionaryIncomeAsContribution();

    expect(component.contributionAmount()).toBe(expectedMonthly);
    expect(component.contributionFrequency()).toBe('monthly');
  });

  it('never sends a negative contribution when expenses exceed take-home pay', () => {
    component.setIncomeEntryYearlyAmount(component.incomeEntries()[0].id, '10000');
    component.setMonthlyCostOfLiving('5000');
    expect(component.householdBudget().discretionaryMonthly).toBeLessThan(0);

    component.useDiscretionaryIncomeAsContribution();
    expect(component.contributionAmount()).toBe(0);
  });

  it('toggles an info popover open and closed', () => {
    expect(component.isInfoPopoverOpen('withholdings')).toBe(false);
    component.toggleInfoPopover('withholdings');
    expect(component.isInfoPopoverOpen('withholdings')).toBe(true);
    component.closeInfoPopover();
    expect(component.isInfoPopoverOpen('withholdings')).toBe(false);
  });

  it('only shows one info popover at a time', () => {
    component.toggleInfoPopover('withholdings');
    expect(component.isInfoPopoverOpen('withholdings')).toBe(true);

    component.toggleInfoPopover('costOfLiving');
    expect(component.isInfoPopoverOpen('withholdings')).toBe(false);
    expect(component.isInfoPopoverOpen('costOfLiving')).toBe(true);
  });

  it('derives the goal retirement age from current age plus the time horizon', () => {
    component.setCurrentAge('30');
    component.setYears('35');
    component.setMonths('0');
    expect(component.goalRetirementAge()).toBe(65);

    component.setMonths('7');
    expect(component.goalRetirementAge()).toBe(66); // rounds up past the half-year mark

    component.setCurrentAge('');
    expect(component.goalRetirementAge()).toBeNull();
  });

  it('re-derives years/months when the goal retirement age is edited', () => {
    component.setCurrentAge('30');
    component.setRetirementAge('65');
    expect(component.years()).toBe(35);
    expect(component.months()).toBe(0);
    expect(component.goalRetirementAge()).toBe(65);

    // Can't go below the current age.
    component.setRetirementAge('20');
    expect(component.years()).toBe(0);
    expect(component.months()).toBe(0);
  });

  it('ignores the retirement age input until a current age is entered', () => {
    component.setCurrentAge('');
    component.setYears('10');
    component.setRetirementAge('65');
    expect(component.years()).toBe(10);
  });

  it('only flags the first year that covers the entered cost of living', () => {
    component.setCurrentAge('30');
    component.setMonthlyCostOfLiving('1000');
    const rows = component.result().yearRows;
    const coveredYears = rows
      .map((row) => row.year)
      .filter((year) => component.coversCostOfLiving(year, rows[year - 1].endingBalance));
    expect(coveredYears.length).toBeGreaterThan(1);
    expect(component.firstCostOfLivingCoveredYear()).toBe(coveredYears[0]);
  });
});
