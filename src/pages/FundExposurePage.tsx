import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { FundHolding, FundHoldingsResponse } from '../types'
import { LoadingState, ErrorState } from '../components/StatusMessage'
import { ChevronIcon } from '../components/icons'

type FundKey = 'mor-israel-ta125' | 'yalin-lapidot-ta125-value'

const FUND_CONFIG: Record<FundKey, { title: string; description: string; dataUrl: string }> = {
  'mor-israel-ta125': {
    title: 'MOR ISRAEL TA-125',
    description:
      'Equity holdings of the MOR Israel TA-125 tracking fund (TASE fund number 5119466), ranked by % of fund. Click a column header to sort. Snapshot from funder.co.il\'s fund composition ("הרכב הקרן") taken when this site was last built -- not a live feed.',
    dataUrl: '/data/fund-exposure/mor-israel-ta125.json',
  },
  'yalin-lapidot-ta125-value': {
    title: 'Yalin Lapidot TA 125 Value',
    description:
      'Equity holdings of the Yelin Lapidot TA-125 Value tracking fund (TASE fund number 5128368), ranked by % of fund. Click a column header to sort. Snapshot from funder.co.il\'s fund composition ("הרכב הקרן") taken when this site was last built -- not a live feed.',
    dataUrl: '/data/fund-exposure/yalin-lapidot-ta125-value.json',
  },
}

type SortKey = 'weight_pct'

const PIE_COLORS = [
  '#4f46e5', '#0ea5e9', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed',
  '#db2777', '#0d9488', '#65a30d', '#d97706', '#2563eb', '#c026d3',
  '#059669', '#e11d48', '#9333ea', '#0891b2', '#ca8a04', '#4338ca',
  '#be123c', '#15803d',
]

export default function FundExposurePage() {
  const { fund } = useParams<{ fund: string }>()
  const config = FUND_CONFIG[fund as FundKey] ?? FUND_CONFIG['mor-israel-ta125']

  const [holdings, setHoldings] = useState<FundHolding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>('weight_pct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(config.dataUrl)
      .then((r) => r.json())
      .then((data: FundHoldingsResponse) => setHoldings(data.holdings))
      .catch(() => setError('Could not load fund holdings right now. Try again in a moment.'))
      .finally(() => setLoading(false))
  }, [config])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const rows = sortKey
    ? [...holdings].sort((a, b) => (sortDir === 'asc' ? a.weight_pct - b.weight_pct : b.weight_pct - a.weight_pct))
    : holdings

  const sectorBreakdown = useMemo(() => {
    const totals = new Map<string, number>()
    for (const h of holdings) {
      totals.set(h.sector, (totals.get(h.sector) ?? 0) + h.weight_pct)
    }
    return [...totals.entries()]
      .map(([sector, weight_pct]) => ({ sector, weight_pct }))
      .sort((a, b) => b.weight_pct - a.weight_pct)
  }, [holdings])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">{config.title}</h1>
      <p className="mb-6 text-sm text-slate-500">{config.description}</p>

      {loading && <LoadingState message="Loading fund holdings…" />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900" dir="rtl">
              חשיפת הקרן לפי ענף
            </h2>
            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <Pie
                  data={sectorBreakdown}
                  dataKey="weight_pct"
                  nameKey="sector"
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  label={({ name, value }) => `${name} (${Number(value).toFixed(1)}%)`}
                >
                  {sectorBreakdown.map((entry, idx) => (
                    <Cell key={entry.sector} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm" dir="rtl">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">נייר</th>
                  <th className="px-4 py-3">ענף</th>
                  <th
                    onClick={() => handleSort('weight_pct')}
                    className="cursor-pointer select-none px-4 py-3 text-right hover:text-slate-700"
                  >
                    אחוז מהקרן
                    {sortKey === 'weight_pct' && (
                      <ChevronIcon direction={sortDir === 'asc' ? 'up' : 'down'} className="mr-1 inline h-3 w-3" />
                    )}
                  </th>
                  <th className="px-4 py-3">מספר נייר/טיקר</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h, i) => (
                  <tr key={`${h.security_number}-${i}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{h.security_name}</td>
                    <td className="px-4 py-3 text-slate-500">{h.sector}</td>
                    <td className="px-4 py-3 text-right text-slate-700" dir="ltr">{h.display_weight_pct}</td>
                    <td className="px-4 py-3 text-right text-slate-700" dir="ltr">{h.display_security_ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
