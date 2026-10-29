import type { FeeInput, FeeKind, FeeType } from '../calc';

interface Props {
  kind: FeeKind;
  value: FeeInput;
  error?: string;
  onChange: (fee: FeeInput) => void;
}

const OPTIONS: { type: FeeType; text: string }[] = [
  { type: 'percent', text: 'Percentage (%)' },
  { type: 'fixed', text: 'Fixed amount (₹)' },
];

/** One fee: a Percentage / Fixed selector plus the amount box. Used twice (buying and selling). */
export default function FeeField({ kind, value, error, onChange }: Props) {
  const title = kind === 'buying' ? 'Buying fee' : 'Selling fee';
  const unit = value.type === 'percent' ? '%' : '₹';
  const inputId = `${kind}-fee`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-err`;

  const help =
    value.type === 'fixed'
      ? 'One total amount for the whole transaction, not per coin.'
      : kind === 'buying'
        ? 'Percentage of the purchase value.'
        : 'Percentage of the selling value.';

  return (
    <fieldset className="fee">
      <legend className="fee-title">{title}</legend>
      <div className="seg">
        {OPTIONS.map((o) => (
          <label className="seg-opt" key={o.type}>
            <input
              type="radio" name={`${kind}-fee-type`} value={o.type}
              checked={value.type === o.type}
              onChange={() => onChange({ ...value, type: o.type })}
            />
            <span>{o.text}</span>
          </label>
        ))}
      </div>
      <div className="field">
        <label htmlFor={inputId}>{`${title} (${unit})`}</label>
        <input
          id={inputId} type="text" inputMode="decimal" autoComplete="off" placeholder="0"
          value={value.value} aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${helpId} ${errorId}` : helpId}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
        />
        <p className="help" id={helpId}>{help} Leave blank for no fee.</p>
        {error && <p className="field-error" id={errorId}>{error}</p>}
      </div>
    </fieldset>
  );
}
