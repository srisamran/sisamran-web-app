const http = require('http');
const https = require('https');
const querystring = require('querystring');

// Configuration
const LOGIN_URL = 'https://ud-local.com/doc/config_ctrl/checkmember.php';
const DATA_URL = 'https://ud-local.com/doc/home.php';
const FIREBASE_DB_URL = 'https://sisamran-c3e5f-default-rtdb.asia-southeast1.firebasedatabase.app';
const PORT = 3000;

const credentials = {
  LogInName: '41133',
  LogInPassWord: '3587989',
  LoginH: 'Submit',
  type: '1'
};

// Cookie cache
let cachedCookies = null;
let cookieExpiry = 0;

// Calculate Thai Fiscal Year
function getThaiFiscalYear() {
  const now = new Date();
  let year = now.getFullYear() + 543;
  if (now.getMonth() >= 9) { // Oct (9) to Dec (11)
    year += 1;
  }
  return String(year);
}

const fiscalYear = getThaiFiscalYear();
console.log(`[INFO] กำหนดปีงบประมาณสำหรับการซิงค์: ${fiscalYear}`);

function makeRequest(url, method, headers = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function getCookies() {
  // Reuse cookies if they are valid (cached for 10 minutes)
  if (cachedCookies && Date.now() < cookieExpiry) {
    return cachedCookies;
  }

  console.log('[INFO] กำลังเข้าสู่ระบบ UD-Local...');
  const postData = querystring.stringify(credentials);
  const loginRes = await makeRequest(LOGIN_URL, 'POST', {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }, postData);

  const setCookie = loginRes.headers['set-cookie'];
  if (!setCookie) {
    throw new Error('ไม่พบข้อมูล Session Cookie จากการล็อกอิน กรุณาตรวจสอบสิทธิ์ผู้ใช้');
  }

  cachedCookies = setCookie.map(c => c.split(';')[0]).join('; ');
  cookieExpiry = Date.now() + 10 * 60 * 1000; // Cache for 10 mins
  return cachedCookies;
}

async function runSync() {
  try {
    const cookies = await getCookies();
    console.log('[INFO] ดึงข้อมูลกล่องรับงาน UD-Local...');

    const dataRes = await makeRequest(DATA_URL, 'GET', {
      'Cookie': cookies,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    });

    const documents = parseHtml(dataRes.body);
    console.log(`[INFO] พบเอกสารในตารางทั้งหมด ${documents.length} รายการ`);

    if (documents.length === 0) {
      console.log('[SUCCESS] ไม่มีเอกสารที่ต้องซิงค์ข้อมูล');
      // Overwrite the entire path with empty object/null
      const docPath = `${FIREBASE_DB_URL}/durableDocs/${fiscalYear}/udlocal.json`;
      await makeRequest(docPath, 'PUT', {
        'Content-Type': 'application/json'
      }, JSON.stringify({}));
      return { count: 0 };
    }

    // Load existing docs to preserve 'รับแล้ว' status
    let existingDocs = [];
    try {
      const existingRes = await makeRequest(`${FIREBASE_DB_URL}/durableDocs/${fiscalYear}/udlocal.json`, 'GET');
      if (existingRes.statusCode === 200 && existingRes.body) {
        const val = JSON.parse(existingRes.body);
        if (val) {
          existingDocs = Object.values(val);
        }
      }
    } catch (e) {
      console.log('[INFO] ไม่สามารถดึงข้อมูลเดิมเพื่อตรวจสอบสถานะได้:', e.message);
    }

    const existingStatusMap = {};
    existingDocs.forEach(d => {
      if (d.id && d.status === 'รับแล้ว') {
        existingStatusMap[d.id] = 'รับแล้ว';
      }
    });

    const docsObj = {};
    for (const doc of documents) {
      if (existingStatusMap[doc.id]) {
        doc.status = 'รับแล้ว';
      }
      docsObj[doc.id] = doc;
    }

    console.log('[INFO] กำลังส่งข้อมูลขึ้น Firebase Database...');
    const docPath = `${FIREBASE_DB_URL}/durableDocs/${fiscalYear}/udlocal.json`;

    await makeRequest(docPath, 'PUT', {
      'Content-Type': 'application/json'
    }, JSON.stringify(docsObj));

    console.log(`[SUCCESS] อัปเดตข้อมูลกล่องรับงานสำเร็จจำนวน ${documents.length} รายการ!`);
    return { count: documents.length };
  } catch (error) {
    console.error('[ERROR] ซิงค์ไม่สำเร็จ:', error.message);
    throw error;
  }
}

async function runAccept(id, iCount) {
  try {
    const cookies = await getCookies();
    console.log(`[INFO] กำลังส่งคำขอกดรับหนังสือ ID: ${id} (iCount: ${iCount}) ไปยัง UD-Local...`);

    const postData = querystring.stringify({
      SubmitH: 'Acept',
      senorg_idH: id,
      iCountH: iCount || '1',
      SearchOption: '',
      SearchOptionVal: '',
      selTypeShow: '1'
    });

    const acceptRes = await makeRequest(DATA_URL, 'POST', {
      'Cookie': cookies,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }, postData);

    console.log(`[INFO] คำสั่งรับหนังสือส่งสำเร็จ (Status: ${acceptRes.statusCode})`);
    
    // Run sync immediately to pull the updated state from UD-Local (assigned receiveNo, isNew changed to false)
    console.log('[INFO] ทำการซิงค์ข้อมูลใหม่หลังกดรับ...');
    await runSync();

    return { success: true };
  } catch (error) {
    console.error('[ERROR] กดรับไม่สำเร็จ:', error.message);
    throw error;
  }
}

function parseHtml(html) {
  const docs = [];
  const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match;
  let noCounter = 1;

  while ((match = trRegex.exec(html)) !== null) {
    const rowHtml = match[1];
    // A valid row must contain 'brdrfashion' td style class
    if (!rowHtml.includes('brdrfashion')) continue;

    const cells = [];
    let cellMatch;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      let txt = cellMatch[1]
        .replace(/<[^>]*>/g, '') // remove HTML tags
        .replace(/&nbsp;/gi, ' ')
        .trim();
      cells.push(txt);
    }

    // A valid row should have at least 10 columns
    if (cells.length < 10) continue;

    // Extract file attachment link
    let downloadUrl = '';
    const fileLinkMatch = rowHtml.match(/fn_open_page\(['"]([^'"]+)['"]\)/i);
    if (fileLinkMatch && fileLinkMatch[1]) {
      downloadUrl = fileLinkMatch[1];
    }

    // Parse unique senorg_id (id) and check if it has Acept button (isNew)
    const aceptMatch = rowHtml.match(/fn_Acept\(\s*['"](\d+)['"]/i);
    const forwardMatch = rowHtml.match(/fn_forward\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*,\s*['"](\d+)['"]/i);
    const id = (aceptMatch && aceptMatch[1]) || (forwardMatch && forwardMatch[1]);
    const isNew = !!aceptMatch;

    if (!id) continue; // Skip if we cannot locate unique id

    docs.push({
      id: id,
      isNew: isNew,
      no: noCounter++,
      receiveNo: cells[2] || '',   // column 2 (1059/2569 or -)
      sender: cells[3] || '',      // column 3 (หน่วยงานผู้ส่ง)
      docNumber: cells[4] || '',   // column 4 (เลขที่หนังสือ)
      status: cells[5] || '',      // column 5 (สถานะ)
      subject: cells[6] || '',     // column 6 (ชื่อหนังสือ)
      downloadUrl: downloadUrl,    // column 7 (ลิงก์ดาวน์โหลด)
      docDate: cells[9] || ''      // column 9 (ลงวันที่)
    });
  }
  return docs;
}

// Start HTTP Server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (reqUrl.pathname === '/api/sync') {
    try {
      const result = await runSync();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: result.count }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  } else if (reqUrl.pathname === '/api/accept') {
    const id = reqUrl.searchParams.get('id');
    const iCount = reqUrl.searchParams.get('iCount') || '1';

    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'ระบุรหัสเอกสาร id ไม่ถูกต้อง' }));
      return;
    }

    try {
      const result = await runAccept(id, iCount);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'ไม่พบพาร์ทที่เรียกใช้' }));
  }
});

server.listen(PORT, () => {
  console.log('=======================================================');
  console.log(`[INFO] UD-Local Sync Service เริ่มทำงานแล้วที่พอร์ต ${PORT}`);
  console.log(`[INFO] รันระบบ Companion: http://localhost:${PORT}`);
  console.log('=======================================================');
});
