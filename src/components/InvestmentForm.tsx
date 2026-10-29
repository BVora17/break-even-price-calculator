import FeeField from './FeeField';
import { formatMoney, validatePrice, validateQuantity } from '../calc';
import type { FeeInput, FeeKind, FormErrors, FormInput } from '../calc';

interface Props {
  form: FormInput;
  errors: FormErrors;
  message: string;
  onAssetName: (value: string) => void;
  onNumber: (field: 'quantity' | 'price', value: string) => void;
  onFee: (kind: FeeKind, fee: FeeInput) => void;
  onSubmit: () => void;
  onReset: () => void;
}

/** The left-hand card: asset, quantity, price and the two fees. */
export default function InvestmentForm({ form, errors, message, onAssetName, onNumber, onFee, onSubmit, onReset }: Props) {
  // A live preview of quantity × price, shown only while both boxes hold valid numbers.
  const q = validateQuantity(form.quantity);
  const p = validatePrice(form.price);
  const purchaseValue = q.value !== null && p.value !== null ? formatMoney(q.value * p.value) : '—';

  const numberField = (name: 'quantity' | 'price', label: string) => {
    const id = `field-${name}`;
    const err = errors[name];
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id} type="text" inputMode="decimal" autoComplete="off"
          value={form[name]} aria-invalid={err ? true : undefined} aria-describedby={err ? `${id}-err` : undefined}
          onChange={(e) => onNumber(name, e.target.value)}
        />
        {err && <p className="field-error" id={`${id}-err`}>{err}</p>}
      </div>
    );
  };

  return (
    <section className="panel" aria-labelledby="form-title">
      <h2 id="form-title">Your Investment Details</h2>
      <form noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <div className="field">
          <label htmlFor="asset-name">Asset or coin name <span className="optional">(optional)</span></label>
          <input
            id="asset-name" type="text" autoComplete="off" maxLength={40} placeholder="e.g. Bitcoin"
            value={form.assetName} onChange={(e) => onAssetName(e.target.value)}
          />
        </div>

        <div className="trade">
          {numberField('quantity', 'Quantity purchased (coins)')}
          {numberField('price', 'Buying price per coin (₹)')}
          <div className="field">
            <span className="label">Purchase value</span>
            <output className="row-total" data-testid="purchase-preview">{purchaseValue}</output>
          </div>
        </div>

        <div className="fee-grid">
          <FeeField kind="buying" value={form.buyingFee} error={errors.buyingFee} onChange={(fee) => onFee('buying', fee)} />
          <FeeField kind="selling" value={form.sellingFee} error={errors.sellingFee} onChange={(fee) => onFee('selling', fee)} />
        </div>

        {message && <p className="form-msg" role="alert">{message}</p>}

        <div className="actions">
          <button type="submit" className="btn btn-primary">Calculate Break-Even Price</button>
          <button type="button" className="btn btn-quiet" onClick={onReset}>Reset</button>
        </div>
      </form>

      <ul className="notes" aria-label="How fees are treated">
        <li>Buying fees are added to your original acquisition cost.</li>
        <li>Selling fees are deducted from the gross sale proceeds.</li>
        <li>All figures are before tax.</li>
      </ul>
    </section>
  );
}
