'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Wrench, FileText, Users, Car, Package,
  ClipboardCheck, History, Newspaper, MessageSquare, ExternalLink, LogOut
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'จัดการคำร้องซ่อม', icon: Wrench },
  { href: '/admin/general-requests', label: 'จัดการคำร้องทั่วไป', icon: MessageSquare },
  { href: '/admin/posts', label: 'จัดการประกาศ', icon: Newspaper },
  { href: '/admin/users', label: 'จัดการผู้ใช้', icon: Users },
  { href: '/admin/vehicles', label: 'ยานพาหนะทั้งหมด', icon: Car },
  { href: '/admin/parts', label: 'คลังอะไหล่', icon: Package },
  { href: '/admin/requisitions', label: 'อนุมัติใบเบิก', icon: ClipboardCheck },
  { href: '/admin/logbook', label: 'ประวัติการซ่อม', icon: History },
]

export default function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname()

  return (
    <nav className="bg-military-dark text-white w-64 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5" />
          ระบบหลังบ้าน
        </h1>
        <p className="text-sm text-gray-400 mt-1">Admin: {username}</p>
      </div>

      <div className="flex-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
                active
                  ? 'bg-military-olive text-white font-semibold'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-gray-700 p-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded"
        >
          <ExternalLink className="w-4 h-4" /> ดูหน้าเว็บ
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-400 hover:bg-gray-700 rounded"
        >
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </Link>
      </div>
    </nav>
  )
}
