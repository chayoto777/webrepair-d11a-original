'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, UserRole } from '@/types/database'
import { Trash2, Shield, Users as UsersIcon, Wrench } from 'lucide-react'

const roleIcons: Record<UserRole, any> = { admin: Shield, user: UsersIcon, mechanic: Wrench }
const roleColors: Record<UserRole, string> = { admin: 'bg-red-100 text-red-700', user: 'bg-blue-100 text-blue-700', mechanic: 'bg-yellow-100 text-yellow-700' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    setUsers((data as User[]) || [])
    setLoading(false)
  }

  async function changeRole(id: string, role: UserRole) {
    const supabase = createClient()
    await supabase.from('users').update({ role }).eq('id', id)
    loadData()
  }

  async function deleteUser(id: string) {
    if (!confirm('ต้องการลบผู้ใช้นี้?')) return
    const supabase = createClient()
    await supabase.from('users').delete().eq('id', id)
    loadData()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-military-dark mb-2">จัดการผู้ใช้</h1>
      <p className="text-gray-500 mb-6">ดูและจัดการบัญชีผู้ใช้ทั้งหมด</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-military-dark text-white">
            <th className="px-4 py-3 text-left text-sm">ชื่อ</th>
            <th className="px-4 py-3 text-left text-sm">อีเมล</th>
            <th className="px-4 py-3 text-left text-sm">สังกัด</th>
            <th className="px-4 py-3 text-left text-sm">บทบาท</th>
            <th className="px-4 py-3 text-left text-sm">จัดการ</th>
          </tr></thead>
          <tbody className="divide-y">
            {users.map(u => {
              const Icon = roleIcons[u.role]
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{u.full_name || u.username}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{u.affiliation || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${roleColors[u.role]}`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="mechanic">Mechanic</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
