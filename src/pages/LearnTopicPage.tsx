import { Link, Navigate, useParams } from 'react-router-dom'
import LearnArticleCard from '../components/LearnArticleCard'
import DataDisclaimer from '../components/DataDisclaimer'
import { ErrorState, LoadingState } from '../components/StatusMessage'
import { articlesByTopic, getTopic, useLearnHub } from '../content/learn'

export default function LearnTopicPage() {
  const { topic: topicId = '' } = useParams<{ topic: string }>()
  const { hub, error } = useLearnHub()

  if (!hub) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        {error ? <ErrorState message="Could not load the guides right now. Try again in a moment." /> : <LoadingState />}
      </div>
    )
  }

  const topic = getTopic(hub, topicId)
  if (!topic) return <Navigate to="/learn" replace />
  const articles = articlesByTopic(hub, topic.id)

  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-300">
            <Link to="/learn" className="hover:text-white hover:underline">
              How to Invest
            </Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{topic.title}</span>
          </nav>
          <h1 className="mt-2 text-3xl font-bold">{topic.title}</h1>
          <p className="mt-2 max-w-2xl text-slate-300">{topic.blurb}</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <LearnArticleCard key={a.slug} article={a} topic={topic} />
          ))}
        </div>

        <section aria-labelledby="other-topics" className="mt-12">
          <h2 id="other-topics" className="text-lg font-semibold text-slate-900">
            Explore other topics
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {hub.topics
              .filter((t) => t.id !== topic.id)
              .map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/learn/topic/${t.id}`}
                    className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium hover:underline ${t.chip}`}
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <DataDisclaimer />
      </div>
    </div>
  )
}
