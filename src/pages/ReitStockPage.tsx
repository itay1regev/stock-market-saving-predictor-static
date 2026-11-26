import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReitStockDetail, ReitYear } from '../types'
import { LoadingState, ErrorState } from '../components/StatusMessage'
import StatCard from '../components/StatCard'
import DataDisclaimer from '../components/DataDisclaimer'

function midpoint(range: ReitYear['noi']): number | null {
  if (range.value != null) return range.value
  if (range.low != null && range.high != null) return (range.low + range.high) / 2
  return null
}

function fmtMillions(v: number | null): string {
  return v != null ? `₪${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}M` : '—'
}

function fmtMultiple(v: number | null): string {
  return v != null ? `${v.toFixed(2)}x` : '—'
}

export default function ReitStockPage() {
  const { securityId } = useParams<{ securityId: string }>()
  const [data, setData] = useState<ReitStockDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!securityId) return
    setLoading(true)
    setError('')
    fetch(`${import.meta.env.BASE_URL}data/reit-stocks/${securityId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(setData)
      .catch(() => setError('Could not load REIT data right now. Try again in a moment.'))
      .finally(() => setLoading(false))
  }, [securityId])

  if (loading) return <LoadingState message="Loading REIT data…" />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const actualYears = data.years.filter((y) => y.status === 'actual')
  const latest = actualYears[actualYears.length - 1]
  const prev = actualYears[actualYears.length - 2]
  const noiGrowthPct =
    latest && prev && latest.noi.value != null && prev.noi.value != null
      ? ((latest.noi.value / prev.noi.value - 1) * 100).toFixed(1)
      : null

  const chartData = data.years.map((y) => ({
    year: y.status === 'actual' ? String(y.year) : `${y.year}E`,
    NOI: midpoint(y.noi),
    FFO: midpoint(y.ffo),
  }))

  const navChartData = data.years
    .filter((y) => y.nav != null || y.market_cap != null)
    .map((y) => ({ year: String(y.year), NAV: y.nav, 'שווי שוק': y.market_cap }))

  const missingNavYears = data.years.filter((y) => y.status === 'actual' && y.nav == null).map((y) => y.year)
  const forecastYears = data.years.filter((y) => y.status !== 'actual').map((y) => y.year)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900" dir="rtl">
          {data.company.name} <span className="text-base font-normal text-slate-400">(קרן ריט)</span>
        </h1>
        <Link
          to={`/companies-by-weight/company/${data.security_id}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          לדוחות הכספיים המלאים ולמכפילים ההיסטוריים ←
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-500" dir="rtl">
        מקור נתוני NOI/FFO/NAV: {data.source.title} מיום {data.source.publish_date} (
        <a href={data.source.pdf_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
          PDF
        </a>
        )
      </p>

      {/* KPI strip -- the headline numbers for a prospective REIT investor */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={`מכפיל NAV (${latest?.year ?? ''})`}
          value={fmtMultiple(latest?.p_nav ?? null)}
          sub="שווי שוק חלקי שווי נכסים נטו"
        />
        <StatCard
          label={`מכפיל FFO (${latest?.year ?? ''})`}
          value={fmtMultiple(latest?.p_ffo ?? null)}
          sub="שווי שוק חלקי FFO ריאלי"
        />
        <StatCard
          label={`NOI (${latest?.year ?? ''})`}
          value={fmtMillions(latest?.noi.value ?? null)}
          sub={noiGrowthPct ? `${Number(noiGrowthPct) > 0 ? '+' : ''}${noiGrowthPct}% לעומת ${prev?.year}` : undefined}
        />
      </div>
      {latest && (
        <p className="mb-8 text-sm text-slate-600" dir="rtl">
          החברה נסחרת כיום קרוב מאוד לשווי הנכסים הנקי שלה (מכפיל NAV ≈ {fmtMultiple(latest.p_nav)}) ובכ-
          {fmtMultiple(latest.p_ffo)} על ה-FFO הריאלי שלה.
        </p>
      )}

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900" dir="rtl">
            צמיחת NOI ו-FFO (מיליוני ש"ח)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `₪${Number(v).toFixed(0)}M`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="NOI" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              <Bar dataKey="FFO" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-slate-400" dir="rtl">
            2026-2027 הם אומדני/תחזיות החברה (טווח, מוצג כערך אמצע), לא נתונים בפועל.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900" dir="rtl">
            NAV מול שווי שוק (מיליוני ש"ח)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={navChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `₪${Number(v).toFixed(0)}M`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="NAV" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="שווי שוק" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-slate-400" dir="rtl">
            NAV זמין רק החל מ-2021 (מגבלת נתוני מאזן); כאשר הקו הכחול (שווי שוק) מעל הירוק (NAV), המניה נסחרת
            בפרמיה על שווי הנכסים.
          </p>
        </div>
      </div>

      {/* By-year table */}
      <div className="mb-8 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm" dir="rtl">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">שנה</th>
              <th className="px-4 py-3">NOI</th>
              <th className="px-4 py-3">FFO ריאלי</th>
              <th className="px-4 py-3">FFO למניה (אג')</th>
              <th className="px-4 py-3">שווי שוק</th>
              <th className="px-4 py-3">GAV (שווי נכסים)</th>
              <th className="px-4 py-3">חוב נטו</th>
              <th className="px-4 py-3">NAV</th>
              <th className="px-4 py-3">מכפיל NAV</th>
              <th className="px-4 py-3">מכפיל FFO</th>
              <th className="px-4 py-3">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {data.years.map((y) => (
              <tr key={y.year} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{y.year}</td>
                <td className="px-4 py-3 text-slate-700" dir="ltr">{y.noi.display}</td>
                <td className="px-4 py-3 text-slate-700" dir="ltr">{y.ffo.display}</td>
                <td className="px-4 py-3 text-slate-700" dir="ltr">{y.ffo_per_share.display}</td>
                <td className="px-4 py-3 text-slate-700" dir="ltr">{fmtMillions(y.market_cap)}</td>
                <td className="px-4 py-3 text-slate-700" dir="ltr">{fmtMillions(y.gav)}</td>
                <td className="px-4 py-3 text-slate-700" dir="ltr">{fmtMillions(y.net_debt)}</td>
                <td className="px-4 py-3 text-slate-700" dir="ltr">{fmtMillions(y.nav)}</td>
                <td className="px-4 py-3 text-slate-700" dir="ltr">{fmtMultiple(y.p_nav)}</td>
                <td className="px-4 py-3 text-slate-700" dir="ltr">{fmtMultiple(y.p_ffo)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{y.status_label}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400" dir="rtl">
          {missingNavYears.length > 0 &&
            `NAV ומכפיל NAV אינם זמינים עבור ${missingNavYears[0]}-${missingNavYears[missingNavYears.length - 1]} (מגבלת נתוני מאזן היסטוריים). `}
          {forecastYears.length > 0 &&
            `${forecastYears[0]}${forecastYears.length > 1 ? `-${forecastYears[forecastYears.length - 1]}` : ''} ${forecastYears.length > 1 ? 'הם' : 'הוא'} תחזית/אומדן החברה בלבד — טרם קיים שווי שוק בפועל עבור${forecastYears.length > 1 ? 'ם' : 'ו'}.`}
        </p>
      </div>

      {/* General company info -- everything else the app tracks for this stock */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" dir="rtl">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">פרטי החברה</h2>
        <dl className="mb-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">ענף</dt>
            <dd className="font-medium text-slate-900">{data.detail.industry ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">שנת יסוד</dt>
            <dd className="font-medium text-slate-900">{data.detail.founded_year ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">משקל במדד TA-125</dt>
            <dd className="font-medium text-slate-900">{data.company.display_weight_pct}</dd>
          </div>
          <div>
            <dt className="text-slate-500">מכפיל רווח (P/E) נוכחי</dt>
            <dd className="font-medium text-slate-900">{data.company.display_pe}</dd>
          </div>
          <div>
            <dt className="text-slate-500">מכפיל הון (P/B) נוכחי</dt>
            <dd className="font-medium text-slate-900">{data.company.display_pb}</dd>
          </div>
          <div>
            <dt className="text-slate-500">תשואה על ההון (ROE) נוכחי</dt>
            <dd className="font-medium text-slate-900">{data.company.display_roe_pct}</dd>
          </div>
        </dl>
        {data.detail.description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{data.detail.description}</p>
        )}
      </div>
      <DataDisclaimer source="company reports filed on TASE MAYA, bizportal.co.il" />
    </div>
  )
}
