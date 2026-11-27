import { useState } from 'react'
import type { UsIndexCompany } from '../types'
import { ChevronIcon } from './icons'

type SortKey = 'rank' | 'weight_pct' | 'price' | 'change_pct' | 'market_cap'

interface Column {
  key: SortKey
  label: string
  title?: string
  getValue: (c: UsIndexCompany) => number | null
  getDisplay: (c: UsIndexCompany) => string
  className?: (c: UsIndexCompany) => string
}

const COLUMNS: Column[] = [
  {
    key: 'weight_pct',
    label: 'Index weight',
    getValue: (c) => c.weight_pct,
    getDisplay: (c) => c.display_weight_pct,
    className: () => 'font-medium text-slate-900',
  },
  { key: 'price', label: 'Price', getValue: (c) => c.price, getDisplay: (c) => c.display_price },
  {
    key: 'change_pct',
    label: 'Day',
    getValue: (c) => c.change_pct,
    getDisplay: (c) => c.display_change_pct,
    className: (c) =>
      c.change_pct == null || c.change_pct === 0
        ? 'text-slate-500'
        : c.change_pct > 0
          ? 'text-emerald-700'
          : 'text-red-700',
  },
  { key: 'market_cap', label: 'Market cap', getValue: (c) => c.market_cap, getDisplay: (c) => c.display_market_cap },
]

export default function UsCompanyTable({ companies }: { companies: UsIndexCompany[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('weight_pct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [query, setQuery] = useState('')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'rank' ? 'asc' : 'desc')
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? companies.filter((c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    : companies

  const getValue = sortKey === 'rank' ? (c: UsIndexCompany) => c.rank : COLUMNS.find((c) => c.key === sortKey)!.getValue
  const rows = [...filtered].sort((a, b) => {
    const av = getValue(a)
    const bv = getValue(b)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const sortHeader = (key: SortKey, label: string, title?: string, align = 'text-right') => (
    <th
      key={key}
      scope="col"
      aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`whitespace-nowrap px-4 py-3 ${align}`}
    >
      <button
        type="button"
        title={title}
        onClick={() => handleSort(key)}
        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-700"
      >
        {label}
        {sortKey === key && <ChevronIcon direction={sortDir === 'asc' ? 'up' : 'down'} className="h-3 w-3" />}
      </button>
    </th>
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="company-search" className="font-medium text-slate-600">
          Search
        </label>
        <input
          id="company-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Company or symbol"
          className="w-56 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none"
        />
        <span className="text-slate-500">
          {rows.length} {rows.length === 1 ? 'company' : 'companies'}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500">
              {sortHeader('rank', '#', 'Rank by index weight', 'text-left')}
              <th scope="col" className="px-4 py-3 uppercase tracking-wide">
                Company
              </th>
              {COLUMNS.map((col) => sortHeader(col.key, col.label, col.title))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.symbol} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 tabular-nums text-slate-500">{c.rank}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-slate-900">{c.name}</span>
                  <span className="ms-2 font-mono text-xs text-slate-500">{c.symbol}</span>
                </td>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-right tabular-nums ${col.className?.(c) ?? 'text-slate-700'}`}
                  >
                    {col.getDisplay(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
