# 🚗 Car Import Calculator — Japan → Mauritius

A small web app to estimate the **total landed cost** of importing a car from
Japan to Mauritius. Built with Next.js and deployable to Vercel with zero
configuration.

## What it does

- Converts the **CIF cost in JPY** to Mauritian Rupees using an editable
  JPY → MUR exchange rate.
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

The estimator follows the exact method on the MRA Customs Declaration Form:

```
ICD    = ICD rate    × customs value          (0% for cars in the observed case)
Excise = excise rate × (customs value + ICD)
VAT    = 15%         × (customs value + ICD + excise)
```

Two things matter here:

- **Fuel type changes the excise rate.** A hybrid attracts a lower rate than an
  equivalent petrol car. Verified from a real declaration: a **1490cc Toyota
  Yaris Hybrid** (HS `8703.40.93`) is charged **35% excise** — where a
  conventional 1490cc petrol car would be 45%. Pick the fuel/powertrain type in
  the app and the matching excise table is used.
- **Customs value ≠ price paid.** MRA assesses its own customs value (in the
  verified case Rs 347,956, versus Rs 487,013 actually paid), and duty is based
  on that assessed value. Enter it separately, or click **“= CIF”** to start
  from the converted price.

The conventional petrol/diesel bands (15/45/75/100% by cc) and the hybrid bands
above 1600cc are editable defaults — confirm them with MRA for your case. The
estimate does not model the CO₂ rebate/levy.

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
