import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ระบบจัดการยานเกราะ D11A',
  description: 'ระบบแจ้งซ่อมและบริหารจัดการยานพาหนะ โครงการ D11A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
}
