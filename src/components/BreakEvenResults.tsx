import { formatMoney, formatNumber, formatPrice } from '../calc';
import type { BreakEven } from '../calc';

interface Props { result: BreakEven | null; stale: boolean; assetName: string }

/** One plain sentence that shows the result is correct: sell at this price and you get your money back. */
function explanation(r: BreakEven): string {
  const sold = `${formatNumber(r.input.quantity)} coin${r.input.quantity === 1 ? '' : 's'}`;
  return (
    `Selling ${sold} at ${formatPrice(r.breakEvenPrice)} each brings in ${formatMoney(r.grossSellingValue)}. ` +
    `After the ${formatMoney(r.sellingFee)} selling fee you keep ${formatMoney(r.netProceeds)}, which equals your original investment ` +
    `(${formatMoney(r.purchaseValue)} purchase + ${formatMoney(r.buyingFee)} buying fee = ${formatMoney(r.investmentCost)}). ` +
    'Figures are rounded for display and are before tax.'
  );
}

export default function BreakEvenResults({ result: r, stale, assetName }: Props) {
  const state = r ? 'ready' : stale ? 'stale' : 'empty';
  const dash = '—';
  const name = assetName.trim();

  return (
    <section className="ledger" data-state={state} aria-labelledby="res-title">
      <h2 id="res-title">Your Break-Even Results</h2>
      <p className="hint" role="status">
        {r ? `Break-even point${name ? ` for ${name}` : ''}, before tax.`
          : stale ? 'Inputs changed. Calculate again to update the results.'
          : 'Enter your investment details, then press Calculate Break-Even Price.'}
      </p>

      <div className="avg">
        <span className="label">Break-even selling price per coin</span>
        <span className="avg-value" data-testid="be-price">{r ? formatPrice(r.breakEvenPrice) : dash}</span>
      </div>

      <div className="total-card">
        <dl>
          <dt>Total break-even selling value</dt>
          <dd data-testid="be-gross">{r ? formatMoney(r.grossSellingValue) : dash}</dd>
        </dl>
        <p className="caption">The whole sale amount for all coins together (price per coin × quantity).</p>
      </div>

      <dl className="breakdown">
        <div><dt>Original purchase cost</dt><dd data-testid="be-purchase">{r ? formatMoney(r.purchaseValue) : dash}</dd></div>
        <div><dt>Buying fee</dt><dd data-testid="be-buying-fee">{r ? formatMoney(r.buyingFee) : dash}</dd></div>
        <div><dt>Estimated selling fee at break-even</dt><dd data-testid="be-selling-fee">{r ? formatMoney(r.sellingFee) : dash}</dd></div>
        <div className="sum"><dt>Total cost to recover</dt><dd data-testid="be-total-cost">{r ? formatMoney(r.totalCostToRecover) : dash}</dd></div>
      </dl>

      {r && <p className="explain" data-testid="be-explain">{explanation(r)}</p>}
      <p className="disclaimer">This calculator illustrates a break-even point. It does not recommend buying or selling any asset.</p>
    </section>
  );
}
