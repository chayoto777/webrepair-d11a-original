'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import { Package, Plus } from 'lucide-react'

export default function MechanicPartsPage() {
  const [parts, setParts] = useState<any[]>([])
  const [myJobs, setMyJobs] = useState<any[]>([])
  const [requisitions, setRequisitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedPart, setSelectedPart] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => { init() }, [])

  async function init() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [partsRes, jobsRes, reqRes] = await Promise.all([
      supabase.from('parts').select('*').order('part_name_th'),
      supabase.from('maintenance_requests').select('id, report_details, vehicle_part:vehicle_parts(vehicle:vehicles(vehicle_name))').eq('assigned_to_user_id', user.id).in('status', ['in_progress', 'requisitioning', 'repairing']),
      supabase.from('part_requisitions').select('*, part:parts(part_name_th)').eq('requested_by_user_id', user.id).order('created_at', { ascending: false }),
    ])

    setParts(partsRes.data || [])
    setMyJobs(jobsRes.data || [])
    setRequisitions(reqRes.data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('part_requisitions').insert({
      maintenance_request_id: selectedJob || null,
      part_id: selectedPart,
      quantity_requested: qty,
      requested_by_user_id: user.id,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    // Update request status to requisitioning if linked
    if (selectedJob) {
      await supabase.from('maintenance_requests').update({ status: 'requisitioning' }).eq('id', selectedJob)
    }

    setMessage({ type: 'success', text: 'ส่งคำขอเบิกอะไหล่สำเร็จ' })
    setShowForm(false)
    setSelectedPart('')
    setSelectedJob('')
    setQty(1)
    init()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-dark">ขอเบิกอะไหล่</h1>
          <p className="text-gray-500">ส่งคำขอเบิกอะไหล่สำหรับงานซ่อม</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-military-olive text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition">
          <Plus className="w-4 h-4" /> ขอเบิกอะไหล่
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-military-dark">แบบฟอร์มขอเบิกอะไหล่</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={selectedPart} onChange={e => setSelectedPart(e.target.value)} className="px-4 py-2.5 border rounded-lg outline-none" required>
              <option value="">เลือกอะไหล่</option>
              {parts.map(p => (
                <option key={p.id} value={p.id}>{p.part_name_th} (คงเหลือ: {p.quantity})</option>
              ))}
            </select>
            <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="px-4 py-2.5 border rounded-lg outline-none">
              <option value="">เลือกงานซ่อม (ถ้ามี)</option>
              {myJobs.map(j => (
                <option key={j.id} value={j.id}>{j.vehicle_part?.vehicle?.vehicle_name || 'งาน'} - {j.report_details?.slice(0, 30) || j.id.slice(0, 8)}</option>
              ))}
            </select>
            <input type="number" value={qty} onChange={e => setQty(+e.target.value)} min={1} placeholder="จำนวน" className="px-4 py-2.5 border rounded-lg outline-none" required />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-military-olive text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-hover transition">ส่งคำขอ</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg border hover:bg-gray-50">ยกเลิก</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-military-dark">ประวัติการขอเบิก</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-military-dark text-white">
                <th className="px-4 py-3 text-left text-sm">วันที่</th>
                <th className="px-4 py-3 text-left text-sm">อะไหล่</th>
                <th className="px-4 py-3 text-left text-sm">จำนวน</th>
                <th className="px-4 py-3 text-left text-sm">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requisitions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">ยังไม่มีประวัติการขอเบิก</td></tr>
              ) : (
                requisitions.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3 text-sm flex items-center gap-2"><Package className="w-4 h-4 text-military-olive" /> {r.part?.part_name_th || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{r.quantity_requested}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
