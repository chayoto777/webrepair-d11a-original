'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Bell, User as UserIcon, LogOut, Settings, Shield, Wrench, ChevronDown } from 'lucide-react'
import type { User } from '@/types/database'

interface NotificationItem {
  id: string
  message: string
  href: string
  date: string
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
        if (profile) {
          setUser(profile as User)
          loadNotifications(profile as User)
        }
      }
    }
    loadUser()
  }, [])

  async function loadNotifications(profile: User) {
    const supabase = createClient()
    const items: NotificationItem[] = []

    if (profile.role === 'admin') {
      const [{ data: pending }, { data: requisitions }] = await Promise.all([
        supabase.from('maintenance_requests').select('id, request_date').eq('status', 'pending').order('request_date', { ascending: false }).limit(5),
        supabase.from('part_requisitions').select('id, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      ])
      for (const r of pending || []) {
        items.push({ id: `m${r.id}`, message: 'มีคำร้องแจ้งซ่อมรอดำเนินการ', href: '/admin/requests', date: r.request_date })
      }
      for (const r of requisitions || []) {
        items.push({ id: `q${r.id}`, message: 'มีคำขอเบิกอะไหล่รออนุมัติ', href: '/admin/requisitions', date: r.created_at })
      }

    } else if (profile.role === 'mechanic') {
      const { data: assigned } = await supabase
        .from('maintenance_requests')
        .select('id, request_date, vehicle_part:vehicle_parts(part:parts(part_name_th))')
        .eq('assigned_to_user_id', profile.id)
        .in('status', ['in_progress', 'repairing', 'requisitioning'])
        .order('request_date', { ascending: false })
        .limit(5)
      for (const r of assigned || []) {
        const partName = (r.vehicle_part as any)?.part?.part_name_th || 'อะไหล่'
        items.push({ id: `m${r.id}`, message: `งานซ่อม: ${partName}`, href: '/mechanic/dashboard', date: r.request_date })
      }

    } else {
      const [{ data: maintenance }, { data: general }] = await Promise.all([
        supabase.from('maintenance_requests').select('id, request_date, status')
          .eq('reported_by_user_id', profile.id)
          .not('status', 'eq', 'pending')
          .order('request_date', { ascending: false }).limit(5),
        supabase.from('general_requests').select('id, created_at, status, subject')
          .eq('user_id', profile.id)
          .not('status', 'eq', 'pending')
          .order('created_at', { ascending: false }).limit(5),
      ])
      const statusLabel: Record<string, string> = {
        in_progress: 'กำลังดำเนินการ', repairing: 'กำลังซ่อม',
        completed: 'เสร็จสิ้น', rejected: 'ถูกปฏิเสธ',
        awaiting_approval: 'รออนุมัติ', requisitioning: 'รอเบิกอะไหล่',
      }
      for (const r of maintenance || []) {
        items.push({ id: `m${r.id}`, message: `คำร้องซ่อม: ${statusLabel[r.status] || r.status}`, href: '/dashboard', date: r.request_date })
      }
      for (const r of general || []) {
        items.push({ id: `g${r.id}`, message: `คำร้อง "${r.subject}": ${statusLabel[r.status] || r.status}`, href: '/my-requests', date: r.created_at })
      }
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setNotifications(items.slice(0, 8))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path
  const navLinkClass = (path: string) =>
    `px-3 py-2 text-sm font-medium border-b-3 transition-all ${
      isActive(path)
        ? 'text-military-olive border-military-olive font-semibold'
        : 'text-gray-700 border-transparent hover:text-military-olive'
    }`

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-military-olive font-semibold text-lg">
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">ระบบแจ้งซ่อมยานเกราะ D11A</span>
              <span className="sm:hidden">D11A</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <Link href="/" className={navLinkClass('/')}>ข่าวสาร</Link>
            {user && <Link href="/dashboard" className={navLinkClass('/dashboard')}>จัดการยานเกราะ</Link>}
            <div className="relative">
              <button onClick={() => setServicesMenuOpen(!servicesMenuOpen)} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-military-olive flex items-center gap-1">
                บริการอื่นๆ <ChevronDown className="w-3 h-3" />
              </button>
              {servicesMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setServicesMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border z-20">
                    <Link href="/request" className="block px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => setServicesMenuOpen(false)}>ส่งคำร้องทั่วไป</Link>
                    <Link href="/my-requests" className="block px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => setServicesMenuOpen(false)}>ตรวจสอบคำร้อง</Link>
                    <Link href="/documents" className="block px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => setServicesMenuOpen(false)}>ดาวน์โหลดเอกสาร</Link>
                  </div>
                </>
              )}
            </div>
            <Link href="/about" className={navLinkClass('/about')}>เกี่ยวกับเรา</Link>
            <Link href="/contact" className={navLinkClass('/contact')}>ติดต่อเรา</Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 text-gray-500 hover:text-military-olive"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-danger-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                      <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-lg border z-20 overflow-hidden">
                        <div className="bg-military-dark text-white px-4 py-3 font-semibold text-sm flex justify-between items-center">
                          <span>การแจ้งเตือน</span>
                          {notifications.length > 0 && (
                            <span className="bg-danger-red text-xs rounded-full px-2 py-0.5">{notifications.length}</span>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto divide-y">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500 text-sm">ไม่มีการแจ้งเตือน</div>
                          ) : (
                            notifications.map(n => (
                              <Link
                                key={n.id}
                                href={n.href}
                                onClick={() => setNotifOpen(false)}
                                className="block px-4 py-3 hover:bg-gray-50 transition"
                              >
                                <p className="text-sm text-gray-800">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(n.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-military-olive">
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden md:inline">สวัสดี, {user.username}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border z-20">
                        {user.role === 'admin' && (
                          <Link href="/admin/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm bg-military-dark text-white hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                            <Shield className="w-4 h-4" /> ระบบหลังบ้าน
                          </Link>
                        )}
                        {user.role === 'mechanic' && (
                          <Link href="/mechanic/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <Wrench className="w-4 h-4" /> งานของฉัน
                          </Link>
                        )}
                        {(user.role === 'user' || user.role === 'admin') && (
                          <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <Settings className="w-4 h-4" /> Dashboard ส่วนตัว
                          </Link>
                        )}
                        <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                          <UserIcon className="w-4 h-4" /> โปรไฟล์ส่วนตัว
                        </Link>
                        <hr className="my-1" />
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-danger-red hover:bg-red-50">
                          <LogOut className="w-4 h-4" /> ออกจากระบบ
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="bg-military-olive text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover transition">
                เข้าสู่ระบบ
              </Link>
            )}

            {/* Mobile menu button */}
            <button className="lg:hidden p-2 text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 border-t">
            <div className="flex flex-col gap-1 pt-2">
              <Link href="/" className="px-3 py-2 text-sm hover:bg-gray-50 rounded" onClick={() => setMobileOpen(false)}>ข่าวสาร</Link>
              {user && <Link href="/dashboard" className="px-3 py-2 text-sm hover:bg-gray-50 rounded" onClick={() => setMobileOpen(false)}>จัดการยานเกราะ</Link>}
              <Link href="/request" className="px-3 py-2 text-sm hover:bg-gray-50 rounded" onClick={() => setMobileOpen(false)}>ส่งคำร้องทั่วไป</Link>
              <Link href="/my-requests" className="px-3 py-2 text-sm hover:bg-gray-50 rounded" onClick={() => setMobileOpen(false)}>ตรวจสอบคำร้อง</Link>
              <Link href="/about" className="px-3 py-2 text-sm hover:bg-gray-50 rounded" onClick={() => setMobileOpen(false)}>เกี่ยวกับเรา</Link>
              <Link href="/contact" className="px-3 py-2 text-sm hover:bg-gray-50 rounded" onClick={() => setMobileOpen(false)}>ติดต่อเรา</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
