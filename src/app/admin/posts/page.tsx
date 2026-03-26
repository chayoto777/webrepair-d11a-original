'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from('posts').select('*, author:users(full_name)').order('created_at', { ascending: false })
    setPosts(data || [])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editId) {
      await supabase.from('posts').update({ title, content }).eq('id', editId)
      setMessage({ type: 'success', text: 'อัปเดตสำเร็จ' })
    } else {
      await supabase.from('posts').insert({ title, content, author_id: user.id })
      setMessage({ type: 'success', text: 'เพิ่มประกาศสำเร็จ' })
    }
    resetForm(); loadData()
  }

  async function deletePost(id: string) {
    if (!confirm('ต้องการลบ?')) return
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', id)
    loadData()
  }

  function startEdit(p: any) { setEditId(p.id); setTitle(p.title); setContent(p.content); setShowForm(true) }
  function resetForm() { setEditId(null); setTitle(''); setContent(''); setShowForm(false) }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-military-dark">จัดการประกาศ</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 bg-military-olive text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition">
          <Plus className="w-4 h-4" /> เพิ่มประกาศ
        </button>
      </div>

      {message.text && <div className="mb-4 p-3 rounded-lg border-l-4 bg-green-50 border-green-500 text-green-700">{message.text}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="หัวข้อประกาศ" className="w-full px-4 py-2.5 border rounded-lg outline-none" required />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="เนื้อหา" rows={6} className="w-full px-4 py-2.5 border rounded-lg outline-none" required />
          <div className="flex gap-2">
            <button type="submit" className="bg-military-olive text-white px-6 py-2 rounded-lg font-semibold">บันทึก</button>
            <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg border hover:bg-gray-50">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {posts.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-military-dark text-lg">{p.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(p.created_at).toLocaleDateString('th-TH')} | โดย {p.author?.full_name || 'Admin'}
              </p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.content.replace(/[\r\n]+/g, ' ')}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button onClick={() => startEdit(p)} className="text-military-olive hover:text-primary-hover"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => deletePost(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
