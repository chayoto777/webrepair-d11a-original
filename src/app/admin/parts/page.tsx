'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Package, Upload, X } from 'lucide-react'

function getImageUrl(path: string | null | undefined) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${path}`
}

export default function AdminPartsPage() {
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [nameT, setNameT] = useState('')
  const [partId, setPartId] = useState('')
  const [qty, setQty] = useState(0)
  const [lifespan, setLifespan] = useState(365)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from('parts').select('*').order('part_name_th')
    setParts(data || [])
    setLoading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    const supabase = createClient()

    let imagePath: string | undefined
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const fileName = `parts/admin_${partId || Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('uploads').upload(fileName, imageFile, { upsert: true })
      if (upErr) { setMessage({ type: 'error', text: 'อัปโหลดรูปไม่สำเร็จ: ' + upErr.message }); setUploading(false); return }
      imagePath = fileName
    }

    const payload: any = { part_name_th: nameT, part_id: partId || null, quantity: qty, standard_lifespan_days: lifespan }
    if (imagePath) payload.part_image_path = imagePath

    if (editId) {
      await supabase.from('parts').update(payload).eq('id', editId)
      setMessage({ type: 'success', text: 'อัปเดตสำเร็จ' })
    } else {
      await supabase.from('parts').insert(payload)
      setMessage({ type: 'success', text: 'เพิ่มอะไหล่สำเร็จ' })
    }
    setUploading(false)
    resetForm()
    loadData()
  }

  function startEdit(p: any) {
    setEditId(p.id)
    setNameT(p.part_name_th)
    setPartId(p.part_id || '')
    setQty(p.quantity)
    setLifespan(p.standard_lifespan_days)
    setImageFile(null)
    setImagePreview(getImageUrl(p.part_image_path))
    setShowForm(true)
  }

  function resetForm() {
    setEditId(null); setNameT(''); setPartId(''); setQty(0); setLifespan(365)
    setImageFile(null); setImagePreview(null); setShowForm(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-dark">คลังอะไหล่</h1>
          <p className="text-gray-500">จัดการอะไหล่ในคลัง</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 bg-military-olive text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition">
          <Plus className="w-4 h-4" /> เพิ่มอะไหล่
        </button>
      </div>

      {message.text && <div className={`mb-4 p-3 rounded-lg border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>{message.text}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-military-dark">{editId ? 'แก้ไขอะไหล่' : 'เพิ่มอะไหล่ใหม่'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={nameT} onChange={e => setNameT(e.target.value)} placeholder="ชื่ออะไหล่ (TH)" className="px-4 py-2.5 border rounded-lg outline-none" required />
            <input value={partId} onChange={e => setPartId(e.target.value)} placeholder="รหัสอะไหล่" className="px-4 py-2.5 border rounded-lg outline-none" />
            <input type="number" value={qty} onChange={e => setQty(+e.target.value)} placeholder="จำนวน" className="px-4 py-2.5 border rounded-lg outline-none" min={0} />
            <input type="number" value={lifespan} onChange={e => setLifespan(+e.target.value)} placeholder="อายุการใช้งาน (วัน)" className="px-4 py-2.5 border rounded-lg outline-none" min={1} />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รูปอะไหล่</label>
            <div
              className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-military-olive transition"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="" className="h-28 object-contain rounded" />
                  <button type="button" onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = '' }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">คลิกเพื่ออัปโหลดรูป</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={uploading} className="bg-military-olive text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50">
              {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg border hover:bg-gray-50">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-military-dark text-white">
            <th className="px-4 py-3 text-left text-sm">รูป</th>
            <th className="px-4 py-3 text-left text-sm">ชื่ออะไหล่</th>
            <th className="px-4 py-3 text-left text-sm">รหัส</th>
            <th className="px-4 py-3 text-left text-sm">จำนวนคงเหลือ</th>
            <th className="px-4 py-3 text-left text-sm">อายุใช้งาน (วัน)</th>
            <th className="px-4 py-3 text-left text-sm">จัดการ</th>
          </tr></thead>
          <tbody className="divide-y">
            {parts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  {getImageUrl(p.part_image_path) ? (
                    <img src={getImageUrl(p.part_image_path)!} alt="" className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-300" />
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{p.part_name_th}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.part_id || '-'}</td>
                <td className="px-4 py-3 text-sm"><span className={`font-semibold ${p.quantity <= 5 ? 'text-red-600' : 'text-green-600'}`}>{p.quantity}</span></td>
                <td className="px-4 py-3 text-sm">{p.standard_lifespan_days}</td>
                <td className="px-4 py-3"><button onClick={() => startEdit(p)} className="text-sm text-military-olive hover:underline flex items-center gap-1"><Pencil className="w-3 h-3" /> แก้ไข</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
