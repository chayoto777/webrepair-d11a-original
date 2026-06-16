import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { Car, Settings, AlertCircle } from 'lucide-react'
import { getImageUrl } from '@/lib/storage'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Fetch vehicle (project has only one)
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .order('id')
    .limit(1)
    .maybeSingle()

  // Fetch maintenance requests for user's vehicle
  const { data: requests } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      vehicle_part:vehicle_parts(
        *,
        part:parts(*),
        vehicle:vehicles(*)
      )
    `)
    .eq('reported_by_user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-military-dark mb-6">
        ยานพาหนะประจำโครงการ (Dashboard)
      </h2>

      {/* Vehicle Card */}
      <div className="flex justify-center mb-8">
        {vehicle ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-2xl w-full hover:shadow-md transition">
            {getImageUrl(vehicle.vehicle_image_path) ? (
              <div
                className="h-60 bg-cover bg-center"
                style={{ backgroundImage: `url(${getImageUrl(vehicle.vehicle_image_path)})` }}
              />
            ) : (
              <div className="h-60 bg-gray-100 flex items-center justify-center text-gray-400">
                <Car className="w-12 h-12" />
              </div>
            )}
            <div className="p-5">
              <h5 className="text-lg font-semibold text-military-dark">{vehicle.vehicle_name}</h5>
              <p className="text-gray-500">{vehicle.license_plate}</p>
              <p className="text-sm text-military-olive mt-2">
                <Settings className="w-4 h-4 inline mr-1" />
                สังกัดโครงการ: {vehicle.project_affiliation}
              </p>
            </div>
            <div className="px-5 pb-5">
              <Link
                href={`/vehicle/${vehicle.id}`}
                className="block w-full text-center bg-military-olive text-white py-3 rounded-lg font-semibold hover:bg-primary-hover transition"
              >
                <Settings className="w-4 h-4 inline mr-1" /> จัดการอะไหล่ และ แจ้งซ่อม
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500 max-w-2xl w-full">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-military-khaki" />
            <p>ไม่พบยานพาหนะสำหรับโครงการของคุณ</p>
            <p className="text-sm mt-1">(สังกัด: {user.affiliation || 'N/A'})</p>
          </div>
        )}
      </div>

      {/* Maintenance Requests Table */}
      <hr className="my-8 border-military-khaki" />
      <h2 className="text-2xl font-bold text-military-dark mb-4">
        ติดตามสถานะการแจ้งซ่อม
      </h2>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-military-dark text-white">
                <th className="px-4 py-3 text-left text-sm font-semibold">วันที่แจ้ง</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">ยานพาหนะ</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">อะไหล่</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">รายละเอียด</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!requests || requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    ยังไม่มีคำร้องแจ้งซ่อม
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(req.request_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {req.vehicle_part?.vehicle?.vehicle_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {req.vehicle_part?.part?.part_name_th || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {req.report_details}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
