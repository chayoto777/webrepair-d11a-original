import type { MaintenanceStatus, GeneralRequestStatus, RequisitionStatus, VehiclePartStatus } from '@/types/database'

const statusConfig: Record<string, { label: string; className: string }> = {
  good: { label: 'ปกติ', className: 'bg-green-100 text-green-800' },
  warning: { label: 'ใกล้หมดอายุ', className: 'bg-yellow-100 text-yellow-800' },
  expired: { label: 'หมดอายุ', className: 'bg-red-100 text-red-800' },
  pending: { label: 'รอดำเนินการ', className: 'bg-red-100 text-red-800' },
  awaiting_approval: { label: 'รออนุมัติ', className: 'bg-yellow-100 text-yellow-800' },
  requisitioning: { label: 'กำลังเบิกอะไหล่', className: 'bg-blue-100 text-blue-800' },
  repairing: { label: 'กำลังซ่อม', className: 'bg-orange-100 text-orange-800' },
  in_progress: { label: 'กำลังดำเนินการ', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'เสร็จสิ้น', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'ปฏิเสธ', className: 'bg-gray-100 text-gray-800' },
  approved: { label: 'อนุมัติแล้ว', className: 'bg-green-100 text-green-800' },
}

export default function StatusBadge({
  status,
}: {
  status: MaintenanceStatus | GeneralRequestStatus | RequisitionStatus | VehiclePartStatus
}) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
