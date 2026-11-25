import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Indicator, IndicatorCountry, IndicatorsResponse, IndicatorYearlySeries, YearlyPoint } from '../types'
import { LoadingState, ErrorState } from '../components/StatusMessage'
import { CloseIcon, TrendIcon } from '../components/icons'

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
const axisMonthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' })

function formatAsOf(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed)
}

// "Oct '13" rather than "Oct 13" -- the latter reads as a day-of-month, not a year.
function formatAxisTick(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return `${axisMonthFormatter.format(parsed)} '${String(parsed.getFullYear()).slice(-2)}`
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: { date: string; value: number } }[] }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] shadow-md">
      <div className="font-medium text-slate-700">{formatAsOf(point.date)}</div>
      <div className="text-slate-500">{point.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
    </div>
  )
}

function IndicatorLineChart({ points, trend }: { points: Indicator['sparkline']; trend: 'up' | 'down' | 'flat' }) {
  if (points.length < 2) return <div className="h-28" />
  const color = trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#94a3b8'
  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisTick}
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            dot={false}
            strokeWidth={1.75}
            isAnimationActive={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function IndicatorCard({ indicator, onClick }: { indicator: Indicator; onClick: () => void }) {
  const trend: 'up' | 'down' | 'flat' =
    indicator.change == null || indicator.change === 0 ? 'flat' : indicator.change > 0 ? 'up' : 'down'
  const changeColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{indicator.label}</p>
        {indicator.previous != null && (
          <span className={`shrink-0 ${changeColor}`}>
            <TrendIcon direction={trend} />
          </span>
        )}
      </div>
      <p className="text-xl font-semibold text-slate-900">{indicator.display_value}</p>
      <IndicatorLineChart points={indicator.sparkline} trend={trend} />
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>As of {formatAsOf(indicator.as_of)}</span>
        {indicator.display_previous && <span>Prev: {indicator.display_previous}</span>}
      </div>
    </div>
  )
}

function YearlyChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: YearlyPoint }[] }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-slate-700">{point.year}</div>
      <div className="text-slate-500">{point.display_value}</div>
    </div>
  )
}

function YearlyIndicatorModal({
  country,
  indicator,
  onClose,
}: {
  country: IndicatorCountry
  indicator: Indicator
  onClose: () => void
}) {
  const [points, setPoints] = useState<YearlyPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`/data/indicators/${country}/${indicator.key}-yearly.json`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then((data: IndicatorYearlySeries) => setPoints(data.points))
      .catch(() => setError('Could not load yearly history right now. Try again in a moment.'))
      .finally(() => setLoading(false))
  }, [country, indicator.key])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{indicator.label}</h3>
            <p className="text-xs text-slate-500">{indicator.category} · Yearly history · Source: {indicator.source}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {loading && <LoadingState message="Loading yearly history…" />}
        {error && <ErrorState message={error} />}

        {!loading && !error && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                  tickFormatter={(value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                />
                <Tooltip content={<YearlyChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

const COUNTRY_LABEL: Record<IndicatorCountry, string> = {
  us: 'United States',
  israel: 'Israel',
  germany: 'Germany',
}

export default function IndicatorsPage() {
  const { country } = useParams<{ country: string }>()
  const resolvedCountry: IndicatorCountry =
    country === 'israel' ? 'israel' : country === 'germany' ? 'germany' : 'us'

  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Indicator | null>(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`/data/indicators/${resolvedCountry}.json`)
      .then((r) => r.json())
      .then((data: IndicatorsResponse) => setIndicators(data.indicators))
      .catch(() => setError('Could not load indicators right now. Try again in a moment.'))
      .finally(() => setLoading(false))
  }, [resolvedCountry])

  const categories: string[] = []
  const byCategory = new Map<string, Indicator[]>()
  for (const indicator of indicators) {
    if (!byCategory.has(indicator.category)) {
      byCategory.set(indicator.category, [])
      categories.push(indicator.category)
    }
    byCategory.get(indicator.category)!.push(indicator)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">{COUNTRY_LABEL[resolvedCountry]} Economic Indicators</h1>
      <p className="mb-6 text-sm text-slate-500">
        Key macroeconomic data for {COUNTRY_LABEL[resolvedCountry]}, a snapshot taken from the Federal Reserve's FRED
        database when this site was last built. Each card shows the latest value, the prior reading, and the trend
        over recent periods.
      </p>

      {loading && <LoadingState message="Loading indicators…" />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="flex flex-col gap-8">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">{category}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {byCategory.get(category)!.map((indicator) => (
                  <IndicatorCard key={indicator.key} indicator={indicator} onClick={() => setSelected(indicator)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected && (
        <YearlyIndicatorModal country={resolvedCountry} indicator={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
