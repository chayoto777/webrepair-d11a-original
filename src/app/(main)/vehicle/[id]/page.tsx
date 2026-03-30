'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import type { VehiclePart } from '@/types/database'
import { AlertTriangle, Trash2, Image as ImageIcon, X, BookOpen, ChevronLeft, CheckCircle2 } from 'lucide-react'

interface Vehicle {
  id: string
  vehicle_name: string
  license_plate: string
  vehicle_image_path: string | null
  project_affiliation: string | null
}

export default function VehiclePage() {
  const { id } = useParams()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [vehicleParts, setVehicleParts] = useState<VehiclePart[]>([])
  const [allParts, setAllParts] = useState<{ id: string; part_name_th: string }[]>([])
  const [showReportForm, setShowReportForm] = useState<string | null>(null)
  const [reportDetails, setReportDetails] = useState<{ [key: string]: string }>({})
  const [isUrgent, setIsUrgent] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [guideModal, setGuideModal] = useState<VehiclePart | null>(null)
  const [successModal, setSuccessModal] = useState<{ text: string; urgent: boolean } | null>(null)

  // General report form (top)
  const [generalPartId, setGeneralPartId] = useState('')
  const [generalDetails, setGeneralDetails] = useState('')
  const [generalUrgent, setGeneralUrgent] = useState(false)

  // Add part form
  const [selectedPartId, setSelectedPartId] = useState('')
  const [installDate, setInstallDate] = useState(new Date().toISOString().split('T')[0])

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [id])

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  async function loadData() {
    setLoading(true)
    const { data: v } = await supabase.from('vehicles').select('*').eq('id', id).single()
    setVehicle(v)

    const { data: vp } = await supabase
      .from('vehicle_parts')
      .select('*, part:parts(*)')
      .eq('vehicle_id', id)
      .order('install_date', { ascending: false })

    // Auto-update status based on install_date + lifespan
    const today = new Date()
    for (const vpart of vp || []) {
      if (!vpart.install_date || !vpart.part?.standard_lifespan_days) continue
      const installDate = new Date(vpart.install_date)
      const lifespan = vpart.part.standard_lifespan_days
      const daysSince = Math.floor((today.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24))
      let newStatus = 'good'
      if (daysSince >= lifespan) newStatus = 'expired'
      else if (daysSince >= lifespan * 0.8) newStatus = 'warning'
      if (newStatus !== vpart.status) {
        await supabase.from('vehicle_parts').update({ status: newStatus }).eq('id', vpart.id)
        vpart.status = newStatus
      }
    }

    setVehicleParts(vp || [])

    const { data: parts } = await supabase
      .from('parts')
      .select('id, part_name_th')
      .neq('part_id', 'guest_info')
      .order('part_name_th')
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
      setSelectedPartId('')
      setInstallDate(new Date().toISOString().split('T')[0])
      loadData()
    }
  }

  async function handleReport(vehiclePartId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const details = reportDetails[vehiclePartId] || ''
    if (!details.trim()) return
    const { error } = await supabase.from('maintenance_requests').insert({
      vehicle_part_id: vehiclePartId,
      reported_by_user_id: user.id,
      report_details: details,
      is_urgent: isUrgent[vehiclePartId] || false,
      status: 'pending',
      request_date: new Date().toISOString(),
    })
    if (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + error.message })
    } else {
      setSuccessModal({ text: 'ส่งคำร้องแจ้งซ่อมเรียบร้อย', urgent: isUrgent[vehiclePartId] || false })
      setShowReportForm(null)
      setReportDetails(prev => ({ ...prev, [vehiclePartId]: '' }))
      setIsUrgent(prev => ({ ...prev, [vehiclePartId]: false }))
    }
  }

  async function handleGeneralReport(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('maintenance_requests').insert({
      vehicle_part_id: generalPartId,
      reported_by_user_id: user.id,
      report_details: generalDetails,
      is_urgent: generalUrgent,
      status: 'pending',
      request_date: new Date().toISOString(),
    })
    if (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + error.message })
    } else {
      setSuccessModal({ text: 'ส่งคำร้องแจ้งซ่อมเรียบร้อย', urgent: generalUrgent })
      setGeneralPartId('')
      setGeneralDetails('')
      setGeneralUrgent(false)
    }
  }

  async function handleDeletePart(vpId: string, partName: string) {
    if (!confirm(`คุณแน่ใจหรือไม่ ว่าต้องการลบอะไหล่ '${partName}' ออกจากรถคันนี้?\n\n(การกระทำนี้จะลบประวัติการแจ้งซ่อมของอะไหล่ชิ้นนี้ทั้งหมด!)`)) return
    await supabase.from('vehicle_parts').delete().eq('id', vpId)
    setMessage({ type: 'success', text: 'ลบอะไหล่เรียบร้อย' })
    loadData()
  }

  function getImageUrl(path: string | null | undefined) {
    if (!path || path === 'no data') return null
    if (path.startsWith('http')) return path
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${path}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          ไม่พบยานพาหนะ หรือคุณไม่มีสิทธิ์เข้าถึง
        </div>
      </div>
    )
  }

  const vehicleImageUrl = getImageUrl(vehicle.vehicle_image_path)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Alert Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg border-l-4 flex justify-between items-center ${
          message.type === 'error'
            ? 'bg-red-50 border-red-500 text-red-700'
            : 'bg-green-50 border-green-500 text-green-700'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Vehicle Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Vehicle Image */}
          <div className="md:w-1/3">
            {vehicleImageUrl ? (
              <img
                src={vehicleImageUrl}
                alt={vehicle.vehicle_name}
                className="w-full rounded-lg shadow-sm object-cover aspect-video"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Vehicle Info + Add Part Form */}
          <div className="md:w-2/3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-military-olive mb-2"
            >
              <ChevronLeft className="w-4 h-4" /> กลับ Dashboard
            </button>
            <h2 className="text-2xl font-bold text-military-dark">{vehicle.vehicle_name}</h2>
            <p className="text-gray-500 mb-1">{vehicle.license_plate}</p>
            <hr className="my-3" />

            {/* Add Part Form */}
            <form onSubmit={handleAddPart} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-semibold text-military-dark mb-1">เพิ่มอะไหล่</label>
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  required
                >
                  <option value="">-- เลือกอะไหล่ --</option>
                  {allParts.map((p) => (
                    <option key={p.id} value={p.id}>{p.part_name_th}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[150px]">
                <label className="block text-sm font-semibold text-military-dark mb-1">วันที่ติดตั้ง</label>
                <input
                  type="date"
                  value={installDate}
                  onChange={(e) => setInstallDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
              >
                เพิ่ม
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* General Report Box */}
      <div className="bg-white rounded-xl shadow-sm mb-5 overflow-hidden">
        <div className="bg-red-600 text-white px-5 py-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <h5 className="font-semibold">แจ้งซ่อมยานพาหนะ (แบบเลือกอะไหล่)</h5>
        </div>
        <div className="p-5">
          {vehicleParts.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm">
              คุณต้อง "เพิ่มอะไหล่" เข้าไปในรถคันนี้ก่อน จึงจะสามารถแจ้งซ่อมได้
            </div>
          ) : (
            <form onSubmit={handleGeneralReport} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-military-dark mb-1">1. เลือกอะไหล่ที่เสียหาย</label>
                  <select
                    value={generalPartId}
                    onChange={(e) => setGeneralPartId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                    required
                  >
                    <option value="">-- กรุณาเลือกอะไหล่ --</option>
                    {vehicleParts.map((vp) => (
                      <option key={vp.id} value={vp.id}>{vp.part?.part_name_th}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-military-dark mb-1">2. กรอกรายละเอียดปัญหา</label>
                  <input
                    type="text"
                    value={generalDetails}
                    onChange={(e) => setGeneralDetails(e.target.value)}
                    placeholder="เช่น: ยางแบน, แบตเสื่อม, สตาร์ทไม่ติด"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generalUrgent}
                    onChange={(e) => setGeneralUrgent(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> แจ้งเป็นกรณีเร่งด่วน
                  </span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                ส่งคำร้องแจ้งซ่อม
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Parts List */}
      <h3 className="text-lg font-bold text-military-dark mb-3">
        รายการอะไหล่ที่ติดตั้งในรถคันนี้ (แจ้งซ่อมรายชิ้น)
      </h3>

      {vehicleParts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          ยังไม่มีการเพิ่มอะไหล่สำหรับรถคันนี้
        </div>
      ) : (
        <div className="space-y-3">
          {vehicleParts.map((vp) => {
            const partImageUrl = getImageUrl(vp.part?.part_image_path)
            return (
              <div key={vp.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Part Info */}
                  <div className="flex items-center gap-3 md:w-1/2">
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border flex-shrink-0">
                      {partImageUrl ? (
                        <img
                          src={partImageUrl}
                          alt={vp.part?.part_name_th}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/100x100/e9ecef/adb5bd?text=${encodeURIComponent(vp.part?.part_name_th || '')}` }}
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-semibold text-military-dark">{vp.part?.part_name_th}</h5>
                      <p className="text-xs text-gray-500 mb-1">
                        ติดตั้งเมื่อ: {new Date(vp.install_date).toLocaleDateString('th-TH')}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={vp.status as any} />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          (vp.part as any)?.quantity === 0
                            ? 'bg-red-100 text-red-700'
                            : (vp.part as any)?.quantity <= 3
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          คงเหลือ: {(vp.part as any)?.quantity ?? '-'} ชิ้น
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:w-1/2 flex flex-col gap-2 justify-center">
                    {/* Quick Report Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={reportDetails[vp.id] || ''}
                        onChange={(e) => setReportDetails(prev => ({ ...prev, [vp.id]: e.target.value }))}
                        placeholder="แจ้งปัญหา (เช่น: ยางแบน, แบตเสื่อม)"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                      />
                      <button
                        onClick={() => handleReport(vp.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition whitespace-nowrap"
                      >
                        แจ้งปัญหา
                      </button>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUrgent[vp.id] || false}
                        onChange={(e) => setIsUrgent(prev => ({ ...prev, [vp.id]: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> แจ้งเป็นกรณีเร่งด่วน
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGuideModal(vp)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition"
                      >
                        <BookOpen className="w-4 h-4" /> ดูวิธีบำรุงรักษาเบื้องต้น
                      </button>
                      <button
                        onClick={() => handleDeletePart(vp.id, vp.part?.part_name_th || '')}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 border border-red-300 text-red-500 rounded-lg text-sm hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" /> ลบอะไหล่นี้ออกจากรถ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Success Report Modal */}
      {successModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSuccessModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-military-dark mb-2">แจ้งปัญหาเรียบร้อย!</h3>
            <p className="text-gray-500 text-sm mb-1">ระบบได้รับคำร้องแจ้งซ่อมของคุณแล้ว</p>
            {successModal.urgent && (
              <p className="text-red-600 text-sm font-semibold flex items-center justify-center gap-1 mt-1">
                <AlertTriangle className="w-4 h-4" /> ถูกส่งเป็นกรณีเร่งด่วน
              </p>
            )}
            <p className="text-gray-400 text-xs mt-3 mb-6">ช่างจะดำเนินการตรวจสอบโดยเร็วที่สุด</p>
            <button
              onClick={() => setSuccessModal(null)}
              className="w-full bg-military-olive text-white py-2.5 rounded-lg font-semibold hover:bg-primary transition"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}

      {/* Maintenance Guide Modal */}
      {guideModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setGuideModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h5 className="font-bold text-military-dark">วิธีบำรุงรักษา: {guideModal.part?.part_name_th}</h5>
              <button onClick={() => setGuideModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line max-h-80 overflow-y-auto">
              {(guideModal.part as any)?.part_text_th || 'ไม่มีข้อมูลการบำรุงรักษา'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
