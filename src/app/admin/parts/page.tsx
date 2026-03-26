'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Package } from 'lucide-react'

export default function AdminPartsPage() {
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [nameT, setNameT] = useState('')
  const [partId, setPartId] = useState('')
  const [qty, setQty] = useState(0)
  const [lifespan, setLifespan] = useState(365)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from('parts').select('*').order('part_name_th')
    setParts(data || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const payload = { part_name_th: nameT, part_id: partId || null, quantity: qty, standard_lifespan_days: lifespan }

    if (editId) {
      await supabase.from('parts').update(payload).eq('id', editId)
      setMessage({ type: 'success', text: 'อัปเดตสำเร็จ' })
    } else {
      await supabase.from('parts').insert(payload)
      setMessage({ type: 'success', text: 'เพิ่มอะไหล่สำเร็จ' })
    }
    resetForm()
    loadData()
  }

  function startEdit(p: any) {
    setEditId(p.id); setNameT(p.part_name_th); setPartId(p.part_id || ''); setQty(p.quantity); setLifespan(p.standard_lifespan_days); setShowForm(true)
  }

  function resetForm() { setEditId(null); setNameT(''); setPartId(''); setQty(0); setLifespan(365); setShowForm(false) }

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

      {message.text && <div className="mb-4 p-3 rounded-lg border-l-4 bg-green-50 border-green-500 text-green-700">{message.text}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={nameT} onChange={e => setNameT(e.target.value)} placeholder="ชื่ออะไหล่ (TH)" className="px-4 py-2.5 border rounded-lg outline-none" required />
            <input value={partId} onChange={e => setPartId(e.target.value)} placeholder="รหัสอะไหล่" className="px-4 py-2.5 border rounded-lg outline-none" />
            <input type="number" value={qty} onChange={e => setQty(+e.target.value)} placeholder="จำนวน" className="px-4 py-2.5 border rounded-lg outline-none" min={0} />
            <input type="number" value={lifespan} onChange={e => setLifespan(+e.target.value)} placeholder="อายุการใช้งาน (วัน)" className="px-4 py-2.5 border rounded-lg outline-none" min={1} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-military-olive text-white px-6 py-2 rounded-lg font-semibold">บันทึก</button>
            <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg border hover:bg-gray-50">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-military-dark text-white">
            <th className="px-4 py-3 text-left text-sm">ชื่ออะไหล่</th>
            <th className="px-4 py-3 text-left text-sm">รหัส</th>
            <th className="px-4 py-3 text-left text-sm">จำนวนคงเหลือ</th>
            <th className="px-4 py-3 text-left text-sm">อายุใช้งาน (วัน)</th>
            <th className="px-4 py-3 text-left text-sm">จัดการ</th>
          </tr></thead>
          <tbody className="divide-y">
            {parts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium flex items-center gap-2"><Package className="w-4 h-4 text-military-olive" /> {p.part_name_th}</td>
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
