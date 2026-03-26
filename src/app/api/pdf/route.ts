import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// pdfkit import (CommonJS module)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfkitModule = require('pdfkit')
const PDFDocument = pdfkitModule.default ?? pdfkitModule

const FONT_REGULAR = path.join(process.cwd(), 'public', 'fonts', 'tahoma.ttf')
const FONT_BOLD = path.join(process.cwd(), 'public', 'fonts', 'tahomabd.ttf')

function addWatermark(doc: typeof PDFDocument) {
  const text = 'ระบบแจ้งซ่อมยานเกราะ'
  doc.save()
  doc.opacity(0.07)
  doc.fontSize(40)
  doc.font(FONT_BOLD)
  doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] })
  doc.fillColor('#000000')
  doc.text(text, 60, 280, { lineBreak: false })
  doc.text(text, 220, 500, { lineBreak: false })
  doc.restore()
}

function addHeader(doc: typeof PDFDocument, title: string) {
  doc.font(FONT_BOLD).fontSize(14).fillColor('#2c3e50')
  doc.text(title, 50, 45, { align: 'center' })
  doc.moveTo(50, 68).lineTo(doc.page.width - 50, 68).stroke('#2c3e50')
  addWatermark(doc)
}

function addFooter(doc: typeof PDFDocument, pageNum: number) {
  const bottom = doc.page.height - 30
  doc.font(FONT_REGULAR).fontSize(8).fillColor('#555555')
  doc.text('เอกสารฉบับนี้เป็นความลับ | ระบบแจ้งซ่อมยานเกราะ', 50, bottom, { align: 'left' })
  doc.text(`หน้า ${pageNum}`, 50, bottom, { align: 'right' })
}

function buildWebManual(doc: typeof PDFDocument) {
  let page = 1
  addHeader(doc, 'คู่มือการใช้งานเว็บแอปพลิเคชัน')
  doc.font(FONT_BOLD).fontSize(13).fillColor('#2c3e50').text('บทที่ 1: การเข้าสู่ระบบและภาพรวม', 50, 85)
  doc.font(FONT_REGULAR).fontSize(11).fillColor('#333333').moveDown(0.5)
  doc.text('ยินดีต้อนรับสู่คู่มือการใช้งานเว็บแอปพลิเคชันระบบจัดการยานเกราะ! เอกสารนี้จะแนะนำวิธีการใช้งานฟังก์ชันต่างๆ ของระบบเพื่อให้คุณสามารถทำงานได้อย่างมีประสิทธิภาพสูงสุด', { indent: 20 })
  doc.moveDown()
  doc.font(FONT_BOLD).fontSize(12).text('1.1 การเข้าสู่ระบบ (Login)')
  doc.font(FONT_REGULAR).fontSize(11).moveDown(0.3)
  doc.text('   • ผู้ใช้จะต้องกรอกอีเมลและรหัสผ่านที่ถูกต้องในหน้า Login เพื่อเข้าสู่ระบบ')
  doc.text('   • หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ')
  doc.moveDown()
  doc.font(FONT_BOLD).fontSize(12).text('1.2 การสมัครสมาชิก (Register)')
  doc.font(FONT_REGULAR).fontSize(11).moveDown(0.3)
  doc.text('   • ผู้ใช้ใหม่ต้องกรอกข้อมูลให้ครบถ้วนตามเงื่อนไขที่กำหนด')
  doc.text('   • รหัสผ่านต้องมีตัวพิมพ์เล็ก, พิมพ์ใหญ่, ตัวเลข และอักขระพิเศษ')
  doc.text('   • กรุณายืนยันอีเมลหลังสมัครสมาชิก')
  doc.moveDown(1.5)
  doc.font(FONT_BOLD).fontSize(13).fillColor('#2c3e50').text('บทที่ 2: การใช้งานระบบ')
  doc.moveDown(0.5)
  doc.font(FONT_BOLD).fontSize(12).fillColor('#333333').text('2.1 หน้า Dashboard ส่วนตัว')
  doc.font(FONT_REGULAR).fontSize(11).moveDown(0.3)
  doc.text('   • เมื่อเข้าสู่ระบบสำเร็จ คุณจะพบกับ Dashboard ที่แสดงข้อมูลสรุปเกี่ยวกับการจัดการยานเกราะของคุณ')
  doc.text('   • คุณสามารถดูสถานะยานพาหนะและประวัติการแจ้งซ่อมได้ในส่วนนี้')
  doc.moveDown()
  doc.font(FONT_BOLD).fontSize(12).text('2.2 การส่งและตรวจสอบคำร้อง')
  doc.font(FONT_REGULAR).fontSize(11).moveDown(0.3)
  doc.text('   • ในเมนู "บริการอื่นๆ" > "ส่งคำร้องทั่วไป" ใช้สำหรับแจ้งเรื่องต่างๆ ที่ไม่ใช่การซ่อมบำรุง')
  doc.text('   • สามารถติดตามสถานะคำร้องได้ที่เมนู "ตรวจสอบคำร้อง"')
  doc.moveDown()
  doc.font(FONT_BOLD).fontSize(12).text('2.3 การแก้ไขโปรไฟล์ส่วนตัว')
  doc.font(FONT_REGULAR).fontSize(11).moveDown(0.3)
  doc.text('   • แก้ไขข้อมูลส่วนตัว เช่น ชื่อ, อีเมล, หรือเบอร์โทรศัพท์ ได้ที่เมนู "โปรไฟล์ส่วนตัว"')
  addFooter(doc, page)
}

function buildCarManual(doc: typeof PDFDocument, model: string) {
  let page = 1
  addHeader(doc, `คู่มือการบำรุงรักษายานเกราะ รุ่น ${model}`)
  doc.font(FONT_BOLD).fontSize(13).fillColor('#2c3e50').text('บทที่ 1: การตรวจสอบประจำวัน (ก่อนปฏิบัติงาน)', 50, 85)
  doc.font(FONT_REGULAR).fontSize(11).fillColor('#333333').moveDown(0.5)
  doc.text('   • ตรวจสอบระดับน้ำมันเครื่อง, น้ำหล่อเย็น, และน้ำมันเบรก ต้องอยู่ในระดับที่กำหนด')
  doc.text('   • ตรวจสอบแรงดันลมยางและสภาพยางโดยรวม ไม่ฉีกขาดหรือบวม')
  doc.text('   • ตรวจสอบระบบไฟส่องสว่างและไฟสัญญาณทั้งหมดว่าทำงานปกติ')
  doc.text('   • ตรวจสอบการรั่วซึมของของเหลวใต้ท้องรถ')
  doc.moveDown(1.5)
  doc.font(FONT_BOLD).fontSize(13).fillColor('#2c3e50').text('บทที่ 2: การบำรุงรักษาตามระยะ')
  doc.moveDown(0.5)
  doc.font(FONT_BOLD).fontSize(12).fillColor('#333333').text('2.1 ระยะ 5,000 กม. (หรือ 3 เดือน)')
  doc.font(FONT_REGULAR).fontSize(11).moveDown(0.3)
  doc.text('   • เปลี่ยนถ่ายน้ำมันเครื่องและไส้กรองน้ำมันเครื่อง')
  doc.text('   • อัดจาระบีตามจุดที่กำหนด')
  doc.moveDown()
  doc.font(FONT_BOLD).fontSize(12).text('2.2 ระยะ 20,000 กม. (หรือ 12 เดือน)')
  doc.font(FONT_REGULAR).fontSize(11).moveDown(0.3)
  doc.text('   • ดำเนินการตามระยะ 5,000 กม.')
  doc.text('   • ตรวจสอบระบบเบรก (ผ้าเบรก, น้ำมันเบรก)')
  doc.text('   • เปลี่ยนไส้กรองอากาศและไส้กรองเชื้อเพลิง')
  doc.moveDown()
  doc.font(FONT_BOLD).fontSize(12).text('2.3 ระยะ 50,000 กม. (หรือ 24 เดือน)')
  doc.font(FONT_REGULAR).fontSize(11).moveDown(0.3)
  doc.text('   • ดำเนินการตามระยะ 20,000 กม.')
  doc.text('   • เปลี่ยนน้ำมันเกียร์และน้ำมันเฟืองท้าย')
  doc.text('   • ตรวจสอบสายพานเครื่องยนต์และระบบหล่อเย็น')
  doc.moveDown(1.5)
  doc.font(FONT_BOLD).fontSize(13).fillColor('#2c3e50').text('บทที่ 3: ข้อควรระวังและความปลอดภัย')
  doc.font(FONT_REGULAR).fontSize(11).fillColor('#333333').moveDown(0.5)
  doc.text('   • ห้ามซ่อมบำรุงขณะเครื่องยนต์ยังร้อนอยู่')
  doc.text('   • ต้องดับเครื่องและถอดกุญแจทุกครั้งก่อนทำการซ่อมบำรุง')
  doc.text('   • ใช้อุปกรณ์ป้องกันส่วนบุคคล (PPE) ทุกครั้ง')
  doc.text('   • รายงานความผิดปกติผ่านระบบออนไลน์ทันที')
  addFooter(doc, page)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'web'

  if (!fs.existsSync(FONT_REGULAR)) {
    return NextResponse.json({ error: 'Font not found' }, { status: 500 })
  }

  const chunks: Buffer[] = []

  return new Promise<NextResponse>((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      const filename = type === 'web'
        ? 'คู่มือการใช้งานเว็บแอปพลิเคชัน.pdf'
        : `คู่มือการบำรุงรักษารถ_${type.toUpperCase()}.pdf`

      resolve(
        new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
          },
        })
      )
    })

    if (type === 'web') {
      buildWebManual(doc)
    } else if (['a', 'b', 'c'].includes(type)) {
      buildCarManual(doc, type.toUpperCase())
    } else {
      doc.text('ไม่พบเอกสาร')
    }

    doc.end()
  })
}
