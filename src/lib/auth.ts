import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/database'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  return profile as User | null
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(role: string): Promise<User> {
  const user = await requireAuth()
  if (user.role !== role && user.role !== 'admin') {
    throw new Error('Forbidden')
  }
  return user
}
