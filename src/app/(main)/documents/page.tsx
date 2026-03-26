'use client'

import { FileText, Download } from 'lucide-react'

const documents = [
  {
    title: 'คู่มือการใช้งานเว็บแอปพลิเคชัน',
    type: 'คู่มือระบบ',
    date: '01/11/2025',
    url: '/api/pdf?type=web',
    icon: 'ppt',
  },
  {
    title: 'คู่มือการบำรุงรักษารถ A',
    type: 'คู่มือบำรุงรักษา',
    date: '01/11/2025',
    url: '/api/pdf?type=a',
    icon: 'pdf',
  },
  {
    title: 'คู่มือการบำรุงรักษารถ B',
    type: 'คู่มือบำรุงรักษา',
    date: '01/11/2025',
    url: '/api/pdf?type=b',
    icon: 'pdf',
  },
  {
    title: 'คู่มือการบำรุงรักษารถ C',
    type: 'คู่มือบำรุงรักษา',
    date: '01/11/2025',
    url: '/api/pdf?type=c',
    icon: 'pdf',
  },
]

export default function DocumentsPage() {
  return (
    <>
      {/* Banner */}
      <div className="bg-white border-b shadow-sm py-10 mb-6">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-military-dark">คลังเอกสารคู่มือ</h1>
          <p className="text-gray-500 mt-1">ศูนย์รวมคู่มือการใช้งานระบบ และคู่มือการบำรุงรักษารถ</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-military-dark text-white text-sm">
                <th className="text-left px-6 py-3 font-semibold">ชื่อเอกสาร</th>
                <th className="text-left px-6 py-3 font-semibold">ประเภท</th>
                <th className="text-left px-6 py-3 font-semibold">วันที่อัปเดต</th>
                <th className="text-right px-6 py-3 font-semibold">ดาวน์โหลด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.url} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className={`w-5 h-5 shrink-0 ${doc.icon === 'ppt' ? 'text-amber-500' : 'text-red-500'}`} />
                      <span className="font-medium text-military-dark">{doc.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.date}</td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-military-olive text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-hover transition"
                    >
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
