import { formatFee, formatMoney, formatNumber, formatPrice } from '../calc';
import type { BreakEven, FeeType } from '../calc';

interface Props { buyingType: FeeType; sellingType: FeeType; result: BreakEven | null }

/** "How It Is Calculated": the steps change with the selected fee types, and show your numbers once calculated. */
export default function FormulaSteps({ buyingType, sellingType, result: r }: Props) {
  const buyingFormula = buyingType === 'percent'
    ? 'Buying fee = purchase value × buying fee % ÷ 100'
    : 'Buying fee = the fixed amount you entered (one total, not per coin)';
  const grossFormula = sellingType === 'percent'
    ? 'Required gross selling value = original investment cost ÷ (1 − selling fee % ÷ 100)'
    : 'Required gross selling value = original investment cost + fixed selling fee';
  const oneLine = sellingType === 'percent'
    ? 'Break-even price = (quantity × buying price + buying fee) ÷ (quantity × (1 − selling fee rate))'
    : 'Break-even price = (quantity × buying price + buying fee + fixed selling fee) ÷ quantity';

  // With a result, each step also shows the real numbers.
  const buyingNumbers = r && (r.input.buyingFee.type === 'percent'
    ? `${formatMoney(r.purchaseValue)} × ${formatFee(r.input.buyingFee)} ÷ 100 = ${formatMoney(r.buyingFee)}`
    : `${formatMoney(r.buyingFee)}`);
  const grossNumbers = r && (r.input.sellingFee.type === 'percent'
    ? `${formatMoney(r.investmentCost)} ÷ (1 − ${formatNumber(r.input.sellingFee.value / 100)}) = ${formatMoney(r.grossSellingValue)}`
    : `${formatMoney(r.investmentCost)} + ${formatMoney(r.sellingFee)} = ${formatMoney(r.grossSellingValue)}`);

  return (
    <section className="panel formula" aria-labelledby="f-title">
      <h2 id="f-title">How It Is Calculated</h2>
      <p className="note">At break-even, net sale proceeds (gross selling value − selling fee) equal your original investment cost, so nothing is gained or lost before tax.</p>
      <ol className="steps">
        <li>
          <b>Purchase value = quantity × buying price per coin</b>
          {r && <span className="calc">{formatNumber(r.input.quantity)} × {formatPrice(r.input.price)} = {formatMoney(r.purchaseValue)}</span>}
        </li>
        <li>
          <b>{buyingFormula}</b>
          {r && <span className="calc">{buyingNumbers}</span>}
        </li>
        <li>
          <b>Original investment cost = purchase value + buying fee</b>
          {r && <span className="calc">{formatMoney(r.purchaseValue)} + {formatMoney(r.buyingFee)} = {formatMoney(r.investmentCost)}</span>}
        </li>
        <li>
          <b>{grossFormula}</b>
          {r && <span className="calc">{grossNumbers}</span>}
        </li>
        <li>
          <b>Break-even selling price per coin = required gross selling value ÷ quantity</b>
          {r && <span className="calc">{formatMoney(r.grossSellingValue)} ÷ {formatNumber(r.input.quantity)} = {formatPrice(r.breakEvenPrice)}</span>}
        </li>
      </ol>
      <p className="oneline">{oneLine}</p>
    </section>
  );
}
