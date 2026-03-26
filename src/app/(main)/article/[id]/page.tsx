import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('*, author:users(full_name)')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-military-olive hover:underline mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> กลับหน้าหลัก
      </Link>

      <article className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-military-dark mb-3">{post.title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {new Date(post.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          {' | โดย '}{post.author?.full_name || 'Admin'}
        </p>
        <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
          {post.content}
        </div>
      </article>
    </div>
  )
}
