'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import type { MaintenanceRequest, MaintenanceStatus } from '@/types/database'

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [mechanics, setMechanics] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase
      .from('maintenance_requests')
      .select(`*, reporter:users!reported_by_user_id(full_name, username), assignee:users!assigned_to_user_id(full_name), vehicle_part:vehicle_parts(part:parts(part_name_th), vehicle:vehicles(vehicle_name))`)
      .order('created_at', { ascending: false })
    setRequests(data || [])

    const { data: mechs } = await supabase.from('users').select('id, full_name, username').eq('role', 'mechanic')
    setMechanics(mechs || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: MaintenanceStatus) {
    const supabase = createClient()
    const updates: any = { status }
    if (status === 'completed') updates.completed_at = new Date().toISOString()
    await supabase.from('maintenance_requests').update(updates).eq('id', id)
    loadData()
  }

  async function assignMechanic(id: string, mechanicId: string) {
    const supabase = createClient()
    await supabase.from('maintenance_requests').update({
      assigned_to_user_id: mechanicId,
      status: 'in_progress',
    }).eq('id', id)
    loadData()
  }

  async function deleteRequest(id: string) {
    if (!confirm('ต้องการลบคำร้องนี้?')) return
    const supabase = createClient()
    await supabase.from('maintenance_requests').delete().eq('id', id)
    loadData()
  }

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus)

  return (
    <div>
      <h1 className="text-3xl font-bold text-military-dark mb-2">จัดการคำร้องแจ้งซ่อม</h1>
      <p className="text-gray-500 mb-6">ดูและมอบหมายคำร้องแจ้งซ่อมบำรุง</p>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'pending', 'in_progress', 'repairing', 'awaiting_approval', 'completed', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filterStatus === s ? 'bg-military-olive text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}
          >
            {s === 'all' ? 'ทั้งหมด' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-military-dark text-white">
                  <th className="px-4 py-3 text-left text-sm">วันที่</th>
                  <th className="px-4 py-3 text-left text-sm">ผู้แจ้ง</th>
                  <th className="px-4 py-3 text-left text-sm">ยานพาหนะ</th>
                  <th className="px-4 py-3 text-left text-sm">อะไหล่</th>
                  <th className="px-4 py-3 text-left text-sm">สถานะ</th>
                  <th className="px-4 py-3 text-left text-sm">มอบหมาย</th>
                  <th className="px-4 py-3 text-left text-sm">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">ไม่มีคำร้อง</td></tr>
                ) : (
                  filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{new Date(req.request_date).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm">{req.reporter?.full_name || req.reporter?.username || '-'}</td>
                      <td className="px-4 py-3 text-sm">{req.vehicle_part?.vehicle?.vehicle_name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{req.vehicle_part?.part?.part_name_th || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3">
                        {req.status === 'pending' && (
                          <select
                            onChange={(e) => e.target.value && assignMechanic(req.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="">มอบหมาย...</option>
                            {mechanics.map(m => <option key={m.id} value={m.id}>{m.full_name || m.username}</option>)}
                          </select>
                        )}
                        {req.assignee && <span className="text-xs text-gray-500">{req.assignee.full_name}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {req.status === 'awaiting_approval' && (
                            <button onClick={() => updateStatus(req.id, 'completed')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                              อนุมัติ
                            </button>
                          )}
                          <button onClick={() => deleteRequest(req.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
