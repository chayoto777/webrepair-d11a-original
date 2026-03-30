'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'

export default function AdminGeneralRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase
      .from('general_requests')
      .select('*, user:users(full_name, username)')
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('general_requests').update({ status }).eq('id', id)
    loadData()
  }

  async function deleteRequest(id: string) {
    if (!confirm('ต้องการลบคำร้องนี้?')) return
    const supabase = createClient()
    await supabase.from('general_requests').delete().eq('id', id)
    loadData()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-military-dark mb-2">คำร้องทั่วไป</h1>
      <p className="text-gray-500 mb-6">จัดการคำร้องขอทั่วไปจากผู้ใช้งาน</p>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-military-dark text-white">
                  <th className="px-4 py-3 text-left text-sm">วันที่</th>
                  <th className="px-4 py-3 text-left text-sm">ผู้ร้องขอ</th>
                  <th className="px-4 py-3 text-left text-sm">ประเภท</th>
                  <th className="px-4 py-3 text-left text-sm">หัวข้อ</th>
                  <th className="px-4 py-3 text-left text-sm">สถานะ</th>
                  <th className="px-4 py-3 text-left text-sm">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">ไม่มีคำร้อง</td></tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{new Date(req.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm">{req.user?.full_name || req.user?.username || '-'}</td>
                      <td className="px-4 py-3 text-sm">{req.request_type || '-'}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">{req.subject}</td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(req.id, 'in_progress')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">รับเรื่อง</button>
                              <button onClick={() => updateStatus(req.id, 'rejected')} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">ปฏิเสธ</button>
                            </>
                          )}
                          <button onClick={() => deleteRequest(req.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">ลบ</button>
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
