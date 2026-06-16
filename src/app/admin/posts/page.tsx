'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, ImageIcon, X } from 'lucide-react'

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from('posts').select('*, author:users(full_name)').order('created_at', { ascending: false })
    setPosts(data || [])
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    setExistingImage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUploading(true)
    let imagePath: string | null = existingImage ?? null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const fileName = `posts/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('uploads').upload(fileName, imageFile, { upsert: true })
      if (upErr) {
        setMessage({ type: 'error', text: `อัปโหลดรูปไม่สำเร็จ: ${upErr.message}` })
        setUploading(false)
        return
      }
      imagePath = fileName
    }

    if (editId) {
      await supabase.from('posts').update({ title, content, featured_image_path: imagePath }).eq('id', editId)
      setMessage({ type: 'success', text: 'อัปเดตสำเร็จ' })
    } else {
      await supabase.from('posts').insert({ title, content, author_id: user.id, featured_image_path: imagePath })
      setMessage({ type: 'success', text: 'เพิ่มประกาศสำเร็จ' })
    }
    setUploading(false)
    resetForm()
    loadData()
  }

  async function deletePost(id: string) {
    if (!confirm('ต้องการลบ?')) return
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', id)
    loadData()
  }

  function startEdit(p: any) {
    setEditId(p.id)
    setTitle(p.title)
    setContent(p.content)
    setExistingImage(p.featured_image_path ?? null)
    setImagePreview(null)
    setImageFile(null)
    setShowForm(true)
  }

  function resetForm() {
    setEditId(null)
    setTitle('')
    setContent('')
    setImageFile(null)
    setImagePreview(null)
    setExistingImage(null)
    setShowForm(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function getDisplayImage(p: any): string | null {
    const path = p.featured_image_path
    if (!path) return null
    if (path.startsWith('http') || path.startsWith('/')) return path
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${path}`
  }

  const previewSrc = imagePreview ?? (existingImage
    ? (existingImage.startsWith('http') || existingImage.startsWith('/') ? existingImage
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${existingImage}`)
    : null)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-military-dark">จัดการประกาศ</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 bg-military-olive text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition">
          <Plus className="w-4 h-4" /> เพิ่มประกาศ
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="หัวข้อประกาศ"
            className="w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-military-olive/30"
            required
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="เนื้อหา"
            rows={6}
            className="w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-military-olive/30"
            required
          />

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพประกอบ (ไม่บังคับ)</label>
            {previewSrc ? (
              <div className="relative inline-block">
                <img src={previewSrc} alt="preview" className="h-40 w-auto rounded-lg object-cover border" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-military-olive hover:bg-gray-50 transition">
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">คลิกเพื่อเลือกรูป</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (สูงสุด 5MB)</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="bg-military-olive text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg border hover:bg-gray-50">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {posts.map(p => {
          const img = getDisplayImage(p)
          return (
            <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex">
              {img && (
                <div className="w-32 h-24 flex-shrink-0">
                  <img src={img} alt={p.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-1 justify-between items-start p-5">
                <div>
                  <h3 className="font-semibold text-military-dark text-lg">{p.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(p.created_at).toLocaleDateString('th-TH')} | โดย {p.author?.full_name || 'Admin'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.content.replace(/[\r\n]+/g, ' ')}</p>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => startEdit(p)} className="text-military-olive hover:text-primary-hover"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deletePost(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
