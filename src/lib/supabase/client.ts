import { createBrowserClient } from '@supabase/ssr'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const SUPABASE_URL = rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co'
const SUPABASE_KEY = rawKey.length > 20 ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}
