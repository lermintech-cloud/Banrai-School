# เว็บโรงเรียนบ้านไร่ อ.ดอยเต่า จ.เชียงใหม่

เว็บแอปแสดงข่าวสารจากเพจเฟซบุ๊กของโรงเรียน รองรับมือถือ/คอมพิวเตอร์ ติดตั้งลงหน้าจอได้ (PWA) ฟรี ไม่ต้องมีเซิร์ฟเวอร์

## หลักการทำงาน
GitHub Actions ดึงโพสต์จาก Facebook ทุก 30 นาที → บันทึกเป็น `data/posts.json` → หน้าเว็บอ่านไฟล์นี้
**โทเคนเก็บใน GitHub Secrets เท่านั้น ไม่อยู่ในโค้ด**

## ขั้นตอนติดตั้ง
1. สร้าง repository ใหม่บน GitHub แล้วอัปโหลดไฟล์ทั้งหมด (รวมโฟลเดอร์ `.github`)
2. **สร้างโทเคนใหม่** (โทเคนเดิมที่เคยโพสต์ในแชทถือว่ารั่วแล้ว): ไปที่ Graph API Explorer → เลือกแอป → ขอสิทธิ์ `pages_read_engagement`, `pages_show_list` → เลือกเพจโรงเรียน → ได้ Page Access Token
   แนะนำแลกเป็นโทเคนอายุยาว (long-lived) ก่อน แล้วโทเคนของเพจที่ได้จะไม่หมดอายุ
3. ที่ repo ไป Settings → Secrets and variables → Actions → New repository secret
   - `FB_PAGE_TOKEN` = โทเคนของเพจ
   - `FB_PAGE_ID` = (ไม่บังคับ) เลขไอดีเพจ
4. Settings → Pages → Source: Deploy from a branch → `main` / root
5. แท็บ Actions → "อัปเดตโพสต์จากเฟซบุ๊ก" → Run workflow เพื่อดึงข้อมูลครั้งแรก
6. แก้ `assets/app.js` ส่วน `CONFIG` ใส่ลิงก์เพจและเบอร์โทร

## ปรับแต่ง
- สีทั้งหมดอยู่ที่ `:root` ใน `assets/style.css`
- ไฟล์ `data/posts.json` ตอนนี้เป็นข้อมูลตัวอย่าง จะถูกแทนที่อัตโนมัติ
- หมวดข่าว (ประกาศ/กิจกรรม/ข่าวสาร) แยกจากคำในโพสต์ ดูฟังก์ชัน `categorize` ใน `app.js`
- ทดสอบในเครื่อง: `python3 -m http.server` แล้วเปิด http://localhost:8000
