import { useEffect, useState } from 'react'
import BlogPostCard from '../components/BlogPostCard'
import type { BlogPost } from '../types'
import { LoadingState } from '../components/StatusMessage'

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/blog-posts.json')
      .then((r) => r.json())
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Blog</h1>
      {loading && <LoadingState />}
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
