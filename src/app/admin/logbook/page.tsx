'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import { FileText } from 'lucide-react'

export default function AdminLogbookPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase
      .from('maintenance_requests')
      .select(`*, reporter:users!reported_by_user_id(full_name), assignee:users!assigned_to_user_id(full_name), vehicle_part:vehicle_parts(part:parts(part_name_th), vehicle:vehicles(vehicle_name))`)
      .in('status', ['completed', 'rejected'])
      .order('completed_at', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-dark">บันทึกประวัติการซ่อม</h1>
          <p className="text-gray-500">ประวัติการซ่อมบำรุงที่เสร็จสิ้นแล้ว</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="w-4 h-4" />
          ทั้งหมด {logs.length} รายการ
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-military-dark text-white">
                  <th className="px-4 py-3 text-left text-sm">วันที่แจ้ง</th>
                  <th className="px-4 py-3 text-left text-sm">วันที่เสร็จ</th>
                  <th className="px-4 py-3 text-left text-sm">ยานพาหนะ</th>
                  <th className="px-4 py-3 text-left text-sm">อะไหล่</th>
                  <th className="px-4 py-3 text-left text-sm">รายละเอียด</th>
                  <th className="px-4 py-3 text-left text-sm">ผู้แจ้ง</th>
                  <th className="px-4 py-3 text-left text-sm">ช่าง</th>
                  <th className="px-4 py-3 text-left text-sm">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">ยังไม่มีประวัติการซ่อม</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{new Date(log.request_date).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm">{log.completed_at ? new Date(log.completed_at).toLocaleDateString('th-TH') : '-'}</td>
                      <td className="px-4 py-3 text-sm">{log.vehicle_part?.vehicle?.vehicle_name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{log.vehicle_part?.part?.part_name_th || '-'}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">{log.report_details || '-'}</td>
                      <td className="px-4 py-3 text-sm">{log.reporter?.full_name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{log.assignee?.full_name || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
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
