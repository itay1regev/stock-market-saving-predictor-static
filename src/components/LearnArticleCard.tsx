import { Link } from 'react-router-dom'
import type { LearnArticle, LearnTopic } from '../content/learn'

interface Props {
  article: LearnArticle
  topic?: LearnTopic
  variant?: 'card' | 'lead'
}

/** Coloured cover band standing in for an article image. */
function CoverBand({ topic, tall }: { topic?: LearnTopic; tall?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-linear-to-br ${topic?.band ?? 'from-slate-500 to-slate-700'} ${
        tall ? 'h-48 sm:h-64' : 'h-28'
      }`}
    >
      <div className="absolute -end-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 start-8 h-32 w-32 rounded-full bg-white/10" />
      <span className="absolute bottom-3 start-4 text-xs font-semibold uppercase tracking-wider text-white/90">
        {topic?.title}
      </span>
    </div>
  )
}

function Meta({ article }: { article: LearnArticle }) {
  return (
    <p className="mt-2 text-xs text-slate-500">
      {article.level} &middot; {article.readMinutes} min read
    </p>
  )
}

export default function LearnArticleCard({ article, topic, variant = 'card' }: Props) {
  const to = `/learn/${article.slug}`

  const lead = variant === 'lead'
  return (
    <Link
      to={to}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <CoverBand topic={topic} tall={lead} />
      <div className="flex flex-1 flex-col p-4">
        <h3
          className={`font-semibold text-slate-900 group-hover:text-indigo-700 group-hover:underline ${
            lead ? 'text-xl sm:text-2xl' : 'text-base'
          }`}
        >
          {article.title}
        </h3>
        {lead && <p className="mt-2 text-sm text-slate-600">{article.summary}</p>}
        <div className="mt-auto pt-1">
          <Meta article={article} />
        </div>
      </div>
    </Link>
  )
}
