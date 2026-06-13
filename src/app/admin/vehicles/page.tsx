'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Car, Upload, X } from 'lucide-react'
import { getImageUrl } from '@/lib/storage'

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [affiliation, setAffiliation] = useState('โครงการ D11A')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
    setVehicles(data || [])
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
      const fileName = `vehicles/vehicle_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('uploads').upload(fileName, imageFile, { upsert: true })
      if (upErr) { setMessage({ type: 'error', text: 'อัปโหลดรูปไม่สำเร็จ: ' + upErr.message }); setUploading(false); return }
      imagePath = fileName
    }

    const payload: any = { vehicle_name: name, license_plate: plate, project_affiliation: affiliation }
    if (imagePath) payload.vehicle_image_path = imagePath

    if (editId) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', editId)
      if (error) { setMessage({ type: 'error', text: error.message }); setUploading(false); return }
      setMessage({ type: 'success', text: 'อัปเดตสำเร็จ' })
    } else {
      const { error } = await supabase.from('vehicles').insert(payload)
      if (error) { setMessage({ type: 'error', text: error.message }); setUploading(false); return }
      setMessage({ type: 'success', text: 'เพิ่มยานพาหนะสำเร็จ' })
    }

    setUploading(false)
    resetForm()
    loadData()
  }

  function startEdit(v: any) {
    setEditId(v.id)
    setName(v.vehicle_name)
    setPlate(v.license_plate || '')
    setAffiliation(v.project_affiliation || '')
    setImageFile(null)
    setImagePreview(getImageUrl(v.vehicle_image_path))
    setShowForm(true)
  }

  function resetForm() {
    setEditId(null)
    setName('')
    setPlate('')
    setAffiliation('โครงการ D11A')
    setImageFile(null)
    setImagePreview(null)
    setShowForm(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-dark">ยานพาหนะทั้งหมด</h1>
          <p className="text-gray-500">จัดการข้อมูลยานพาหนะในระบบ</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 bg-military-olive text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition">
          <Plus className="w-4 h-4" /> เพิ่มยานพาหนะ
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-military-dark">{editId ? 'แก้ไขยานพาหนะ' : 'เพิ่มยานพาหนะใหม่'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อยานพาหนะ" className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-primary/30" required />
            <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="ทะเบียน" className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={affiliation} onChange={e => setAffiliation(e.target.value)} placeholder="สังกัดโครงการ" className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รูปยานพาหนะ</label>
            <div
              className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-military-olive transition"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="" className="h-32 object-contain rounded" />
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
            <button type="submit" disabled={uploading} className="bg-military-olive text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50">
              {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg border hover:bg-gray-50">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" /></div>
        ) : (
          vehicles.map(v => (
            <div key={v.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                {getImageUrl(v.vehicle_image_path) ? (
                  <img src={getImageUrl(v.vehicle_image_path)!} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Car className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-military-dark">{v.vehicle_name}</h3>
                <p className="text-sm text-gray-500">{v.license_plate}</p>
                <p className="text-xs text-military-olive mt-1">{v.project_affiliation}</p>
                <button onClick={() => startEdit(v)} className="mt-3 flex items-center gap-1 text-sm text-military-olive hover:underline">
                  <Pencil className="w-3 h-3" /> แก้ไข
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
