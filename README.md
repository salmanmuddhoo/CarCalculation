# 🚗 Car Import Calculator — Japan → Mauritius

A small web app to estimate the **total landed cost** of importing a car from
Japan to Mauritius. Built with Next.js and deployable to Vercel with zero
configuration.

## What it does

- Converts the **CIF cost in JPY** to Mauritian Rupees using the **MCB selling
  rate** (editable; defaults to 0.32, with a link to check MCB's rates).
- Estimates **excise duty + VAT**, **registration fee**, and **road tax** from
  the engine capacity (cc) using editable rate tables.
- Lets you enter every real-world charge as an editable line item
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

| Engine capacity | Road tax (12 months) |
| --------------- | -------------------- |
| ≤ 1250 cc       | Rs 4,500             |
| 1251 – 1600 cc  | Rs 5,000             |
| 1601 – 1850 cc  | Rs 10,000            |
| 1851 – 2250 cc  | Rs 12,000            |
| Above 2250 cc   | Rs 15,000            |

**Registration fee** still ships as an illustrative default — confirm with
NLTA.

Always confirm the current figures against MRA and NLTA before relying on a
number.

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
