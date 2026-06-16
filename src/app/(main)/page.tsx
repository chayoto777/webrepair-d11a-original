import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight } from 'lucide-react'
import CalendarWidget from '@/components/CalendarWidget'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*, author:users(full_name)')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-military-dark text-white py-20 px-4">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url('/images/hero-banner.jpg')" }}
        />
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            ระบบจัดการยานเกราะ D11A
          </h1>
          <p className="text-xl text-gray-200 mb-8 drop-shadow">
            โครงการ D11A
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-military-olive text-white px-6 py-3 rounded-lg font-semibold border-2 border-military-khaki hover:bg-primary-hover transition shadow-lg"
          >
            เข้าสู่ระบบจัดการ <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-military-dark mb-6">ข่าวสารและประกาศ</h2>

            {!posts || posts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm">
                <p>ยังไม่มีข่าวสารในขณะนี้</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition hover:-translate-y-0.5 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {post.featured_image_path ? (
                      <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${post.featured_image_path})` }} />
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                        ไม่มีรูปภาพ
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-semibold text-military-dark text-lg mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(post.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </p>
                      <Link
                        href={`/article/${post.id}`}
                        className="text-military-olive text-sm font-semibold hover:underline"
                      >
                        อ่านเพิ่มเติม →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calendar Card */}
            <CalendarWidget />

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-military-dark text-white px-4 py-3 font-semibold">
                ลิงก์ด่วน
              </div>
              <div className="divide-y">
                <Link href="/dashboard" className="block px-4 py-3 text-sm hover:bg-gray-50 text-military-dark">
                  จัดการยานเกราะ
                </Link>
                <Link href="/request" className="block px-4 py-3 text-sm hover:bg-gray-50 text-military-dark">
                  ส่งคำร้องทั่วไป
                </Link>
                <Link href="/my-requests" className="block px-4 py-3 text-sm hover:bg-gray-50 text-military-dark">
                  ตรวจสอบคำร้อง
                </Link>
                <Link href="/documents" className="block px-4 py-3 text-sm hover:bg-gray-50 text-military-dark">
                  ดาวน์โหลดเอกสาร
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
