import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvestmentCalculator } from './investment-calculator';

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
    component.setContributionAmount('500');
    const after = component.result().endingBalance;
    expect(after).toBeGreaterThan(before);
  });

  it('resets all inputs to their defaults', () => {
    component.setStartingAmount('9999');
    component.setYears('1');
    component.setCurrentAge('30');
    component.setWithdrawalRatePercent('5');
    component.reset();
    expect(component.startingAmount()).toBe(1000);
    expect(component.years()).toBe(20);
    expect(component.currentAge()).toBeNull();
    expect(component.withdrawalRatePercent()).toBe(3.5);
  });

  it('computes the withdrawal amount as a percentage of the ending balance', () => {
    component.setWithdrawalRatePercent('4');
    expect(component.withdrawalAmount(100000)).toBeCloseTo(4000);
  });

  it('leaves current age unset until entered, then computes age per year', () => {
    expect(component.currentAge()).toBeNull();
    component.setCurrentAge('30');
    expect(component.currentAge()).toBe(30);
    expect(component.ageAtYear(1)).toBe(31);
    expect(component.ageAtYear(5)).toBe(35);
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
    expect(component.startingAmount()).toBe(1000);

    component.loadFromHistory(saved);
    expect(component.startingAmount()).toBe(5000);
    expect(component.currentAge()).toBe(40);
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
});
