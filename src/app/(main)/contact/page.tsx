'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function ContactPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('กรุณาเข้าสู่ระบบก่อน')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('general_requests').insert({
      user_id: user.id,
      request_type: 'contact_form',
      subject,
      details: message,
      status: 'pending',
    })

    if (insertError) {
      setError('เกิดข้อผิดพลาด: ' + insertError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="bg-white border-b-3 border-military-olive p-12 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-military-dark">ติดต่อเรา</h1>
          <p className="text-lg text-gray-600 mt-2">ส่งข้อเสนอแนะ หรือแจ้งปัญหาการใช้งาน</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-military-dark mb-6">แบบฟอร์มติดต่อ</h2>

              {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4">{error}</div>}

              {sent ? (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded">
                  <strong>ส่งข้อความสำเร็จ!</strong> ขอบคุณสำหรับข้อเสนอแนะ เจ้าหน้าที่จะติดต่อกลับ
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-military-dark mb-1">หัวข้อ</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-military-dark mb-1">รายละเอียด</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-military-olive text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50"
                  >
                    {loading ? 'กำลังส่ง...' : 'ส่งข้อความ'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-military-dark text-white px-4 py-3 font-semibold">ข้อมูลติดต่อ</div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="font-semibold text-military-dark flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-military-olive" /> ที่อยู่:
                  </p>
                  <p className="text-gray-600 text-sm mt-1">(ใส่ที่อยู่กองร้อย/หน่วยงาน)</p>
                </div>
                <div>
                  <p className="font-semibold text-military-dark flex items-center gap-2">
                    <Phone className="w-4 h-4 text-military-olive" /> โทรศัพท์:
                  </p>
                  <p className="text-gray-600 text-sm mt-1">02-XXX-XXXX</p>
                </div>
                <div>
                  <p className="font-semibold text-military-dark flex items-center gap-2">
                    <Mail className="w-4 h-4 text-military-olive" /> อีเมล:
                  </p>
                  <p className="text-gray-600 text-sm mt-1">contact@army.mil</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
