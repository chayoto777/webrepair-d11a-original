import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'

export default async function MyRequestsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: requests } = await supabase
    .from('general_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="bg-white border-b-3 border-military-olive p-12 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-military-dark">ตรวจสอบคำร้อง</h1>
          <p className="text-lg text-gray-600 mt-2">ติดตามสถานะคำร้องทั่วไปของคุณ</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-military-dark text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold">วันที่</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ประเภท</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">หัวข้อ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">สถานะ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">หมายเหตุจาก Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!requests || requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      ยังไม่มีคำร้อง
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(req.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-4 py-3 text-sm">{req.request_type}</td>
                      <td className="px-4 py-3 text-sm font-medium">{req.subject}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{req.admin_notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
