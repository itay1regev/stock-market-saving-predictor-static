import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Company, CompaniesResponse } from '../types'
import { LoadingState, ErrorState } from '../components/StatusMessage'
import CompanyTable from '../components/CompanyTable'
import DataDisclaimer from '../components/DataDisclaimer'

type CompanyIndex = 'ta125'

const INDEX_CONFIG: Record<CompanyIndex, { title: string; dataUrl: string }> = {
  ta125: {
    title: 'TA-125 companies by index weight',
    dataUrl: import.meta.env.BASE_URL + 'data/companies/ta125.json',
  },
}

export default function CompaniesByWeightPage() {
  const { index } = useParams<{ index: string }>()
  const config = INDEX_CONFIG[index as CompanyIndex] ?? INDEX_CONFIG.ta125

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(config.dataUrl)
      .then((r) => r.json())
      .then((data: CompaniesResponse) => setCompanies(data.companies))
      .catch(() => setError('Could not load company data right now. Try again in a moment.'))
      .finally(() => setLoading(false))
  }, [config])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{config.title}</h1>

      {loading && <LoadingState message="Loading company data…" />}
      {error && <ErrorState message={error} />}

      {!loading && !error && <CompanyTable companies={companies} />}
      <DataDisclaimer source="bizportal.co.il" />
    </div>
  )
}
