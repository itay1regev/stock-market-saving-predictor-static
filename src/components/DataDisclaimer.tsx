import { Link } from 'react-router-dom'

/**
 * Short, persistent notice shown directly below data tables and charts.
 * `source` names the third-party provider(s) the data on that page comes from.
 */
export default function DataDisclaimer({ source, className = '' }: { source?: string; className?: string }) {
  return (
    <p className={`mt-6 text-xs leading-relaxed text-slate-400 ${className}`} dir="ltr">
      Data is provided "as is" for informational and educational purposes only and is not financial, investment,
      tax or legal advice. Figures are a periodic snapshot, not a live feed, and may be delayed, incomplete or
      inaccurate.
      {source && <> Source: {source} — not independently verified.</>}{' '}
      <Link to="/terms" className="underline hover:text-slate-600">
        Terms of Use &amp; Disclaimer
      </Link>
    </p>
  )
}
