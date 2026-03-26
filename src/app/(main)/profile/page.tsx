'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'
import { UserCircle } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [rank, setRank] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    if (data) {
      setUser(data as User)
      setFullName(data.full_name || '')
      setEmail(data.email || '')
      setPhone(data.phone_number || '')
      setRank(data.rank || '')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!user) return
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName, phone_number: phone || null, rank: rank || null })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'อัปเดตข้อมูลสำเร็จ' })
      setEditing(false)
      loadProfile()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-military-olive border-t-transparent rounded-full" /></div>
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-military-dark text-white px-6 py-4 flex items-center gap-3">
          <UserCircle className="w-6 h-6" />
          <h1 className="text-lg font-semibold">โปรไฟล์ส่วนตัว</h1>
        </div>

        <div className="p-6">
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">ชื่อ-นามสกุล</label>
                {editing ? (
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
                ) : (
                  <p className="px-4 py-2.5 text-military-dark font-semibold">{user.full_name || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">อีเมล</label>
                <p className="px-4 py-2.5 text-gray-500">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">ยศ/ตำแหน่ง</label>
                {editing ? (
                  <input value={rank} onChange={(e) => setRank(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
                ) : (
                  <p className="px-4 py-2.5 text-military-dark">{user.rank || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">เบอร์โทรศัพท์</label>
                {editing ? (
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
                ) : (
                  <p className="px-4 py-2.5 text-military-dark">{user.phone_number || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">สังกัด</label>
                <p className="px-4 py-2.5 text-military-dark">{user.affiliation || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">บทบาท</label>
                <p className="px-4 py-2.5 text-military-dark capitalize">{user.role}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              {editing ? (
                <>
                  <button onClick={handleSave} className="bg-military-olive text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-hover transition">
                    บันทึก
                  </button>
                  <button onClick={() => setEditing(false)} className="px-6 py-2 rounded-lg border hover:bg-gray-50">
                    ยกเลิก
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="bg-military-olive text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-hover transition">
                  แก้ไขข้อมูล
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
