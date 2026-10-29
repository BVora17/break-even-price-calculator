/** Pure logic for Task 3: validation, the break-even calculation and ₹ formatting. No React in this file. */

// ---------------------------------------------------------------------------
// Types: the shapes of our data
// ---------------------------------------------------------------------------

/** A fee is either a percentage of a value, or one fixed rupee amount for the whole transaction. */
export type FeeType = 'percent' | 'fixed';

/** Which side of the trade a fee belongs to. */
export type FeeKind = 'buying' | 'selling';

/** A fee exactly as typed: text boxes always give us strings. */
export interface FeeInput { type: FeeType; value: string }

/** The whole form exactly as typed. */
export interface FormInput {
  assetName: string;
  quantity: string;
  price: string;
  buyingFee: FeeInput;
  sellingFee: FeeInput;
}

/** One optional error message per field. A field with no problem has no message. */
export interface FormErrors { quantity?: string; price?: string; buyingFee?: string; sellingFee?: string }

/** Result of checking ONE box: either a number (value) or a message (error). */
export interface FieldResult { value: number | null; error: string | null }

/** A fee after checking: a real number instead of text. */
export interface Fee { type: FeeType; value: number }

/** The form after every field passed validation. Only this goes into the calculation. */
export interface ValidInput { quantity: number; price: number; buyingFee: Fee; sellingFee: Fee }

/** Everything the results card needs. */
export interface BreakEven {
  input: ValidInput;
  purchaseValue: number;      // quantity × buying price
  buyingFee: number;          // in rupees
  investmentCost: number;     // purchase value + buying fee
  grossSellingValue: number;  // total sale value needed (before the selling fee comes off)
  sellingFee: number;         // in rupees, at break-even
  netProceeds: number;        // gross − selling fee (equals investmentCost)
  totalCostToRecover: number; // investment cost + selling fee
  breakEvenPrice: number;     // gross ÷ quantity
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Highest number we accept in one box; keeps results far from Infinity. */
export const MAX_VALUE = 1e12;
const PLAIN_NUMBER = /^(\d+\.?\d*|\.\d+)$/;

function fail(error: string): FieldResult { return { value: null, error }; }

/** Reads one number from text. `name` is used inside the error messages. */
function readNumber(raw: string, name: string, emptyMessage: string, allowZero: boolean): FieldResult {
  const text = raw.trim();
  if (text === '') return fail(emptyMessage);
  if (text.startsWith('-') && PLAIN_NUMBER.test(text.slice(1).trim())) return fail(`${name} cannot be negative.`);
  if (!PLAIN_NUMBER.test(text)) return fail(`Enter a valid ${name.toLowerCase()}.`);
  const value = Number(text);
  if (!allowZero && value === 0) return fail(`${name} must be greater than 0.`);
  if (value > MAX_VALUE) return fail(`${name} is too large.`);
  return { value, error: null };
}

export const validateQuantity = (raw: string) => readNumber(raw, 'Quantity', 'Please enter the quantity purchased.', false);
export const validatePrice = (raw: string) => readNumber(raw, 'Buying price', 'Please enter the buying price per coin.', false);

/**
 * Checks a fee box. A blank fee box means "no fee" (0). That is a deliberate choice, and the
 * screen says so. Text that is not a number is never turned into 0: it gets an error.
 */
export function validateFee(fee: FeeInput, kind: FeeKind): FieldResult {
  const name = kind === 'buying' ? 'Buying fee' : 'Selling fee';
  if (fee.value.trim() === '') return { value: 0, error: null };
  const result = readNumber(fee.value, name, '', true);
  if (result.value === null || fee.type === 'fixed') return result;

  // Percentage rules
  if (kind === 'selling' && result.value >= 100) {
    return fail('Selling fee percentage must be below 100%. At 100% or more, no selling price can recover your cost.');
  }
  if (kind === 'buying' && result.value > 100) return fail('Buying fee percentage cannot be more than 100%.');
  return result;
}

/** Checks EVERY field so the user sees all problems at once. `input` is null when anything is wrong. */
export function validateForm(form: FormInput): { errors: FormErrors; input: ValidInput | null } {
  const q = validateQuantity(form.quantity);
  const p = validatePrice(form.price);
  const b = validateFee(form.buyingFee, 'buying');
  const s = validateFee(form.sellingFee, 'selling');

  const errors: FormErrors = {};
  if (q.error) errors.quantity = q.error;
  if (p.error) errors.price = p.error;
  if (b.error) errors.buyingFee = b.error;
  if (s.error) errors.sellingFee = s.error;

  if (q.value === null || p.value === null || b.value === null || s.value === null) return { errors, input: null };
  return {
    errors,
    input: {
      quantity: q.value,
      price: p.value,
      buyingFee: { type: form.buyingFee.type, value: b.value },
      sellingFee: { type: form.sellingFee.type, value: s.value },
    },
  };
}

// ---------------------------------------------------------------------------
// The break-even calculation
// ---------------------------------------------------------------------------

/**
 * Works out the selling price at which you get back exactly what you put in.
 *
 *   purchase value  = quantity × price
 *   buying fee      = percent: purchase value × % ÷ 100      fixed: the amount entered
 *   investment cost = purchase value + buying fee
 *
 * At break-even:  gross selling value − selling fee = investment cost
 *   fixed selling fee:   gross = investment cost + fee
 *   percent selling fee: gross = investment cost ÷ (1 − rate)      (the fee is a share of gross)
 *
 *   break-even price = gross ÷ quantity
 *
 * Full precision is kept; rounding happens only when we display. Returns null if a number overflows.
 */
export function calculateBreakEven(input: ValidInput): BreakEven | null {
  const { quantity, price, buyingFee: buy, sellingFee: sell } = input;

  const purchaseValue = quantity * price;
  const buyingFee = buy.type === 'percent' ? (purchaseValue * buy.value) / 100 : buy.value;
  const investmentCost = purchaseValue + buyingFee;

  let grossSellingValue: number;
  let sellingFee: number;
  if (sell.type === 'percent') {
    const rate = sell.value / 100;
    if (!(rate < 1)) return null; // 100% or more: no finite answer
    grossSellingValue = investmentCost / (1 - rate);
    sellingFee = (grossSellingValue * sell.value) / 100;
  } else {
    sellingFee = sell.value;
    grossSellingValue = investmentCost + sellingFee;
  }

  const result: BreakEven = {
    input,
    purchaseValue,
    buyingFee,
    investmentCost,
    grossSellingValue,
    sellingFee,
    netProceeds: grossSellingValue - sellingFee,
    totalCostToRecover: investmentCost + sellingFee,
    breakEvenPrice: grossSellingValue / quantity,
  };

  const allFinite = [
    result.purchaseValue, result.buyingFee, result.investmentCost, result.grossSellingValue,
    result.sellingFee, result.netProceeds, result.totalCostToRecover, result.breakEvenPrice,
  ].every(Number.isFinite);
  return allFinite ? result : null;
}

// ---------------------------------------------------------------------------
// Formatting (rounding happens ONLY here, never inside the calculations above)
// ---------------------------------------------------------------------------

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const smallMoney = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 8 });
const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 8 });

/** Totals and fees: always 2 decimals, e.g. ₹1,00,000.00 */
export const formatMoney = (n: number) => money.format(n);

/**
 * Price per coin: 2 decimals normally, but more for prices below ₹1 so that a tiny coin price
 * is not rounded to a misleading ₹0.00.
 */
export const formatPrice = (n: number) => (Math.abs(n) >= 1 ? money.format(n) : smallMoney.format(n));

/** Quantities and plain numbers, e.g. 1,250.5 */
export const formatNumber = (n: number) => plain.format(n);

/** A fee as the user chose it: "2%" or "₹15.00". */
export const formatFee = (fee: Fee) => (fee.type === 'percent' ? `${plain.format(fee.value)}%` : money.format(fee.value));
