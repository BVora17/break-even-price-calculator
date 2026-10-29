import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

type User = ReturnType<typeof userEvent.setup>;

const quantity = () => screen.getByLabelText('Quantity purchased (coins)');
const price = () => screen.getByLabelText('Buying price per coin (₹)');
const calcButton = () => screen.getByRole('button', { name: 'Calculate Break-Even Price' });
const resetButton = () => screen.getByRole('button', { name: 'Reset' });
const buyingGroup = () => screen.getByRole('group', { name: 'Buying fee' });
const sellingGroup = () => screen.getByRole('group', { name: 'Selling fee' });
const text = (id: string) => screen.getByTestId(id).textContent;

/** Picks Percentage or Fixed inside one fee group. */
async function chooseType(user: User, group: HTMLElement, label: 'Percentage (%)' | 'Fixed amount (₹)') {
  await user.click(within(group).getByRole('radio', { name: label }));
}

async function fill(user: User, q: string, p: string) {
  await user.type(quantity(), q);
  await user.type(price(), p);
}

describe('layout and wording', () => {
  it('shows the Task 3 header, heading and description', () => {
    render(<App />);
    expect(screen.getByText('Scalezix Ventures LLP')).toBeInTheDocument();
    expect(screen.getByText('Full Stack Developer Intern Assessment')).toBeInTheDocument();
    expect(screen.getByText('TASK 03 / 05')).toBeInTheDocument();
    expect(screen.getByText('TASK 03 · FINANCIAL CALCULATOR')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Break-Even Price Calculator' })).toBeInTheDocument();
    expect(screen.getByText('Calculate the minimum selling price needed to recover your original investment after buying and selling fees, before tax.')).toBeInTheDocument();
  });

  it('has the two cards, all inputs and both buttons', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Your Investment Details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Break-Even Results' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How It Is Calculated' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Asset or coin name/)).toBeInTheDocument();
    expect(quantity()).toHaveValue('');
    expect(price()).toHaveValue('');
    expect(screen.getByLabelText('Buying fee (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Selling fee (%)')).toBeInTheDocument();
    expect(calcButton()).toBeInTheDocument();
    expect(resetButton()).toBeInTheDocument();
    expect(screen.getByText('Buying fees are added to your original acquisition cost.')).toBeInTheDocument();
    expect(screen.getByText('Selling fees are deducted from the gross sale proceeds.')).toBeInTheDocument();
  });

  it('starts with an empty state: dashes, no misleading numbers', () => {
    render(<App />);
    expect(text('be-price')).toBe('—');
    expect(text('be-gross')).toBe('—');
    expect(text('be-total-cost')).toBe('—');
    expect(screen.getByText(/Enter your investment details, then press Calculate Break-Even Price/)).toBeInTheDocument();
    expect(screen.queryByTestId('be-explain')).toBeNull();
  });
});

describe('Test A: no fees', () => {
  it('break-even equals the buying price', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '5', '100');
    expect(text('purchase-preview')).toBe('₹500.00');
    await user.click(calcButton());
    expect(text('be-price')).toBe('₹100.00');
    expect(text('be-gross')).toBe('₹500.00');
    expect(text('be-purchase')).toBe('₹500.00');
    expect(text('be-buying-fee')).toBe('₹0.00');
    expect(text('be-selling-fee')).toBe('₹0.00');
    expect(text('be-total-cost')).toBe('₹500.00');
  });
});

describe('Test B: fixed fees', () => {
  it('₹10 buying and ₹15 selling', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '5', '100');
    await chooseType(user, buyingGroup(), 'Fixed amount (₹)');
    await chooseType(user, sellingGroup(), 'Fixed amount (₹)');
    await user.type(screen.getByLabelText('Buying fee (₹)'), '10');
    await user.type(screen.getByLabelText('Selling fee (₹)'), '15');
    await user.click(calcButton());
    expect(text('be-price')).toBe('₹105.00');
    expect(text('be-gross')).toBe('₹525.00');
    expect(text('be-purchase')).toBe('₹500.00');
    expect(text('be-buying-fee')).toBe('₹10.00');
    expect(text('be-selling-fee')).toBe('₹15.00');
    expect(text('be-total-cost')).toBe('₹525.00');
    expect(text('be-explain')).toMatch(/you keep ₹510\.00/);
  });
});

describe('Test C: percentage fees', () => {
  it('2% buying and 1% selling', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '5', '100');
    await user.type(screen.getByLabelText('Buying fee (%)'), '2');
    await user.type(screen.getByLabelText('Selling fee (%)'), '1');
    await user.click(calcButton());
    expect(text('be-price')).toBe('₹103.03');
    expect(text('be-gross')).toBe('₹515.15');
    expect(text('be-buying-fee')).toBe('₹10.00');
    expect(text('be-selling-fee')).toBe('₹5.15');
    expect(text('be-total-cost')).toBe('₹515.15');
    expect(text('be-explain')).toMatch(/₹510\.00 purchase|\(₹500\.00 purchase \+ ₹10\.00 buying fee = ₹510\.00\)/);
  });

  it('Enter in a box also calculates (real form submit)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '5', '100');
    await user.type(screen.getByLabelText('Selling fee (%)'), '1{Enter}');
    expect(text('be-price')).toBe('₹101.01');
  });
});

describe('mixed fee types', () => {
  it('percentage buying fee with fixed selling fee', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '5', '100');
    await user.type(screen.getByLabelText('Buying fee (%)'), '2');
    await chooseType(user, sellingGroup(), 'Fixed amount (₹)');
    await user.type(screen.getByLabelText('Selling fee (₹)'), '15');
    await user.click(calcButton());
    expect(text('be-buying-fee')).toBe('₹10.00');
    expect(text('be-gross')).toBe('₹525.00');
    expect(text('be-price')).toBe('₹105.00');
  });

  it('fixed buying fee with percentage selling fee', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '5', '100');
    await chooseType(user, buyingGroup(), 'Fixed amount (₹)');
    await user.type(screen.getByLabelText('Buying fee (₹)'), '10');
    await user.type(screen.getByLabelText('Selling fee (%)'), '1');
    await user.click(calcButton());
    expect(text('be-gross')).toBe('₹515.15');
    expect(text('be-price')).toBe('₹103.03');
  });
});

describe('fee type selector', () => {
  it('starts as Percentage and switches the label and the formula text', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(within(buyingGroup()).getByRole('radio', { name: 'Percentage (%)' })).toBeChecked();
    expect(screen.getByText(/original investment cost ÷ \(1 − selling fee % ÷ 100\)/)).toBeInTheDocument();
    await chooseType(user, sellingGroup(), 'Fixed amount (₹)');
    expect(within(sellingGroup()).getByRole('radio', { name: 'Fixed amount (₹)' })).toBeChecked();
    expect(screen.getByLabelText('Selling fee (₹)')).toBeInTheDocument();
    expect(screen.getByText(/original investment cost \+ fixed selling fee/)).toBeInTheDocument();
    expect(screen.getByText(/\(quantity × buying price \+ buying fee \+ fixed selling fee\) ÷ quantity/)).toBeInTheDocument();
  });

  it('can be changed with the keyboard (arrow keys on the radio group)', async () => {
    const user = userEvent.setup();
    render(<App />);
    within(buyingGroup()).getByRole('radio', { name: 'Percentage (%)' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(within(buyingGroup()).getByRole('radio', { name: 'Fixed amount (₹)' })).toBeChecked();
    expect(screen.getByLabelText('Buying fee (₹)')).toBeInTheDocument();
  });

  it('re-checks the typed fee against the new type', async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseType(user, sellingGroup(), 'Fixed amount (₹)');
    await user.type(screen.getByLabelText('Selling fee (₹)'), '100');
    expect(screen.queryByText(/must be below 100%/)).toBeNull();      // ₹100 fixed is fine
    await chooseType(user, sellingGroup(), 'Percentage (%)');
    expect(screen.getByText(/must be below 100%/)).toBeInTheDocument(); // 100% is not
  });
});

describe('formula section shows real numbers after calculating', () => {
  it('fills each step with the entered values', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '5', '100');
    await user.type(screen.getByLabelText('Buying fee (%)'), '2');
    await user.type(screen.getByLabelText('Selling fee (%)'), '1');
    expect(screen.queryByText('5 × ₹100.00 = ₹500.00')).toBeNull();
    await user.click(calcButton());
    expect(screen.getByText('5 × ₹100.00 = ₹500.00')).toBeInTheDocument();
    expect(screen.getByText('₹500.00 × 2% ÷ 100 = ₹10.00')).toBeInTheDocument();
    expect(screen.getByText('₹510.00 ÷ (1 − 0.01) = ₹515.15')).toBeInTheDocument();
    expect(screen.getByText('₹515.15 ÷ 5 = ₹103.03')).toBeInTheDocument();
  });
});

describe('validation', () => {
  it('shows an error beside every empty required field and does not calculate', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(calcButton());
    expect(screen.getByText('Please enter the quantity purchased.')).toBeInTheDocument();
    expect(screen.getByText('Please enter the buying price per coin.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields');
    expect(quantity()).toHaveAttribute('aria-invalid', 'true');
    expect(text('be-price')).toBe('—');
  });

  it('rejects zero and negative quantity, negative price', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(quantity(), '0');
    expect(screen.getByText('Quantity must be greater than 0.')).toBeInTheDocument();
    await user.clear(quantity());
    await user.type(quantity(), '-5');
    expect(screen.getByText('Quantity cannot be negative.')).toBeInTheDocument();
    await user.type(price(), '-1');
    expect(screen.getByText('Buying price cannot be negative.')).toBeInTheDocument();
    await user.click(calcButton());
    expect(text('be-price')).toBe('—');
  });

  it('rejects negative fees and non-numeric text without turning them into 0', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '5', '100');
    await user.type(screen.getByLabelText('Buying fee (%)'), '-2');
    await user.type(screen.getByLabelText('Selling fee (%)'), 'abc');
    expect(screen.getByText('Buying fee cannot be negative.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid selling fee.')).toBeInTheDocument();
    await user.click(calcButton());
    expect(text('be-price')).toBe('—');
  });

  it('rejects a selling fee of 100% or more with a clear message', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '5', '100');
    await user.type(screen.getByLabelText('Selling fee (%)'), '100');
    expect(screen.getByText(/Selling fee percentage must be below 100%/)).toBeInTheDocument();
    await user.click(calcButton());
    expect(text('be-price')).toBe('—');
    await user.clear(screen.getByLabelText('Selling fee (%)'));
    await user.type(screen.getByLabelText('Selling fee (%)'), '99');
    expect(screen.queryByText(/must be below 100%/)).toBeNull();
    await user.click(calcButton());
    expect(text('be-price')).toBe('₹10,000.00');
  });

  it('rejects absurdly large values', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fill(user, '99999999999999', '100');
    expect(screen.getByText('Quantity is too large.')).toBeInTheDocument();
  });

  it('links each error to its box for screen readers', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(quantity(), '-1');
    const err = screen.getByText('Quantity cannot be negative.');
    expect(quantity()).toHaveAttribute('aria-describedby', err.id);
  });
});

describe('stale results and reset', () => {
  async function calculated(user: User) {
    await fill(user, '5', '100');
    await user.type(screen.getByLabelText('Selling fee (%)'), '1');
    await user.click(calcButton());
    expect(text('be-price')).toBe('₹101.01');
  }

  it('hides the old result as soon as a number changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await calculated(user);
    await user.type(quantity(), '0');
    expect(text('be-price')).toBe('—');
    expect(screen.getByText('Inputs changed. Calculate again to update the results.')).toBeInTheDocument();
    expect(screen.queryByTestId('be-explain')).toBeNull();
  });

  it('hides the old result when a fee type changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await calculated(user);
    await chooseType(user, sellingGroup(), 'Fixed amount (₹)');
    expect(text('be-price')).toBe('—');
    expect(screen.getByText(/Calculate again/)).toBeInTheDocument();
  });

  it('keeps the result when only the optional asset name changes, and shows the name', async () => {
    const user = userEvent.setup();
    render(<App />);
    await calculated(user);
    await user.type(screen.getByLabelText(/Asset or coin name/), 'Bitcoin');
    expect(text('be-price')).toBe('₹101.01');
    expect(screen.getByText('Break-even point for Bitcoin, before tax.')).toBeInTheDocument();
  });

  it('Reset clears inputs, errors, results and fee types', async () => {
    const user = userEvent.setup();
    render(<App />);
    await calculated(user);
    await chooseType(user, buyingGroup(), 'Fixed amount (₹)');
    await user.click(calcButton());          // result again, now with a fixed buying type
    await user.clear(quantity());
    await user.type(quantity(), '-1');       // leaves an error on screen
    await user.click(resetButton());
    expect(quantity()).toHaveValue('');
    expect(price()).toHaveValue('');
    expect(screen.queryByText('Quantity cannot be negative.')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(text('be-price')).toBe('—');
    expect(text('purchase-preview')).toBe('—');
    expect(screen.getByText(/Enter your investment details/)).toBeInTheDocument();
    expect(screen.queryByText(/Calculate again/)).toBeNull();
    expect(within(buyingGroup()).getByRole('radio', { name: 'Percentage (%)' })).toBeChecked();
    expect(screen.getByLabelText('Selling fee (%)')).toHaveValue('');
  });
});

describe('keyboard accessibility', () => {
  it('can be completed by Tab and keys alone', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();                                  // skip link-free page: first stop is the brand link
    expect(screen.getByRole('link', { name: /Scalezix Ventures LLP/ })).toHaveFocus();
    await user.tab(); expect(screen.getByLabelText(/Asset or coin name/)).toHaveFocus();
    await user.tab(); expect(quantity()).toHaveFocus();
    await user.keyboard('5');
    await user.tab(); expect(price()).toHaveFocus();
    await user.keyboard('100');
    await user.tab();                                  // first radio of the buying group
    expect(within(buyingGroup()).getByRole('radio', { name: 'Percentage (%)' })).toHaveFocus();
    await user.tab(); expect(screen.getByLabelText('Buying fee (%)')).toHaveFocus();
    await user.tab();                                  // selling group radio
    expect(within(sellingGroup()).getByRole('radio', { name: 'Percentage (%)' })).toHaveFocus();
    await user.tab(); expect(screen.getByLabelText('Selling fee (%)')).toHaveFocus();
    await user.tab(); expect(calcButton()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(text('be-price')).toBe('₹100.00');
  });

  it('labels every input and gives the results a polite live region', () => {
    render(<App />);
    for (const box of screen.getAllByRole('textbox')) expect(box).toHaveAccessibleName();
    expect(screen.getByText(/Enter your investment details/)).toHaveAttribute('role', 'status');
  });
});
