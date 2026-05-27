export default function AboutPage() {
  const teamMembers = [
    { name: 'สมาชิก 1', role: 'หัวหน้าโครงการ', image: null },
    { name: 'สมาชิก 2', role: 'นักพัฒนา', image: null },
    { name: 'สมาชิก 3', role: 'นักพัฒนา', image: null },
    { name: 'สมาชิก 4', role: 'ออกแบบระบบ', image: null },
  ]

  return (
    <div>
      <div className="bg-white border-b-3 border-military-olive p-12 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-military-dark">เกี่ยวกับเรา</h1>
          <p className="text-lg text-gray-600 mt-2">ภารกิจและวิสัยทัศน์ของระบบจัดการยานพาหนะ</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-military-dark mb-4">วิสัยทัศน์</h2>
          <p className="text-gray-600 leading-relaxed">
            ระบบจัดการยานเกราะ M113 พัฒนาขึ้นเพื่อเพิ่มประสิทธิภาพในการบริหารจัดการยานพาหนะ
            การแจ้งซ่อมบำรุง และการติดตามสถานะอะไหล่ของโครงการรถสายพานลำเลียง M113
          </p>
        </div>

        <hr className="my-8 border-military-khaki" />

        <h2 className="text-2xl font-bold text-military-dark mb-6 text-center">ทีมพัฒนา</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:-translate-y-1 transition flex flex-col items-center text-center"
            >
              <div className="w-44 h-44 rounded-xl border-3 border-military-khaki bg-gray-100 flex items-center justify-center mb-4 overflow-hidden">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-4xl">👤</span>
                )}
              </div>
              <h5 className="font-semibold text-military-dark">{member.name}</h5>
              <p className="text-sm text-gray-500">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
