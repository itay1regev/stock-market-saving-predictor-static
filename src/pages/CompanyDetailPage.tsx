import { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { CompanyDetail, PeriodicReportTable, ReportTable } from '../types'
import { LoadingState, ErrorState } from '../components/StatusMessage'

type Period = 'quarterly' | 'yearly'

const PERIODIC_SECTIONS: { id: string; title: string; key: keyof Pick<CompanyDetail, 'balance_sheet' | 'income_statement' | 'cash_flow'> }[] = [
  { id: 'balance', title: 'מאזן', key: 'balance_sheet' },
  { id: 'pnl', title: 'רווח והפסד', key: 'income_statement' },
  { id: 'cashflow', title: 'תזרים מזומנים', key: 'cash_flow' },
]

function ReportTableView({ id, title, table }: { id: string; title: string; table: ReportTable }) {
  if (table.rows.length === 0) return null

  let lastCategory: string | null | undefined
  return (
    <div id={id} className="mb-6 scroll-mt-4 overflow-x-auto rounded-lg border border-slate-200" dir="rtl">
      <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
        {title}
      </h3>
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">שורה</th>
            {table.periods.map((p) => (
              <th key={p} className="px-4 py-2 text-right" dir="ltr">
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => {
            const showCategory = row.category && row.category !== lastCategory
            lastCategory = row.category
            return (
              <Fragment key={i}>
                {showCategory && (
                  <tr className="bg-slate-50">
                    <td colSpan={table.periods.length + 1} className="px-4 py-1.5 text-xs font-medium text-slate-400">
                      {row.category}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="px-4 py-2 text-right text-slate-700" dir="ltr">
                      {v}
                    </td>
                  ))}
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PeriodToggle({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-sm" dir="rtl">
      {(['quarterly', 'yearly'] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded px-3 py-1 font-medium ${
            period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {p === 'quarterly' ? 'רבעוני' : 'שנתי'}
        </button>
      ))}
    </div>
  )
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<Period>('quarterly')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    setPeriod('quarterly')
    fetch(`/data/companies/ta125/${id}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(setDetail)
      .catch(() => setError('Could not load company data right now. Try again in a moment.'))
      .finally(() => setLoading(false))
  }, [id])

  function tableFor(periodic: PeriodicReportTable): ReportTable {
    return period === 'quarterly' ? periodic.quarterly : periodic.yearly
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/companies-by-weight/ta125" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Back to TA-125 companies by index weight
      </Link>

      {loading && <LoadingState message="Loading company data…" />}
      {error && <ErrorState message={error} />}

      {!loading && !error && detail && (
        <>
          <div className="mb-6 flex items-center justify-between gap-3" dir="rtl">
            <h1 className="text-2xl font-semibold text-slate-900">{detail.name}</h1>
          </div>

          <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" dir="rtl">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">פרופיל</h2>
            <dl className="mb-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-slate-500">ענף</dt>
                <dd className="font-medium text-slate-900">{detail.industry ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">שנת יסוד</dt>
                <dd className="font-medium text-slate-900">{detail.founded_year ?? '—'}</dd>
              </div>
            </dl>
            {detail.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{detail.description}</p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3" dir="rtl">
              <h2 className="text-lg font-semibold text-slate-900">דוחות</h2>
              <div className="flex flex-wrap items-center gap-3">
                <PeriodToggle period={period} onChange={setPeriod} />
                <nav className="flex flex-wrap gap-1 text-sm">
                  <a href="#ratios" className="rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-slate-100">
                    יחסים פיננסיים
                  </a>
                  {PERIODIC_SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            <div id="ratios" className="scroll-mt-4">
              {period === 'quarterly' ? (
                <>
                  <p className="mb-2 text-xs text-slate-400" dir="rtl">
                    מקור: bizportal.co.il, רבעון אחרון
                  </p>
                  <ReportTableView id="ratios-table" title="יחסים פיננסיים" table={detail.ratios} />
                </>
              ) : detail.ratios_yearly ? (
                <>
                  <p className="mb-2 text-xs text-slate-400" dir="rtl">
                    מחושב: שווי שוק בסוף כל שנה (בורסה לני"ע, שער נעילה × הון רשום למסחר) חלקי רווח נקי / הון עצמי
                    מהדוחות השנתיים. ROE מחושב לפי הון עצמי בסוף השנה (לא ממוצע שנתי); בשנים עם הון עצמי שלילי
                    הערך מסומן כ"לא רלוונטי" במקום אחוז מטעה.
                  </p>
                  <ReportTableView id="ratios-table" title="יחסים פיננסיים" table={detail.ratios_yearly} />
                </>
              ) : (
                <p className="text-sm text-slate-400" dir="rtl">
                  אין נתונים שנתיים זמינים עבור חברה זו
                </p>
              )}
            </div>

            {PERIODIC_SECTIONS.map((s) => (
              <ReportTableView key={s.id} id={s.id} title={s.title} table={tableFor(detail[s.key])} />
            ))}
          </section>
        </>
      )}
    </div>
  )
}
