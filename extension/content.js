// ดักจับเหตุการณ์ที่ส่งมาจากหน้าเว็บเบราว์เซอร์
window.addEventListener('message', (event) => {
  // รับเฉพาะข้อความจากหน้าเดียวกัน
  if (event.source !== window) return;
  
  if (event.data && event.data.type === 'UDLOCAL_EXTENSION_REQUEST') {
    const { action, reqId, data } = event.data;
    
    // ส่งข้อมูลต่อไปยัง Background Service Worker ของ Extension
    chrome.runtime.sendMessage({ action, data }, (response) => {
      // ส่งผลลัพธ์กลับไปยังหน้าเว็บหลัก
      window.postMessage({
        type: 'UDLOCAL_EXTENSION_RESPONSE',
        reqId: reqId,
        response: response
      }, '*');
    });
  }
});

// ฉีด Element ตรวจจับเพื่อบอกหน้าเว็บว่า Extension ติดตั้งสำเร็จแล้ว
const injectFlag = () => {
  if (!document.getElementById('udlocal-extension-installed')) {
    const checkElem = document.createElement('div');
    checkElem.id = 'udlocal-extension-installed';
    checkElem.style.display = 'none';
    document.documentElement.appendChild(checkElem);
  }
};

injectFlag();
// รันซ้ำอีกครั้งเมื่อ DOM โหลดเสร็จสิ้น เพื่อความชัวร์
document.addEventListener('DOMContentLoaded', injectFlag);
