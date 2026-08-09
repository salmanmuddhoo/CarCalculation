# 🚗 Car Import Calculator — Japan → Mauritius

A small web app to estimate the **total landed cost** of importing a car from
Japan to Mauritius. Built with Next.js and deployable to Vercel with zero
configuration.

## What it does

- Converts the **CIF cost in JPY** to Mauritian Rupees using the **MCB selling
  rate** (editable; defaults to 0.32, with a link to check MCB's rates).
- **Automatically computes and populates** the **excise duty + VAT**,
  **registration duty**, and **road tax** in the cost breakdown (shown as
  read-only “auto” rows) — no manual step. They update live as you change the
  vehicle details.
- Lets you enter every other real-world charge as an editable line item
  (showroom permit, broker, boat/MOL freight, insurance/TEM/fitness, paint,
  plate, excess VAT, rectification, etc.).
- Shows a live **total landed cost** and can print / save as PDF.
- Everything you enter is saved in your browser (localStorage).

## Where the figures come from

The rate tables ship with **default values** and are fully editable in the UI.

### Excise duty & VAT (MRA)

The estimator follows the exact method on the MRA Customs Declaration Form
(import customs duty on cars is 0%, so it drops out):

```
Excise = excise rate × customs value
VAT    = 15%         × (customs value + excise)
```

Two things matter here:

- **Fuel type changes the excise rate**, and **electric is rated by power (kW),
  not cc**. Pick the powertrain in the app and the matching official table is
  used. Verified from a real declaration: a **1490cc Toyota Yaris Hybrid**
  (HS `8703.40.93`) is charged **35% excise**.
- **Customs value ≠ price paid.** MRA assesses its own customs value (in the
  verified case Rs 347,956, versus Rs 487,013 actually paid), and duty is based
  on that assessed value. The app includes a **CIF builder** that reproduces how
  the declaration arrives at it:

  ```
  Assessed FOB (JPY)  ×  customs FX rate   =  FOB in rupees
  FOB in rupees  +  freight  +  insurance  +  other costs  =  customs value (CIF)
  ```

  Worked from the sample declaration:

  | Component | Value |
  | --------- | ----- |
  | Assessed FOB (from MRA e-Services) | 953,484 JPY |
  | Customs FX rate (its own, ≠ MCB) | 0.315 |
  | FOB in rupees | 300,347 |
  | + Freight | 40,950 |
  | + Insurance | 5,142 |
  | + Other costs | 1,517 |
  | **Customs value (CIF)** | **347,956** |

  Look up the assessed FOB in JPY on
  [MRA e-Services](http://eservices6.mra.mu/choice.asp) and fill the builder —
  the computed CIF is used directly as the duty base. Note customs converts the
  FOB at **its own exchange rate** (0.315 here), which differs from the MCB
  selling rate you pay.

The app covers **motor cars, pick-ups, vans and lorries**. Pick the vehicle
category, powertrain, and (where relevant) body/cabin type — the matching
official excise rate is applied. VAT is 15% in every band. All rates are built
in as editable defaults; the estimate does not model the CO₂ rebate/levy or
duty-exemption concessions.

**Motor cars** — by engine capacity (electric by power output in kW):

| Engine capacity | ICE (petrol/diesel) | Mild / full hybrid | Plug-in hybrid |
| --------------- | ------------------- | ------------------ | -------------- |
| ≤ 550 cc        | 0%                  | 0%                 | 0%             |
| 551 – 1,000 cc  | 45%                 | 25%                | 15%            |
| 1,001 – 1,600 cc| 55%                 | 35%                | 25%            |
| 1,601 – 2,000 cc| 75%                 | 55%                | 35%            |
| Above 2,000 cc  | 100%                | 75%                | 55%            |

Electric cars: ≤ 180 kW → 15%, above 180 kW → 25%.

**Pick-ups** — by cabin:

| Cabin  | ICE | Hybrid | Plug-in hybrid | Electric            |
| ------ | --- | ------ | -------------- | ------------------- |
| Single | 10% | 5%     | 5%             | 5%                  |
| Double | 30% | 20%    | 15%            | 10% ≤180kW / 15% >  |

**Vans** — by body type:

| Body                         | ICE           | Hybrid        | Electric              |
| ---------------------------- | ------------- | ------------- | --------------------- |
| Refrigerated                 | 0%            | 0%            | 0%                    |
| No bench / anchor points     | 10%           | 5%            | 5%                    |
| Standard                     | 55/75/100% by cc | 35/55/75% by cc | 15% ≤180kW / 25% > |

**Lorries** — flat by type:

| Type              | ICE | Hybrid | Electric |
| ----------------- | --- | ------ | -------- |
| CKD               | 0%  | —      | —        |
| Refrigerated      | 0%  | 0%     | 0%       |
| Lorry             | 10% | 5%     | 5%       |

### Registration fee & road tax (NLTA)

From the **NLTA** (National Land Transport Authority), based on engine capacity.

**Road tax** uses the official NLTA figures (Motor Vehicle Licences communiqué,
effective **01 July 2025**) — Mauritius, 12-month licence, section 1 (private
motorcar / dual-purpose / double-cab, including hybrid & electric):

| Engine capacity | Power output (electric) | Road tax (12 months) |
| --------------- | ----------------------- | -------------------- |
| ≤ 1250 cc       | ≤ 40.0 kW               | Rs 4,500             |
| 1251 – 1600 cc  | 40.1 – 57.5 kW          | Rs 5,000             |
| 1601 – 1850 cc  | 57.6 – 71.5 kW          | Rs 10,000            |
| 1851 – 2250 cc  | 71.6 – 90.0 kW          | Rs 12,000            |
| Above 2250 cc   | Above 90.0 kW           | Rs 15,000            |

Electric vehicles have no engine capacity, so their road tax is looked up by
**power output (kW)** using the column above (e.g. a 210 kW EV → Rs 15,000).

**Registration duty** is computed from the official Registration Duty schedule
(GN 75/2009, "First Registration in Mauritius" column):

```
base    = official duty (Part A by cc, or Part C by kW for electric)
base   ×= 0.5 for hybrids (Part B — mild / full / plug-in)
payable = round(base × (1 + increase)) + doc fee + horsepower fee + service fee
```

- **Part A** (petrol/diesel cars, by cc): 16,300 / 32,500 / **52,000** / 65,000 /
  78,000 / 117,000 / 156,000 / 195,000 across the ≤1000 → >2500 cc bands.
- **Part B** (hybrids): 50% of Part A.
- **Part C** (electric, by kW): 8,100 / 16,300 / 26,000 / 32,500 / 39,000 /
  58,500 / 78,000 / 97,500 across the ≤27.5 → >102.5 kW bands.
- **increase**: 30% (last budget) — editable.
- **fixed fees**: document Rs 300 + horsepower Rs 400 + service Rs 2,000 —
  editable.

Worked example (1490cc hybrid): 52,000 × 0.5 = 26,000 → × 1.30 = 33,800 →
+ 300 + 400 + 2,000 = **Rs 36,500**. All values are editable in the app.

Always confirm the current figures against MRA and NLTA before relying on a
number.

## Client quote: profit, cash vs lease

Below the landed cost you set a **Profit** and get the **Selling price (quote to
client)** = landed cost + profit. A **Client pays by** toggle handles the two
sale types:

- **Cash** — the calculation is as recorded; the **Excess VAT** is the fixed
  figure you enter (default Rs 11,289).
- **Lease** — the leasing company is invoiced 15% VAT on the **full selling
  price**, so the excess VAT is recomputed as
  `15% × selling price − customs VAT (already paid)` and included in the total.
  Because the selling price includes that excess VAT plus your profit, it is
  solved as `selling price = (base cost + profit − customs VAT) / 0.85`.

Worked example (base cost Rs 772,877, customs VAT Rs 70,461, profit Rs 100,000):

| | Cash | Lease |
| --- | --- | --- |
| Excess VAT | 11,289 (fixed) | 71,142 (computed) |
| Total landed cost | 784,166 | 844,019 |
| Selling price (quote) | 884,166 | 944,019 |
| Lease invoice VAT (15%) | — | 141,603 |

For the lease row, `15% × 944,019 = 141,603 = 71,142 excess VAT + 70,461 customs
VAT`, exactly as intended.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com/new), import the repository.
3. Vercel auto-detects Next.js — no configuration needed. Click **Deploy**.

## The recorded example

The app is pre-filled with the example car used to build it — a 1490cc Toyota
Yaris Hybrid, customs value Rs 347,956 — whose excise + VAT computes to exactly
**Rs 192,246** (matching its MRA declaration) and a total landed cost of roughly
**Rs 785,000**. Click **Reset to example** at any time to return to it.

## Tech

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS. All
calculations run client-side.
