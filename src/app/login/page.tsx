'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [regFullName, setRegFullName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regRank, setRegRank] = useState('')
  const [regPhone, setRegPhone] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (error) {
      setError('อีเมล หรือ รหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (regPassword.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      setLoading(false)
      return
    }

    if (regPassword !== regConfirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          full_name: regFullName,
          username: regUsername,
          rank: regRank,
          phone_number: regPhone,
          affiliation: 'โครงการวิจัยและพัฒนาจรวดหลายลำกล้องนำวิถี (D11A)',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี')
    setActiveTab('login')
    setLoading(false)
  }

  // Password validation
  const pwLength = regPassword.length >= 8
  const pwLower = /[a-z]/.test(regPassword)
  const pwUpper = /[A-Z]/.test(regPassword)
  const pwSpecial = /[^a-zA-Z0-9]/.test(regPassword)

  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-bg py-10 px-4">
      <div className="flex flex-col md:flex-row w-full max-w-[950px] rounded-2xl overflow-hidden shadow-2xl bg-white">
        {/* Branding Panel */}
        <div className="flex flex-col items-center justify-center bg-primary text-white p-10 flex-1 text-center">
          <Shield className="w-20 h-20 mb-5 opacity-90" />
          <h2 className="text-2xl font-bold mb-2">
            โครงการวิจัยและพัฒนาจรวดหลายลำกล้องนำวิถี (D11A)
          </h2>
          <p className="text-white/80 leading-relaxed">
            ระบบสำหรับบุคลากรภายในองค์กร<br />กรุณาเข้าสู่ระบบเพื่อใช้งาน
          </p>
        </div>

        {/* Form Panel */}
        <div className="flex-[1.2] p-8 md:p-10">
          {/* Tabs */}
          <div className="flex border-b-2 border-gray-200 mb-6">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 pb-3 text-center font-semibold border-b-3 transition ${
                activeTab === 'login'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`flex-1 pb-3 text-center font-semibold border-b-3 transition ${
                activeTab === 'register'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded mb-4 text-sm font-medium">
              {success}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">อีเมล</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>

            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">อีเมล <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-military-dark mb-1">ยศ/ตำแหน่ง</label>
                  <input
                    type="text"
                    value={regRank}
                    onChange={(e) => setRegRank(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-military-dark mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={10}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-military-dark mb-1">ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.replace(/\s/g, ''))}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-military-dark mb-1">รหัสผ่าน <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-military-dark mb-1">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  required
                />
              </div>
              <ul className="text-xs space-y-1 pl-1">
                <li className={pwLength ? 'text-success' : 'text-red-500'}>{pwLength ? '✓' : '✗'} อย่างน้อย 8 ตัวอักษร</li>
                <li className={pwLower ? 'text-success' : 'text-red-500'}>{pwLower ? '✓' : '✗'} มีตัวพิมพ์เล็ก (a-z)</li>
                <li className={pwUpper ? 'text-success' : 'text-red-500'}>{pwUpper ? '✓' : '✗'} มีตัวพิมพ์ใหญ่ (A-Z)</li>
                <li className={pwSpecial ? 'text-success' : 'text-red-500'}>{pwSpecial ? '✓' : '✗'} มีอักขระพิเศษ (!@#)</li>
              </ul>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-success text-white py-3 rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50"
              >
                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
