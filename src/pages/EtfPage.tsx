import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Etf, EtfsResponse } from '../types'
import { LoadingState, ErrorState } from '../components/StatusMessage'
import { ChevronIcon } from '../components/icons'
import DataDisclaimer from '../components/DataDisclaimer'

type EtfIndex =
  | 'sp500'
  | 'msci-world'
  | 'nasdaq100'
  | 'bond'
  | 'israel-sp500'
  | 'israel-nasdaq100'
  | 'israel-msci-world'
  | 'israel-ta125'
  | 'ishares-tase'
  | 'sector-exposure'

type SortKey = 'price' | 'change_pct' | 'aum' | 'expense_ratio' | 'avg_volume' | 'ytd_return_pct' | 'dividend_yield_pct'

const INDEX_CONFIG: Record<
  EtfIndex,
  { title: string; source: string; dataUrl: string; hideColumns?: SortKey[] }
> = {
  sp500: {
    title: 'S&P 500 ETFs',
    source: 'Yahoo Finance',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/sp500.json',
  },
  'msci-world': {
    title: 'MSCI World ETFs',
    source: 'Yahoo Finance',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/msci-world.json',
  },
  nasdaq100: {
    title: 'Nasdaq 100 ETFs',
    source: 'Yahoo Finance',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/nasdaq100.json',
  },
  bond: {
    title: 'Bond ETFs',
    source: 'Yahoo Finance',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/bond.json',
  },
  'israel-sp500': {
    title: 'S&P 500 ETF - Israel',
    source: 'funder.co.il',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/israel-sp500.json',
  },
  'israel-nasdaq100': {
    title: 'Nasdaq 100 ETF - Israel',
    source: 'funder.co.il',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/israel-nasdaq100.json',
  },
  'israel-msci-world': {
    title: 'MSCI World - TASE (Israel)',
    source: 'funder.co.il',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/israel-msci-world.json',
  },
  'israel-ta125': {
    title: 'TA 125 - TASE (Israel)',
    source: 'funder.co.il',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/israel-ta125.json',
  },
  'ishares-tase': {
    title: 'Ishares - TASE (Israel)',
    source: 'funder.co.il',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/ishares-tase.json',
    hideColumns: ['ytd_return_pct'],
  },
  'sector-exposure': {
    title: 'Sector Exposure',
    source: 'funder.co.il',
    dataUrl: import.meta.env.BASE_URL + 'data/etfs/sector-exposure.json',
  },
}

interface Column {
  key: SortKey
  label: string
  align: 'right'
  getValue: (etf: Etf) => number | null
  getDisplay: (etf: Etf) => string
}

const COLUMNS: Column[] = [
  { key: 'price', label: 'Price', align: 'right', getValue: (e) => e.price, getDisplay: (e) => e.display_price },
  {
    key: 'change_pct',
    label: 'Change',
    align: 'right',
    getValue: (e) => e.change_pct,
    getDisplay: (e) => e.display_change_pct,
  },
  { key: 'aum', label: 'AUM', align: 'right', getValue: (e) => e.aum, getDisplay: (e) => e.display_aum },
  {
    key: 'expense_ratio',
    label: 'Expense Ratio',
    align: 'right',
    getValue: (e) => e.expense_ratio,
    getDisplay: (e) => e.display_expense_ratio,
  },
  {
    key: 'avg_volume',
    label: 'Avg Volume',
    align: 'right',
    getValue: (e) => e.avg_volume,
    getDisplay: (e) => e.display_avg_volume,
  },
  {
    key: 'ytd_return_pct',
    label: 'YTD Return',
    align: 'right',
    getValue: (e) => e.ytd_return_pct,
    getDisplay: (e) => e.display_ytd_return_pct,
  },
  {
    key: 'dividend_yield_pct',
    label: 'Dividend Yield',
    align: 'right',
    getValue: (e) => e.dividend_yield_pct,
    getDisplay: (e) => e.display_dividend_yield_pct,
  },
]

export default function EtfPage() {
  const { index } = useParams<{ index: string }>()
  const config = INDEX_CONFIG[index as EtfIndex] ?? INDEX_CONFIG.sp500

  const [etfs, setEtfs] = useState<Etf[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(config.dataUrl)
      .then((r) => r.json())
      .then((data: EtfsResponse) => setEtfs(data.etfs))
      .catch(() => setError('Could not load ETF data right now. Try again in a moment.'))
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

  const visibleColumns = COLUMNS.filter((c) => !config.hideColumns?.includes(c.key))
  const column = visibleColumns.find((c) => c.key === sortKey)
  const rows = column
    ? [...etfs].sort((a, b) => {
        const av = column.getValue(a)
        const bv = column.getValue(b)
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        return sortDir === 'asc' ? av - bv : bv - av
      })
    : etfs

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{config.title}</h1>

      {loading && <LoadingState message="Loading ETF data…" />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Issuer</th>
                <th className="px-4 py-3">Sector (ענף)</th>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer select-none px-4 py-3 text-right hover:text-slate-700"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <ChevronIcon direction={sortDir === 'asc' ? 'up' : 'down'} className="ml-1 inline h-3 w-3" />
                    )}
                  </th>
                ))}
                <th className="px-4 py-3">Dividend Treatment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((etf) => {
                const changeColor =
                  etf.change_pct > 0 ? 'text-emerald-600' : etf.change_pct < 0 ? 'text-red-600' : 'text-slate-400'
                return (
                  <tr key={etf.symbol} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{etf.symbol}</td>
                    <td className="px-4 py-3 text-slate-700">{etf.name}</td>
                    <td className="px-4 py-3 text-slate-500">{etf.issuer}</td>
                    <td className="px-4 py-3 text-slate-500">{etf.category}</td>
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-right ${col.key === 'change_pct' ? `font-medium ${changeColor}` : 'text-slate-700'}`}
                      >
                        {col.getDisplay(etf)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-slate-700">{etf.dividend_treatment}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <DataDisclaimer source={config.source} />
    </div>
  )
}
