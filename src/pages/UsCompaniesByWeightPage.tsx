import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { UsIndexResponse } from '../types'
import { LoadingState, ErrorState } from '../components/StatusMessage'
import UsCompanyTable from '../components/UsCompanyTable'
import DataDisclaimer from '../components/DataDisclaimer'

type UsIndex = 'sp500' | 'nasdaq100'

const INDEX_CONFIG: Record<UsIndex, { title: string; dataUrl: string }> = {
  sp500: {
    title: 'S&P 500 companies by index weight',
    dataUrl: import.meta.env.BASE_URL + 'data/companies/sp500.json',
  },
  nasdaq100: {
    title: 'Nasdaq 100 companies by index weight',
    dataUrl: import.meta.env.BASE_URL + 'data/companies/nasdaq100.json',
  },
}

export default function UsCompaniesByWeightPage() {
  const { index } = useParams<{ index: string }>()
  const config = INDEX_CONFIG[index as UsIndex] ?? INDEX_CONFIG.sp500

  const [data, setData] = useState<UsIndexResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setData(null)
    fetch(config.dataUrl)
      .then((r) => r.json())
      .then((payload: UsIndexResponse) => setData(payload))
      .catch(() => setError('Could not load company data right now. Try again in a moment.'))
      .finally(() => setLoading(false))
  }, [config])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">{config.title}</h1>
      {data && <p className="mb-6 text-sm text-slate-500">Snapshot from {data.as_of}</p>}

      {loading && <LoadingState message="Loading company data…" />}
      {error && <ErrorState message={error} />}

      {data && <UsCompanyTable companies={data.companies} />}
      <DataDisclaimer source={data ? data.sources.map((s) => s.label).join(', ') : undefined} />
    </div>
  )
}
