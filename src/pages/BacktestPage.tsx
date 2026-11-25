import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { BacktestResult } from '../types'
import { ErrorState, LoadingState } from '../components/StatusMessage'
import StatCard from '../components/StatCard'

type Scenario = BacktestResult & { scenario_id: string; scenario_label: string }
type ScenarioMap = Record<string, Scenario>

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const currencyPrecise = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const percent = (v: number) => `${(v * 100).toFixed(2)}%`

export default function BacktestPage() {
  const [scenarios, setScenarios] = useState<ScenarioMap | null>(null)
  const [scenarioId, setScenarioId] = useState<string>('sp500__combo')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/data/backtest-scenarios.json')
      .then((r) => {
        if (!r.ok) throw new Error('Could not load backtest scenarios.')
        return r.json()
      })
      .then((data: ScenarioMap) => setScenarios(data))
      .catch(() => setError('Could not load backtest scenarios right now.'))
      .finally(() => setLoading(false))
  }, [])

  const result = scenarios?.[scenarioId] ?? null

  const chartData =
    result?.growth_chart.map((p) => ({
      date: p.date,
      Balance: Math.round(p.balance),
      Contributed: Math.round(p.contributed),
    })) ?? []

  const annualData =
    result?.annual_returns.map((y) => ({
      year: y.year,
      returnPct: y.return_pct * 100,
    })) ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Backtest a Portfolio</h1>
      <p className="mb-6 text-sm text-slate-500">
        This static build ships a fixed set of pre-calculated scenarios (computed from real historical prices at
        build time) instead of running a live backtest -- pick one below to see how it would have actually
        performed, including recurring contributions, volatility, drawdowns, and year-by-year returns.
      </p>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Scenario
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : (
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {Object.values(scenarios ?? {}).map((s) => (
                <option key={s.scenario_id} value={s.scenario_id}>
                  {s.scenario_label}
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      {result && (
        <div className="mt-6 flex flex-col gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Results for <span className="font-semibold text-slate-900">{result.scenario_label}</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {result.start_date} &rarr; {result.end_date}
            </p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">End balance</p>
            <p className="mt-1 text-3xl font-bold text-indigo-600">{currency.format(result.end_balance)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Start balance" value={currency.format(result.start_balance)} />
            <StatCard label="Total contributed" value={currency.format(result.total_contributed)} />
            <StatCard label="Total gain" value={currency.format(result.total_gain)} />
            <StatCard label="CAGR" value={percent(result.cagr)} sub={`Price return, ${result.asset_label}`} />
            <StatCard label="Annualized volatility" value={percent(result.annualized_stdev)} />
            <StatCard label="Sharpe ratio" value={result.sharpe_ratio != null ? result.sharpe_ratio.toFixed(2) : 'N/A'} sub="0% risk-free rate assumed" />
            <StatCard label="Sortino ratio" value={result.sortino_ratio != null ? result.sortino_ratio.toFixed(2) : 'N/A'} />
            <StatCard label="Max drawdown" value={percent(result.max_drawdown_pct)} sub="Monthly-resolution" />
            <StatCard
              label="Best year"
              value={result.best_year ? `${result.best_year.year}: ${percent(result.best_year.return_pct)}` : 'N/A'}
            />
            <StatCard
              label="Worst year"
              value={result.worst_year ? `${result.worst_year.year}: ${percent(result.worst_year.return_pct)}` : 'N/A'}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Portfolio growth</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
                <YAxis tickFormatter={(v) => currency.format(v)} width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => currencyPrecise.format(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="Balance" stroke="#4f46e5" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="Contributed" stroke="#94a3b8" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Annual returns</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={annualData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                <Bar dataKey="returnPct">
                  {annualData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.returnPct >= 0 ? '#16a34a' : '#dc2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Annual returns detail</h2>
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="py-2 pr-4">Year</th>
                  <th className="py-2 pr-4">Return</th>
                  <th className="py-2">Ending balance</th>
                </tr>
              </thead>
              <tbody>
                {result.annual_returns.map((y) => (
                  <tr key={y.year} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 pr-4 text-slate-900">{y.year}</td>
                    <td className={`py-2 pr-4 font-medium ${y.return_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {percent(y.return_pct)}
                    </td>
                    <td className="py-2 text-slate-900">{currency.format(y.ending_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Worst drawdowns</h2>
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="py-2 pr-4">Peak</th>
                  <th className="py-2 pr-4">Trough</th>
                  <th className="py-2 pr-4">Recovery</th>
                  <th className="py-2 pr-4">Depth</th>
                  <th className="py-2">Length (days)</th>
                </tr>
              </thead>
              <tbody>
                {result.drawdowns.map((d, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 pr-4 text-slate-900">{d.peak_date}</td>
                    <td className="py-2 pr-4 text-slate-900">{d.trough_date}</td>
                    <td className="py-2 pr-4 text-slate-900">{d.recovery_date ?? 'Ongoing'}</td>
                    <td className="py-2 pr-4 font-medium text-red-600">{percent(d.depth_pct)}</td>
                    <td className="py-2 text-slate-900">{d.length_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Trailing returns (annualized)</h2>
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  {result.trailing_returns.map((t) => (
                    <th key={t.label} className="py-2 pr-4">
                      {t.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {result.trailing_returns.map((t) => (
                    <td key={t.label} className="py-2 pr-4 text-slate-900">
                      {t.annualized_return_pct != null ? percent(t.annualized_return_pct) : 'N/A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400">
            Results are hypothetical, based on historical {result.asset_label} prices as of this site's last build,
            and do not account for fees, taxes, or trading costs. Past performance does not guarantee future
            results.
          </p>
        </div>
      )}
    </div>
  )
}
