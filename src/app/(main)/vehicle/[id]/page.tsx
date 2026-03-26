'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import type { Vehicle, VehiclePart } from '@/types/database'
import { AlertTriangle, Plus, Trash2, Image as ImageIcon } from 'lucide-react'

export default function VehiclePage() {
  const { id } = useParams()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [vehicleParts, setVehicleParts] = useState<VehiclePart[]>([])
  const [allParts, setAllParts] = useState<{ id: string; part_name_th: string }[]>([])
  const [showReportForm, setShowReportForm] = useState<string | null>(null)
  const [reportDetails, setReportDetails] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Add part form
  const [showAddPart, setShowAddPart] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState('')
  const [installDate, setInstallDate] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const { data: v } = await supabase.from('vehicles').select('*').eq('id', id).single()
    setVehicle(v)

    const { data: vp } = await supabase
      .from('vehicle_parts')
      .select('*, part:parts(*)')
      .eq('vehicle_id', id)
      .order('install_date', { ascending: false })
    setVehicleParts(vp || [])

    const { data: parts } = await supabase.from('parts').select('id, part_name_th')
    setAllParts(parts || [])
    setLoading(false)
  }

  async function handleAddPart(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('vehicle_parts').insert({
      vehicle_id: id,
      part_id: selectedPartId,
      install_date: installDate,
      status: 'good',
    })
    if (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'เพิ่มอะไหล่สำเร็จ' })
      setShowAddPart(false)
      setSelectedPartId('')
      setInstallDate('')
      loadData()
    }
  }

  async function handleReport(vehiclePartId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('maintenance_requests').insert({
      vehicle_part_id: vehiclePartId,
      reported_by_user_id: user.id,
      report_details: reportDetails,
      is_urgent: isUrgent,
      status: 'pending',
      request_date: new Date().toISOString(),
    })

    if (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'แจ้งซ่อมสำเร็จ' })
      setShowReportForm(null)
      setReportDetails('')
      setIsUrgent(false)
    }
  }

  async function handleDeletePart(vpId: string) {
    if (!confirm('ต้องการลบอะไหล่นี้?')) return
    await supabase.from('vehicle_parts').delete().eq('id', vpId)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!vehicle) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">ไม่พบข้อมูลยานพาหนะ</div>
  }

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'good': return 'border-l-green-500'
      case 'worn': return 'border-l-yellow-500'
      case 'damaged': return 'border-l-red-500'
      default: return 'border-l-gray-300'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Vehicle Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-military-dark">{vehicle.vehicle_name}</h1>
        <p className="text-gray-500">{vehicle.license_plate}</p>
        <p className="text-sm text-military-olive mt-1">สังกัด: {vehicle.project_affiliation}</p>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Add Part Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-military-dark">รายการอะไหล่</h2>
        <button
          onClick={() => setShowAddPart(!showAddPart)}
          className="flex items-center gap-2 bg-military-olive text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover transition"
        >
          <Plus className="w-4 h-4" /> เพิ่มอะไหล่
        </button>
      </div>

      {/* Add Part Form */}
      {showAddPart && (
        <form onSubmit={handleAddPart} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-military-dark mb-1">เลือกอะไหล่</label>
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none"
                required
              >
                <option value="">-- เลือก --</option>
                {allParts.map((p) => (
                  <option key={p.id} value={p.id}>{p.part_name_th}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-military-dark mb-1">วันที่ติดตั้ง</label>
              <input
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-success text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-hover transition">
              บันทึก
            </button>
            <button type="button" onClick={() => setShowAddPart(false)} className="px-6 py-2 rounded-lg border hover:bg-gray-50">
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {/* Parts List */}
      <div className="space-y-4">
        {vehicleParts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            ยังไม่มีอะไหล่
          </div>
        ) : (
          vehicleParts.map((vp) => (
            <div
              key={vp.id}
              className={`bg-white rounded-lg shadow-sm border-l-4 ${getStatusBorderColor(vp.status)} p-4 hover:shadow-md transition`}
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                  {vp.part?.part_image_path ? (
                    <img src={vp.part.part_image_path} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-military-dark">{vp.part?.part_name_th}</h3>
                  <p className="text-sm text-gray-500">
                    ติดตั้ง: {new Date(vp.install_date).toLocaleDateString('th-TH')}
                  </p>
                  <StatusBadge status={vp.status as any} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReportForm(showReportForm === vp.id ? null : vp.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                  >
                    <AlertTriangle className="w-3 h-3" /> แจ้งซ่อม
                  </button>
                  <button
                    onClick={() => handleDeletePart(vp.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Report Form */}
              {showReportForm === vp.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="อธิบายปัญหาที่พบ..."
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none"
                    rows={3}
                    required
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="rounded"
                    />
                    เร่งด่วน
                  </label>
                  <button
                    onClick={() => handleReport(vp.id)}
                    className="bg-danger-red text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    ส่งแจ้งซ่อม
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
