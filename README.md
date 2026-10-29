# Break-Even Price Calculator (₹ INR) · Task 03 / 05

Scalezix Ventures LLP · Full Stack Developer Intern Assessment (an assessment label, not an official product).

Finds the minimum selling price per coin that recovers your original investment after **buying and selling fees, before tax**.
Frontend only (no backend, database or API). Built with React 18, TypeScript, Vite, custom CSS, Vitest + React Testing Library, ESLint.

This is a separate project from Task 1 and Task 2. It only reuses their design (header, colours, cards, buttons).

## Run locally
```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest + React Testing Library
npm run lint      # ESLint
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
```
Needs Node.js 18 or newer.

## The formula
```
Purchase value      = quantity × buying price
Buying fee          = percentage:  purchase value × % ÷ 100
                      fixed:       the amount entered (one total, not per coin)
Investment cost     = purchase value + buying fee

At break-even:  gross selling value − selling fee = investment cost

Selling fee fixed:       gross selling value = investment cost + selling fee
Selling fee percentage:  gross selling value = investment cost ÷ (1 − rate)      rate = % ÷ 100

Break-even price per coin = gross selling value ÷ quantity
Selling fee at break-even = fixed: the amount entered   |   percentage: gross × % ÷ 100
Total cost to recover     = investment cost + selling fee at break-even
```
Why `÷ (1 − rate)`? A percentage selling fee is taken from the **gross** amount, so you keep `gross × (1 − rate)`.
Setting that equal to your cost gives `gross = cost ÷ (1 − rate)`. At a 100% fee you would keep nothing, so no price works;
the app asks for a selling fee below 100%.

Worked example (5 coins at ₹100, buying fee 2%, selling fee 1%):
purchase ₹500 → buying fee ₹10 → cost ₹510 → gross ₹510 ÷ 0.99 = ₹515.15 → **₹103.03 per coin**; selling fee ₹5.15, so you keep ₹510.

Full precision is kept internally; numbers are rounded only when displayed. A blank fee box means "no fee"; text that is not a number is an error, never silently 0.

## Project structure
- `src/calc.ts` – all logic: types, validation, `calculateBreakEven`, ₹ formatting (no React)
- `src/App.tsx` – state (form, errors, result, stale flag) and page layout
- `src/components/Header.tsx` – Scalezix header and TASK 03 / 05 badge
- `src/components/InvestmentForm.tsx` – the left-hand form
- `src/components/FeeField.tsx` – one fee: Percentage / Fixed selector + amount box (used twice)
- `src/components/BreakEvenResults.tsx` – the results card
- `src/components/FormulaSteps.tsx` – "How It Is Calculated" (changes with the selected fee types)
- `src/styles.css` – design system (CSS variables)
- `src/calc.test.ts`, `src/App.test.tsx` – tests

## TypeScript ideas used (good for the interview)
- `interface` describes the shape of an object (`FormInput`, `BreakEven`).
- A union type such as `'percent' | 'fixed'` allows only those two words, so typos become compile errors.
- Text boxes give **strings**; `ValidInput` holds **numbers**. `validateForm` is the only place that turns one into the other.
- `number | null` means "a number, or nothing". TypeScript forces us to check for `null` before using it.
- Props interfaces describe what each React component receives.

## Upload to a NEW GitHub repository
1. On github.com click **New repository**, name it `break-even-price-calculator`, leave it empty (no README), click **Create**.
2. In a terminal inside this project folder:
```bash
git init
git add .
git commit -m "Task 3: Break-Even Price Calculator"
git branch -M main
git remote add origin https://github.com/<your-username>/break-even-price-calculator.git
git push -u origin main
```

## Deploy on Netlify
1. Log in to netlify.com → **Add new site** → **Import an existing project** → **GitHub**.
2. Pick the `break-even-price-calculator` repository.
3. Settings are read from `netlify.toml` (build command `npm run build`, publish directory `dist`). Click **Deploy**.
4. Netlify gives you a `*.netlify.app` link. Every `git push` redeploys automatically.

(Alternative: run `npm run build`, then drag the `dist` folder onto Netlify's **Deploy manually** page.)
