export function getImageUrl(path: string | null | undefined): string | null {
  if (!path || path === 'no data') return null
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) return path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${path}`
}
