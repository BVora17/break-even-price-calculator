import { calculateBreakEven, formatFee, formatMoney, formatNumber, formatPrice, validateFee, validateForm, validatePrice, validateQuantity } from './calc';
import type { Fee, FormInput, ValidInput } from './calc';

const fixed = (value: number): Fee => ({ type: 'fixed', value });
const percent = (value: number): Fee => ({ type: 'percent', value });
const input = (buyingFee: Fee, sellingFee: Fee, quantity = 5, price = 100): ValidInput => ({ quantity, price, buyingFee, sellingFee });

function run(i: ValidInput) {
  const r = calculateBreakEven(i);
  if (!r) throw new Error('expected a result');
  return r;
}

describe('required test cases', () => {
  it('A: no fees → break-even equals the buying price', () => {
    const r = run(input(fixed(0), fixed(0)));
    expect(r.purchaseValue).toBe(500);
    expect(r.investmentCost).toBe(500);
    expect(r.grossSellingValue).toBe(500);
    expect(r.breakEvenPrice).toBe(100);
  });

  it('B: fixed buying ₹10 and fixed selling ₹15', () => {
    const r = run(input(fixed(10), fixed(15)));
    expect(r.purchaseValue).toBe(500);
    expect(r.investmentCost).toBe(510);
    expect(r.grossSellingValue).toBe(525);
    expect(r.breakEvenPrice).toBe(105);
    expect(r.sellingFee).toBe(15);
    expect(r.netProceeds).toBe(510);
    expect(r.totalCostToRecover).toBe(525);
  });

  it('C: buying 2% and selling 1%', () => {
    const r = run(input(percent(2), percent(1)));
    expect(r.purchaseValue).toBe(500);
    expect(r.buyingFee).toBe(10);
    expect(r.investmentCost).toBe(510);
    expect(r.grossSellingValue).toBeCloseTo(515.1515, 4);
    expect(r.breakEvenPrice).toBeCloseTo(103.0303, 4);
    expect(r.sellingFee).toBeCloseTo(5.1515, 4);
    expect(r.netProceeds).toBeCloseTo(510, 10);
    expect(formatPrice(r.breakEvenPrice)).toBe('₹103.03');
    expect(formatMoney(r.sellingFee)).toBe('₹5.15');
  });
});

describe('mixed fee types', () => {
  it('percentage buying fee with fixed selling fee', () => {
    const r = run(input(percent(2), fixed(15)));
    expect(r.buyingFee).toBe(10);          // 2% of the PURCHASE VALUE (500), not of anything else
    expect(r.grossSellingValue).toBe(525); // 510 + 15
    expect(r.breakEvenPrice).toBe(105);
    expect(r.netProceeds).toBe(510);
  });

  it('fixed buying fee with percentage selling fee', () => {
    const r = run(input(fixed(10), percent(1)));
    expect(r.investmentCost).toBe(510);
    expect(r.grossSellingValue).toBeCloseTo(515.1515, 4);
    expect(r.sellingFee).toBeCloseTo(5.1515, 4);
  });

  it('fixed fees are one total for the transaction, not per coin', () => {
    const few = run(input(fixed(10), fixed(15), 1, 100));
    const many = run(input(fixed(10), fixed(15), 100, 100));
    expect(few.buyingFee).toBe(10);
    expect(many.buyingFee).toBe(10);
    expect(many.sellingFee).toBe(15);
  });

  it('matches the one-line formula for percentage selling fees', () => {
    const q = 7.5, p = 123.45, b = 9.99, rate = 0.0125;
    const r = run(input(fixed(b), percent(rate * 100), q, p));
    expect(r.breakEvenPrice).toBeCloseTo((q * p + b) / (q * (1 - rate)), 10);
  });

  it('always nets exactly the investment cost after the selling fee', () => {
    const cases: [Fee, Fee][] = [[fixed(0), percent(0)], [percent(0.1), percent(0.25)], [fixed(3.5), percent(99)], [percent(100), fixed(1e6)]];
    for (const [b, s] of cases) {
      const r = run(input(b, s, 3, 49.99));
      expect(r.netProceeds).toBeCloseTo(r.investmentCost, 6);
      expect(r.totalCostToRecover).toBeCloseTo(r.grossSellingValue, 6);
    }
  });
});

describe('precision and limits', () => {
  it('keeps full precision internally (no early rounding)', () => {
    const r = run(input(percent(0), percent(3), 3, 33.33));
    expect(r.breakEvenPrice).toBeCloseTo(33.33 / 0.97, 10);
    expect(r.breakEvenPrice).not.toBe(Math.round(r.breakEvenPrice * 100) / 100);
  });

  it('handles a very high (but valid) selling percentage', () => {
    const r = run(input(fixed(0), percent(99.99)));
    expect(Number.isFinite(r.breakEvenPrice)).toBe(true);
    expect(r.breakEvenPrice).toBeCloseTo(100 / 0.0001, 3);
  });

  it('returns null for a selling fee of 100% or more', () => {
    expect(calculateBreakEven(input(fixed(0), percent(100)))).toBeNull();
    expect(calculateBreakEven(input(fixed(0), percent(120)))).toBeNull();
  });

  it('returns null when a result would overflow', () => {
    expect(calculateBreakEven(input(fixed(0), fixed(0), 1e300, 1e300))).toBeNull();
  });

  it('works for a tiny coin price', () => {
    const r = run(input(fixed(0), fixed(0), 1_000_000, 0.00001));
    expect(r.breakEvenPrice).toBeCloseTo(0.00001, 12);
    expect(formatPrice(r.breakEvenPrice)).toBe('₹0.00001');
  });
});

describe('validation', () => {
  it('quantity: empty, zero, negative, text, too large', () => {
    expect(validateQuantity('').error).toBe('Please enter the quantity purchased.');
    expect(validateQuantity('0').error).toBe('Quantity must be greater than 0.');
    expect(validateQuantity('-2').error).toBe('Quantity cannot be negative.');
    expect(validateQuantity('abc').error).toBe('Enter a valid quantity.');
    expect(validateQuantity('1e5').error).toBe('Enter a valid quantity.');
    expect(validateQuantity('1,000').error).toBe('Enter a valid quantity.');
    expect(validateQuantity('1e13').error).toBe('Enter a valid quantity.');
    expect(validateQuantity('99999999999999').error).toBe('Quantity is too large.');
    expect(validateQuantity(' 2.5 ').value).toBe(2.5);
  });

  it('price: empty, negative, zero, text', () => {
    expect(validatePrice('').error).toBe('Please enter the buying price per coin.');
    expect(validatePrice('-1').error).toBe('Buying price cannot be negative.');
    expect(validatePrice('0').error).toBe('Buying price must be greater than 0.');
    expect(validatePrice('12x').error).toBe('Enter a valid buying price.');
    expect(validatePrice('.5').value).toBe(0.5);
  });

  it('fees: a blank box means no fee, but text is never silently turned into 0', () => {
    expect(validateFee({ type: 'percent', value: '' }, 'buying').value).toBe(0);
    expect(validateFee({ type: 'fixed', value: '  ' }, 'selling').value).toBe(0);
    expect(validateFee({ type: 'fixed', value: 'abc' }, 'selling').error).toBe('Enter a valid selling fee.');
    expect(validateFee({ type: 'fixed', value: '0' }, 'buying').value).toBe(0);
  });

  it('fees: negative values are rejected for both types', () => {
    expect(validateFee({ type: 'percent', value: '-1' }, 'buying').error).toBe('Buying fee cannot be negative.');
    expect(validateFee({ type: 'fixed', value: '-5' }, 'selling').error).toBe('Selling fee cannot be negative.');
  });

  it('fees: percentage rules', () => {
    expect(validateFee({ type: 'percent', value: '100' }, 'selling').error).toMatch(/must be below 100%/);
    expect(validateFee({ type: 'percent', value: '150' }, 'selling').error).toMatch(/must be below 100%/);
    expect(validateFee({ type: 'percent', value: '99.5' }, 'selling').value).toBe(99.5);
    expect(validateFee({ type: 'percent', value: '100.5' }, 'buying').error).toMatch(/cannot be more than 100%/);
    expect(validateFee({ type: 'percent', value: '100' }, 'buying').value).toBe(100);
  });

  it('fees: 100 is fine as a FIXED selling fee (rupees), not a percentage', () => {
    expect(validateFee({ type: 'fixed', value: '100' }, 'selling').value).toBe(100);
  });

  it('validateForm reports every problem at once and gives no input', () => {
    const form: FormInput = {
      assetName: '', quantity: '', price: '-3',
      buyingFee: { type: 'percent', value: 'x' }, sellingFee: { type: 'percent', value: '100' },
    };
    const { errors, input: valid } = validateForm(form);
    expect(valid).toBeNull();
    expect(Object.keys(errors).sort()).toEqual(['buyingFee', 'price', 'quantity', 'sellingFee']);
  });

  it('validateForm builds numbers from a good form', () => {
    const form: FormInput = {
      assetName: 'BTC', quantity: '5', price: '100',
      buyingFee: { type: 'percent', value: '2' }, sellingFee: { type: 'fixed', value: '' },
    };
    const { errors, input: valid } = validateForm(form);
    expect(errors).toEqual({});
    expect(valid).toEqual({ quantity: 5, price: 100, buyingFee: percent(2), sellingFee: fixed(0) });
  });
});

describe('formatting', () => {
  it('uses ₹ with Indian digit grouping and 2 decimals', () => {
    expect(formatMoney(0)).toBe('₹0.00');
    expect(formatMoney(500)).toBe('₹500.00');
    expect(formatMoney(1234567.891)).toBe('₹12,34,567.89');
    expect(formatMoney(100000)).toBe('₹1,00,000.00');
  });
  it('shows prices of ₹1 and above with 2 decimals, and small prices without rounding to zero', () => {
    expect(formatPrice(105)).toBe('₹105.00');
    expect(formatPrice(0.5)).toBe('₹0.50');
    expect(formatPrice(0.000123)).toBe('₹0.000123');
  });
  it('formats plain numbers and fees', () => {
    expect(formatNumber(1250.5)).toBe('1,250.5');
    expect(formatFee(percent(2))).toBe('2%');
    expect(formatFee(fixed(15))).toBe('₹15.00');
  });
});
