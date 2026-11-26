import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LoadingState, ErrorState } from '../components/StatusMessage'
import { ChevronIcon } from '../components/icons'
import DataDisclaimer from '../components/DataDisclaimer'

type GemelKind = 'hishtalmut' | 'kupot-gemel' | 'pensia'

type Returns = { month: number | null; y1: number | null; y3: number | null; y5: number | null }
type GemelFund = Returns & { name: string }
type GemelGroup = { title: string; subtitle: string; month_label: string; rows: GemelFund[]; average: Returns | null }
type GemelResponse = { title: string; source: string; source_url: string; retrieved: string; groups: GemelGroup[] }

type SortKey = keyof Returns

const KIND_CONFIG: Record<GemelKind, { title: string; dataUrl: string }> = {
  hishtalmut: {
    title: 'קרנות השתלמות',
    dataUrl: import.meta.env.BASE_URL + 'data/gemel/hishtalmut.json',
  },
  'kupot-gemel': {
    title: 'קופות גמל',
    dataUrl: import.meta.env.BASE_URL + 'data/gemel/kupot-gemel.json',
  },
  pensia: {
    title: 'קרנות פנסיה',
    dataUrl: import.meta.env.BASE_URL + 'data/gemel/pensia.json',
  },
}

function formatPct(v: number | null) {
  return v == null ? '—' : `${v.toFixed(2)}%`
}

function pctColor(v: number | null) {
  if (v == null || v === 0) return 'text-slate-500'
  return v > 0 ? 'text-emerald-600' : 'text-red-600'
}

export default function GemelFundsPage() {
  const { kind } = useParams<{ kind: string }>()
  const config = KIND_CONFIG[kind as GemelKind] ?? KIND_CONFIG.hishtalmut

  const [data, setData] = useState<GemelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groupIndex, setGroupIndex] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    setLoading(true)
    setError('')
    setGroupIndex(0)
    setSortKey(null)
    fetch(config.dataUrl)
      .then((r) => r.json())
      .then((d: GemelResponse) => setData({ ...d, groups: d.groups.filter((g) => g.rows.length > 0) }))
      .catch(() => setError('לא ניתן לטעון את הנתונים כרגע. נסו שוב בעוד רגע.'))
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

  const group = data?.groups[groupIndex]
  const rows = group
    ? sortKey
      ? [...group.rows].sort((a, b) => {
          const av = a[sortKey]
          const bv = b[sortKey]
          if (av == null && bv == null) return 0
          if (av == null) return 1
          if (bv == null) return -1
          return sortDir === 'asc' ? av - bv : bv - av
        })
      : group.rows
    : []

  const columns: { key: SortKey; label: string }[] = [
    { key: 'month', label: group?.month_label || 'חודש אחרון' },
    { key: 'y1', label: 'שנה' },
    { key: 'y3', label: '3 שנים' },
    { key: 'y5', label: '5 שנים' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div dir="rtl" lang="he">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">{config.title}</h1>
        <p className="mb-6 text-sm text-slate-600">
          השוואת תשואות לפי מסלול השקעה. התשואות מצטברות ולפני דמי ניהול. לחצו על כותרת עמודה כדי למיין.
        </p>

        {loading && <LoadingState message="טוען נתונים…" />}
        {error && <ErrorState message={error} />}

        {!loading && !error && data && group && (
          <>
            <label className="mb-4 flex flex-col gap-1 text-sm font-medium text-slate-700 sm:max-w-md">
              מסלול השקעה
              <select
                value={groupIndex}
                onChange={(e) => {
                  setGroupIndex(Number(e.target.value))
                  setSortKey(null)
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {data.groups.map((g, i) => (
                  <option key={g.title} value={i}>
                    {g.title} ({g.rows.length})
                  </option>
                ))}
              </select>
            </label>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">{group.title}</caption>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-start text-xs font-medium text-slate-500">
                    <th scope="col" className="px-4 py-3 text-start">
                      שם הקופה
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        className="px-4 py-3 text-center"
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className="inline-flex items-center gap-1 rounded-md hover:text-slate-700"
                        >
                          {col.label}
                          {sortKey === col.key && (
                            <ChevronIcon direction={sortDir === 'asc' ? 'up' : 'down'} className="h-3 w-3" />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => (
                    <tr key={f.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <th scope="row" className="px-4 py-3 text-start font-medium text-slate-900">
                        {f.name}
                      </th>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          dir="ltr"
                          className={`px-4 py-3 text-center tabular-nums ${pctColor(f[col.key])}`}
                        >
                          {formatPct(f[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {group.average && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50 font-medium">
                      <th scope="row" className="px-4 py-3 text-start text-slate-700">
                        תשואה ממוצעת לקבוצה
                      </th>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          dir="ltr"
                          className={`px-4 py-3 text-center tabular-nums ${pctColor(group.average![col.key])}`}
                        >
                          {formatPct(group.average![col.key])}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

          </>
        )}
      </div>

      <DataDisclaimer source="mygemel.net" />
    </div>
  )
}
