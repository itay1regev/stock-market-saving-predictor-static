import { Link, Navigate, useParams } from 'react-router-dom'
import NewsCard from '../components/NewsCard'
import NewsSectionNav from '../components/NewsSectionNav'
import DataDisclaimer from '../components/DataDisclaimer'
import { ErrorState, LoadingState } from '../components/StatusMessage'
import { NEWS_SECTIONS, useNews } from '../content/news'
import { NEWS_EYEBROW, RAIL_HEADING } from '../components/newsStyles'

export default function NewsSectionPage() {
  const { section: sectionId = '' } = useParams<{ section: string }>()
  const section = NEWS_SECTIONS.find((s) => s.id === sectionId)
  const { posts, error, retry } = useNews()

  if (!section) return <Navigate to="/news" replace />
  const items = posts?.filter((p) => p.category === section.category) ?? []
  const [lead, ...rest] = items
  const elsewhere = posts?.filter((p) => p.category !== section.category).slice(0, 5) ?? []

  return (
    <div>
      <title>{`${section.title} | BacktestIQ`}</title>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 pt-8 pb-3">
          <p className={NEWS_EYEBROW}>
            <Link to="/news" className="hover:underline">
              News
            </Link>
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">{section.title}</h1>
        </div>
      </div>
      <NewsSectionNav />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {!posts &&
          (error ? (
            <ErrorState message="Could not load the news right now." onRetry={retry} />
          ) : (
            <LoadingState message="Loading news…" />
          ))}

        {posts && items.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
            No stories in this section yet.{' '}
            <Link to="/news" className="font-medium text-indigo-700 hover:underline">
              See today's top stories
            </Link>
          </div>
        )}

        {lead && (
          <div className="grid items-start gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="sr-only">Stories</h2>
              <NewsCard post={lead} variant="lead" showCategory={false} />
              {rest.length > 0 && (
                <ul className="mt-6 divide-y divide-slate-200 border-t border-slate-200">
                  {rest.map((p) => (
                    <li key={p.slug}>
                      <NewsCard post={p} variant="row" showCategory={false} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {elsewhere.length > 0 && (
              <aside aria-labelledby="elsewhere-heading" className="border-t border-slate-200 pt-6 lg:border-t-0 lg:border-s lg:pt-0 lg:ps-6">
                <h2 id="elsewhere-heading" className={RAIL_HEADING}>
                  Latest across News
                </h2>
                <ol className="mt-2 divide-y divide-slate-200">
                  {elsewhere.map((p) => (
                    <li key={p.slug}>
                      <NewsCard post={p} variant="headline" />
                    </li>
                  ))}
                </ol>
              </aside>
            )}
          </div>
        )}

        <DataDisclaimer />
      </div>
    </div>
  )
}
