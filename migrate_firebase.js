/**
 * migrate_firebase.js
 * สคริปต์ย้ายข้อมูลจาก Firebase เดิม (wasadu-office) ไปยัง Firebase ใหม่ (sisamran-c3e5f)
 * รองรับการเข้าถึง Firebase เดิมผ่าน REST Auth และรองรับการบันทึกเข้า Firebase ใหม่ทั้งแบบใช้ token และแบบเขียนตรง
 * รัน: node migrate_firebase.js
 */

const https = require('https');

const OLD_CONFIG = {
  apiKey: "AIzaSyDHiM6OClTja2VF825sdbRnpcf73Oq8gik",
  databaseURL: "https://wasadu-office-default-rtdb.firebaseio.com"
};

const NEW_CONFIG = {
  apiKey: "AIzaSyAKhE7Yf3YlByAO3Au8TuMvpv58Aq7k2Z4",
  databaseURL: "https://sisamran-c3e5f-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const NODES_TO_MIGRATE = [
  'items',
  'fuelVehicles',
  'fuelLogs',
  'users',
  'fiscalYears',
  'categories',
  'settings',
  'durableDocs'
];

function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

function putJSON(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function migrate() {
  console.log('============================================================');
  console.log('🚀 เริ่มต้นการย้ายข้อมูล Firebase (แบบยืนยันตัวตน Anonymous)');
  console.log(`📤 ต้นทาง: ${OLD_CONFIG.databaseURL}`);
  console.log(`📥 ปลายทาง: ${NEW_CONFIG.databaseURL}`);
  console.log('============================================================');

  try {
    // 1. ล็อกอินแบบ Anonymous บน Firebase เดิม
    process.stdout.write('🔑 ล็อกอินแบบ Anonymous บน Firebase เดิม... ');
    const oldAuth = await postJSON(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${OLD_CONFIG.apiKey}`,
      { returnSecureToken: true }
    );
    if (!oldAuth.idToken) {
      throw new Error('ไม่สามารถล็อกอินกับ Firebase เดิมได้: ' + JSON.stringify(oldAuth));
    }
    const oldToken = oldAuth.idToken;
    console.log('✅ สำเร็จ');

    // 2. ล็อกอินแบบ Anonymous บน Firebase ใหม่ (ถ้าเปิดใช้งาน)
    let newToken = null;
    process.stdout.write('🔑 ล็อกอินแบบ Anonymous บน Firebase ใหม่... ');
    const newAuth = await postJSON(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${NEW_CONFIG.apiKey}`,
      { returnSecureToken: true }
    );
    if (newAuth && newAuth.idToken) {
      newToken = newAuth.idToken;
      console.log('✅ สำเร็จ');
    } else {
      console.log('⚠️ ไม่สำเร็จ (ADMIN_ONLY_OPERATION) - จะใช้โหมดเขียนตรงโดยไม่ต้องใช้ Token');
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const node of NODES_TO_MIGRATE) {
      process.stdout.write(`\n🔄 กำลังย้าย [${node}]... `);
      
      try {
        // ดึงข้อมูลโดยผ่าน Token ยืนยันตัวตน
        const data = await getJSON(`${OLD_CONFIG.databaseURL}/${node}.json?auth=${oldToken}`);
        
        if (data === null || data === undefined) {
          console.log(`⏭️  ไม่มีข้อมูล (ข้าม)`);
          skipCount++;
          continue;
        }

        if (data.error) {
          throw new Error(data.error);
        }

        // นับจำนวนข้อมูล
        const count = typeof data === 'object' ? Object.keys(data).length : 1;
        
        // เขียนข้อมูลไปยัง Firebase ใหม่
        const writeUrl = newToken 
          ? `${NEW_CONFIG.databaseURL}/${node}.json?auth=${newToken}`
          : `${NEW_CONFIG.databaseURL}/${node}.json`;
          
        const writeRes = await putJSON(writeUrl, data);
        
        if (writeRes.includes('Permission denied')) {
          throw new Error('Permission denied');
        }
        
        console.log(`✅ สำเร็จ (${count} รายการ)`);
        successCount++;
        
      } catch (err) {
        console.log(`❌ ล้มเหลว: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n============================================================');
    console.log(`📊 สรุปผลการย้ายข้อมูล:`);
    console.log(`   ✅ สำเร็จ: ${successCount} โหนด`);
    console.log(`   ⏭️  ข้าม:   ${skipCount} โหนด (ไม่มีข้อมูล)`);
    console.log(`   ❌ ล้มเหลว: ${errorCount} โหนด`);
    console.log('============================================================');
    
    if (errorCount === 0) {
      console.log('\n🎉 ย้ายข้อมูลเสร็จสมบูรณ์เรียบร้อยแล้วครับ!');
    } else {
      console.log('\n⚠️  มีบางโหนดล้มเหลว — โปรดตั้งค่า Firebase Rules ในโครงการใหม่ให้เป็น Test Mode หรือเปิดสิทธิ์ก่อนครับ');
    }

  } catch (err) {
    console.error('\n❌ เกิดข้อผิดพลาดร้ายแรงระหว่างดำเนินการ:', err.message);
  }
}

migrate().catch(console.error);
