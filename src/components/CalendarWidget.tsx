'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

type EventType = 'maintenance' | 'general' | 'completed'

interface DayEvent {
  type: EventType
  label: string
}

export default function CalendarWidget() {
  const [today] = useState(new Date())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [eventMap, setEventMap] = useState<Record<string, DayEvent[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [viewYear, viewMonth])

  async function fetchEvents() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const firstDay = new Date(viewYear, viewMonth, 1).toISOString()
    const lastDay = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString()

    const [{ data: maintenance }, { data: general }] = await Promise.all([
      supabase
        .from('maintenance_requests')
        .select('request_date, status, completed_at')
        .eq('reported_by_user_id', user.id)
        .gte('request_date', firstDay)
        .lte('request_date', lastDay),
      supabase
        .from('general_requests')
        .select('created_at, status')
        .eq('user_id', user.id)
        .gte('created_at', firstDay)
        .lte('created_at', lastDay),
    ])

    const map: Record<string, DayEvent[]> = {}

    for (const m of maintenance || []) {
      const day = new Date(m.request_date).getDate()
      const key = String(day)
      if (!map[key]) map[key] = []
      const type: EventType = m.status === 'completed' ? 'completed' : 'maintenance'
      map[key].push({ type, label: 'แจ้งซ่อม' })
    }

    for (const g of general || []) {
      const day = new Date(g.created_at).getDate()
      const key = String(day)
      if (!map[key]) map[key] = []
      map[key].push({ type: 'general', label: 'คำร้องทั่วไป' })
    }

    setEventMap(map)
    setLoading(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })

  const weeks: (number | null)[][] = []
  let current: (number | null)[] = Array(firstWeekday).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    current.push(d)
    if (current.length === 7) { weeks.push(current); current = [] }
  }
  if (current.length > 0) {
    while (current.length < 7) current.push(null)
    weeks.push(current)
  }

  const dayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-military-dark text-white px-4 py-3 font-semibold flex items-center gap-2">
        <Calendar className="w-4 h-4" /> ปฏิทินกิจกรรม
      </div>
      <div className="p-3">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-military-dark">{monthName}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {dayLabels.map(d => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin w-5 h-5 border-2 border-military-olive border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => {
                  if (!day) return <div key={di} />
                  const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
                  const events = eventMap[String(day)] || []
                  return (
                    <div
                      key={di}
                      className={`relative flex flex-col items-center py-1 rounded-lg ${isToday ? 'bg-military-olive/10' : ''}`}
                    >
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-military-olive text-white' : 'text-gray-700'}`}>
                        {day}
                      </span>
                      {events.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                          {events.slice(0, 3).map((ev, ei) => (
                            <span
                              key={ei}
                              title={ev.label}
                              className={`w-1.5 h-1.5 rounded-full ${
                                ev.type === 'completed' ? 'bg-military-olive' :
                                ev.type === 'maintenance' ? 'bg-red-500' : 'bg-yellow-400'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-around text-xs mt-3 pt-2 border-t gap-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> แจ้งซ่อม</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> คำร้อง</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-military-olive" /> เสร็จสิ้น</span>
        </div>
      </div>
    </div>
  )
}
