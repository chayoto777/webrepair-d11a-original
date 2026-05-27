import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ระบบจัดการยานเกราะ M113',
  description: 'ระบบแจ้งซ่อมและบริหารจัดการยานพาหนะ โครงการ M113',
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
