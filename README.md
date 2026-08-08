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

The rate tables ship with **illustrative default values** and are fully
editable in the UI:

- **Excise duty & VAT** — from the **MRA** (Mauritius Revenue Authority).
  Enter the MRA figure directly, or use the cc-based estimate as a starting
  point. The estimate applies excise on CIF and 15% VAT on (CIF + excise); it
  does not account for CO₂ rebate/levy or hybrid concessions.
- **Registration fee & road tax** — from the **NLTA** (National Land Transport
  Authority), based on engine capacity.

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

The app is pre-filled with the example car used to build it (CIF Rs 487,013,
1490 cc), which produces a total landed cost of roughly **Rs 785,000**. Click
**Reset to example** at any time to return to it.

## Tech

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS. All
calculations run client-side.
