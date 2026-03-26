'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RequestPage() {
  const [reqType, setReqType] = useState('')
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('กรุณาเข้าสู่ระบบ'); setLoading(false); return }

    const { error: err } = await supabase.from('general_requests').insert({
      user_id: user.id,
      request_type: reqType,
      subject,
      details,
      status: 'pending',
    })

    if (err) setError(err.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div>
      <div className="bg-white border-b-3 border-military-olive p-12 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-military-dark">ส่งคำร้องทั่วไป</h1>
          <p className="text-lg text-gray-600 mt-2">กรอกข้อมูลเพื่อส่งคำร้องถึงผู้ดูแลระบบ</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4">{error}</div>}

          {sent ? (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded text-center">
              <strong>ส่งคำร้องสำเร็จ!</strong>
              <p className="mt-2">เจ้าหน้าที่จะดำเนินการตรวจสอบคำร้องของคุณ</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">ประเภทคำร้อง</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none"
                  required
                >
                  <option value="">-- เลือกประเภท --</option>
                  <option value="general">ทั่วไป</option>
                  <option value="suggestion">ข้อเสนอแนะ</option>
                  <option value="bug_report">แจ้งปัญหาระบบ</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">หัวข้อ</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">รายละเอียด</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-military-olive text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50"
              >
                {loading ? 'กำลังส่ง...' : 'ส่งคำร้อง'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
