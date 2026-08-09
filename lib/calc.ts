// -----------------------------------------------------------------------------
// Domain model for the Japan -> Mauritius car import cost calculator.
//
// The numbers below are DEFAULTS meant to be edited inside the app. Tax and fee
// schedules in Mauritius change over time, so every rate table here is editable
// in the UI and persisted to the browser. Always confirm the current figures
// against MRA (excise duty & VAT) and NLTA (registration & road tax).
// -----------------------------------------------------------------------------

export const VAT_RATE = 0.15; // Mauritius standard VAT rate.

/** A rate bracket keyed by engine capacity (cc). `maxCc: null` means "and above". */
export interface CcBracket {
  maxCc: number | null;
  /** For excise this is a rate (e.g. 0.45). For registration/road tax it is an amount in Rs. */
  value: number;
}

/** A single editable cost line on the estimate. */
export interface LineItem {
  id: string;
  label: string;
  amount: number;
  /** Grouping for display. */
  group: CostGroup;
  /** When true the amount is derived from a rate table and can be auto-filled. */
  derived?: boolean;
}

export type CostGroup =
  | "vehicle"
  | "taxes"
  | "shipping"
  | "preparation"
  | "other";

export const GROUP_LABELS: Record<CostGroup, string> = {
  vehicle: "Vehicle cost",
  taxes: "Taxes & duties (MRA / NLTA)",
  shipping: "Shipping & clearance",
  preparation: "Preparation & handling",
  other: "Other charges",
};

// --- Vehicle categories, powertrains and excise rates ------------------------
//
// Source: MRA "Rate of excise duty and taxes on motor vehicles". Excise is
// resolved per vehicle category -> powertrain -> body/cabin sub-type. Depending
// on the sub-type the rate is a fixed percentage, a table keyed by engine
// capacity (cc), or a table keyed by electric power output (kW). VAT is 15% in
// every band (buses can be VAT-exempt, but buses are not modelled here).
// Cross-checked against a real declaration: car / hybrid / 1,001–1,600cc = 35%
// (Toyota Yaris Hybrid, 1490cc).

export type VehicleCategory = "car" | "pickup" | "van" | "lorry";

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  "car",
  "pickup",
  "van",
  "lorry",
];

export const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  car: "Motor car",
  pickup: "Pick-up",
  van: "Van",
  lorry: "Lorry",
};

/** How a sub-type's excise rate is determined. */
export type RateSpec =
  | { kind: "fixed"; rate: number }
  | { kind: "cc"; brackets: CcBracket[] }
  | { kind: "kw"; brackets: CcBracket[] };

/** A body / cabin variant within a powertrain (e.g. "Single cabin"). */
export interface SubType {
  id: string;
  label: string;
  spec: RateSpec;
}

/** A powertrain option within a category (e.g. "Hybrid"), with its variants. */
export interface Powertrain {
  id: string;
  label: string;
  subTypes: SubType[];
}

/** The full editable excise schedule: category -> list of powertrains. */
export type ExciseSchedule = Record<VehicleCategory, Powertrain[]>;

const carBrackets = (r: number[]): CcBracket[] => [
  { maxCc: 550, value: r[0] },
  { maxCc: 1000, value: r[1] },
  { maxCc: 1600, value: r[2] },
  { maxCc: 2000, value: r[3] },
  { maxCc: null, value: r[4] },
];

const std = (spec: RateSpec): SubType[] => [
  { id: "standard", label: "Standard", spec },
];

const electricKw: CcBracket[] = [
  { maxCc: 180, value: 0.15 },
  { maxCc: null, value: 0.25 },
];

export const DEFAULT_EXCISE_SCHEDULE: ExciseSchedule = {
  car: [
    { id: "ice", label: "Petrol / Diesel (ICE)", subTypes: std({ kind: "cc", brackets: carBrackets([0, 0.45, 0.55, 0.75, 1.0]) }) },
    { id: "mild_hybrid", label: "Mild hybrid", subTypes: std({ kind: "cc", brackets: carBrackets([0, 0.25, 0.35, 0.55, 0.75]) }) },
    { id: "hybrid", label: "Hybrid", subTypes: std({ kind: "cc", brackets: carBrackets([0, 0.25, 0.35, 0.55, 0.75]) }) },
    { id: "plugin_hybrid", label: "Plug-in hybrid", subTypes: std({ kind: "cc", brackets: carBrackets([0, 0.15, 0.25, 0.35, 0.55]) }) },
    { id: "electric", label: "Electric", subTypes: std({ kind: "kw", brackets: electricKw }) },
  ],
  pickup: [
    { id: "ice", label: "Petrol / Diesel (ICE)", subTypes: [
      { id: "single", label: "Single cabin", spec: { kind: "fixed", rate: 0.1 } },
      { id: "double", label: "Double cabin", spec: { kind: "fixed", rate: 0.3 } },
    ] },
    { id: "hybrid", label: "Hybrid", subTypes: [
      { id: "single", label: "Single cabin", spec: { kind: "fixed", rate: 0.05 } },
      { id: "double", label: "Double cabin", spec: { kind: "fixed", rate: 0.2 } },
    ] },
    { id: "plugin_hybrid", label: "Plug-in hybrid", subTypes: [
      { id: "single", label: "Single cabin", spec: { kind: "fixed", rate: 0.05 } },
      { id: "double", label: "Double cabin", spec: { kind: "fixed", rate: 0.15 } },
    ] },
    { id: "electric", label: "Electric", subTypes: [
      { id: "single", label: "Single cabin", spec: { kind: "fixed", rate: 0.05 } },
      { id: "double", label: "Double cabin", spec: { kind: "kw", brackets: [ { maxCc: 180, value: 0.1 }, { maxCc: null, value: 0.15 } ] } },
    ] },
  ],
  van: [
    { id: "ice", label: "Petrol / Diesel (ICE)", subTypes: [
      { id: "refrigerated", label: "Refrigerated", spec: { kind: "fixed", rate: 0 } },
      { id: "no_bench", label: "No bench / anchor points behind front seats", spec: { kind: "fixed", rate: 0.1 } },
      { id: "standard", label: "Standard (by cc)", spec: { kind: "cc", brackets: [ { maxCc: 1600, value: 0.55 }, { maxCc: 2000, value: 0.75 }, { maxCc: null, value: 1.0 } ] } },
    ] },
    { id: "hybrid", label: "Hybrid", subTypes: [
      { id: "refrigerated", label: "Refrigerated", spec: { kind: "fixed", rate: 0 } },
      { id: "no_bench", label: "No bench / anchor points behind front seats", spec: { kind: "fixed", rate: 0.05 } },
      { id: "standard", label: "Standard (by cc)", spec: { kind: "cc", brackets: [ { maxCc: 1600, value: 0.35 }, { maxCc: 2000, value: 0.55 }, { maxCc: null, value: 0.75 } ] } },
    ] },
    { id: "electric", label: "Electric", subTypes: [
      { id: "refrigerated", label: "Refrigerated", spec: { kind: "fixed", rate: 0 } },
      { id: "no_bench", label: "No bench / anchor points behind front seats", spec: { kind: "fixed", rate: 0.05 } },
      { id: "standard", label: "Standard (by kW)", spec: { kind: "kw", brackets: electricKw } },
    ] },
  ],
  lorry: [
    { id: "ice", label: "Petrol / Diesel (ICE)", subTypes: [
      { id: "ckd", label: "Completely knocked-down (CKD)", spec: { kind: "fixed", rate: 0 } },
      { id: "refrigerated", label: "Refrigerated", spec: { kind: "fixed", rate: 0 } },
      { id: "lorry", label: "Lorry", spec: { kind: "fixed", rate: 0.1 } },
    ] },
    { id: "hybrid", label: "Hybrid", subTypes: [
      { id: "refrigerated", label: "Refrigerated", spec: { kind: "fixed", rate: 0 } },
      { id: "lorry", label: "Lorry", spec: { kind: "fixed", rate: 0.05 } },
    ] },
    { id: "electric", label: "Electric", subTypes: [
      { id: "refrigerated", label: "Refrigerated", spec: { kind: "fixed", rate: 0 } },
      { id: "lorry", label: "Lorry", spec: { kind: "fixed", rate: 0.05 } },
    ] },
  ],
};

/** Resolve the excise rate for a sub-type given the vehicle's cc and power. */
export function resolveExciseRate(
  spec: RateSpec,
  cc: number,
  powerKw: number,
): number {
  switch (spec.kind) {
    case "fixed":
      return spec.rate;
    case "cc":
      return lookupBracket(spec.brackets, cc);
    case "kw":
      return lookupBracket(spec.brackets, powerKw);
  }
}

// Import Customs Duty (ICD) rate on cars. 0% in the observed declaration; kept
// editable because it applies before excise when non-zero.
export const DEFAULT_ICD_RATE = 0;

// First registration fee by engine capacity in Rs (illustrative defaults — verify with NLTA).
export const DEFAULT_REGISTRATION_BRACKETS: CcBracket[] = [
  { maxCc: 1000, value: 13000 },
  { maxCc: 1250, value: 25000 },
  { maxCc: 1600, value: 36500 },
  { maxCc: 2000, value: 55000 },
  { maxCc: null, value: 100000 },
];

// Road tax (12-month licence) by engine capacity in Rs. Official NLTA figures
// for Mauritius from the Motor Vehicle Licences communiqué effective
// 01 July 2025, section 1 (motorcar / dual-purpose / double-cab, including
// hybrid and electric — NOT company/trade-name registered).
export const DEFAULT_ROAD_TAX_BRACKETS: CcBracket[] = [
  { maxCc: 1250, value: 4500 },
  { maxCc: 1600, value: 5000 },
  { maxCc: 1850, value: 10000 },
  { maxCc: 2250, value: 12000 },
  { maxCc: null, value: 15000 },
];

/** Look up the bracket value for a given engine capacity. */
export function lookupBracket(brackets: CcBracket[], cc: number): number {
  const sorted = [...brackets].sort((a, b) => {
    if (a.maxCc === null) return 1;
    if (b.maxCc === null) return -1;
    return a.maxCc - b.maxCc;
  });
  for (const b of sorted) {
    if (b.maxCc === null || cc <= b.maxCc) return b.value;
  }
  return sorted.length ? sorted[sorted.length - 1].value : 0;
}

// --- Excise + VAT estimate ---------------------------------------------------

export interface DutyEstimate {
  icdAmount: number;
  exciseRate: number;
  exciseAmount: number;
  vatAmount: number;
  total: number;
}

/**
 * Estimate ICD, excise duty and VAT from the customs-assessed value (in Rs) and
 * the applicable excise rate, following the MRA method seen on the customs
 * declaration:
 *
 *   ICD    = icdRate    x customsValue
 *   Excise = exciseRate x (customsValue + ICD)
 *   VAT    = 15%        x (customsValue + ICD + Excise)
 *
 * The customs value is what MRA assesses the vehicle at — usually lower than the
 * price paid. It ignores CO2 rebate/levy and duty-exemption concessions; use the
 * exact MRA figure when you have the declaration.
 */
export function estimateDuty(
  customsValue: number,
  exciseRate: number,
  icdRate: number = DEFAULT_ICD_RATE,
): DutyEstimate {
  const icdAmount = Math.round(customsValue * icdRate);
  const exciseAmount = Math.round((customsValue + icdAmount) * exciseRate);
  const vatAmount = Math.round(
    (customsValue + icdAmount + exciseAmount) * VAT_RATE,
  );
  return {
    icdAmount,
    exciseRate,
    exciseAmount,
    vatAmount,
    total: icdAmount + exciseAmount + vatAmount,
  };
}

// --- Default estimate (matches the recorded example car) ---------------------

let idCounter = 0;
const nid = (seed: string) => `${seed}-${idCounter++}`;

export function defaultLineItems(): LineItem[] {
  idCounter = 0;
  return [
    { id: nid("permit"), label: "Showroom permit", amount: 25000, group: "shipping" },
    { id: nid("excise"), label: "Excise duty + VAT (MRA)", amount: 192246, group: "taxes", derived: true },
    { id: nid("registration"), label: "Car registration (NLTA)", amount: 36500, group: "taxes", derived: true },
    { id: nid("roadtax"), label: "Road tax (NLTA)", amount: 5000, group: "taxes", derived: true },
    { id: nid("broker"), label: "Broker fee", amount: 4500, group: "shipping" },
    { id: nid("boat"), label: "Boat / MOL freight", amount: 10611, group: "shipping" },
    { id: nid("insurance"), label: "Insurance / TEM / fitness / gate pass", amount: 820, group: "preparation" },
    { id: nid("fuel"), label: "Fuel (l'essence)", amount: 800, group: "preparation" },
    { id: nid("paint"), label: "Car paint", amount: 3500, group: "preparation" },
    { id: nid("nettoyage"), label: "Nettoyage (cleaning)", amount: 0, group: "preparation" },
    { id: nid("worker"), label: "Worker fee", amount: 0, group: "preparation" },
    { id: nid("plate"), label: "Car plate number", amount: 1000, group: "other" },
    { id: nid("excessvat"), label: "Excess VAT", amount: 11289, group: "other" },
    { id: nid("additional"), label: "Additional", amount: 5000, group: "other" },
    { id: nid("rectification"), label: "Rectification", amount: 1500, group: "other" },
  ];
}

export function newLineItem(group: CostGroup): LineItem {
  return { id: nid("custom"), label: "New item", amount: 0, group };
}

// --- Formatting helpers ------------------------------------------------------

export function formatRs(n: number): string {
  return new Intl.NumberFormat("en-MU", {
    style: "currency",
    currency: "MUR",
    maximumFractionDigits: 0,
  }).format(isFinite(n) ? n : 0);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    isFinite(n) ? n : 0,
  );
}
