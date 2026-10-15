# คู่มือนักพัฒนา (Developer Guide) — ระบบบริหารจัดการงาน อบต.ศรีสำราญ

เอกสารนี้จัดทำขึ้นเพื่อให้ผู้พัฒนาสามารถทำความเข้าใจโครงสร้างโค้ด สถาปัตยกรรมข้อมูล และระบบการทำงานทั้งหมดของโปรเจคนี้ได้อย่างรวดเร็ว โดยไม่ต้องอ่านโค้ดบรรทัดต่อบรรทัดใหม่ทั้งหมด

> **อัปเดตล่าสุด**: 23 กรกฎาคม 2569 (2026) | **จำนวนบรรทัด**: ~10,755 | **ขนาดไฟล์**: ~518 KB

---

## 📌 ภาพรวมระบบ (System Overview)

ระบบบริหารจัดการงาน อบต.ศรีสำราญ เป็นเว็บแอปพลิเคชันหน้าเดียว (**Single Page Application - SPA**) ที่รวมเครื่องมือหลัก 3 ส่วนเข้าด้วยกัน:
1. **ระบบควบคุมวัสดุสำนักงาน**: จัดการคลังวัสดุ การรับ-จ่ายประวัติ และสถิติการใช้งาน
2. **ระบบควบคุมการใช้น้ำมันรถ สำนักปลัด**: บันทึกประวัติการเติมน้ำมัน คำนวณระยะทางสะสม นำเข้าข้อมูลจากไฟล์ต้นฉบับหลวง และส่งออกรายงานในรูปแบบ Excel ราชการแยกชีต 12 เดือน
3. **ระบบสารบรรณ**: ลงทะเบียนรับ-ส่งหนังสือราชการ จัดเก็บเอกสาร และ**ดึงข้อมูล/กดรับหนังสือจากระบบ UD-Local ผ่าน Chrome Extension** โดยตรงจากหน้าเว็บ

**Production URL**: https://sisamran.web.app

---

## ⚙️ สถาปัตยกรรมเทคโนโลยี (Tech Stack)

* **Frontend**: HTML5, Vanilla JavaScript, CSS3 (ไฟล์เดียว SPA ไม่ใช้เฟรมเวิร์ก)
* **Database & Auth**: Firebase Realtime Database + Firebase Authentication (ซิงค์กับ LocalStorage สำหรับการใช้งานแบบออฟไลน์บางส่วน)
* **Libraries**:
  * [xlsx-js-style v1.2.0](https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js): เขียนและจัดรูปแบบไฟล์ Excel ราชการ
  * Firebase SDK v10.8.0 (App, Auth, Database, Storage — compat mode)
* **Fonts**: Google Fonts — `Sarabun` (UI ภาษาไทย) + `IBM Plex Mono` (ตัวเลข)
* **Deployment**: Firebase Hosting → `sisamran.web.app`
* **ส่วนขยายเบราว์เซอร์ (Chrome Extension)**: ใช้สำหรับข้ามข้อจำกัด CORS เพื่อดึงข้อมูลจากเว็บ ud-local.com โดยตรง

---

## 📂 โครงสร้างไฟล์ในโปรเจค (File Structure)

```
sisamran-web-app/
├── index.html                  # ไฟล์หลัก (HTML + CSS + JS ทั้งหมด ~10,755 บรรทัด)
├── logo.png                    # โลโก้ตราสัญลักษณ์ อบต.ศรีสำราญ (~109 KB)
├── 404.html                    # หน้า Error 404
├── firebase.json               # ตั้งค่า Firebase Hosting + Database rules (public: ".", site: sisamran)
├── database.rules.json         # Firebase Realtime Database Security Rules (deploy พร้อม firebase deploy)
├── .firebaserc                 # ระบุโปรเจค Firebase (sisamran-c3e5f)
├── .gitignore                  # ไฟล์ที่ไม่ต้องติดตาม Git
├── migrate_firebase.js         # สคริปต์ Node.js ย้าย/ปรับข้อมูลใน Firebase (ใช้ครั้งคราว ไม่ deploy)
├── sync_udlocal.js             # Local companion server (Node.js) — ตัวสำรอง Option 2
├── sync.bat                    # Batch script สำหรับรัน companion server — ตัวสำรอง Option 2
├── udlocal_extension.zip       # ไฟล์ Chrome Extension พร้อมติดตั้ง (สำหรับดาวน์โหลดจากเว็บ)
├── extension/                  # โค้ดต้นฉบับของ Chrome Extension
│   ├── manifest.json           # Manifest V3 ระบุสิทธิ์และสคริปต์
│   ├── content.js              # Content Script: รับ-ส่งข้อความระหว่างหน้าเว็บกับ Background
│   └── background.js           # Service Worker: Proxy ดึงข้อมูลจาก ud-local.com (ข้าม CORS)
├── council-templates.js        # เทมเพลตเอกสารประชุมสภา ฝัง base64 (สำหรับ lazy load ใน docgen)
├── council-templates/          # โฟลเดอร์เก็บไฟล์เทมเพลต Word (.docx) ต้นฉบับ
│   ├── agenda.docx             # ระเบียบวาระการประชุม
│   ├── announce-call.docx      # ประกาศเรียกประชุม
│   ├── announce-public.docx    # ประกาศเชิญชวนประชาชน/สรุปรายงาน
│   ├── attendee-list.docx      # ทะเบียนรายชื่อผู้เข้าร่วมประชุม/ผู้ลา
│   ├── cover.docx              # ปกรายงานการประชุม
│   ├── invite-control-list.docx# ใบเซ็นรับหนังสือเชิญประชุม
│   ├── invite-letter.docx      # หนังสือเชิญประชุมสภา
│   └── pr-request.docx         # บันทึกข้อความขอประชาสัมพันธ์การประชุม
└── README.md                   # เอกสารนี้
```

---

## 🗺️ แผนผังโครงสร้างไฟล์ index.html (File Map)

### CSS Styles (บรรทัด 21–1848)
| ช่วงบรรทัด | เนื้อหา |
|---|---|
| 21–83 | `:root` CSS Variables (สี, เงา, มุมโค้ง) และการฝังฟอนต์ราชการ |
| 84–135 | หน้า Login (`.login-card`, `.login-form`) |
| 136–296 | หน้า Home (`.home-container`, `.home-user-card`, `.home-grid`, `.home-card-btn`) |
| 297–384 | Header, Tabs, Stats Bar, Panels |
| 385–413 | Panel & Cards |
| 414–434 | Stats Bar |
| 435–457 | Grid & forms |
| 458–715 | Tables, Modal, Ledger, Toast |
| 716–1431 | `@media(max-width:768px)` — Mobile Responsive ทั้งหมด (Header, Tabs, Tables, Fuel buttons, Stats) |
| 1432–1546 | Durable Summary View Styles (ระบบสารบรรณ) |
| 1547–1847 | Council App Styles (ระบบงานสภา) |

### HTML Structure (บรรทัด 1853–3238)
| ช่วงบรรทัด | เนื้อหา |
|---|---|
| 1853–1875 | `#login-page` — หน้าล็อกอิน |
| 1876–2024 | `#home-page` — หน้าหลัก (โลโก้, user card, grid เมนู, **กล่องดาวน์โหลด UD-Local Extension**, ปุ่มออก, ลิขสิทธิ์) |
| 2025–2349 | `#main-app` — ระบบวัสดุสำนักงาน (Header, Tabs, Stats, Tables, Modals) |
| 2350–2593 | `#fuel-app` — ระบบน้ำมันรถ (Header, Vehicle select, Month select, ปุ่ม Export/Import, ตาราง, ฟอร์มบันทึก, สรุปเปรียบเทียบ, Modal ยานพาหนะ) |
| 2594–2713 | `#durable-app` — ระบบสารบรรณ (Header, Tabs, Form Panel, ตาราง, แท็บ UD-Local inbox) |
| 2714–3238 | `#council-app` — ระบบงานสภา (Header, Tabs, Settings/Members/Meetings Modals, Forms & Minutes Editor) |

### JavaScript (บรรทัด 3239–10755)
| ช่วงบรรทัด | เนื้อหา |
|---|---|
| 3239–3278 | Firebase Config & Initialization, Global Variables |
| 3279–3394 | Utility Functions (วันที่, ภาษาไทย, logo fallback) |
| 3395–3478 | `loadInitialData()` — โหลดข้อมูลเริ่มต้นจาก Firebase |
| 3479–3533 | `save()` — บันทึกข้อมูลไปยัง Firebase + LocalStorage |
| 3534–3629 | Authentication (login, logout, checkAuth, hashPassword) |
| 3630–3803 | Home Page Logic (renderHomeGrid, enterApp, goBackToHome) |
| 3804–3950 | `applyPermissions()` — จัดการสิทธิ์ UI ตาม role และตรวจสอบการติดตั้ง Extension |
| 3951–4250 | จัดการปีงบประมาณ + หมวดหมู่ + ผู้ใช้ (CRUD) |
| 4251–4433 | หมวดหมู่ Dropdown, Filters, Tab switching |
| 4434–5250 | ตารางวัสดุ (renderTable, addItem, getBalance, editItem) |
| 5251–5314 | `renderLedger()` — สรุปรับ-จ่ายทั้งหมด (พร้อม data-label สำหรับ mobile) |
| 5315–6437 | `exportSummaryExcel()`, `exportToExcel()`, `exportSingleItem()`, `importFromExcel()` |
| 6438–6820 | Fuel App Init, Logs CRUD, and Vehicles Management (ระบบน้ำมันรถ) |
| 6821–7504 | Excel Fuel Export/Import (ส่งออกน้ำมัน 12 ชีต / นำเข้า) |
| 7505–8706 | Durable App Logic — ระบบสารบรรณเอกสาร (รับ, ส่ง, บันทึก, นำเข้า/ส่งออก Excel, อัปโหลด PDF) |
| 8707–9319 | Chrome Extension Integration — ระบบดึงงาน UD-Local (`checkExtensionInstalled()`, `syncUDLocalData()`, `parseUDLocalHtml()`, `acceptUDLocalDoc()`) |
| 9320–10755 | **[NEW]** Council App & docx Generation — ระบบงานสภาและการสร้างเอกสาร Word (`initCouncilApp()`, `loadCouncilMembers()`, `loadCouncilMeetings()`, `generateSingleCouncilDoc()`, `generateAllCouncilDocs()`, ฯลฯ) |

---

## 💾 โครงสร้างข้อมูล Firebase (Data Schema)

```
Firebase Realtime Database
├── items/                          # รายการวัสดุทั้งหมด
│   └── {itemId}/
│       ├── id: String
│       ├── name: String            # ชื่อวัสดุ
│       ├── category: String        # หมวดหมู่
│       ├── unit: String            # หน่วยนับ
│       ├── transactions: Array     # ประวัติรับ-จ่าย
│       │   └── { id, date, type("recv"|"pay"), qty, unit, price, note }
│       ├── movedToYear: String?    # [NEW] ถ้ามีค่า = ถูก "ยกไปปีงบ" นี้แล้ว → แถวถูกล็อก (ดูอย่างเดียว)
│       ├── movedToId: String?      # [NEW] id ของสำเนาในปีปลายทาง (ใช้ตอน "ยกกลับ" เพื่อลบสำเนาได้ตรงตัว)
│       ├── movedAt: String?        # [NEW] ISO timestamp ตอนยกไป
│       └── createdAt: Number
│
├── fuelVehicles/                   # ยานพาหนะทั้งหมด
│   └── {vehicleId}/
│       ├── id: String
│       ├── type: "car"|"motorcycle"|"other"
│       ├── otherTypeDetail: String
│       └── plateNumber: String     # ทะเบียนรถ
│
├── fuelLogs/                       # บันทึกน้ำมันแยกตามปี/รถ
│   └── {year}/
│       └── {vehicleId}/
│           └── {logId}/
│               ├── id, date, bookNo, receiptNo
│               ├── odometer: Number    # เลขไมล์ (ไม่บังคับ)
│               ├── liters, amount: Number
│               ├── approver, receiver: String
│               └── note: String
│
├── users/                          # ผู้ใช้งานระบบ
│   └── {username}/
│       ├── username, password (hashed)
│       └── role: "admin"|"editor"|"downloader"|"viewer"
│
├── fiscalYears: Array              # รายการปีงบประมาณ [2568, 2569, ...]
│
├── categories: Array               # หมวดหมู่วัสดุ
│
├── settings/
│   └── currentYear: Number         # ปีงบประมาณปัจจุบัน
│
└── durableDocs/                    # [NEW] ข้อมูลกล่องรับงาน UD-Local
    └── {year}/
        └── udlocal/
            └── {docId}/
                ├── id: String          # รหัสเอกสารจาก UD-Local
                ├── isNew: Boolean      # true = ยังไม่ได้กดรับ (ปุ่มสีเขียว)
                ├── no: Number          # ลำดับที่
                ├── receiveNo: String   # เลขรับ
                ├── sender: String      # หน่วยงานผู้ส่ง
                ├── docNumber: String   # เลขที่หนังสือ
                ├── status: String      # สถานะ
                ├── subject: String     # ชื่อเรื่อง
                ├── downloadUrl: String # URL ดาวน์โหลดเอกสาร
                └── docDate: String     # วันที่
```

### สิทธิ์ผู้ใช้งาน (User Roles)

| Role | ดูข้อมูล | เพิ่ม/แก้ไข/ลบ | ส่งออก Excel | จัดการผู้ใช้/ปีงบ | นำเข้า Excel |
|------|:--------:|:--------------:|:------------:|:-----------------:|:------------:|
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `editor` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `downloader` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `viewer` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🛠️ ฟังก์ชัน JavaScript สำคัญ (Key Functions Reference)

### 🔑 ระบบจัดการสิทธิ์และการล็อกอิน
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `handleLogin()` | ตรวจสอบ username/password แล้วเข้าสู่ระบบ |
| `handleLogout()` | ออกจากระบบ ล้าง session |
| `checkAuth()` | สลับหน้าจอระหว่าง login/home/app และเรียก `checkExtensionInstalled()` |
| `applyPermissions()` | แสดง/ซ่อน UI ตามระดับสิทธิ์ |
| `hashPassword()` | เข้ารหัสรหัสผ่านด้วย SHA-256 |

### 🏠 หน้าหลัก (Home Page)
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `renderHomeGrid()` | สร้างการ์ดเมนูโมดูลต่าง ๆ |
| `enterApp(appName)` | เข้าสู่โมดูลที่เลือก (materials/fuel/durable) |
| `goBackToHome()` | กลับหน้าหลัก |
| `checkExtensionInstalled()` | **[NEW]** ตรวจสอบว่าผู้ใช้ติดตั้ง Chrome Extension หรือยัง และอัปเดตแถบสถานะสีเขียว/แดง |

### 📦 ระบบวัสดุสำนักงาน
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `loadInitialData()` | โหลดข้อมูลทั้งหมดจาก Firebase |
| `save()` | บันทึกข้อมูลไปยัง Firebase + LocalStorage |
| `renderTable(data)` | แสดงตารางวัสดุแบ่งตามหมวดหมู่ |
| `renderLedger(data)` | แสดงตารางสรุปรับ-จ่ายทั้งหมด (พร้อม data-label mobile) |
| `addItem()` | เพิ่มรายการวัสดุใหม่ |
| `openModal(id)` | เปิด modal ประวัติรับ-จ่ายของรายการ |
| `addTx(type)` | บันทึกธุรกรรมรับ/จ่ายวัสดุ |
| `getBalancesByPrice(item)` | คำนวณยอดคงเหลือแยกตามราคาต่อหน่วย |
| `toggleItemSelect()` / `toggleSelectAllItems()` | ติ๊กเลือกหลายรายการ (แถวที่ถูกล็อก `movedToYear` จะข้ามไม่ให้เลือก) |
| `applyBulkCategory()` | เปลี่ยนหมวดหมู่หลายรายการที่เลือกพร้อมกัน |
| `applyBulkMoveYear()` | **[NEW]** ยกรายการที่เลือกไปปีงบอื่น (พร้อมประวัติรับ-จ่าย) — เขียนสำเนาไปปีปลายทางก่อน แล้ว "ล็อก" ต้นทางไว้ (ไม่ลบ) ติดป้าย "↗ ยกไปปีงบ… แล้ว" |
| `moveBackItem(mergedId)` | **[NEW]** ยกกลับ/ปลดล็อก (undo) — ลบสำเนาในปีปลายทางด้วย `movedToId` แล้วล้าง flag ให้ต้นทางกลับมาใช้งานปกติ |
| `exportSummaryExcel()` | ส่งออก Excel สรุปประจำปี |
| `exportToExcel()` | ส่งออก Excel ทั้งหมดแยกชีต |
| `exportSingleItem(id)` | ส่งออก Excel เฉพาะรายการเดียว |
| `importFromExcel(input)` | นำเข้าข้อมูลวัสดุจากไฟล์ Excel |

### ⛽ ระบบน้ำมันรถ
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `initFuelApp()` | เริ่มต้นระบบน้ำมัน (โหลดปี, ยานพาหนะ, เดือน) |
| `loadFuelLogs()` | โหลดบันทึกน้ำมันจาก Firebase |
| `renderFuelLogs()` | แสดงตารางประวัติน้ำมัน (พร้อม data-label mobile) |
| `calculateFuelSummary()` | คำนวณสถิติสรุป (ระยะทาง, ลิตร, เงิน, เปรียบเทียบเดือนก่อน) |
| `saveFuelLog()` | บันทึกการเติมน้ำมัน (จดจำชื่อผู้สั่งจ่าย/คนขับอัตโนมัติ) |
| `editFuelLog(id)` | แก้ไขรายการเติมน้ำมัน |
| `deleteFuelLog(id)` | ลบรายการเติมน้ำมัน |
| `exportFuelToExcel()` | ส่งออก Excel น้ำมันประจำเดือน (ฟอร์มราชการ) |
| `exportFullYearFuelToExcel()` | ส่งออก Excel น้ำมันทั้งปี 12 ชีต (ตค–กย) |
| `importFuelFromExcel(input)` | นำเข้าข้อมูลน้ำมันจาก Excel |

### 🚘 จัดการยานพาหนะ
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `renderVehicleList()` | แสดงตารางยานพาหนะใน modal |
| `addVehicle()` | เพิ่ม/อัปเดตยานพาหนะ |
| `editVehicle(id)` | โหลดข้อมูลยานพาหนะเข้าฟอร์มเพื่อแก้ไข |
| `deleteVehicle(id)` | ลบยานพาหนะ |

### 📁 ระบบสารบัญเอกสาร (งานสารบรรณ)
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `initDurableApp()` | เริ่มต้นระบบสารบัญ (โหลดปีงบประมาณ, เปิดประเภทหนังสือรับ) |
| `switchDurableTab(tabName)` | สลับแท็บประเภททะเบียน — **ซ่อน form-panel อัตโนมัติเมื่ออยู่แท็บ `udlocal`** |
| `loadDurableLogs()` | ดึงข้อมูลรายการเอกสารจากฐานข้อมูล Firebase ของปีและประเภทที่เลือก |
| `renderDurableTable()` | แสดงรายการข้อมูลลงตาราง (จัดแบ่งหน้า และกรองค้นหา) |
| `renderDurableForm(editDoc)` | แสดงฟอร์มเพิ่ม/แก้ไขเอกสาร พร้อมกล่องป้อนลิงก์และอัปโหลดไฟล์ PDF |
| `handleDurableFileUpload(input)` | อัปโหลดไฟล์ PDF ขึ้น Firebase Storage และบันทึก Download URL ลงฟอร์ม |
| `saveDurableDoc()` | บันทึกเอกสาร (ทั้งสร้างใหม่และอัปเดตงานที่เลือก) ลง Firebase |
| `deleteDurableDoc(id)` | ลบข้อมูลรายการสารบัญเอกสาร |
| `importDurableFromExcel(input)` | นำเข้าข้อมูลคลังจดหมายและหนังสือจากไฟล์ Excel |
| `exportDurableToExcel()` | ส่งออกข้อมูลทะเบียนคุมทั้งหมดในหมวดเป็นไฟล์ Excel ราชการ |
| `importUDLocalDocToForm(docId)` | ค้นหาเอกสารจาก UD-Local ใน Firebase และเปิดฟอร์มลงทะเบียนรับพร้อมกรอกข้อมูลอัตโนมัติ |

### 🔌 ระบบ UD-Local ผ่าน Chrome Extension [NEW]
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `checkExtensionInstalled()` | ตรวจสอบว่า Extension ติดตั้งอยู่หรือไม่ โดยดูจาก DOM element `#udlocal-extension-installed` ที่ content.js ฉีดเข้ามา |
| `extensionFetch(url, options)` | ส่งคำสั่ง `fetch` ไปยัง Extension ผ่าน `window.postMessage` เพื่อข้าม CORS และรับผลลัพธ์คืนผ่าน Promise |
| `syncUDLocalData()` | ล็อกอินเข้า UD-Local → ดึงหน้า home.php → แยกวิเคราะห์ HTML → บันทึกขึ้น Firebase |
| `parseUDLocalHtml(html)` | แยกวิเคราะห์ HTML จาก UD-Local ด้วย Regex เพื่อดึงข้อมูลเอกสารจากตาราง |
| `acceptUDLocalDoc(docId, iCount)` | ล็อกอิน → POST กดรับหนังสือ → ซิงค์ตารางใหม่ → เปิดฟอร์มลงทะเบียนรับอัตโนมัติ |

### 📅 จัดการปีงบประมาณ / หมวดหมู่ / ผู้ใช้
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `initYearSelect()` | โหลดตัวเลือกปีงบประมาณ |
| `addFiscalYear()` | เพิ่มปีงบประมาณใหม่ |
| `renameYear(old)` | เปลี่ยนชื่อปี |
| `deleteYear(year)` | ลบปีงบประมาณ |
| `manageCategories()` | เปิด modal จัดการหมวดหมู่ |
| `addUser()` | เพิ่มผู้ใช้งานใหม่ |
| `deleteUser(username)` | ลบผู้ใช้งาน |

### 🏛️ ระบบงานสภาและการสร้างเอกสาร Word (Council App & Docgen) [NEW]
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `initCouncilApp()` | เริ่มต้นระบบสภา โหลดปีงบประมาณและตรวจสอบสิทธิ์ |
| `initCouncilYearSelect()` / `changeCouncilYear()` | จัดการเลือกปีงบประมาณในส่วนงานสภาและโหลดข้อมูลใหม่ |
| `switchCouncilTab(tabName)` | สลับหน้าจอระหว่างแท็บ สมาชิก และ รายการประชุมสภา |
| `loadCouncilMembers()` / `saveCouncilMember()` | โหลดข้อมูลสมาชิกสภา / เพิ่มหรืออัปเดตสมาชิก (ชื่อ, ตำแหน่ง, เขต) ลง Firebase |
| `renderCouncilMembersTable()` | เรนเดอร์รายชื่อสมาชิกสภาลงตาราง พร้อมปุ่มแก้ไข/ลบ |
| `loadCouncilMeetings()` / `saveCouncilMeeting()` | โหลดประวัติการประชุม / บันทึกประวัติการประชุม (หัวข้อ, สมัย, ครั้งที่, วันเวลา, ผู้เข้าประชุม, ระเบียบวาระ) |
| `renderCouncilMeetingsTable()` | เรนเดอร์รายการการประชุมสภาลงตาราง พร้อมปุ่มจดรายงาน ปุ่มสร้างเอกสาร และปุ่มลบ |
| `openCouncilMinutes(meetingId)` / `saveCouncilMinutes()` | เปิดหน้าต่างจดบันทึกรายงานการประชุมสภา (บันทึกรายคน, ผู้ร่วมพูด, ผู้ไม่มา) และบันทึกลง Firebase |
| `previewCouncilMinutes()` | เปิดหน้าต่างพรีวิวรายงานการประชุมสภาในรูปแบบฟอนต์ TH SarabunIT๙ ตามรูปแบบรายงานทางการ |
| `generateSingleCouncilDoc(meetingId, templateKey)` | สร้างไฟล์ Word (.docx) ตามคีย์ของเทมเพลตที่เลือก (เช่น บันทึกเชิญประชุม, ระเบียบวาระ, ทะเบียนรายชื่อ) |
| `generateAllCouncilDocs()` | คอมไพล์และสร้างไฟล์รายงานและเอกสารประกอบการประชุมสภาทั้งหมดรวม 8 ประเภท บีบอัดเป็นไฟล์ ZIP เพื่อดาวน์โหลดในครั้งเดียว |

### 🔧 Utility Functions
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `formatDateToThaiBE(dateStr)` | แปลงวันที่เป็นรูปแบบไทย พ.ศ. |
| `getCurrentDateForInput()` | วันที่ปัจจุบันสำหรับ input[type=date] |
| `parseExcelDate(dateStr)` | แปลงวันที่จาก Excel (Serial/พ.ศ.) เป็น ISO |
| `getThaiMonthFromDate(dateStr)` | ดึงชื่อเดือนไทยจากวันที่ |
| `showToast(msg, isError)` | แสดงข้อความแจ้งเตือน |

---

## 🔌 ระบบ UD-Local Extension — รายละเอียดการทำงาน

### ปัญหาที่แก้ไข
เว็บแอปที่ Deploy บน `sisamran.web.app` ไม่สามารถ `fetch` ข้อมูลจาก `ud-local.com` ได้โดยตรง เนื่องจาก CORS Policy ของเบราว์เซอร์บล็อกคำขอข้ามโดเมน

### สถาปัตยกรรมการแก้ไข (Flow)
```
หน้าเว็บพัสดุ
    → window.postMessage (UDLOCAL_EXTENSION_REQUEST)
    → content.js (รับข้อความ, ส่งต่อ)
    → chrome.runtime.sendMessage
    → background.js (Service Worker — มีสิทธิ์เข้าถึง ud-local.com เต็มรูปแบบ)
    → fetch('https://ud-local.com/...', { credentials: 'include' })
    → ส่งผลลัพธ์กลับ background → content → window.postMessage (UDLOCAL_EXTENSION_RESPONSE)
    → หน้าเว็บ parseUDLocalHtml() → บันทึกลง Firebase
```

### สิทธิ์ที่ Extension ต้องการ (manifest.json)
- `host_permissions`: `https://ud-local.com/*`
- `permissions`: `activeTab`, `scripting`
- `content_scripts`: inject `content.js` บน `sisamran.web.app` และ `file://*`

### การตรวจสอบการติดตั้ง
`content.js` จะฉีด element `<div id="udlocal-extension-installed">` เข้าสู่ DOM ของหน้าเว็บ  
`checkExtensionInstalled()` จะตรวจหา element นี้เพื่อแสดงสถานะสีเขียวหรือสีแดง

### ข้อควรทราบ (File URL)
สำหรับผู้ใช้ที่เปิดระบบจากไฟล์ HTML ในเครื่องโดยตรง (`file://`) ต้องเข้าไปที่ `chrome://extensions` → Details → เปิดสิทธิ์ **"Allow access to file URLs"** ด้วย

---

## 📱 Mobile Responsive Design

ระบบรองรับการแสดงผลบนหน้าจอมือถือโดยใช้ `@media(max-width:768px)`:

- **หน้า Home**: ใช้ `justify-content: flex-start` เพื่อให้เลื่อนดูได้ครบ, ลดขนาดโลโก้/หัวข้อ, user card จัดแนวตั้ง
- **Header**: จัดเรียง 2 แถว (ปีงบ + ปุ่มกด) แบ่งครึ่ง 50%
- **ตาราง**: ใช้ระบบ **Stacked Card** (`table.main-table`) — ซ่อน `thead` และแสดง `td` เป็นแถวแนวตั้งพร้อม `data-label`
- **แถวหมวดหมู่**: class `.cat-row` แสดงเป็นแถบแบ่งกลุ่มเต็มความกว้าง
- **ปุ่มหน้าน้ำมัน**: class `.fuel-action-btns` จัดเรียงแนวตั้ง 100% ความกว้าง
- **Stats bar**: แสดง 1 คอลัมน์บนมือถือ

---

## 🚀 คำสั่งพัฒนาและติดตั้งระบบ (Commands)

### การจำลองเซิร์ฟเวอร์รันระบบภายในเครื่อง (Local Development)
```powershell
npx -y http-server -p 8080 -c-1
```
เปิดเบราว์เซอร์เข้าใช้งานที่: `http://localhost:8080`

### การอัปเดตระบบขึ้นสู่เซิร์ฟเวอร์จริง (Production Deploy)
```powershell
npx -y firebase-tools deploy
```
*(จำเป็นต้องรันในสิทธิ์บัญชีผู้ดูแลระบบที่ได้รับอนุญาต)*

### การสร้างไฟล์ Extension ZIP ใหม่ (หลังแก้ไขโค้ดใน /extension)
```powershell
Compress-Archive -Path extension\* -DestinationPath udlocal_extension.zip -Force
```

---

## ⚠️ ข้อควรระวังสำหรับนักพัฒนา

1. **ไฟล์เดียวทั้งระบบ**: โค้ดทั้งหมดอยู่ใน `index.html` — ระวังการแก้ไขข้ามส่วน
2. **Inline Styles**: บางส่วนใช้ inline styles ใน HTML — ถ้าต้องการ override บนมือถือต้องใช้ `!important`
3. **LocalStorage Cache**: ข้อมูลถูก cache ใน localStorage — หาก Firebase เปลี่ยนแต่ local ไม่อัปเดตอาจเห็นข้อมูลเก่า
4. **ปีงบประมาณ**: รอบปีเริ่ม ตุลาคม–กันยายน (ไม่ใช่ มกราคม–ธันวาคม)
5. **เลขไมล์**: ฟิลด์ odometer ไม่บังคับกรอก — ระบบจะคำนวณระยะทางอัตโนมัติจากเลขไมล์ก่อนหน้า
6. **ชื่อผู้สั่งจ่าย/คนขับ**: ถูกจดจำอัตโนมัติผ่าน `localStorage` เพื่อความสะดวกในการกรอกครั้งถัดไป
7. **UD-Local Credentials**: **ไม่ฝังรหัสไว้ในโค้ดแล้ว** (เดิมเคยฝัง LogInName/LogInPassWord เป็น plaintext ในไฟล์ที่ deploy สาธารณะ — ช่องโหว่ความปลอดภัย จึงถอดออก) ปัจจุบันดึงจาก `localStorage` ผ่าน `getUDLocalCredentials()` โดยจะให้ผู้ใช้กรอกครั้งแรกและจำไว้ในเครื่องนั้น หากกรอกผิดหรือรหัสเปลี่ยน ให้เรียก `resetUDLocalCredentials()` (ผ่าน Console) เพื่อล้างค่าแล้วกรอกใหม่
8. **Firebase Security Rules**: ตั้งไว้ที่ `database.rules.json` เป็น `auth != null` (อาศัย Anonymous Auth ที่แอปล็อกอินให้อัตโนมัติ) — บล็อกการเข้าถึงจากภายนอกที่ไม่ผ่านแอป **แต่ยังไม่ได้แยกสิทธิ์ระดับ node** ผู้ที่ signInAnonymously ด้วย config สาธารณะยังอ่าน node `users/` (ที่มี password hash) ได้ การป้องกันเต็มรูปแบบต้องย้ายการยืนยันตัวตนไปฝั่งเซิร์ฟเวอร์ (Cloud Functions/Custom Claims) — เป็นงานใหญ่แยกต่างหาก
9. **การรัน migrate_firebase.js**: เป็นสคริปต์ Node.js สำหรับปรับข้อมูลใน Firebase แบบครั้งคราว ไม่ถูก deploy ขึ้น hosting (อยู่ใน ignore list)
10. **Extension ZIP**: หลังแก้ไขโค้ดใน `/extension` ต้องสร้าง `udlocal_extension.zip` ใหม่และ deploy ขึ้น Firebase ใหม่ทุกครั้ง

---

## 📝 บันทึกการปรับปรุงระบบล่าสุด (Recent Updates - กรกฎาคม 2569)

### 1. เปลี่ยนชื่อโฟลเดอร์โครงการ (Project Folder Rename)
- เปลี่ยนชื่อโครงสร้างโฟลเดอร์หลักจากเดิม `wasadu/` เป็น `sisamran-web-app/`
- ปรับเปลี่ยนข้อมูลในไฟล์คอนฟิกต่าง ๆ ให้ชี้ไปที่โปรเจคและ Firebase Realtime Database ตัวใหม่ `sisamran-c3e5f`

### 2. แก้ไขข้อผิดพลาดหน้าจอขาวค้าง (White Screen Bug Fixes)
- **Firebase Initialization Safety**: เพิ่มเงื่อนไขตรวจสอบการโหลดสคริปต์ Firebase ป้องกันระบบขัดข้องค้างหน้าจอขาวในกรณีที่อินเทอร์เน็ตมีปัญหาหรือไฟล์ CDN โดนบล็อก
- **Array Parsing Defense**: บังคับแปลงข้อมูลผู้ใช้ ปีงบประมาณ หมวดหมู่ และยานพาหนะเป็น Array เสมอ แม้ข้อมูลจาก Firebase จะถูกตอบกลับมาในรูปของ Object (แก้ไขปัญหาระบบหยุดเรนเดอร์จากการพยายามเรียกใช้ `.find()` หรือ `.map()`)
- **Dashboard Navigation Fix**: แก้ไขเหตุการณ์ปุ่มการ์ด "ระบบควบคุมน้ำมัน" บนหน้าแดชบอร์ดชี้เป้าหมายไปที่ห้อง `'construction'` ผิดพลาด โดยเปลี่ยนเป็น `'fuel'` เพื่อแก้ปัญหาคลิกแล้วเกิดจอขาว

### 3. ระบบแจ้งเตือนพื้นที่จัดเก็บไฟล์ (Storage Limit Indicator)
- เพิ่มหน้าจอความจุและแถบแสดงความคืบหน้า (Progress Bar) ลิมิตความจุ **5 GB** บนหน้าหลัก (Dashboard) เฉพาะสำหรับสิทธิ์แอดมิน (Admin)
- คำนวณความจุตามความจริงผ่าน API `listAll()` และอัปเดตระบบเก็บประวัติให้บันทึกฟิลด์ `fileSize` ทุกครั้งเมื่ออัปโหลดเอกสาร PDF ลงระบบใหม่

### 4. แก้ไขด้านความปลอดภัยและความสะอาดของโค้ด (Security & Cleanup — 9 ก.ค. 2569)
- **ถอดรหัส UD-Local ออกจากโค้ดสาธารณะ**: เดิม `LogInName`/`LogInPassWord` ถูกฝังเป็น plaintext ใน `index.html` ที่ deploy สาธารณะ (ใครก็ View Source เห็นได้) → ย้ายไปเก็บใน `localStorage` ผ่าน `getUDLocalCredentials()` ให้ผู้ใช้กรอกครั้งแรก และเพิ่ม `resetUDLocalCredentials()` สำหรับล้างค่า
- **ลบ `updateAdminPassword()`**: ฟังก์ชัน migration เดิมรีเซ็ตรหัส admin เป็น `admin1234` และ `console.log` รหัสออกทุกครั้งที่โหลดหน้า → ลบทิ้งทั้งหมด
- **เพิ่ม Firebase Security Rules**: สร้าง `database.rules.json` (`auth != null`) และผูกเข้า `firebase.json` พร้อมแก้ให้ `loadInitialData()` `await ensureFirebaseAuth()` ก่อนอ่านข้อมูล เพื่อกัน race condition ของ Anonymous Auth
- **แก้เอกสาร/ค่าคอนฟิกที่ไม่ตรง**: URL จริงคือ `sisamran.web.app` (ไม่ใช่ srisamran-stock), ลบการอ้างอิง `index_redesigned.html` ที่ถูกลบไปแล้วออกจาก `manifest.json`, และลบ `package.json`/`package-lock.json` ที่ไม่มีจริงออกจาก ignore list ของ hosting

### 5. แก้บั๊กข้อมูลหาย + Guard กันเขียนทับ (Data-Wipe Guard — 13 ก.ค. 2569)
- **อาการ**: ข้อมูลวัสดุเคยหาย (เช่น 115 → เหลือไม่ครบ) สาเหตุจริงคือทุกครั้งที่ `save()` จะ **เขียนทับทั้ง node `items/<ปี>`** บนเซิร์ฟเวอร์ด้วยข้อมูลในหน่วยความจำ ถ้าตอนนั้นข้อมูลในเครื่องยังโหลดไม่ครบ/ไม่ตรงปี (เช่น Firebase ยังเชื่อมต่อไม่สำเร็จ หรือเพิ่งสลับปี) ข้อมูลสำรองเก่าจะไปทับของจริง
- **วิธีแก้**: เพิ่มธง `firebaseLoadOk` (โหลดจากเซิร์ฟเวอร์สำเร็จหรือยัง) และ `itemsLoadedYear` (ข้อมูลในหน่วยความจำเป็นของปีไหน) — `save()` จะ **งดเขียน node `items` ขึ้นเซิร์ฟเวอร์** ถ้ายังไม่ซิงก์หรือปีไม่ตรง พร้อมเตือนผู้ใช้ให้รีเฟรช
- **ครอบคลุมทุกโมดูล**: ใช้แนวคิดธงเดียวกันกับการบันทึกของ **น้ำมันรถ** (ปี/รถ), **สารบรรณ** (ปี + ตอนนำเข้า Excel), และ **งานสภา** (บุคลากร + การประชุมรายปี) เพื่อกันข้อมูลถูกเขียนทับเช่นกัน

### 6. ฟีเจอร์ "ยกรายการไปปีงบอื่น" + "ยกกลับ" (Move Item Across Fiscal Years — 13 ก.ค. 2569)
- **ยกไปปีงบอื่น**: ในโมดูลวัสดุ ติ๊กเลือกหลายรายการ → เลือกปีปลายทางในแถบเครื่องมือ → กด **"ย้ายปีงบ 📅"** ระบบจะคัดลอกรายการ (พร้อมประวัติรับ-จ่ายทั้งหมด) ไปยังปีปลายทาง
- **ต้นทางไม่ถูกลบ แต่ถูกล็อก**: แถวต้นทางยังอยู่ให้เห็น แต่ติดป้าย **"↗ ยกไปปีงบ… แล้ว"**, ติ๊กเลือก/แก้ไข/ลบไม่ได้ (แสดง 🔒/🔓), และเปิดบัญชีได้แบบดูประวัติอย่างเดียว (ฟอร์มรับ-จ่ายถูกซ่อน) — เก็บสถานะไว้ในฟิลด์ `movedToYear`/`movedToId`/`movedAt`
- **ยกกลับ (Undo)**: กดปุ่ม **🔓** บนแถวที่ถูกล็อก ระบบจะลบสำเนาในปีปลายทาง (อ้างอิงด้วย `movedToId` จึงลบได้ตรงตัว) แล้วปลดล็อกต้นทางให้กลับมาใช้งานปกติ
- **ความปลอดภัยของข้อมูล**: ทุกขั้นตอนโหลดข้อมูลปีปลายทาง "สด" จากเซิร์ฟเวอร์ก่อนเสมอ และเขียนปลายทางให้สำเร็จก่อนค่อยแก้ต้นทาง (worst case = มีสำเนาซ้ำ ไม่ใช่ข้อมูลหาย) — ใช้ guard `firebaseLoadOk`/`itemsLoadedYear` เดียวกับข้อ 5
- **ฟังก์ชันที่เกี่ยวข้อง**: `applyBulkMoveYear()`, `moveBackItem()`, `updateBulkBar()` (เติม dropdown ปีปลายทาง), `getMergedItems()` (ส่งต่อ flag `movedToYear`)

### 7. ระบบงานสภาและการจดรายงานการประชุมพร้อมสร้างเอกสาร Word (Council App & Docgen — 20 ก.ค. 2569)
- **ระบบงานสภา (Council App)**: เพิ่มโมดูลที่ 4 ในหน้าหลัก (Dashboard) เพื่อให้แอดมินและเจ้าหน้าที่สภาสามารถควบคุมฐานข้อมูลรายชื่อสมาชิกสภา (ชื่อ, ตำแหน่ง, เขต) และประวัติการประชุมแต่ละสมัย/ครั้งได้ครบวงจร
- **ระบบจดรายงานการประชุม (Minutes Editor)**: หน้าต่างสำหรับเลือกผู้เข้าร่วมประชุม, ผู้ที่ลา/ขาดการประชุม และการเพิ่มบทพูดโต้ตอบของสมาชิกแต่ละคนในการประชุมอย่างเป็นระบบ แยกตามวาระการประชุมต่าง ๆ
- **การสร้างเอกสารอัตโนมัติ (Document Generation)**: รวมการใช้งาน PizZip และ Docxtemplater ร่วมกับการโหลดเทมเพลตแบบ lazy จากไฟล์ `council-templates.js` (ไฟล์เก็บ base64 ของเอกสาร Word .docx ราชการทั้ง 8 ชนิด) เพื่อสร้างไฟล์ Word ราชการอัตโนมัติ เช่น หนังสือเชิญประชุมสภา, ระเบียบวาระการประชุม, ทะเบียนรายชื่อ, รายงานการประชุม เป็นต้น รองรับทั้งการดาวน์โหลดทีละชิ้นและการดาวน์โหลดทั้งเซ็ตเป็นไฟล์บีบอัด (.zip)
- **การจำลองฟอนต์ราชการในระบบพรีวิว**: ฝังฟอนต์ `TH SarabunIT๙` สำหรับหน้าต่างพรีวิวรายงานการประชุมสภาทางหน้าจอ เพื่อช่วยจัดระเบียบหน้าตาและขนาดตัวอักษรให้เหมือนกับตอนพิมพ์ออกจากหน้ากระดาษราชการจริง

> **⚠️ หมายเหตุการทดสอบ**: preview ในเครื่องและการรันสคริปต์ทดสอบ **เชื่อมต่อฐานข้อมูล production จริง** (ไม่มี staging) — การทดสอบที่เรียก `save()`/`db.ref().set()` จะเขียนทับข้อมูลจริง ควรทดสอบแบบ in-memory หรือใช้รายการชื่อ `ZZ_TEST_*` ที่กู้คืนได้ และตรวจยอดหลังทดสอบ (2569 = 110 รายการ)

### 8. แก้พรีวิวเอกสารประชุมสภาให้ตรงกับ Word (Docgen Preview Alignment Fix — 23 ก.ค. 2569)
- **อาการ**: หน้าต่างพรีวิวเอกสารประชุมสภา (ปุ่ม 👁️ พรีวิว) แสดงผลไม่ตรงกับไฟล์ Word ที่ดาวน์โหลด โดยเฉพาะ **ระเบียบวาระการประชุม (agenda.docx)** — วาระย่อยที่ตกบรรทัด (เช่น ๒.๑, ๕.๑) ถูกยืดเต็มบรรทัด (justify) เกิดช่องโหว่กลางคำ ทั้งที่ Word จัดชิดซ้ายเว้นวรรคปกติ (ไฟล์ดาวน์โหลดถูกต้องอยู่แล้ว เพี้ยนเฉพาะพรีวิว)
- **สาเหตุ**: `docx-preview` ไม่รองรับการจัดแบบ `thaiDistribute` (เรนเดอร์ชิดซ้าย) โค้ดเดิมใน `polishDocPreview()` จึงชดเชยด้วยการสั่ง `text-align:justify` ให้ **ทุกย่อหน้าที่สูงเกิน 30px** ซึ่งเป็นการเดาจากความสูง ทำให้ไป justify วาระย่อยของ agenda ที่ต้นฉบับไม่มี `thaiDistribute` (ต่างจากรายการในประกาศเชิญร่วมฟังที่มี `thaiDistribute` จริง จึง justify ถูกต้อง)
- **วิธีแก้**: ให้การจัด justify อิงค่า `w:jc` จริงของต้นฉบับแทนการเดาความสูง
  - เพิ่ม `thaiDistributeToBothForPreview(buf)` — ก่อน `renderAsync` จะแปลง `w:val="thaiDistribute"`→`w:val="both"` ใน `word/document.xml` ของ **สำเนาที่ใช้พรีวิวเท่านั้น** (ผ่าน PizZip) เพราะ `docx-preview` แม็ป `both`→`justify` โดยตรง จึง justify เฉพาะย่อหน้าที่ Word จัดกระจายจริง
  - ลดรูป `polishDocPreview()` ให้เหลือ 2 หน้าที่: (1) บังคับ `nowrap` บรรทัด "สิ่งที่ส่งมาด้วย" (2) ยุบช่องว่างซ้ำ (`xml:space`) เฉพาะย่อหน้าที่ถูก justify — **ตัดตรรกะ justify-ตามความสูงออก**
- **ไฟล์ดาวน์โหลดไม่เปลี่ยน**: แปลง `thaiDistribute` เฉพาะบัฟเฟอร์พรีวิว ตัว `.docx` ที่ดาวน์โหลดยังคง `thaiDistribute` เดิมสำหรับ Word
- **การตรวจสอบ**: เทียบทั้ง 5 เอกสาร (announce-call/announce-public/invite-letter/pr-request/agenda) ระหว่าง Word จริง (เรนเดอร์ผ่าน Word COM → PDF) กับพรีวิว `docx-preview` (headless Chrome + ฟอนต์ TH SarabunIT๙) — agenda หายเพี้ยน อีก 4 ไฟล์เหมือนเดิม (ไม่มี regression)
- **ข้อจำกัดที่เหลือ (ธรรมชาติของเบราว์เซอร์ แก้ไม่ได้)**: การตัดคำไทยของเบราว์เซอร์ต่างจาก Word เล็กน้อย (เช่น ตัด "ส่วนตำบล" เป็น ส่วน|ตำบล) ทำให้จุดตัดบรรทัดคลาดกันได้ และคอลัมน์ "จำนวน" ในหนังสือเชิญจัดด้วยการเคาะเว้นวรรคมือ จึงเหลื่อมเล็กน้อย

### 9. ฟีเจอร์สรุปประวัติการใช้น้ำมันประจำเดือน (ทุกรถ) + ปุ่ม▼เลือกคนขับ (Fuel App — 1 กันยายน 2569)
- **สรุปทุกรถในเดือนเดียว**: เพิ่ม Panel ใหม่ด้านล่างกรอบบันทึกประวัติรายคัน ชื่อ "📊 สรุปประวัติการใช้น้ำมันประจำเดือน (ทุกรถ)" ประกอบด้วย
  - ตารางสรุปรายคัน: คอลัมน์ `ลำดับ | ยานพาหนะ | จำนวนครั้ง | ระยะทาง (กม.) | น้ำมัน (ลิตร) | จำนวนเงิน (บาท) | ค่าเฉลี่ย (บาท/ลิตร)` พร้อมแถวสีเทา (tfoot) แสดงยอดรวมทุกรถ
  - ส่วนสรุปท้ายตาราง: ยอดรวมเดือนนี้ / ยอดรวมเดือนที่แล้วมา (สะสมตั้งแต่ต้นปีงบ ตุลาคม) / ผลต่าง (+/-)
- **คำนวณระยะทางแยก per คัน**: ฟังก์ชัน `calculatePerVehicleDistance()` คำนวณจากเลขไมล์แยกตาม vehicleId เพราะแต่ละคันมีเลขไมล์เริ่มต้นคนละค่า
- **โหลด logs ทุกรถแบบ Real-time**: `loadAllVehicleLogs()` ดึงข้อมูลทุกรถจาก LocalStorage (ทันที) แล้ว Firebase (async) พร้อม cache `allVehicleLogsCache` สำหรับ refresh
- **อัปเดตอัตโนมัติทุกจุด**: ทุกครั้งที่เปลี่ยนเดือน/ปีงบ, บันทึก/ลบรายการ, นำเข้า Excel, เพิ่ม/ลบรถ → จะเรียก `renderAllVehiclesFuelSummary()` ทันที

### 10. แก้ไขปุ่ม▼เลือกชื่อคนขับ: กล่อง dropdown ไม่โดนตัด + แสดงรายการคนขับเต็ม (Driver Dropdown Fix — 1 กันยายน 2569)
- **สาเหตุเดิมที่ปุ่ม▼ไม่ทำงาน**: (ก) ปุ่ม▼เดิมไม่ได้ผูก `onclick` ใดๆ (แค่ UI ตกแต่ง) (ข) ช่อง input ใช้ `<datalist>` ที่ต้องพิมพ์ถึงจะแสดง suggest ไม่รองรับคลิกเปิดรายการ
- **สาเหตุที่ dropdown โดนตัดกล่อง**: `.panel` และบาง container มี CSS `overflow:hidden` ทำให้ dropdown ที่วาง `position:absolute` ภายใน ถูกตัดออกแค่ 2-3 รายการ (เห็นชัดในภาพหน้าจอที่ user ส่งมา)
- **วิธีแก้ (แบบ Robust)**:
  1. **เปลี่ยนเป็น Fixed Position + Move ไป Body**: ฟังก์ชัน `_ensureDropdownOnBody()` ย้าย `<div class="driver-dropdown-list">` ไปเป็น child ของ `<body>` (ไม่อยู่ใน panel อีกต่อไป) และใช้ CSS `position: fixed` แทน absolute
  2. **คำนวณตำแหน่งอัตโนมัติ**: `_positionDropdownList()` ใช้ `getBoundingClientRect()` คำนวณ left/top/width ตามขนาดช่อง input จริง รองรับกรณี (ก) พื้นที่ใต้ช่องไม่พอ → เปิดขึ้นบนแทน (ข) ช่องอยู่ใกล้ขอบจอ → เลื่อน dropdown ไม่ให้หลุดจอ (ค) หน้าจอแคบ → ลด maxHeight ให้พอดี
  3. **เพิ่มฟังก์ชันควบคุม**: `toggleDriverDropdown(ev, id)`, `renderDriverDropdownItems()`, `selectDriverFromDropdown()`, `closeAllDriverDropdowns()` พร้อม listener `document.click` (ปิดเมื่อคลิกนอก), `window.resize`, `window.scroll` (position ใหม่หรือปิด)
  4. **ครอบคลุม 2 จุด**: (ก) ช่อง `ผู้รับ (คนขับ)` ในฟอร์มน้ำมัน (id `fuel-receiver`) (ข) ช่อง `👤 คนขับประจำ` ใน modal จัดการรถ (id `v-default-driver`)
  5. **UX เพิ่มเติม**:
     - ชื่อที่เลือกอยู่แล้วจะถูก highlight (class `.dd-item.active` สีฟ้า ตัวหนา)
     - dropdown มีเงา + มุมโค้ง + scroll bar รองรับรายการมาก (max-height 380px ≈ 15 รายการ)
     - z-index: `2147483000` (สูงกว่า modal ทั่วไป เพื่อไม่โดนซ้อน)
     - กระจายรายชื่อคนขับไปทุกจุด: `renderDriverDatalist()` render ทั้ง `fuel-receiver-list` (datalist) และ `v-driver-list` (modal จัดการรถ)
- **ผลการตรวจสอบบนเว็บจริง (sisamran.web.app)**:
  - Dropdown อยู่บน body, position fixed, สูง 378px (เต็ม 380px max-height ไม่โดนตัดอีกต่อไป)
  - แสดงรายการคนขับ 9 คนจาก Firebase จริง: นายธีระวัฒน์ พิมพาแสง, นายนณัฐพล พาวะธิ, นายบุญชัย อุ่นแก้ว, นายปริญญา จันภูถิ่น, นายปิยะ ช่วยแสง, นายมิตร สุทธิแพทย์, นายยุทธนา ภูมูลนา, นายวิทยา คำภา เป็นต้น
  - คลิกเลือกชื่อ → ใส่ค่าในช่อง input พร้อม dispatch `input`/`change` event → ทำงานต่อได้ปกติ
  - คลิกภายนอก / resize / scroll → dropdown position อัปเดตอัตโนมัติ หรือปิด

> **⚠️ สัญญาการ Deploy ที่แก้ไขใหม่ (Added 1 ก.ย. 2569)**: ทุกครั้งที่ Deploy อัปเดตระบบขึ้น Firebase Hosting จะ **ยึดข้อมูลจริงจากฐานข้อมูล Firebase คลาวด์ของผู้ใช้ (fuelVehicles, fuelLogs, fuelDrivers ฯลฯ) เป็นหลัก 100%** — ห้ามนำข้อมูลจำลอง / ข้อมูลเทส / ข้อมูลนอกเหนือจากที่ผู้ใช้บันทึกไว้ใน Firebase มาใส่ทุกกรณี (แม้จะเป็นการทดสอบใน sandbox browser ก็ตาม — ถ้าจำเป็นต้องเทส Logic ให้เตรียมข้อมูลเทสไว้แยก แล้วล้างทิ้งก่อนจบการทดสอบ โดยไม่กระทบข้อมูลจริงผู้ใช้)

### 11. แก้ไขการส่งออก Excel (เดือนเดียว + ทั้งปี): ดาวโหลดแยกไฟล์ต่อคัน (Fuel Export Refactor — 1 กันยายน 2569)
- **ปัญหาเดิม**: ฟังก์ชัน `exportFuelToExcel` / `exportFullYearFuelToExcel` ทำงานเฉพาะยานพาหนะที่เลือกใน dropdown (1 คัน) เท่านั้น ไม่สามารถส่งออกทุกรถในคราวเดียวได้ → user ต้องสลับคัน แล้วกดส่งออกซ้ำๆ ทีละคัน
- **การแก้ไข**: เปลี่ยนให้ทุกรถถูกส่งออกทั้งหมดในคราวเดียว แต่ **แยกไฟล์เป็นคันๆ ตามที่ user ต้องการ** (ไม่มีการรวมทุกรถเข้าด้วยกันในไฟล์เดียว):
  1. **Refactor ฟังก์ชันย่อย** (ย้ายโค้ดเดิมที่ซ้ำซ้อนมาเป็น helper):
     - `buildMonthlyWorkbookForVehicle(vehicle, targetMonth, targetYear)` → สร้าง workbook 1 คัน สำหรับ 1 เดือน (1 ชีต)
     - `buildFullYearWorkbookForVehicle(vehicle, targetYear)` → สร้าง workbook 1 คัน สำหรับ 1 ปีงบ (12 ชีต ตค - กย เหมือนเดิม)
     - `sanitizeFilename(str)` → แก้ชื่อไฟล์ให้ปลอดภัย (ลบสัญลักษณ์ห้าม `\\/:*?"<>|` รวมถึงช่องว่าง → เปลี่ยนเป็น `_`)
     - `workbookToBlob(wb)` → convert workbook → Uint8Array → Blob
     - `downloadBlob(blob, filename)` → helper download ไฟล์ใดๆ ผ่าน anchor element
  2. **กรณี 1 คัน** (fuelVehicles.length === 1): ดาวโหลดไฟล์ Excel (.xlsx) ตรงๆ เหมือนเดิม (รองรับย้อนหลัง)
  3. **กรณีหลายคัน** (มี 2 คันขึ้นไป): สร้างไฟล์ **ZIP** (ใช้ `PizZip` ที่โปรเจกต์มีอยู่แล้วจากบรรทัดแรก ของ script src) โดยภายใน ZIP มีไฟล์ Excel แยกกันเป็นคันๆ
- **ผลลัพธ์ชื่อไฟล์**:
  - เดือนเดียว (ZIP): `รายงานน้ำมัน_ทุกรถ_<เดือน>_<ปีงบ>.zip`
  - ใน ZIP มี: `รายงานน้ำมัน_<ทะเบียน>_<เดือน>_<ปีงบ>.xlsx`
  - ทั้งปี (ZIP): `รายงานน้ำมันทั้งปี_ทุกรถ_ปีงบประมาณ_<ปีงบ>.zip`
  - ใน ZIP มี: `รายงานน้ำมันทั้งปี_<ทะเบียน>_ปีงบประมาณ_<ปีงบ>.xlsx` (แต่ละไฟล์ภายในยังแยก 12 ชีตตามเดือนเหมือนเดิม)
- **จุดสำคัญอื่น**:
  - **Logs ถูก filter ตาม vehicle.id**: `.filter(l => l.vehicleId === vehicle.id)` ก่อนคำนวณระยะทาง (ทั้ง helper ทั้ง monthly และ full-year) — แก้ขอบเขต bug เดิมที่เคยคำนวณจาก logs ทุกรถรวมกันเมื่อส่งออก 1 คันก็ตาม (แต่เคย workaround ด้วยการเลือกคันใน dropdown)
  - `lastOdo` ถูก reset เป็น 0 ใหม่ต่อ vehicle (สำหรับ full-year build per vehicle)
  - Zip ใช้ `compression: "DEFLATE"` → บีบอัดไฟล์ Excel ขนาดเล็กลงได้ดี

### 12. แก้ไข Bug ส่งออก Excel: ข้อมูลหาย (0.00) + จัดรูปแบบหัวตารางตรงงานราชการ (Fix Export Data + Headers — 1 กันยายน 2569)
- **สาเหตุที่ไฟล์ดาวน์โหลดมีแค่ 0.00**:
  - ตัวแปร global `fuelLogs` (บรรทัด 6522) อ่าน/เขียนได้เฉพาะ **ยานพาหนะที่เลือกใน dropdown (selectedVehicleId)** เท่านั้น — มันจะว่างเปล่าสำหรับรถคันอื่นๆ ทุกคัน เวลา export วนทุกรถไปเรื่อยๆ → logs ของคันที่ 2,3,4... ถูก filter เป็น [] → เลข 0.00 หมด
  - Solution: ใช้ `allVehicleLogsCache[vehicle.id]` (ที่เป็น cache ของทุกรถ ถูกเติมทุกครั้งเมื่อบันทึก/ลบรายการ และโหลดจาก LocalStorage ทุกคัน) แทน
  - เพิ่ม helper `ensureAllVehicleLogsLoadedForYear(targetYear)` (บรรทัด 7861) เพื่อโหลดทุกรถจาก LocalStorage `office_fuel_logs_${year}_${vid}` ทุกคัน sync ทันที (ไม่ต้องรอ Firebase) ก่อนเริ่ม Export ทุกครั้ง (ใช้ทั้งเดือนเดียวและทั้งปี)
- **แก้ไขหัวตารางใน Excel ให้ตรงกับตัวอย่างภาพงานราชการที่ user ส่งมา**:
  - `ใบสั่งจ่าย/ใบเสร็จรับเงิน` → **`บสั่งจ่าย/ใบเสร็จรับเงิน`** (ตามรูปแบบราชการจริง)
  - บันทัดที่ 2 ของ header: `"เล่มที่", "เลขที่", "เมื่อขอเติม", "(กิโลเมตร)", "(จำนวนลิตร)", "(บาท)"` — รองรับ merge cell เดิม ให้ตรงตารางงานราชการ
  - หัวรายงาน `แบบควบคุมการค่าใช้จ่ายสิ้นเปลืองน้ำมันเชื้อเพลิงและหล่อลื่น`, `องค์การบริหารส่วนตำบลศรีสำราญ` และป้ายประเภทรถ ✅ ถูกต้อง
  - หมายเหตุท้ายสุด: `หมายเหตุ : ผลต่าง เพิ่มให้ใส่เครื่องหมาย + ลดลงให้ใส่เครื่องหมาย -` — ตรงกับภาพ
- **จุดที่ตรวจสอบเพิ่ม**:
  - `sort()` logs ภายใน build ทั้ง 2 ฟังก์ชัน → ให้แน่ใจว่า `calculate distance` เปรียบเทียบก่อนหน้าถูกต้องตามวันที่ (ไม่เอา global fuelLogs ที่อาจจะปะปนมาจากคันอื่น)
  - เรียก `ensureAllVehicleLogsLoadedForYear(year)` ทุกครั้งใน `exportFuelToExcel` และ `exportFullYearFuelToExcel` ก่อนเริ่มสร้าง workbook

### 13. แก้ไข Bug Export: ข้อมูลรถคันอื่นรั่วข้ามคันในไฟล์ Excel (Cross-Vehicle Leak — 1 กันยายน 2569)
- **สาเหตุ**: ตอน refactor เปลี่ยน data source จาก `fuelLogs` (บรรทัด #11) → `allVehicleLogsCache[vehicle.id]` ลืมใส่ **filter by vehicleId** ซ้ำอีกชั้นหนึ่งไว้ (เดิมเคยมี `.filter(l => l.vehicleId === vehicle.id)` อยู่ในโค้ดเวอร์ชันเก่า) → ถ้า cache/state มี legacy data หรือ logs ที่ไม่มี `vehicleId` จะถูกนำไปใส่ใน workbook ทุกรถ
- **วิธีแก้ไข (Defense-in-Depth)**:
  - ใน `buildMonthlyWorkbookForVehicle` (บรรทัด 7884): เพิ่ม `.filter(l => l && l.vehicleId === vehicle.id)` หลังดึงจาก `allVehicleLogsCache[vehicle.id]`
  - ใน `buildFullYearWorkbookForVehicle` (บรรทัด 8060): เพิ่ม `.filter(l => l && l.vehicleId === vehicle.id)` ด้วย
- **ผลลัพธ์**: 1 ไฟล์ Excel = 1 รถคันเดียว 100% ไม่มี logs จากคันอื่นปะปน

### 14. ปรับพฤติกรรม Export + Table Render: (1) ปุ่มส่งออกแยก 2 ชุด (2) Div ตารางแสดงเฉพาะคันที่เลือกใน dropdown (1 กันยายน 2569)
- **(1) ปุ่มส่งออกเดือนเดียวแยก 2 ชุด ตามต้องการ user**:
  - ปุ่มที่ 1 (สีเดิม `--fuel-accent`): `📊 ส่งออกประจำเดือน (แค่คันที่เลือก)` → กดแล้วได้ไฟล์ xlsx ไฟล์เดียวของรถคันที่เลือกอยู่ใน dropdown **ตรงกับที่แสดงใน div กรอบตารางพอดี**
  - ปุ่มที่ 2 (สีเขียว `#1abc9c`): `📦 ส่งออกประจำเดือน (ทุกรถใน ZIP)` → กดแล้วได้ ZIP ไฟล์รวมทุกรถแยกไฟล์เหมือนเดิม
  - ปุ่ม `ส่งออกรายงานทั้งปี (แยกชีต)` (สีส้ม) **คงอยู่เหมือนเดิม ตามที่สั่ง**
  - `exportFuelToExcel(mode)` รับ parameter `'selected'` หรือ `'all'` แยก path; selected mode มี validate ถ้ายังไม่ได้เลือกรถจะ toast แจ้งเตือน
  - เพิ่ม helper `labelOfVehicle(v)` (บรรทัด 7843) เพื่อแปลง vehicle.type → ชื่อไทย สำหรับ toast และ badge
- **(2) Div ตาราง "📋 บันทึกประวัติการใช้น้ำมันประจำเดือน" แสดงเฉพาะของคันที่เลือกใน dropdown เท่านั้น (Fix ที่ user แจ้งว่ามีคันอื่นรวมอยู่ด้วย)**:
  - **รากเหง้า**: พฤติกรรมโหลดทุกจุด (`loadFuelLogs` STEP 1 local preview, STEP 2 Firebase sync, `loadFuelLogsFromLocal`, `renderFuelLogs` table render) มีแต่ `.filter(id && date)` แต่ไม่ได้ filter `vehicleId === selectedVehicleId` ในระดับ logic เลย — แม้ LocalStorage จะ key แยกคัน แต่ถ้ามี legacy data / state รั่ว / logs ที่ vehicleId ไม่ตรง จะปะปนขึ้นในตารางทันที
  - **วิธีแก้ไข (Defense-in-Depth ทุกจุด — 4 จุด)**:
    - จุด 1 [loadFuelLogs() STEP 1 — local preview L6651] `.filter(l => l && l.id && l.vehicleId === selectedVehicleId)`
    - จุด 2 [loadFuelLogs() STEP 2 — Firebase sync L6677+L6680] serverLogs และ inMem filter `&& log.vehicleId === selectedVehicleId`
    - จุด 3 [loadFuelLogsFromLocal() L7001] rawLogs filter `&& log.vehicleId === selectedVehicleId`
    - จุด 4 [renderFuelLogs() L7114] cleanLogs ก่อน sort/calc filter `&& log.vehicleId === selectedVehicleId`
  - **(3) กรอบ "📊 สรุประวัติการใช้น้ำมันประจำเดือน (ทุกรถ)" — เอาไว้เหมือนเดิม ตามที่ user สั่ง explicit**





