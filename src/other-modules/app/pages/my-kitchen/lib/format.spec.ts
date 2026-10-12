import { formatAmount, formatQuantity } from './format';

describe('formatQuantity', () => {
  it.each([
    [2, '2'],
    [0.5, '½'],
    [1.5, '1 ½'],
    [0.3333, '⅓'],
    [2.6667, '2 ⅔'],
    [0.125, '⅛'],
    [2.1, '2.1'],
    [0.999, '1'],
  ])('%d → %s', (value, text) => {
    expect(formatQuantity(value)).toBe(text);
  });
});

describe('formatAmount', () => {
  it('combines amount, range and unit with the right plural', () => {
    expect(formatAmount(1, undefined, 'cup')).toBe('1 cup');
    expect(formatAmount(1.5, undefined, 'cup')).toBe('1 ½ cups');
    expect(formatAmount(2, 3, 'clove')).toBe('2–3 cloves');
    expect(formatAmount(2, undefined)).toBe('2');
    expect(formatAmount(undefined, undefined, 'cup')).toBe('');
  });
});
