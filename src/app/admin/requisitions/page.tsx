'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'

export default function AdminRequisitionsPage() {
  const supabase = createClient()
  const [requisitions, setRequisitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase
      .from('part_requisitions')
      .select('*, part:parts(part_name_th, part_id), requester:users!requested_by_user_id(full_name, username), request:maintenance_requests(id, report_details)')
      .order('created_at', { ascending: false })
    setRequisitions(data || [])
    setLoading(false)
  }

  async function approve(id: string) {
    const [{ data: { user } }, { data: req }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('part_requisitions').select('part_id, quantity_requested').eq('id', id).single(),
    ])
    if (!user) return

    await supabase.from('part_requisitions').update({
      status: 'approved',
      approved_by_user_id: user.id,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    if (req) {
      const { data: part } = await supabase.from('parts').select('quantity').eq('id', req.part_id).single()
      if (part) {
        await supabase.from('parts').update({ quantity: Math.max(0, part.quantity - req.quantity_requested) }).eq('id', req.part_id)
      }
    }

    loadData()
  }

  async function reject(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('part_requisitions').update({ status: 'rejected', approved_by_user_id: user.id, updated_at: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-military-dark mb-2">อนุมัติเบิกอะไหล่</h1>
      <p className="text-gray-500 mb-6">ตรวจสอบและอนุมัติคำขอเบิกอะไหล่จากช่าง</p>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-military-dark text-white">
                  <th className="px-4 py-3 text-left text-sm">วันที่</th>
                  <th className="px-4 py-3 text-left text-sm">ผู้ขอเบิก</th>
                  <th className="px-4 py-3 text-left text-sm">อะไหล่</th>
                  <th className="px-4 py-3 text-left text-sm">จำนวน</th>
                  <th className="px-4 py-3 text-left text-sm">สถานะ</th>
                  <th className="px-4 py-3 text-left text-sm">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requisitions.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">ไม่มีคำขอเบิกอะไหล่</td></tr>
                ) : (
                  requisitions.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{new Date(req.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm">{req.requester?.full_name || req.requester?.username || '-'}</td>
                      <td className="px-4 py-3 text-sm">{req.part?.part_name_th || '-'} {req.part?.part_id ? `(${req.part.part_id})` : ''}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{req.quantity_requested}</td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => approve(req.id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">อนุมัติ</button>
                              <button onClick={() => reject(req.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">ปฏิเสธ</button>
                            </>
                          )}
                          {req.status !== 'pending' && <span className="text-xs text-gray-400">ดำเนินการแล้ว</span>}
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
