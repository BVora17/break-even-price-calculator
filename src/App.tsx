import { useState } from 'react';
import Header from './components/Header';
import InvestmentForm from './components/InvestmentForm';
import BreakEvenResults from './components/BreakEvenResults';
import FormulaSteps from './components/FormulaSteps';
import { calculateBreakEven, validateFee, validatePrice, validateQuantity, validateForm } from './calc';
import type { BreakEven, FeeInput, FeeKind, FormErrors, FormInput } from './calc';

/** A blank form. Both fees start as percentages, the most common kind. */
const BLANK_FORM: FormInput = {
  assetName: '',
  quantity: '',
  price: '',
  buyingFee: { type: 'percent', value: '' },
  sellingFee: { type: 'percent', value: '' },
};

export default function App() {
  // ---- State: everything the screen needs to remember ----
  const [form, setForm] = useState<FormInput>(BLANK_FORM);        // the boxes, as typed
  const [errors, setErrors] = useState<FormErrors>({});            // messages under the boxes
  const [result, setResult] = useState<BreakEven | null>(null);    // the answer, or null when there is none
  const [stale, setStale] = useState(false);                       // true after an edit hid an old result
  const [message, setMessage] = useState('');                      // one message for the whole form

  /** Called after any edit that changes the maths: hide the old result so it can never be out of date. */
  function hideResult() {
    if (result) setStale(true);
    setResult(null);
    setMessage('');
  }

  // The asset name does not change the maths, so editing it keeps the result visible.
  function onAssetName(value: string) {
    setForm({ ...form, assetName: value });
  }

  function onNumber(field: 'quantity' | 'price', value: string) {
    setForm({ ...form, [field]: value });
    const check = field === 'quantity' ? validateQuantity(value) : validatePrice(value);
    setErrors({ ...errors, [field]: value.trim() === '' ? undefined : check.error ?? undefined }); // no complaint while empty
    hideResult();
  }

  function onFee(kind: FeeKind, fee: FeeInput) {
    const field = kind === 'buying' ? 'buyingFee' : 'sellingFee';
    setForm({ ...form, [field]: fee });
    setErrors({ ...errors, [field]: validateFee(fee, kind).error ?? undefined }); // re-check, e.g. after switching % to ₹
    hideResult();
  }

  function calculate() {
    setStale(false);
    setResult(null);
    setMessage('');

    const check = validateForm(form);       // checks every field, so every problem shows at once
    setErrors(check.errors);
    if (!check.input) { setMessage('Please fix the highlighted fields, then calculate again.'); return; }

    const answer = calculateBreakEven(check.input);
    if (!answer) { setMessage('These values are too large to calculate safely. Check the quantity, price and fees.'); return; }
    setResult(answer);
  }

  function reset() {
    setForm(BLANK_FORM);
    setErrors({});
    setResult(null);
    setStale(false);
    setMessage('');
  }

  return (
    <>
      <Header />
      <main className="wrap" id="top">
        <div className="intro">
          <p className="eyebrow">TASK 03 · FINANCIAL CALCULATOR</p>
          <h1>Break-Even Price Calculator</h1>
          <p className="lede">Calculate the minimum selling price needed to recover your original investment after buying and selling fees, before tax.</p>
        </div>

        <div className="layout">
          <InvestmentForm
            form={form} errors={errors} message={message}
            onAssetName={onAssetName} onNumber={onNumber} onFee={onFee} onSubmit={calculate} onReset={reset}
          />
          <div className="side">
            <BreakEvenResults result={result} stale={stale} assetName={form.assetName} />
            <FormulaSteps buyingType={form.buyingFee.type} sellingType={form.sellingFee.type} result={result} />
          </div>
        </div>
      </main>
      <footer className="wrap foot">For general information only. This calculator estimates the selling price needed to recover your cost after the fees you enter, before tax. It does not recommend buying or selling any asset, and is not financial, investment or tax advice.</footer>
    </>
  );
}
