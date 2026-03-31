'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import type { MaintenanceStatus } from '@/types/database'
import { AlertTriangle } from 'lucide-react'

export default function MechanicDashboardPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    await loadJobs(user.id)
  }

  async function loadJobs(uid: string) {
    const { data } = await supabase
      .from('maintenance_requests')
      .select(`*, reporter:users!reported_by_user_id(full_name), vehicle_part:vehicle_parts(part:parts(part_name_th), vehicle:vehicles(vehicle_name))`)
      .eq('assigned_to_user_id', uid)
      .order('created_at', { ascending: false })
    setJobs(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: MaintenanceStatus) {
    if (!userId) return
    await supabase.from('maintenance_requests').update({ status }).eq('id', id)
    loadJobs(userId)
  }

  const activeJobs = jobs.filter(j => !['completed', 'rejected'].includes(j.status))
  const completedJobs = jobs.filter(j => ['completed', 'rejected'].includes(j.status))

  return (
    <div>
      <h1 className="text-3xl font-bold text-military-dark mb-2">งานซ่อมของฉัน</h1>
      <p className="text-gray-500 mb-6">รายการงานซ่อมที่ได้รับมอบหมาย</p>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Active Jobs */}
          <h2 className="text-lg font-semibold text-military-dark mb-3">งานที่กำลังดำเนินการ ({activeJobs.length})</h2>
          <div className="space-y-4 mb-8">
            {activeJobs.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">ไม่มีงานที่รอดำเนินการ</div>
            ) : (
              activeJobs.map(job => (
                <div key={job.id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-military-dark">{job.vehicle_part?.vehicle?.vehicle_name || 'ยานพาหนะ'}</h3>
                        <StatusBadge status={job.status} />
                        {job.is_urgent && (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                            <AlertTriangle className="w-3 h-3" /> เร่งด่วน
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">อะไหล่: {job.vehicle_part?.part?.part_name_th || '-'}</p>
                      <p className="text-sm text-gray-500">ผู้แจ้ง: {job.reporter?.full_name || '-'}</p>
                      <p className="text-sm text-gray-500">วันที่แจ้ง: {new Date(job.request_date).toLocaleDateString('th-TH')}</p>
                      {job.report_details && <p className="text-sm text-gray-600 mt-2 italic">"{job.report_details}"</p>}
                      {job.admin_notes && <p className="text-xs text-military-olive mt-1">โน้ตแอดมิน: {job.admin_notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      {job.status === 'in_progress' && (
                        <>
                          <button onClick={() => updateStatus(job.id, 'requisitioning')} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded hover:bg-yellow-200 font-medium">ขอเบิกอะไหล่</button>
                          <button onClick={() => updateStatus(job.id, 'repairing')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 font-medium">เริ่มซ่อม</button>
                        </>
                      )}
                      {job.status === 'repairing' && (
                        <button onClick={() => updateStatus(job.id, 'awaiting_approval')} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 font-medium">ซ่อมเสร็จแล้ว</button>
                      )}
                      {job.status === 'requisitioning' && (
                        <button onClick={() => updateStatus(job.id, 'repairing')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 font-medium">อะไหล่มาแล้ว → ซ่อมต่อ</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Completed */}
          <h2 className="text-lg font-semibold text-military-dark mb-3">งานที่เสร็จสิ้น ({completedJobs.length})</h2>
          <div className="space-y-3">
            {completedJobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm p-4 opacity-75">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">{job.vehicle_part?.vehicle?.vehicle_name || '-'}</span>
                    <span className="text-gray-400 mx-2">|</span>
                    <span className="text-sm text-gray-500">{job.vehicle_part?.part?.part_name_th || '-'}</span>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
