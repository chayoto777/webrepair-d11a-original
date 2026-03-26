import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { AlertTriangle, Users, Car, Package } from 'lucide-react'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const affiliation = user?.affiliation

  // Stats
  const { count: pendingCount } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })

  const { count: partsCount } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true })

  // Recent pending requests
  const { data: pendingRequests } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      reporter:users!reported_by_user_id(full_name),
      vehicle_part:vehicle_parts(part:parts(part_name_th), vehicle:vehicles(vehicle_name))
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'คำร้องรอดำเนินการ', value: pendingCount || 0, icon: AlertTriangle, color: 'bg-red-600', href: '/admin/requests' },
    { label: 'ผู้ใช้ทั้งหมด', value: userCount || 0, icon: Users, color: 'bg-blue-600', href: '/admin/users' },
    { label: 'ยานพาหนะ', value: vehicleCount || 0, icon: Car, color: 'bg-green-600', href: '/admin/vehicles' },
    { label: 'อะไหล่ในคลัง', value: partsCount || 0, icon: Package, color: 'bg-yellow-600', href: '/admin/parts' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-military-dark mb-2">ภาพรวมระบบ</h1>
      <p className="text-gray-500 mb-6">Dashboard สำหรับผู้ดูแลระบบ</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`${stat.color} rounded-xl p-6 text-white relative overflow-hidden min-h-[160px] hover:-translate-y-1 transition shadow-sm`}>
              <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 opacity-20" />
              <div className="relative z-10">
                <p className="text-4xl font-bold">{stat.value}</p>
                <p className="text-lg font-medium mt-1">{stat.label}</p>
              </div>
              <Link href={stat.href} className="absolute bottom-0 left-0 right-0 bg-black/15 hover:bg-black/25 text-white text-sm px-4 py-2 transition">
                ดูรายละเอียด →
              </Link>
            </div>
          )
        })}
      </div>

      {/* Recent Pending */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-military-dark">คำร้องล่าสุดที่รอดำเนินการ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-military-dark text-white">
                <th className="px-4 py-3 text-left text-sm">วันที่</th>
                <th className="px-4 py-3 text-left text-sm">ผู้แจ้ง</th>
                <th className="px-4 py-3 text-left text-sm">ยานพาหนะ</th>
                <th className="px-4 py-3 text-left text-sm">อะไหล่</th>
                <th className="px-4 py-3 text-left text-sm">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!pendingRequests || pendingRequests.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">ไม่มีคำร้องรอดำเนินการ</td></tr>
              ) : (
                pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(req.request_date).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3 text-sm">{(req.reporter as any)?.full_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{(req.vehicle_part as any)?.vehicle?.vehicle_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{(req.vehicle_part as any)?.part?.part_name_th || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{req.report_details}</td>
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
