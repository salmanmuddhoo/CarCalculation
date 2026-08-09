"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  CcBracket,
  CostGroup,
  DEFAULT_EXCISE_SCHEDULE,
  DEFAULT_ICD_RATE,
  DEFAULT_REGISTRATION_BRACKETS,
  DEFAULT_ROAD_TAX_BRACKETS,
  ExciseSchedule,
  GROUP_LABELS,
  LineItem,
  Powertrain,
  RateSpec,
  SubType,
  VAT_RATE,
  VEHICLE_CATEGORIES,
  VehicleCategory,
  defaultLineItems,
  estimateDuty,
  formatNumber,
  formatRs,
  lookupBracket,
  newLineItem,
  resolveExciseRate,
} from "@/lib/calc";

const STORAGE_KEY = "car-import-calc:v6";

const MCB_RATES_URL = "https://www.mcb.mu";
const MRA_FOB_URL = "http://eservices6.mra.mu/choice.asp";

interface Persisted {
  carName: string;
  cifJpy: number;
  jpyRate: number;
  category: VehicleCategory;
  powertrainId: string;
  subTypeId: string;
  cc: number;
  powerKw: number;
  assessedFobJpy: number;
  customsValue: number;
  icdRate: number;
  items: LineItem[];
  exciseSchedule: ExciseSchedule;
  registrationBrackets: CcBracket[];
  roadTaxBrackets: CcBracket[];
}

function loadState(): Partial<Persisted> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : {};
  } catch {
    return {};
  }
}

const GROUP_ORDER: CostGroup[] = ["taxes", "shipping", "preparation", "other"];

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [carName, setCarName] = useState("");
  const [cifJpy, setCifJpy] = useState(1520000);
  const [jpyRate, setJpyRate] = useState(0.32);
  const [category, setCategory] = useState<VehicleCategory>("car");
  const [powertrainId, setPowertrainId] = useState("hybrid");
  const [subTypeId, setSubTypeId] = useState("standard");
  const [cc, setCc] = useState(1490);
  const [powerKw, setPowerKw] = useState(100);
  const [assessedFobJpy, setAssessedFobJpy] = useState(0);
  const [customsValue, setCustomsValue] = useState(347956);
  const [icdRate, setIcdRate] = useState(DEFAULT_ICD_RATE);
  const [items, setItems] = useState<LineItem[]>(defaultLineItems());
  const [exciseSchedule, setExciseSchedule] = useState(DEFAULT_EXCISE_SCHEDULE);
  const [registrationBrackets, setRegistrationBrackets] = useState(
    DEFAULT_REGISTRATION_BRACKETS,
  );
  const [roadTaxBrackets, setRoadTaxBrackets] = useState(
    DEFAULT_ROAD_TAX_BRACKETS,
  );
  const [showRates, setShowRates] = useState(false);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const s = loadState();
    if (s.carName !== undefined) setCarName(s.carName);
    if (s.cifJpy !== undefined) setCifJpy(s.cifJpy);
    if (s.jpyRate !== undefined) setJpyRate(s.jpyRate);
    if (s.category !== undefined) setCategory(s.category);
    if (s.powertrainId !== undefined) setPowertrainId(s.powertrainId);
    if (s.subTypeId !== undefined) setSubTypeId(s.subTypeId);
    if (s.cc !== undefined) setCc(s.cc);
    if (s.powerKw !== undefined) setPowerKw(s.powerKw);
    if (s.assessedFobJpy !== undefined) setAssessedFobJpy(s.assessedFobJpy);
    if (s.customsValue !== undefined) setCustomsValue(s.customsValue);
    if (s.icdRate !== undefined) setIcdRate(s.icdRate);
    if (s.items) setItems(s.items);
    if (s.exciseSchedule) setExciseSchedule(s.exciseSchedule);
    if (s.registrationBrackets) setRegistrationBrackets(s.registrationBrackets);
    if (s.roadTaxBrackets) setRoadTaxBrackets(s.roadTaxBrackets);
    setLoaded(true);
  }, []);

  // Persist on change (after initial hydration).
  useEffect(() => {
    if (!loaded) return;
    const data: Persisted = {
      carName,
      cifJpy,
      jpyRate,
      category,
      powertrainId,
      subTypeId,
      cc,
      powerKw,
      assessedFobJpy,
      customsValue,
      icdRate,
      items,
      exciseSchedule,
      registrationBrackets,
      roadTaxBrackets,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota errors */
    }
  }, [
    loaded,
    carName,
    cifJpy,
    jpyRate,
    category,
    powertrainId,
    subTypeId,
    cc,
    powerKw,
    assessedFobJpy,
    customsValue,
    icdRate,
    items,
    exciseSchedule,
    registrationBrackets,
    roadTaxBrackets,
  ]);

  const cifMru = useMemo(() => Math.round(cifJpy * jpyRate), [cifJpy, jpyRate]);
  const assessedFobMru = useMemo(
    () => Math.round(assessedFobJpy * jpyRate),
    [assessedFobJpy, jpyRate],
  );

  // Resolve the currently selected powertrain / sub-type with safe fallbacks.
  const powertrains: Powertrain[] = exciseSchedule[category];
  const powertrain: Powertrain =
    powertrains.find((p) => p.id === powertrainId) ?? powertrains[0];
  const subTypes: SubType[] = powertrain.subTypes;
  const subType: SubType =
    subTypes.find((s) => s.id === subTypeId) ?? subTypes[0];
  const spec: RateSpec = subType.spec;

  const needsCc = spec.kind === "cc";
  const needsKw = spec.kind === "kw";
  const hasSubTypeChoice = subTypes.length > 1;

  const exciseRate = resolveExciseRate(spec, cc, powerKw);
  const dutyEstimate = useMemo(
    () => estimateDuty(customsValue, exciseRate, icdRate),
    [customsValue, exciseRate, icdRate],
  );
  const registrationEstimate = useMemo(
    () => lookupBracket(registrationBrackets, cc),
    [registrationBrackets, cc],
  );
  const roadTaxEstimate = useMemo(
    () => lookupBracket(roadTaxBrackets, cc),
    [roadTaxBrackets, cc],
  );

  const itemsTotal = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
    [items],
  );
  const grandTotal = cifMru + itemsTotal;

  // --- selection handlers keep powertrain/sub-type valid ---------------------
  function changeCategory(next: VehicleCategory) {
    setCategory(next);
    const pt = exciseSchedule[next][0];
    setPowertrainId(pt.id);
    setSubTypeId(pt.subTypes[0].id);
  }
  function changePowertrain(id: string) {
    setPowertrainId(id);
    const pt = powertrains.find((p) => p.id === id) ?? powertrains[0];
    setSubTypeId(pt.subTypes[0].id);
  }

  // --- editing the excise schedule -------------------------------------------
  function updateCurrentSpec(nextSpec: RateSpec) {
    setExciseSchedule((prev) => {
      const next: ExciseSchedule = { ...prev };
      next[category] = prev[category].map((p) =>
        p.id !== powertrain.id
          ? p
          : {
              ...p,
              subTypes: p.subTypes.map((s) =>
                s.id !== subType.id ? s : { ...s, spec: nextSpec },
              ),
            },
      );
      return next;
    });
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function addItem(group: CostGroup) {
    setItems((prev) => [...prev, newLineItem(group)]);
  }

  function applyEstimate(kind: "excise" | "registration" | "roadtax") {
    setItems((prev) =>
      prev.map((i) => {
        if (kind === "excise" && i.label.startsWith("Excise"))
          return { ...i, amount: dutyEstimate.total };
        if (kind === "registration" && i.label.startsWith("Car registration"))
          return { ...i, amount: registrationEstimate };
        if (kind === "roadtax" && i.label.startsWith("Road tax"))
          return { ...i, amount: roadTaxEstimate };
        return i;
      }),
    );
  }

  function resetAll() {
    if (!confirm("Reset all inputs to the default example car?")) return;
    setCarName("");
    setCifJpy(1520000);
    setJpyRate(0.32);
    setCategory("car");
    setPowertrainId("hybrid");
    setSubTypeId("standard");
    setCc(1490);
    setPowerKw(100);
    setAssessedFobJpy(0);
    setCustomsValue(347956);
    setIcdRate(DEFAULT_ICD_RATE);
    setItems(defaultLineItems());
    setExciseSchedule(DEFAULT_EXCISE_SCHEDULE);
    setRegistrationBrackets(DEFAULT_REGISTRATION_BRACKETS);
    setRoadTaxBrackets(DEFAULT_ROAD_TAX_BRACKETS);
  }

  const dimLabel = needsKw
    ? `${formatNumber(powerKw)}kW`
    : `${formatNumber(cc)}cc`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          🚗 Car Import Calculator
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Estimate the total landed cost of importing a vehicle from{" "}
          <span className="font-medium">Japan</span> to{" "}
          <span className="font-medium">Mauritius</span>.
        </p>
      </header>

      {/* Vehicle & currency */}
      <section className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Vehicle & currency
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vehicle name / reference">
            <input
              type="text"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="e.g. Toyota Yaris Hybrid 2022"
              className="input"
            />
          </Field>
          <Field label="Vehicle category">
            <select
              value={category}
              onChange={(e) => changeCategory(e.target.value as VehicleCategory)}
              className="input"
            >
              {VEHICLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fuel / powertrain type">
            <select
              value={powertrain.id}
              onChange={(e) => changePowertrain(e.target.value)}
              className="input"
            >
              {powertrains.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          {hasSubTypeChoice && (
            <Field label="Body / cabin type">
              <select
                value={subType.id}
                onChange={(e) => setSubTypeId(e.target.value)}
                className="input"
              >
                {subTypes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {needsCc && (
            <Field label="Engine capacity (cc)">
              <input
                type="number"
                value={cc || ""}
                onChange={(e) => setCc(Number(e.target.value))}
                className="input"
              />
            </Field>
          )}
          {needsKw && (
            <Field label="Power rating (kW)">
              <input
                type="number"
                value={powerKw || ""}
                onChange={(e) => setPowerKw(Number(e.target.value))}
                className="input"
              />
            </Field>
          )}
          <Field label="Vehicle cost in Japan — CIF (JPY)">
            <input
              type="number"
              value={cifJpy || ""}
              onChange={(e) => setCifJpy(Number(e.target.value))}
              placeholder="e.g. 1680000"
              className="input"
            />
          </Field>
          <Field label="MCB selling rate (1 JPY → MUR)">
            <input
              type="number"
              step="0.0001"
              value={jpyRate || ""}
              onChange={(e) => setJpyRate(Number(e.target.value))}
              className="input"
            />
            <a
              href={MCB_RATES_URL}
              target="_blank"
              rel="noreferrer"
              className="no-print mt-1 inline-block text-[11px] font-medium text-brand hover:underline"
            >
              Check MCB rates ↗
            </a>
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-teal-50 px-4 py-3 ring-1 ring-teal-100">
          <span className="text-sm font-medium text-teal-800">
            CIF in Mauritian Rupees
          </span>
          <span className="text-lg font-bold text-teal-800">
            {formatRs(cifMru)}
          </span>
        </div>
      </section>

      {/* Excise / duty estimate */}
      <section className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Duty & tax estimate
          </h2>
          <button
            onClick={() => setShowRates((v) => !v)}
            className="no-print text-xs font-medium text-brand hover:underline"
          >
            {showRates ? "Hide rate tables" : "Edit rate tables"}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Excise/VAT from the official MRA schedule; registration & road tax from
          NLTA. Use the actual MRA / NLTA figures when you have them — click
          “Use” to copy an estimate into the cost line below.
        </p>

        {/* Duty computation (MRA method) */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Customs-assessed value for duty (Rs)">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customsValue || ""}
                  onChange={(e) => setCustomsValue(Number(e.target.value))}
                  className="input"
                />
                <button
                  onClick={() => setCustomsValue(cifMru)}
                  title="Set equal to the converted CIF"
                  className="no-print shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  = CIF
                </button>
              </div>
            </Field>
            <Field label="Import customs duty — ICD (%)">
              <input
                type="number"
                step="1"
                value={Math.round(icdRate * 100)}
                onChange={(e) => setIcdRate(Number(e.target.value) / 100)}
                className="input"
              />
            </Field>
          </div>

          {/* Assessed FOB (JPY) from MRA e-Services -> customs value */}
          <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white/60 p-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[10rem] flex-1">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Assessed FOB value (JPY) — from MRA e-Services
                </span>
                <input
                  type="number"
                  value={assessedFobJpy || ""}
                  onChange={(e) => setAssessedFobJpy(Number(e.target.value))}
                  placeholder="e.g. 953484"
                  className="input"
                />
              </div>
              <div className="pb-1 text-xs text-slate-500">
                × {jpyRate} ={" "}
                <span className="font-semibold text-slate-700 tabular-nums">
                  {formatRs(assessedFobMru)}
                </span>
              </div>
              <button
                onClick={() => setCustomsValue(assessedFobMru)}
                disabled={!assessedFobJpy}
                className="no-print rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-40"
              >
                Use as customs value
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Look up the assessed FOB value in JPY on{" "}
              <a
                href={MRA_FOB_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand hover:underline"
              >
                MRA e-Services ↗
              </a>
              , then convert it here. Customs may add freight, insurance and other
              costs on top — adjust the Rs value above if needed.
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            MRA assesses its own customs value (often lower than the price paid).
            Excise rate for a {dimLabel} {CATEGORY_LABELS[category].toLowerCase()}{" "}
            ({powertrain.label}
            {hasSubTypeChoice ? `, ${subType.label}` : ""}):{" "}
            <span className="font-semibold text-slate-500">
              {(exciseRate * 100).toFixed(0)}%
            </span>
            .
          </p>
          <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
            <BreakdownRow label="Customs value" value={formatRs(customsValue)} />
            {icdRate > 0 && (
              <BreakdownRow
                label={`Import customs duty (${(icdRate * 100).toFixed(0)}%)`}
                value={formatRs(dutyEstimate.icdAmount)}
              />
            )}
            <BreakdownRow
              label={`Excise duty (${(exciseRate * 100).toFixed(0)}%)`}
              value={formatRs(dutyEstimate.exciseAmount)}
            />
            <BreakdownRow
              label={`VAT (${(VAT_RATE * 100).toFixed(0)}%)`}
              value={formatRs(dutyEstimate.vatAmount)}
            />
            <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 font-semibold text-slate-800">
              <dt>Total duties + VAT</dt>
              <dd className="flex items-center gap-2 tabular-nums">
                {formatRs(dutyEstimate.total)}
                <button
                  onClick={() => applyEstimate("excise")}
                  className="no-print rounded bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand hover:bg-brand/20"
                >
                  Use
                </button>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <EstimateCard
            title="Registration"
            value={registrationEstimate}
            sub="NLTA first registration (by cc)"
            onUse={() => applyEstimate("registration")}
          />
          <EstimateCard
            title="Road tax"
            value={roadTaxEstimate}
            sub="NLTA 12-month (Mauritius, by cc)"
            onUse={() => applyEstimate("roadtax")}
          />
        </div>

        {showRates && (
          <div className="no-print mt-5 grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 lg:grid-cols-3">
            <ExciseSpecEditor
              title={`Excise — ${CATEGORY_LABELS[category]} · ${powertrain.label}${
                hasSubTypeChoice ? ` · ${subType.label}` : ""
              }`}
              spec={spec}
              onChange={updateCurrentSpec}
            />
            <RateTableEditor
              title="Registration fee (Rs)"
              unit="Rs"
              brackets={registrationBrackets}
              onChange={setRegistrationBrackets}
            />
            <RateTableEditor
              title="Road tax (Rs)"
              unit="Rs"
              brackets={roadTaxBrackets}
              onChange={setRoadTaxBrackets}
            />
          </div>
        )}
      </section>

      {/* Cost line items */}
      <section className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Cost breakdown
        </h2>

        <div className="space-y-6">
          {GROUP_ORDER.map((group) => {
            const groupItems = items.filter((i) => i.group === group);
            const groupTotal = groupItems.reduce(
              (s, i) => s + (Number(i.amount) || 0),
              0,
            );
            return (
              <div key={group}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {GROUP_LABELS[group]}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    {formatRs(groupTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-1.5"
                    >
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) =>
                          updateItem(item.id, { label: e.target.value })
                        }
                        className="min-w-0 flex-1 rounded bg-transparent px-1 py-1 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand/40"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">Rs</span>
                        <input
                          type="number"
                          value={item.amount || ""}
                          onChange={(e) =>
                            updateItem(item.id, {
                              amount: Number(e.target.value),
                            })
                          }
                          className="w-28 rounded border border-slate-200 bg-white px-2 py-1 text-right text-sm tabular-nums focus:border-brand focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="no-print rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                        aria-label="Remove item"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addItem(group)}
                  className="no-print mt-2 text-xs font-medium text-brand hover:underline"
                >
                  + Add item
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Totals */}
      <section className="mb-6 rounded-xl bg-slate-900 p-5 text-white shadow-sm">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Vehicle CIF (converted)</span>
            <span className="tabular-nums">{formatRs(cifMru)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>All other charges</span>
            <span className="tabular-nums">{formatRs(itemsTotal)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-base font-semibold">Total landed cost</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatRs(grandTotal)}
            </span>
          </div>
        </div>
      </section>

      <div className="no-print mb-10 flex flex-wrap gap-3">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Print / Save PDF
        </button>
        <button
          onClick={resetAll}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Reset to example
        </button>
      </div>

      <footer className="mb-6 text-xs text-slate-400">
        <p>
          VAT rate used for estimates: {(VAT_RATE * 100).toFixed(0)}%. Excise
          rates follow the official MRA schedule for motor cars, pick-ups, vans
          and lorries; road tax uses the NLTA figures (eff. 01 July 2025). Rate
          tables are editable and saved in your browser only. The estimate
          ignores CO₂ rebate/levy and duty-exemption concessions — verify with
          MRA / NLTA before relying on a figure.
        </p>
      </footer>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-500">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function EstimateCard({
  title,
  value,
  sub,
  onUse,
}: {
  title: string;
  value: number;
  sub: string;
  onUse: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        <button
          onClick={onUse}
          className="no-print rounded bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand hover:bg-brand/20"
        >
          Use
        </button>
      </div>
      <div className="mt-1 text-lg font-bold text-slate-800 tabular-nums">
        {formatRs(value)}
      </div>
      <div className="text-[11px] text-slate-400">{sub}</div>
    </div>
  );
}

/** Editor for the currently selected excise sub-type: a fixed % or a bracket table. */
function ExciseSpecEditor({
  title,
  spec,
  onChange,
}: {
  title: string;
  spec: RateSpec;
  onChange: (s: RateSpec) => void;
}) {
  if (spec.kind === "fixed") {
    return (
      <div>
        <h4 className="mb-2 text-xs font-semibold text-slate-500">{title}</h4>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Rate</span>
          <input
            type="number"
            step="1"
            value={Math.round(spec.rate * 100)}
            onChange={(e) =>
              onChange({ kind: "fixed", rate: Number(e.target.value) / 100 })
            }
            className="w-20 rounded border border-slate-200 px-1.5 py-1 text-right tabular-nums focus:border-brand focus:outline-none"
          />
          <span className="text-slate-400">%</span>
        </div>
      </div>
    );
  }
  return (
    <RateTableEditor
      title={title}
      unit="%"
      thresholdUnit={spec.kind === "kw" ? "kW" : "cc"}
      isPercent
      brackets={spec.brackets}
      onChange={(b) => onChange({ kind: spec.kind, brackets: b })}
    />
  );
}

function RateTableEditor({
  title,
  unit,
  brackets,
  onChange,
  isPercent = false,
  thresholdUnit = "cc",
}: {
  title: string;
  unit: string;
  brackets: CcBracket[];
  onChange: (b: CcBracket[]) => void;
  isPercent?: boolean;
  thresholdUnit?: string;
}) {
  function update(idx: number, patch: Partial<CcBracket>) {
    onChange(brackets.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  }
  function add() {
    onChange([...brackets, { maxCc: 3000, value: 0 }]);
  }
  function remove(idx: number) {
    onChange(brackets.filter((_, i) => i !== idx));
  }
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold text-slate-500">{title}</h4>
      <div className="space-y-1.5">
        {brackets.map((b, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">≤</span>
            <input
              type="number"
              value={b.maxCc ?? ""}
              placeholder="∞"
              onChange={(e) =>
                update(idx, {
                  maxCc: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-20 rounded border border-slate-200 px-1.5 py-1 text-right tabular-nums focus:border-brand focus:outline-none"
            />
            <span className="text-slate-400">{thresholdUnit} →</span>
            <input
              type="number"
              step={isPercent ? "1" : "500"}
              value={isPercent ? Math.round(b.value * 100) : b.value}
              onChange={(e) =>
                update(idx, {
                  value: isPercent
                    ? Number(e.target.value) / 100
                    : Number(e.target.value),
                })
              }
              className="w-20 rounded border border-slate-200 px-1.5 py-1 text-right tabular-nums focus:border-brand focus:outline-none"
            />
            <span className="w-6 text-slate-400">{unit}</span>
            <button
              onClick={() => remove(idx)}
              className="text-slate-300 hover:text-red-500"
              aria-label="Remove bracket"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-2 text-[11px] font-medium text-brand hover:underline"
      >
        + Add bracket
      </button>
    </div>
  );
}
