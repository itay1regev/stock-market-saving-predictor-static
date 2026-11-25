import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Company } from '../types'
import { ChevronIcon } from './icons'

type SortKey = 'weight_pct' | 'pe' | 'pb' | 'roe_pct'

interface Column {
  key: SortKey
  label: string
  getValue: (c: Company) => number | null
  getDisplay: (c: Company) => string
}

const COLUMNS: Column[] = [
  { key: 'weight_pct', label: 'משקל במדד', getValue: (c) => c.weight_pct, getDisplay: (c) => c.display_weight_pct },
  { key: 'pe', label: 'מכפיל רווח (P/E)', getValue: (c) => c.pe, getDisplay: (c) => c.display_pe },
  { key: 'pb', label: 'מכפיל הון (P/B)', getValue: (c) => c.pb, getDisplay: (c) => c.display_pb },
  { key: 'roe_pct', label: 'תשואה על ההון (ROE)', getValue: (c) => c.roe_pct, getDisplay: (c) => c.display_roe_pct },
]

interface Props {
  companies: Company[]
  showIndustryFilter?: boolean
  companyHref?: (company: Company) => string
}

export default function CompanyTable({
  companies,
  showIndustryFilter = true,
  companyHref = (c) => `/companies-by-weight/company/${c.security_id}`,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>('weight_pct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [industryFilter, setIndustryFilter] = useState<string>('all')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const industries = Array.from(new Set(companies.map((c) => c.industry).filter((i): i is string => Boolean(i)))).sort(
    (a, b) => a.localeCompare(b, 'he'),
  )

  const filteredCompanies =
    !showIndustryFilter || industryFilter === 'all' ? companies : companies.filter((c) => c.industry === industryFilter)

  const column = COLUMNS.find((c) => c.key === sortKey)
  const rows = column
    ? [...filteredCompanies].sort((a, b) => {
        const av = column.getValue(a)
        const bv = column.getValue(b)
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        return sortDir === 'asc' ? av - bv : bv - av
      })
    : filteredCompanies

  return (
    <>
      {showIndustryFilter && (
        <div className="mb-4 flex items-center gap-2 text-sm" dir="rtl">
          <label htmlFor="industry-filter" className="font-medium text-slate-600">
            סנן לפי ענף
          </label>
          <select
            id="industry-filter"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="all">כל הענפים</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          {industryFilter !== 'all' && (
            <span className="text-slate-400">
              {rows.length} {rows.length === 1 ? 'חברה' : 'חברות'}
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm" dir="rtl">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">שם החברה</th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none px-4 py-3 text-right hover:text-slate-700"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <ChevronIcon direction={sortDir === 'asc' ? 'up' : 'down'} className="mr-1 inline h-3 w-3" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.security_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  <Link to={companyHref(c)} className="hover:text-indigo-600 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right text-slate-700" dir="ltr">{c.display_weight_pct}</td>
                <td className="px-4 py-3 text-right text-slate-700" dir="ltr">{c.display_pe}</td>
                <td className="px-4 py-3 text-right text-slate-700" dir="ltr">{c.display_pb}</td>
                <td className="px-4 py-3 text-right text-slate-700" dir="ltr">{c.display_roe_pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
