import { Link } from 'react-router-dom'
import LearnArticleCard from '../components/LearnArticleCard'
import DataDisclaimer from '../components/DataDisclaimer'
import { ErrorState, LoadingState } from '../components/StatusMessage'
import { articlesByTopic, getArticle, getTopic, useLearnHub } from '../content/learn'

export default function LearnHubPage() {
  const { hub, error } = useLearnHub()

  const hero = (
    <section className="bg-slate-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Learning hub</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">How to Invest</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Clear, practical guides to stocks, ETFs, bonds and building a portfolio, from your first deposit to a
          retirement plan.
        </p>
        {hub && (
          <nav aria-label="Investing topics" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {hub.topics.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/learn/topic/${t.id}`}
                    className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  )

  if (!hub) {
    return (
      <div>
        {hero}
        <div className="mx-auto max-w-5xl px-4 py-10">
          {error ? <ErrorState message="Could not load the guides right now. Try again in a moment." /> : <LoadingState />}
        </div>
      </div>
    )
  }

  const topicOf = (id: string) => getTopic(hub, id)
  const [lead, ...sideFeatured] = hub.articles.filter((a) => a.featured)
  const path = hub.start_here.map((slug) => getArticle(hub, slug)).filter((a) => a !== undefined)

  return (
    <div>
      {hero}

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Featured */}
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="sr-only">
            Featured guides
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {lead && (
              <div className="lg:col-span-2">
                <LearnArticleCard article={lead} topic={topicOf(lead.topic)} variant="lead" />
              </div>
            )}
            <div className="flex flex-col gap-6">
              {sideFeatured.map((a) => (
                <LearnArticleCard key={a.slug} article={a} topic={topicOf(a.topic)} />
              ))}
            </div>
          </div>
        </section>

        {/* Start here */}
        <section aria-labelledby="start-heading" className="mt-12 rounded-lg border border-indigo-100 bg-indigo-50/60 p-6">
          <h2 id="start-heading" className="text-xl font-semibold text-slate-900">
            New to investing? Start here
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {path.length} guides, in order, that cover everything you need to begin.
          </p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {path.map((a, i) => (
              <li key={a.slug}>
                <Link
                  to={`/learn/${a.slug}`}
                  className="group flex h-full flex-col rounded-md border border-slate-200 bg-white p-4 hover:border-indigo-300"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-indigo-700 group-hover:underline">
                    {a.title}
                  </span>
                  <span className="mt-auto pt-2 text-xs text-slate-500">{a.readMinutes} min read</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* Topic sections */}
        {hub.topics.map((t) => {
          const items = articlesByTopic(hub, t.id).slice(0, 3)
          const headingId = `topic-${t.id}-heading`
          return (
            <section key={t.id} aria-labelledby={headingId} className="mt-12">
              <div className="flex items-end justify-between gap-4 border-b-2 border-slate-900 pb-2">
                <div>
                  <h2 id={headingId} className="text-xl font-semibold text-slate-900">
                    {t.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-600">{t.blurb}</p>
                </div>
                <Link to={`/learn/topic/${t.id}`} className="shrink-0 text-sm font-medium text-indigo-700 hover:underline">
                  See all<span className="sr-only"> {t.title} guides</span> &rarr;
                </Link>
              </div>
              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <LearnArticleCard key={a.slug} article={a} topic={t} />
                ))}
              </div>
            </section>
          )
        })}

        {/* Glossary */}
        <section aria-labelledby="terms-heading" className="mt-12">
          <h2 id="terms-heading" className="border-b-2 border-slate-900 pb-2 text-xl font-semibold text-slate-900">
            Key terms to know
          </h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {hub.glossary.map((g) => (
              <div key={g.term} className="rounded-md border border-slate-200 bg-white p-4">
                <dt className="font-semibold text-slate-900">{g.term}</dt>
                <dd className="mt-1 text-sm text-slate-600">{g.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Tools CTA */}
        <section className="mt-12 flex flex-col items-start gap-4 rounded-lg bg-slate-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Put it into practice</h2>
            <p className="mt-1 text-sm text-slate-300">
              Test a portfolio against ten years of real market data before you commit a single shekel.
            </p>
          </div>
          <Link
            to="/backtest"
            className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50"
          >
            Open the Backtest tool
          </Link>
        </section>

        <DataDisclaimer />
      </div>
    </div>
  )
}
