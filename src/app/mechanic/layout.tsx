import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MechanicSidebar from '@/components/MechanicSidebar'

export default async function MechanicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'mechanic') redirect('/')

  return (
    <div className="flex min-h-screen">
      <MechanicSidebar username={user.full_name || user.username} />
      <main className="flex-1 bg-soft-bg p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
