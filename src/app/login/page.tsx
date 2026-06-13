'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Eye, EyeOff } from 'lucide-react'

function Field({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-military-dark mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputClass(error?: string) {
  return `w-full px-4 py-2.5 border rounded-lg outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary ${
    error ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
  }`
}

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginTouched, setLoginTouched] = useState<Record<string, boolean>>({})
  const [showLoginPw, setShowLoginPw] = useState(false)

  // Register state
  const [reg, setReg] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '', rank: '', phone: '' })
  const [regTouched, setRegTouched] = useState<Record<string, boolean>>({})
  const [showRegPw, setShowRegPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const setRegField = (field: string, value: string) => setReg(r => ({ ...r, [field]: value }))
  const touchReg = (field: string) => setRegTouched(t => ({ ...t, [field]: true }))
  const touchLogin = (field: string) => setLoginTouched(t => ({ ...t, [field]: true }))

  // Login validation
  const loginErrors = {
    email: loginTouched.email && !loginEmail ? 'กรุณากรอกอีเมล' : '',
    password: loginTouched.password && !loginPassword ? 'กรุณากรอกรหัสผ่าน' : '',
  }

  // Register validation
  const pwLength = reg.password.length >= 8
  const pwLower = /[a-z]/.test(reg.password)
  const pwUpper = /[A-Z]/.test(reg.password)
  const pwSpecial = /[^a-zA-Z0-9]/.test(reg.password)
  const pwValid = pwLength && pwLower && pwUpper && pwSpecial

  const regErrors = {
    fullName: regTouched.fullName && !reg.fullName ? 'กรุณากรอกชื่อ-นามสกุล' : '',
    email: regTouched.email && !reg.email ? 'กรุณากรอกอีเมล' : regTouched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email) ? 'รูปแบบอีเมลไม่ถูกต้อง' : '',
    username: regTouched.username && !reg.username ? 'กรุณากรอก Username' : '',
    password: regTouched.password && !reg.password ? 'กรุณากรอกรหัสผ่าน' : regTouched.password && !pwValid ? 'รหัสผ่านไม่ผ่านเงื่อนไข' : '',
    confirmPassword: regTouched.confirmPassword && !reg.confirmPassword ? 'กรุณายืนยันรหัสผ่าน' : regTouched.confirmPassword && reg.password !== reg.confirmPassword ? 'รหัสผ่านไม่ตรงกัน' : '',
    phone: regTouched.phone && reg.phone && reg.phone.length < 9 ? 'เบอร์โทรไม่ถูกต้อง' : '',
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginTouched({ email: true, password: true })
    if (!loginEmail || !loginPassword) return
    setGlobalError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
    if (error) { setGlobalError('อีเมล หรือ รหัสผ่านไม่ถูกต้อง'); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegTouched({ fullName: true, email: true, username: true, password: true, confirmPassword: true, phone: true })
    if (!reg.fullName || !reg.email || !reg.username || !reg.password || !reg.confirmPassword) return
    if (!pwValid || reg.password !== reg.confirmPassword) return
    setGlobalError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: reg.email,
      password: reg.password,
      options: {
        data: {
          full_name: reg.fullName,
          username: reg.username,
          rank: reg.rank,
          phone_number: reg.phone,
          affiliation: 'โครงการ D11A',
        },
      },
    })
    if (error) { setGlobalError(error.message); setLoading(false); return }
    setSuccess('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี')
    setActiveTab('login')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-bg py-10 px-4">
      <div className="flex flex-col md:flex-row w-full max-w-[950px] rounded-2xl overflow-hidden shadow-2xl bg-white">
        {/* Branding Panel */}
        <div className="flex flex-col items-center justify-center bg-primary text-white p-10 flex-1 text-center">
          <Shield className="w-20 h-20 mb-5 opacity-90" />
          <h2 className="text-2xl font-bold mb-2">โครงการ D11A</h2>
          <p className="text-white/80 leading-relaxed">ระบบสำหรับบุคลากรภายในองค์กร<br />กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        {/* Form Panel */}
        <div className="flex-[1.2] p-8 md:p-10">
          {/* Tabs */}
          <div className="flex border-b-2 border-gray-200 mb-6">
            {(['login', 'register'] as const).map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setGlobalError('') }}
                className={`flex-1 pb-3 text-center font-semibold border-b-3 transition ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            ))}
          </div>

          {globalError && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm font-medium">{globalError}</div>}
          {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded mb-4 text-sm font-medium">{success}</div>}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="on" noValidate>
              <Field label="อีเมล" required error={loginErrors.email}>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onBlur={() => touchLogin('email')}
                  autoComplete="email"
                  placeholder="example@email.com"
                  className={inputClass(loginErrors.email)}
                />
              </Field>
              <Field label="รหัสผ่าน" required error={loginErrors.password}>
                <div className="relative">
                  <input
                    type={showLoginPw ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onBlur={() => touchLogin('password')}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={inputClass(loginErrors.password) + ' pr-10'}
                  />
                  <button type="button" onClick={() => setShowLoginPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <button type="submit" disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50">
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3" autoComplete="on" noValidate>
              <Field label="ชื่อ-นามสกุล" required error={regErrors.fullName}>
                <input type="text" value={reg.fullName}
                  onChange={(e) => setRegField('fullName', e.target.value)}
                  onBlur={() => touchReg('fullName')}
                  autoComplete="name" placeholder="ชื่อ นามสกุล"
                  className={inputClass(regErrors.fullName)} />
              </Field>

              <Field label="อีเมล" required error={regErrors.email}>
                <input type="email" value={reg.email}
                  onChange={(e) => setRegField('email', e.target.value)}
                  onBlur={() => touchReg('email')}
                  autoComplete="email" placeholder="example@email.com"
                  className={inputClass(regErrors.email)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="ยศ/ตำแหน่ง">
                  <input type="text" value={reg.rank}
                    onChange={(e) => setRegField('rank', e.target.value)}
                    autoComplete="organization-title" placeholder="ร้อยตรี / นักวิจัย"
                    className={inputClass()} />
                </Field>
                <Field label="เบอร์โทรศัพท์" error={regErrors.phone}>
                  <input type="tel" value={reg.phone}
                    onChange={(e) => setRegField('phone', e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={() => touchReg('phone')}
                    autoComplete="tel" placeholder="0812345678" maxLength={10}
                    className={inputClass(regErrors.phone)} />
                </Field>
              </div>

              <Field label="ชื่อผู้ใช้ (Username)" required error={regErrors.username}>
                <input type="text" value={reg.username}
                  onChange={(e) => setRegField('username', e.target.value.replace(/\s/g, ''))}
                  onBlur={() => touchReg('username')}
                  autoComplete="username" placeholder="ไม่มีช่องว่าง เช่น john_doe"
                  className={inputClass(regErrors.username)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="รหัสผ่าน" required error={regErrors.password}>
                  <div className="relative">
                    <input type={showRegPw ? 'text' : 'password'} value={reg.password}
                      onChange={(e) => setRegField('password', e.target.value)}
                      onBlur={() => touchReg('password')}
                      autoComplete="new-password" placeholder="••••••••"
                      className={inputClass(regErrors.password) + ' pr-10'} />
                    <button type="button" onClick={() => setShowRegPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="ยืนยันรหัสผ่าน" required error={regErrors.confirmPassword}>
                  <div className="relative">
                    <input type={showConfirmPw ? 'text' : 'password'} value={reg.confirmPassword}
                      onChange={(e) => setRegField('confirmPassword', e.target.value)}
                      onBlur={() => touchReg('confirmPassword')}
                      autoComplete="new-password" placeholder="••••••••"
                      className={inputClass(regErrors.confirmPassword) + ' pr-10'} />
                    <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
              </div>

              {/* Password rules */}
              {reg.password.length > 0 && (
                <ul className="text-xs space-y-1 pl-1 bg-gray-50 rounded-lg p-3 border">
                  {[
                    { ok: pwLength, label: 'อย่างน้อย 8 ตัวอักษร' },
                    { ok: pwLower, label: 'มีตัวพิมพ์เล็ก (a-z)' },
                    { ok: pwUpper, label: 'มีตัวพิมพ์ใหญ่ (A-Z)' },
                    { ok: pwSpecial, label: 'มีอักขระพิเศษ (!@#...)' },
                  ].map(({ ok, label }) => (
                    <li key={label} className={ok ? 'text-green-600' : 'text-red-500'}>
                      {ok ? '✓' : '✗'} {label}
                    </li>
                  ))}
                </ul>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-success text-white py-3 rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50">
                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
