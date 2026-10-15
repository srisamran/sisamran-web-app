// รับฟังข้อความจาก Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetch') {
    const { url, options } = request.data;
    
    // ตั้งค่าส่ง Cookie อัตโนมัติด้วย credentials: 'include'
    if (!options.credentials) {
      options.credentials = 'include';
    }
    
    fetch(url, options)
      .then(res => {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return res.json().then(data => ({ status: res.status, data }));
        } else {
          return res.text().then(data => ({ status: res.status, data }));
        }
      })
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(err => {
        console.error('Fetch error:', err);
        sendResponse({ success: false, error: err.message });
      });
      
    return true; // บอก Chrome ว่าให้เปิดช่องการสื่อสารไว้เนื่องจากเป็นการทำงานแบบ Asynchronous
  }
});
