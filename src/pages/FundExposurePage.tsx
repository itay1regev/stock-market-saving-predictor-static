import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import type { FundHolding, FundHoldingsResponse } from '../types'
import { ErrorState, LoadingState } from '../components/StatusMessage'
import { ChevronIcon } from '../components/icons'
import DataDisclaimer from '../components/DataDisclaimer'

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const FUNDS = {
  'mor-israel-ta125': { title: 'MOR Israel TA-125', file: 'mor-israel-ta125.json' },
  'yalin-lapidot-ta125-value': { title: 'Yalin Lapidot TA-125 Value', file: 'yalin-lapidot-ta125-value.json' },
} as const
type FundKey = keyof typeof FUNDS

function isFundKey(value: string | undefined): value is FundKey {
  return value !== undefined && Object.hasOwn(FUNDS, value)
}

const DATA_BASE = import.meta.env.BASE_URL + 'data/'
const TOP_SECTORS = 10
const TOP_ACTIVE = 10
const TABLE_PREVIEW = 15

// Bar colours (validated pair: CVD ΔE ≥ 8, ≥ 3:1 on white). Text never uses series colours.
const BAR = 'bg-indigo-600'
const BAR_MUTED = 'bg-slate-400'
const BAR_UNLISTED = 'bg-slate-300'
const OVER = 'bg-indigo-600'
const UNDER = 'bg-orange-600'

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

interface IndexCompany {
  security_id: string
  industry: string | null
  weight_pct: number
}

interface Holding extends FundHolding {
  inIndex: boolean
}

interface SectorRow {
  sector: string
  weight: number
  count: number
}

interface ActiveRow {
  sector: string
  fund: number
  index: number
  diff: number
}

/** Merges duplicate lines of the same security and drops zero-weight rows. */
function cleanHoldings(raw: FundHolding[]): FundHolding[] {
  const bySecurity = new Map<string, FundHolding>()
  for (const h of raw) {
    if (!(h.weight_pct > 0)) continue
    const prev = bySecurity.get(h.security_number)
    bySecurity.set(h.security_number, prev ? { ...prev, weight_pct: prev.weight_pct + h.weight_pct } : { ...h })
  }
  return [...bySecurity.values()].sort((a, b) => b.weight_pct - a.weight_pct)
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return (await r.json()) as T
}

function useFundData(fund: FundKey | null) {
  const [state, setState] = useState<{
    fund: FundKey | null
    holdings: FundHolding[] | null
    index: IndexCompany[] | null
    error: boolean
  }>({ fund: null, holdings: null, index: null, error: false })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!fund) return
    const ac = new AbortController()
    setState({ fund, holdings: null, index: null, error: false })
    fetchJson<FundHoldingsResponse>(DATA_BASE + 'fund-exposure/' + FUNDS[fund].file, ac.signal)
      .then(async (data) => {
        const holdings = Array.isArray(data.holdings) ? cleanHoldings(data.holdings) : []
        // The index comparison is optional: the page still works if this file fails.
        const index = await fetchJson<{ companies: IndexCompany[] }>(DATA_BASE + 'companies/ta125.json', ac.signal)
          .then((d) => (Array.isArray(d.companies) ? d.companies : null))
          .catch((e: unknown) => {
            if (ac.signal.aborted) throw e
            return null
          })
        setState({ fund, holdings, index, error: false })
      })
      .catch(() => {
        if (!ac.signal.aborted) setState({ fund, holdings: null, index: null, error: true })
      })
    return () => ac.abort()
  }, [fund, attempt])

  // Never show one fund's data under another fund's title.
  const current = state.fund === fund ? state : { fund, holdings: null, index: null, error: false }
  return { ...current, retry: () => setAttempt((n) => n + 1) }
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

function Pct({ value, digits = 1, signed = false }: { value: number; digits?: number; signed?: boolean }) {
  const text = `${signed && value > 0 ? '+' : ''}${value.toFixed(digits)}%`
  return (
    <span dir="ltr" className="tabular-nums">
      {text}
    </span>
  )
}

function Points({ value }: { value: number }) {
  return (
    <span dir="ltr" className="tabular-nums">
      {`${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}`}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function FundExposurePage() {
  const { fund: fundParam } = useParams<{ fund: string }>()
  const fund = isFundKey(fundParam) ? fundParam : null
  const { holdings: raw, index, error, retry } = useFundData(fund)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  // Reset the sector filter when switching funds (adjusting state during render).
  const [lastFund, setLastFund] = useState(fund)
  if (fund !== lastFund) {
    setLastFund(fund)
    setSelectedSector(null)
  }

  const model = useMemo(() => {
    if (!raw) return null
    const indexById = new Map((index ?? []).map((c) => [c.security_id, c]))
    const holdings: Holding[] = raw.map((h) => ({ ...h, inIndex: indexById.has(h.security_number) }))
    const listedTotal = holdings.reduce((s, h) => s + h.weight_pct, 0)

    const bySector = new Map<string, SectorRow>()
    for (const h of holdings) {
      const row = bySector.get(h.sector) ?? { sector: h.sector, weight: 0, count: 0 }
      row.weight += h.weight_pct
      row.count += 1
      bySector.set(h.sector, row)
    }
    const sectors = [...bySector.values()].sort((a, b) => b.weight - a.weight)
    const top10 = holdings.slice(0, 10).reduce((s, h) => s + h.weight_pct, 0)
    const outside = holdings.filter((h) => !h.inIndex)

    let active: ActiveRow[] | null = null
    if (index && index.length > 0 && listedTotal > 0) {
      const indexBySector = new Map<string, number>()
      for (const c of index) {
        const key = c.industry ?? 'אחר'
        indexBySector.set(key, (indexBySector.get(key) ?? 0) + c.weight_pct)
      }
      const names = new Set([...bySector.keys(), ...indexBySector.keys()])
      active = [...names]
        .map((sector) => {
          // Fund weights are a share of the fund; rescale to the listed holdings so both sides sum to 100%.
          const f = ((bySector.get(sector)?.weight ?? 0) / listedTotal) * 100
          const i = indexBySector.get(sector) ?? 0
          return { sector, fund: f, index: i, diff: f - i }
        })
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    }

    return {
      holdings,
      listedTotal,
      sectors,
      top10,
      outsideCount: outside.length,
      outsideWeight: outside.reduce((s, h) => s + h.weight_pct, 0),
      active,
    }
  }, [raw, index])

  if (!fund) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <title>Fund not found | BacktestIQ</title>
        <h1 className="text-2xl font-bold text-slate-900">Fund not found</h1>
        <p className="mt-2 text-slate-600">Choose one of the funds we analyse:</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(FUNDS) as FundKey[]).map((key) => (
            <li key={key}>
              <Link
                to={`/fund-exposure/${key}`}
                className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:underline"
              >
                {FUNDS[key].title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const title = FUNDS[fund].title

  return (
    <div>
      <title>{`${title} – ניתוח חשיפה | BacktestIQ`}</title>

      {/* Hero */}
      <section className="bg-slate-900 text-white" dir="rtl" lang="he">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <p className="text-sm font-semibold tracking-wider text-indigo-300">ניתוח חשיפה · קרן מנוהלת</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            <bdi dir="ltr">{title}</bdi>
          </h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            במה הקרן מחזיקה, לפי ענף ולפי נייר, ואיך היא שונה ממדד ת״א-125.
          </p>
          <nav aria-label="בחירת קרן" className="mt-5">
            <ul className="flex flex-wrap gap-2">
              {(Object.keys(FUNDS) as FundKey[]).map((key) => (
                <li key={key}>
                  <NavLink
                    to={`/fund-exposure/${key}`}
                    className={({ isActive }) =>
                      `inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${
                        isActive
                          ? 'border-white bg-white text-slate-900'
                          : 'border-white/20 bg-white/5 text-white hover:bg-white/15'
                      }`
                    }
                  >
                    <bdi dir="ltr">{FUNDS[key].title}</bdi>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8" dir="rtl" lang="he">
        {!model &&
          (error ? (
            <ErrorState message="לא ניתן לטעון את אחזקות הקרן כרגע." onRetry={retry} />
          ) : (
            <LoadingState message="טוען אחזקות…" />
          ))}

        {model && model.holdings.length === 0 && <p className="text-slate-600">אין נתוני אחזקות לקרן זו.</p>}

        {model && model.holdings.length > 0 && (
          <>
            {/* Stat tiles */}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="מספר החזקות" value={<span className="tabular-nums">{model.holdings.length}</span>} />
              <StatTile label="10 ההחזקות הגדולות" value={<Pct value={model.top10} />} note="מסך הקרן" />
              <StatTile
                label="הענף הגדול ביותר"
                value={<Pct value={model.sectors[0].weight} />}
                note={model.sectors[0].sector}
              />
              {model.active ? (
                <StatTile
                  label="מחוץ למדד ת״א-125"
                  value={<Pct value={model.outsideWeight} />}
                  note={`${model.outsideCount} החזקות`}
                />
              ) : (
                <StatTile label="מניות מפורטות" value={<Pct value={model.listedTotal} />} note="מסך הקרן" />
              )}
            </dl>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <SectorChart
                sectors={model.sectors}
                listedTotal={model.listedTotal}
                selected={selectedSector}
                onSelect={setSelectedSector}
              />
              {model.active && <ActiveWeightChart rows={model.active} />}
            </div>

            <HoldingsTable
              key={fund}
              holdings={model.holdings}
              sector={selectedSector}
              onClearSector={() => setSelectedSector(null)}
              showIndexBadge={model.active !== null}
            />
          </>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <DataDisclaimer source="funder.co.il (fund holdings); TA-125 weights are approximate" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function StatTile({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-slate-900">{value}</dd>
      {note && <dd className="mt-0.5 truncate text-xs text-slate-500">{note}</dd>}
    </div>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Ranked horizontal bars: one hue, largest first, long tail folded into "Other". */
function SectorChart({
  sectors,
  listedTotal,
  selected,
  onSelect,
}: {
  sectors: SectorRow[]
  listedTotal: number
  selected: string | null
  onSelect: (sector: string | null) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const folded = !showAll && sectors.length > TOP_SECTORS + 1
  const shown = folded ? sectors.slice(0, TOP_SECTORS) : sectors
  const rest = folded ? sectors.slice(TOP_SECTORS) : []
  const restWeight = rest.reduce((s, r) => s + r.weight, 0)
  const unlisted = Math.max(0, 100 - listedTotal)
  const max = Math.max(...shown.map((r) => r.weight), restWeight, unlisted)

  return (
    <Card title="חשיפה לפי ענף" subtitle="אחוז מסך נכסי הקרן. לחיצה על ענף מסננת את טבלת ההחזקות.">
      <ul className="space-y-1">
        {shown.map((r) => (
          <li key={r.sector}>
            <button
              type="button"
              aria-pressed={selected === r.sector}
              onClick={() => onSelect(selected === r.sector ? null : r.sector)}
              title={`${r.sector}: ${r.weight.toFixed(2)}% · ${r.count} החזקות`}
              className={`group grid w-full grid-cols-[7.5rem_1fr_3.25rem] items-center gap-3 rounded-md px-2 py-1 text-start sm:grid-cols-[9.5rem_1fr_3.5rem] ${
                selected === r.sector ? 'bg-indigo-50' : 'hover:bg-slate-50'
              } focus-visible:outline-2 focus-visible:outline-indigo-600`}
            >
              <span className="truncate text-sm text-slate-800">{r.sector}</span>
              <Bar value={r.weight} max={max} color={BAR} />
              <span className="text-sm font-medium text-slate-800">
                <Pct value={r.weight} />
              </span>
            </button>
          </li>
        ))}
        {folded && (
          <StaticRow label={`אחר (${rest.length} ענפים)`} value={restWeight} max={max} color={BAR_MUTED} />
        )}
        {unlisted >= 0.05 && (
          <StaticRow label="מזומן ונכסים אחרים" value={unlisted} max={max} color={BAR_UNLISTED} muted />
        )}
      </ul>
      {sectors.length > TOP_SECTORS + 1 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-sm font-medium text-indigo-700 hover:underline"
        >
          {showAll ? 'הצג את 10 הענפים הגדולים' : `הצג את כל ${sectors.length} הענפים`}
        </button>
      )}
      {unlisted >= 0.05 && (
        <p className="mt-3 text-xs text-slate-500">
          המניות המפורטות מהוות <Pct value={listedTotal} /> מהקרן. היתרה כוללת מזומן, פיקדונות, מק״מ ותעודות סל.
        </p>
      )}
    </Card>
  )
}

function StaticRow({
  label,
  value,
  max,
  color,
  muted,
}: {
  label: string
  value: number
  max: number
  color: string
  muted?: boolean
}) {
  return (
    <li className="grid grid-cols-[7.5rem_1fr_3.25rem] items-center gap-3 px-2 py-1 sm:grid-cols-[9.5rem_1fr_3.5rem]">
      <span className={`truncate text-sm ${muted ? 'text-slate-500' : 'text-slate-700'}`}>{label}</span>
      <Bar value={value} max={max} color={color} />
      <span className={`text-sm ${muted ? 'text-slate-500' : 'text-slate-700'}`}>
        <Pct value={value} />
      </span>
    </li>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = max > 0 ? Math.max(1.5, (value / max) * 100) : 0
  return (
    <span aria-hidden="true" className="block h-3.5 w-full rounded-e bg-slate-100">
      <span className={`block h-full rounded-e ${color}`} style={{ width: `${width}%` }} />
    </span>
  )
}

/** Diverging bars of active weight (fund − index) per sector, biggest differences first. */
function ActiveWeightChart({ rows }: { rows: ActiveRow[] }) {
  const shown = rows.slice(0, TOP_ACTIVE)
  const max = Math.max(...shown.map((r) => Math.abs(r.diff)), 0.1)

  return (
    <Card
      title="הקרן מול מדד ת״א-125"
      subtitle="הפער בנקודות אחוז בין משקל הענף בקרן (מתוך המניות המפורטות) לבין משקלו במדד."
    >
      <div className="mb-2 grid grid-cols-[7.5rem_1fr_3.25rem] gap-3 px-2 text-xs text-slate-500 sm:grid-cols-[9.5rem_1fr_3.5rem]">
        <span />
        <span className="grid grid-cols-2">
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 rounded-sm ${UNDER}`} />
            משקל חסר
          </span>
          <span className="flex items-center justify-end gap-1">
            עודף משקל
            <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 rounded-sm ${OVER}`} />
          </span>
        </span>
        <span />
      </div>
      <ul className="space-y-1">
        {shown.map((r) => {
          const width = `${(Math.abs(r.diff) / max) * 100}%`
          return (
            <li
              key={r.sector}
              title={`${r.sector}: בקרן ${r.fund.toFixed(1)}% · במדד ${r.index.toFixed(1)}%`}
              className="grid grid-cols-[7.5rem_1fr_3.25rem] items-center gap-3 rounded-md px-2 py-1 hover:bg-slate-50 sm:grid-cols-[9.5rem_1fr_3.5rem]"
            >
              <span className="truncate text-sm text-slate-800">{r.sector}</span>
              <span aria-hidden="true" className="relative grid h-3.5 grid-cols-2">
                {/* Underweight grows from the centre toward the start (right in RTL). */}
                <span className="flex justify-end border-e border-slate-400">
                  {r.diff < 0 && <span className={`h-full rounded-s ${UNDER}`} style={{ width }} />}
                </span>
                <span className="flex justify-start">
                  {r.diff > 0 && <span className={`h-full rounded-e ${OVER}`} style={{ width }} />}
                </span>
              </span>
              <span className="text-sm font-medium text-slate-800">
                <Points value={r.diff} />
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        מוצגים {shown.length} הענפים עם הפער הגדול ביותר. משקלי המדד משוערים על פי אחזקות קרן מחקה.
      </p>
    </Card>
  )
}

type SortKey = 'security_name' | 'sector' | 'weight_pct'

function HoldingsTable({
  holdings,
  sector,
  onClearSector,
  showIndexBadge,
}: {
  holdings: Holding[]
  sector: string | null
  onClearSector: () => void
  showIndexBadge: boolean
}) {
  const [sortKey, setSortKey] = useState<SortKey>('weight_pct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    const list = sector ? holdings.filter((h) => h.sector === sector) : holdings
    const dir = sortDir === 'asc' ? 1 : -1
    return [...list].sort((a, b) =>
      sortKey === 'weight_pct'
        ? (a.weight_pct - b.weight_pct) * dir
        : a[sortKey].localeCompare(b[sortKey], 'he') * dir,
    )
  }, [holdings, sector, sortKey, sortDir])

  const rows = showAll || sector ? filtered : filtered.slice(0, TABLE_PREVIEW)
  const max = Math.max(...holdings.map((h) => h.weight_pct))

  function sortBy(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'weight_pct' ? 'desc' : 'asc')
    }
  }

  const header = (key: SortKey, label: string, className = '') => (
    <th
      scope="col"
      aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-3 py-2.5 font-medium ${className}`}
    >
      <button type="button" onClick={() => sortBy(key)} className="inline-flex items-center gap-1 hover:text-slate-900">
        {label}
        {sortKey === key && <ChevronIcon direction={sortDir === 'asc' ? 'up' : 'down'} className="h-3 w-3" />}
      </button>
    </th>
  )

  return (
    <section aria-labelledby="holdings-heading" className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <h2 id="holdings-heading" className="text-lg font-semibold text-slate-900">
          החזקות הקרן
        </h2>
        {sector && (
          <button
            type="button"
            onClick={onClearSector}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            ענף: {sector}
            <span aria-hidden="true">×</span>
            <span className="sr-only">(נקה סינון)</span>
          </button>
        )}
      </div>

      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">החזקות הקרן, ממוינות לפי {sortKey === 'weight_pct' ? 'משקל' : sortKey === 'sector' ? 'ענף' : 'שם'}</caption>
        <thead className="border-y border-slate-200 bg-slate-50 text-start text-xs text-slate-600">
          <tr>
            {header('security_name', 'נייר', 'text-start')}
            {header('sector', 'ענף', 'hidden text-start sm:table-cell')}
            {header('weight_pct', 'אחוז מהקרן', 'text-end')}
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.security_number} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-3 py-2">
                <span className="font-medium text-slate-900">{h.security_name}</span>
                {showIndexBadge && !h.inIndex && (
                  <span className="ms-2 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                    לא במדד
                  </span>
                )}
                <span className="mt-0.5 block text-xs text-slate-500">
                  <span className="sm:hidden">{h.sector} · </span>
                  <bdi dir="ltr">{h.security_number}</bdi>
                </span>
              </td>
              <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">{h.sector}</td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-2">
                  <span aria-hidden="true" className="hidden h-1.5 w-16 rounded-full bg-slate-100 sm:block">
                    <span
                      className="block h-full rounded-full bg-indigo-500"
                      style={{ width: `${(h.weight_pct / max) * 100}%` }}
                    />
                  </span>
                  <span className="w-14 text-end font-medium text-slate-800">
                    <Pct value={h.weight_pct} digits={2} />
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!sector && filtered.length > TABLE_PREVIEW && (
        <div className="border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-sm font-medium text-indigo-700 hover:underline"
          >
            {showAll ? `הצג את ${TABLE_PREVIEW} הגדולות` : `הצג את כל ${filtered.length} ההחזקות`}
          </button>
        </div>
      )}
    </section>
  )
}
