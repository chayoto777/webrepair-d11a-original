import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen">
      <AdminSidebar username={user.username} />
      <main className="flex-1 bg-soft-bg p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
