'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wrench, Package, ExternalLink, LogOut } from 'lucide-react'

const navItems = [
  { href: '/mechanic/dashboard', label: 'งานของฉัน', icon: LayoutDashboard },
  { href: '/mechanic/parts', label: 'ขอเบิกอะไหล่', icon: Package },
]

export default function MechanicSidebar({ username }: { username: string }) {
  const pathname = usePathname()

  return (
    <nav className="bg-military-dark text-white w-64 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          ระบบช่าง
        </h1>
        <p className="text-sm text-gray-400 mt-1">ช่าง: {username}</p>
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
        <Link href="/" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded">
          <ExternalLink className="w-4 h-4" /> ดูหน้าเว็บ
        </Link>
        <Link href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-400 hover:bg-gray-700 rounded">
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </Link>
      </div>
    </nav>
  )
}
