/* checkapi 的 API 完整說明
 * desc：概述；members：主要方法與屬性 [簽名, 說明]；use：使用情境；notes：注意事項
 * ex：範例程式碼；mdn：MDN 路徑（接在 developer.mozilla.org/docs/Web/ 之後）
 */
window.API_DOCS = {

  /* ================= Storage 儲存 ================= */

  localStorage: {
    desc: `Web Storage API 的一部分，提供同源（協定 + 網域 + 連接埠相同）共用的 key-value 儲存。資料沒有到期時間，關閉分頁或瀏覽器後仍會保留，直到被程式或使用者清除。所有 key 與 value 都以字串儲存。`,
    members: [
      [`setItem(key, value)`, `寫入或覆蓋一筆資料，value 會被轉成字串；超過配額時拋出 QuotaExceededError。`],
      [`getItem(key)`, `讀取資料，key 不存在時回傳 null。`],
      [`removeItem(key)`, `刪除指定的 key。`],
      [`clear()`, `清除此 origin 的所有資料。`],
      [`key(index)`, `取得第 index 個 key 的名稱，可搭配 length 走訪全部資料。`],
      [`length`, `目前儲存的項目數量。`],
      [`storage 事件`, `其他分頁修改 localStorage 時，會在本分頁的 window 上觸發，可用來同步多個分頁。`],
    ],
    use: [`儲存主題、語言、字級等使用者偏好`, `記住 UI 狀態，例如側欄是否收合、最後開啟的分頁`, `快取不敏感的小型資料，減少重複請求`],
    notes: [
      `容量約 5 MB（依瀏覽器而異），超過會拋出例外，寫入時應使用 try/catch。`,
      `同步 API，大量讀寫會阻塞主執行緒；大型資料請改用 IndexedDB。`,
      `任何同源腳本都能讀取，不要存放 token、密碼等敏感資訊（有 XSS 風險）。`,
      `Safari 無痕模式或使用者封鎖網站資料時可能無法使用；Worker 中無法存取。`,
    ],
    mdn: 'API/Window/localStorage',
    ex: String.raw`// 物件需要先轉成 JSON 字串
const settings = { theme: 'dark', fontSize: 14 };
try {
  localStorage.setItem('settings', JSON.stringify(settings));
} catch (e) {
  console.warn('寫入失敗（可能超過配額）', e);
}

const saved = JSON.parse(localStorage.getItem('settings') ?? '{}');
console.log(saved.theme); // 'dark'

// 走訪所有項目
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, localStorage.getItem(key));
}

// 監聽其他分頁的變更
window.addEventListener('storage', e => {
  console.log(e.key, e.oldValue, '→', e.newValue);
});`,
  },

  sessionStorage: {
    desc: `與 localStorage 介面完全相同的 Web Storage，但資料的生命週期綁定在「單一分頁的 session」：重新整理頁面仍會保留，關閉分頁就清除。即使是同一網址的兩個分頁，各自的 sessionStorage 也互相獨立。`,
    members: [
      [`setItem(key, value)`, `寫入或覆蓋一筆字串資料。`],
      [`getItem(key)`, `讀取資料，不存在時回傳 null。`],
      [`removeItem(key)`, `刪除指定的 key。`],
      [`clear()`, `清除此分頁的所有 sessionStorage 資料。`],
      [`key(index) / length`, `依索引取得 key 名稱、目前項目數量。`],
    ],
    use: [`暫存多步驟表單的進度，避免重新整理後遺失`, `記錄單次流程的狀態，例如結帳步驟`, `分頁專屬的暫存資料，不希望影響其他分頁`],
    notes: [
      `「複製分頁」或以 window.open 開啟同源頁面時，新分頁會複製一份當下的 sessionStorage。`,
      `容量同樣約 5 MB，只能存字串。`,
      `同步 API，不適合大量資料。`,
    ],
    mdn: 'API/Window/sessionStorage',
    ex: String.raw`const form = document.querySelector('form');

// 還原草稿
const draft = sessionStorage.getItem('draft');
if (draft) form.elements.message.value = draft;

// 輸入時自動儲存
form.addEventListener('input', () => {
  sessionStorage.setItem('draft', form.elements.message.value);
});

// 送出後清除
form.addEventListener('submit', () => sessionStorage.removeItem('draft'));`,
  },

  IndexedDB: {
    desc: `瀏覽器內建的非同步、交易式 NoSQL 資料庫。可以儲存幾乎所有結構化資料（物件、陣列、Date、Blob、File、ArrayBuffer），透過 object store 與 index 查詢。容量通常可達可用磁碟空間的一定比例，遠大於 localStorage。`,
    members: [
      [`indexedDB.open(name, version)`, `開啟資料庫；版本號提高時會觸發 upgradeneeded 事件。`],
      [`db.createObjectStore(name, options)`, `在 upgradeneeded 中建立資料表，可指定 keyPath 或 autoIncrement。`],
      [`store.createIndex(name, keyPath)`, `建立索引，以便依欄位查詢。`],
      [`db.transaction(stores, mode)`, `建立交易，mode 為 'readonly' 或 'readwrite'。`],
      [`store.put() / add() / get() / getAll() / delete()`, `寫入、讀取、刪除資料。`],
      [`store.openCursor()`, `以游標逐筆走訪資料。`],
      [`IDBKeyRange`, `指定查詢範圍，例如 IDBKeyRange.bound(a, b)。`],
    ],
    use: [`離線應用（PWA）的本機資料庫`, `快取大量 API 回應或圖片 Blob`, `編輯器、筆記軟體的本機儲存`],
    notes: [
      `原生 API 以事件回呼為主、較繁瑣，常搭配 idb、Dexie 等函式庫。`,
      `交易在事件迴圈閒置後會自動提交，交易進行中不要 await 其他非 IndexedDB 的 Promise。`,
      `其他分頁開著舊版本資料庫時，升級會被 blocked。`,
      `可在 Worker 中使用。`,
    ],
    mdn: 'API/IndexedDB_API',
    ex: String.raw`function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('notes-db', 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
      store.createIndex('byDate', 'createdAt');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const db = await openDB();

// 寫入
const tx = db.transaction('notes', 'readwrite');
tx.objectStore('notes').add({ text: '買牛奶', createdAt: Date.now() });
tx.oncomplete = () => console.log('已儲存');

// 讀取全部
db.transaction('notes').objectStore('notes').getAll().onsuccess = e => {
  console.log(e.target.result);
};`,
  },

  'Cache API': {
    desc: `以 Request 為 key、Response 為 value 的儲存空間，由全域的 caches（CacheStorage）管理多個具名快取。可在頁面與 Service Worker 中使用，是實作離線瀏覽與自訂快取策略的基礎。`,
    members: [
      [`caches.open(name)`, `開啟（不存在則建立）具名快取，回傳 Cache 物件。`],
      [`caches.match(request)`, `在所有快取中尋找相符的回應。`],
      [`caches.keys() / caches.delete(name)`, `列出、刪除快取，常用於版本更新時清理舊快取。`],
      [`cache.add(url) / addAll(urls)`, `抓取資源並存入快取。`],
      [`cache.put(request, response)`, `存入自訂的回應。`],
      [`cache.match() / delete() / keys()`, `查詢、刪除、列出快取中的項目。`],
    ],
    use: [`Service Worker 預先快取 App Shell，實現離線開啟`, `實作 cache-first、network-first、stale-while-revalidate 等策略`, `快取 API 回應或圖片`],
    notes: [
      `快取不會自動過期，需自行管理版本與清理。`,
      `只能快取 GET 請求。`,
      `需要安全環境（HTTPS 或 localhost）。`,
      `Response 的 body 只能讀取一次，要同時回傳與存入快取時需使用 response.clone()。`,
    ],
    mdn: 'API/Cache',
    ex: String.raw`// sw.js — stale-while-revalidate 策略
const CACHE = 'v2';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/index.html', '/app.js'])));
});

self.addEventListener('activate', e => {
  // 刪除舊版本快取
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request);
    const network = fetch(e.request).then(res => {
      cache.put(e.request, res.clone());
      return res;
    });
    return cached || network;
  }));
});`,
  },

  StorageManager: {
    desc: `透過 navigator.storage 存取，用來查詢此 origin 的儲存使用量與配額、請求持久化儲存，以及取得 OPFS 根目錄。統計範圍涵蓋 IndexedDB、Cache API、OPFS 等儲存方式（localStorage 通常不計入）。`,
    members: [
      [`estimate()`, `回傳 { usage, quota }，單位為 bytes，為估計值。`],
      [`persist()`, `請求持久化儲存；核准後瀏覽器在空間不足時不會自動清除此網站資料。`],
      [`persisted()`, `查詢目前是否已是持久化儲存。`],
      [`getDirectory()`, `取得 Origin Private File System 的根目錄。`],
    ],
    use: [`下載大量離線內容前先檢查剩餘空間`, `為重要的離線資料申請持久化`, `在設定頁顯示儲存使用量`],
    notes: [
      `estimate() 的數值刻意不精確，避免被用來追蹤使用者。`,
      `預設為「盡力保存」(best-effort)，空間不足時瀏覽器可能清除資料。`,
      `persist() 是否核准由瀏覽器決定，例如依網站互動程度、是否安裝為 PWA。`,
      `需要安全環境。`,
    ],
    mdn: 'API/StorageManager',
    ex: String.raw`const { usage, quota } = await navigator.storage.estimate();
console.log('已使用 ' + (usage / 1024 / 1024).toFixed(1) + ' MB，' +
            '配額 ' + (quota / 1024 / 1024).toFixed(0) + ' MB');

if (!(await navigator.storage.persisted())) {
  const granted = await navigator.storage.persist();
  console.log(granted ? '已取得持久化儲存' : '仍為 best-effort');
}`,
  },

  'File System Access': {
    desc: `讓網頁透過作業系統的檔案對話框，取得使用者本機檔案或資料夾的 handle，並直接讀取與寫回原檔。適合打造線上編輯器、圖片工具等需要「開啟 → 編輯 → 儲存」流程的應用。`,
    members: [
      [`showOpenFilePicker(options)`, `開啟檔案選擇器，回傳 FileSystemFileHandle 陣列。`],
      [`showSaveFilePicker(options)`, `開啟另存新檔對話框。`],
      [`showDirectoryPicker()`, `選擇資料夾，回傳 FileSystemDirectoryHandle。`],
      [`handle.getFile()`, `取得 File 物件以讀取內容。`],
      [`handle.createWritable()`, `建立可寫入串流，write() 後必須 close() 才會實際儲存。`],
      [`handle.queryPermission() / requestPermission()`, `查詢與請求讀寫權限。`],
    ],
    use: [`線上程式碼或 Markdown 編輯器直接編輯本機檔案`, `批次處理整個資料夾的圖片`, `匯出大型檔案而不必觸發下載`],
    notes: [
      `開啟對話框必須由使用者手勢（例如點擊）觸發。`,
      `showOpenFilePicker 等方法目前主要是 Chromium 支援，Firefox 與 Safari 不支援。`,
      `handle 可存入 IndexedDB 供下次使用，但需重新請求權限。`,
      `需要安全環境。`,
    ],
    mdn: 'API/File_System_API',
    ex: String.raw`let handle;

openBtn.onclick = async () => {
  [handle] = await window.showOpenFilePicker({
    types: [{ description: '文字檔', accept: { 'text/plain': ['.txt', '.md'] } }]
  });
  const file = await handle.getFile();
  editor.value = await file.text();
};

saveBtn.onclick = async () => {
  const writable = await handle.createWritable();
  await writable.write(editor.value);
  await writable.close();
};`,
  },

  OPFS: {
    desc: `Origin Private File System 是每個 origin 專屬、對使用者不可見的私有檔案系統，屬於 File System API 的一部分。不需要權限對話框，讀寫效能很高；在 Worker 中還能透過同步存取 handle 進行原地讀寫，是 SQLite WASM 等在瀏覽器中運作的基礎。`,
    members: [
      [`navigator.storage.getDirectory()`, `取得 OPFS 根目錄。`],
      [`dir.getFileHandle(name, { create })`, `取得或建立檔案。`],
      [`dir.getDirectoryHandle(name, { create })`, `取得或建立子資料夾。`],
      [`dir.removeEntry(name, { recursive })`, `刪除檔案或資料夾。`],
      [`dir.entries() / values()`, `非同步走訪目錄內容。`],
      [`fileHandle.createSyncAccessHandle()`, `（僅限 Worker）同步讀寫，提供 read()、write()、flush()、truncate()。`],
    ],
    use: [`在瀏覽器中執行 SQLite 等資料庫`, `影音或圖片編輯器的大型暫存檔`, `需要高效能隨機讀寫的應用`],
    notes: [
      `資料屬於網站儲存，會隨「清除網站資料」一併刪除，也受配額限制。`,
      `使用者無法在檔案總管中看到這些檔案。`,
      `同步存取 handle 只能在 Dedicated Worker 中使用。`,
    ],
    mdn: 'API/File_System_API/Origin_private_file_system',
    ex: String.raw`const root = await navigator.storage.getDirectory();
const fh = await root.getFileHandle('log.txt', { create: true });

// 主執行緒：非同步寫入
const w = await fh.createWritable({ keepExistingData: true });
await w.write('hello OPFS\n');
await w.close();
console.log(await (await fh.getFile()).text());

// worker.js：同步高效能讀寫
// const access = await fh.createSyncAccessHandle();
// access.write(new TextEncoder().encode('fast'), { at: 0 });
// access.flush();
// access.close();`,
  },

  /* ================= Network 網路 ================= */

  fetch: {
    desc: `以 Promise 為基礎的網路請求 API，用來取代 XMLHttpRequest。由 Request、Response、Headers 物件組成，支援串流讀取回應、以 AbortController 取消請求，也可在 Worker 與 Service Worker 中使用。`,
    members: [
      [`fetch(url, options)`, `發送請求，回傳 Promise<Response>；options 包含 method、headers、body、credentials、mode、signal 等。`],
      [`response.ok / status / headers`, `回應狀態（ok 代表 200–299）與標頭。`],
      [`response.json() / text() / blob() / arrayBuffer() / formData()`, `以不同格式讀取回應內容。`],
      [`response.body`, `回應的 ReadableStream，可逐段讀取。`],
      [`AbortController`, `透過 signal 取消請求或實作逾時。`],
    ],
    use: [`呼叫 REST / GraphQL API`, `上傳表單或檔案（FormData）`, `串流讀取大型回應或 AI 逐字輸出`],
    notes: [
      `只有網路錯誤才會 reject，HTTP 404、500 仍會 resolve，必須檢查 response.ok。`,
      `跨域請求受 CORS 規範限制。`,
      `預設不送出跨域 Cookie，需設定 credentials: 'include'。`,
      `原生不提供上傳進度事件。`,
    ],
    mdn: 'API/Fetch_API',
    ex: String.raw`const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 5000); // 5 秒逾時

try {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '寫文件' }),
    signal: ctrl.signal
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const todo = await res.json();
  console.log(todo);
} catch (err) {
  console.error(err.name === 'AbortError' ? '請求逾時' : err);
} finally {
  clearTimeout(timer);
}`,
  },

  XMLHttpRequest: {
    desc: `最早期的 AJAX API，以事件與回呼方式發送 HTTP 請求。新程式多改用 fetch，但它原生支援上傳進度事件，在需要顯示上傳進度條時仍很實用。`,
    members: [
      [`open(method, url)`, `初始化請求。`],
      [`setRequestHeader(name, value)`, `設定請求標頭（須在 open 之後呼叫）。`],
      [`send(body)`, `發送請求。`],
      [`abort()`, `取消請求。`],
      [`responseType / response`, `設定並讀取回應格式（'json'、'blob'、'arraybuffer' 等）。`],
      [`status / readyState`, `HTTP 狀態碼與請求進度。`],
      [`onload / onerror / onprogress / upload.onprogress`, `完成、錯誤、下載進度與上傳進度事件。`],
    ],
    use: [`檔案上傳並顯示進度條`, `維護舊專案`],
    notes: [
      `同步模式（open 第三個參數為 false）已不建議使用，會凍結畫面。`,
      `Service Worker 中無法使用。`,
      `API 較繁瑣，一般請求建議使用 fetch。`,
    ],
    mdn: 'API/XMLHttpRequest',
    ex: String.raw`function upload(file) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload');

  xhr.upload.onprogress = e => {
    if (e.lengthComputable)
      progress.value = Math.round(e.loaded / e.total * 100);
  };
  xhr.onload = () => console.log('完成', xhr.status);
  xhr.onerror = () => console.error('上傳失敗');

  const form = new FormData();
  form.append('file', file);
  xhr.send(form);
}`,
  },

  WebSocket: {
    desc: `透過一次 HTTP 升級握手，在瀏覽器與伺服器之間建立持久的全雙工連線。雙方可以隨時互相傳送文字或二進位訊息，沒有每次 HTTP 請求的額外開銷。`,
    members: [
      [`new WebSocket(url, protocols)`, `建立連線，url 使用 ws:// 或 wss://。`],
      [`send(data)`, `傳送字串、Blob 或 ArrayBuffer。`],
      [`close(code, reason)`, `關閉連線。`],
      [`readyState`, `連線狀態：CONNECTING、OPEN、CLOSING、CLOSED。`],
      [`binaryType`, `接收二進位資料的格式（'blob' 或 'arraybuffer'）。`],
      [`bufferedAmount`, `尚未送出的資料量，可用來做流量控制。`],
      [`onopen / onmessage / onerror / onclose`, `連線事件。`],
    ],
    use: [`聊天室、即時通知`, `多人協作編輯、線上遊戲`, `股價、比分等即時資料`],
    notes: [
      `斷線不會自動重連，需自行實作重連與心跳機制。`,
      `HTTPS 頁面必須使用 wss://。`,
      `沒有內建背壓控制，大量傳送時應觀察 bufferedAmount。`,
    ],
    mdn: 'API/WebSocket',
    ex: String.raw`function connect() {
  const ws = new WebSocket('wss://example.com/chat');

  ws.onopen = () => ws.send(JSON.stringify({ type: 'join', room: 'general' }));

  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    console.log(msg.user + ': ' + msg.text);
  };

  ws.onclose = e => {
    console.log('連線關閉', e.code, '3 秒後重連');
    setTimeout(connect, 3000);
  };
  return ws;
}

const ws = connect();`,
  },

  EventSource: {
    desc: `Server-Sent Events (SSE) 的用戶端 API。伺服器以 text/event-stream 格式透過一般 HTTP 連線持續推送事件給瀏覽器，屬於單向（伺服器 → 瀏覽器）通訊，斷線時瀏覽器會自動重新連線。`,
    members: [
      [`new EventSource(url, { withCredentials })`, `建立連線。`],
      [`onmessage`, `接收未指定事件名稱的訊息。`],
      [`addEventListener(name, fn)`, `接收伺服器以 event: 欄位指定的具名事件。`],
      [`onopen / onerror`, `連線開啟與錯誤（包含自動重連時）。`],
      [`close()`, `關閉連線且不再重連。`],
      [`readyState / lastEventId`, `連線狀態與最後事件 ID（重連時會以 Last-Event-ID 標頭送回伺服器）。`],
    ],
    use: [`通知、動態消息、即時儀表板`, `AI 回應逐字串流`, `長時間任務的進度回報`],
    notes: [
      `只能接收文字，無法從用戶端傳送資料（需另用 fetch）。`,
      `不能自訂請求標頭，驗證通常依賴 Cookie 或 URL 參數。`,
      `HTTP/1.1 下同網域最多約 6 條連線，HTTP/2 則沒有此限制。`,
    ],
    mdn: 'API/EventSource',
    ex: String.raw`const es = new EventSource('/api/stream');

es.onmessage = e => console.log('訊息', e.data);

es.addEventListener('progress', e => {
  const { percent } = JSON.parse(e.data);
  bar.style.width = percent + '%';
});

es.addEventListener('done', () => es.close());
es.onerror = () => console.warn('連線中斷，瀏覽器會自動重連');

// 伺服器回應格式：
// event: progress
// data: {"percent": 40}`,
  },

  WebTransport: {
    desc: `建立在 HTTP/3（QUIC）之上的雙向傳輸 API。可同時開啟多條可靠且有序的串流，也能傳送不保證送達、不保證順序的資料報 (datagram)，避免 TCP 的隊頭阻塞，延遲比 WebSocket 更低。`,
    members: [
      [`new WebTransport(url)`, `建立連線（必須是 https://）。`],
      [`ready / closed`, `連線建立與關閉時 resolve 的 Promise。`],
      [`datagrams.readable / writable`, `不可靠資料報的讀寫串流。`],
      [`createBidirectionalStream()`, `建立雙向可靠串流。`],
      [`createUnidirectionalStream()`, `建立單向串流。`],
      [`incomingBidirectionalStreams`, `接收伺服器開啟的串流。`],
      [`close()`, `關閉連線。`],
    ],
    use: [`雲端遊戲、即時多人遊戲的狀態同步`, `低延遲音視訊串流`, `大量即時感測資料傳輸`],
    notes: [
      `伺服器端必須支援 HTTP/3 與 WebTransport。`,
      `Safari 支援較晚，使用前需檢查。`,
      `資料以 Streams API（ReadableStream / WritableStream）操作。`,
    ],
    mdn: 'API/WebTransport',
    ex: String.raw`const wt = new WebTransport('https://game.example.com:4433/play');
await wt.ready;

// 不可靠資料報：適合高頻率的位置更新
const writer = wt.datagrams.writable.getWriter();
writer.write(new Float32Array([player.x, player.y]));

// 讀取伺服器送來的資料報
const reader = wt.datagrams.readable.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  console.log('收到', value);
}`,
  },

  BroadcastChannel: {
    desc: `讓同一個 origin 下的多個瀏覽環境（分頁、視窗、iframe、Worker）透過具名頻道互相廣播訊息。所有加入相同名稱頻道的對象都會收到訊息（發送者自己除外）。`,
    members: [
      [`new BroadcastChannel(name)`, `加入（或建立）指定名稱的頻道。`],
      [`postMessage(data)`, `廣播訊息，可傳送能被結構化複製的資料（物件、陣列、Blob 等）。`],
      [`onmessage`, `接收訊息，資料位於 e.data。`],
      [`close()`, `離開頻道。`],
    ],
    use: [`一個分頁登出時，讓其他分頁同步登出`, `多分頁之間同步購物車、主題設定`, `避免多個分頁重複執行相同的背景工作`],
    notes: [
      `僅限同源，無法跨網域通訊（跨網域請使用 window.postMessage）。`,
      `發送者自己不會收到自己的訊息。`,
      `沒有回條機制，不保證有接收者。`,
    ],
    mdn: 'API/BroadcastChannel',
    ex: String.raw`const auth = new BroadcastChannel('auth');

logoutBtn.onclick = () => {
  clearSession();
  auth.postMessage({ type: 'logout' });
  location.href = '/login';
};

auth.onmessage = e => {
  if (e.data.type === 'logout') location.href = '/login';
};`,
  },

  WebRTC: {
    desc: `Web Real-Time Communication，讓瀏覽器之間直接點對點傳輸音訊、視訊與任意資料。建立連線前需透過自建的信令 (signaling) 管道交換 SDP 與 ICE 候選資訊，並使用 STUN / TURN 伺服器穿越 NAT。`,
    members: [
      [`new RTCPeerConnection(config)`, `建立連線，在 config.iceServers 中設定 STUN / TURN。`],
      [`createOffer() / createAnswer()`, `產生 SDP 提議與回應。`],
      [`setLocalDescription() / setRemoteDescription()`, `設定本地與遠端的 SDP。`],
      [`onicecandidate / addIceCandidate()`, `交換網路路徑候選資訊。`],
      [`addTrack(track, stream) / ontrack`, `傳送與接收音視訊軌。`],
      [`createDataChannel(label)`, `建立任意資料的傳輸通道。`],
    ],
    use: [`視訊會議、語音通話`, `螢幕分享與遠端協助`, `P2P 檔案傳輸、低延遲遊戲資料`],
    notes: [
      `必須自行實作信令伺服器（例如用 WebSocket）來交換連線資訊。`,
      `在對稱型 NAT 或企業防火牆後需要 TURN 中繼伺服器。`,
      `多人通話通常需要 SFU 伺服器，純 P2P 不易擴展。`,
    ],
    mdn: 'API/WebRTC_API',
    ex: String.raw`const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// 加入本機相機與麥克風
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
stream.getTracks().forEach(t => pc.addTrack(t, stream));

// 收到對方的畫面
pc.ontrack = e => { remoteVideo.srcObject = e.streams[0]; };

// 透過信令伺服器交換候選資訊與 SDP
pc.onicecandidate = e => e.candidate && signaling.send({ candidate: e.candidate });
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
signaling.send({ sdp: pc.localDescription });`,
  },

  sendBeacon: {
    desc: `navigator.sendBeacon() 以非同步 POST 送出少量資料。瀏覽器會在背景確保請求送達，即使頁面正在關閉也不會被取消，也不會拖慢頁面卸載或下一頁的載入。`,
    members: [
      [`navigator.sendBeacon(url, data)`, `發送資料，data 可為字串、Blob、FormData、URLSearchParams 或 ArrayBuffer；回傳 true 表示已排入佇列。`],
      [`fetch(url, { keepalive: true })`, `功能相近的替代方案，可自訂方法與標頭。`],
    ],
    use: [`傳送分析與點擊統計`, `頁面離開時回報停留時間、效能指標`, `錯誤記錄`],
    notes: [
      `只能使用 POST，且無法讀取伺服器回應。`,
      `資料量有上限（通常約 64 KB）。`,
      `建議在 visibilitychange（變為 hidden）時發送；unload、beforeunload 在行動裝置上不可靠。`,
    ],
    mdn: 'API/Navigator/sendBeacon',
    ex: String.raw`const startTime = performance.now();

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden') return;

  const payload = JSON.stringify({
    page: location.pathname,
    staySeconds: Math.round((performance.now() - startTime) / 1000)
  });
  navigator.sendBeacon('/analytics', new Blob([payload], { type: 'application/json' }));
});`,
  },

  /* ================= Workers 背景執行 ================= */

  Worker: {
    desc: `Dedicated Web Worker 在獨立的背景執行緒中執行 JavaScript，讓耗時的運算不會阻塞主執行緒、造成畫面卡頓。Worker 與主執行緒之間透過 postMessage 傳遞訊息（結構化複製，或轉移 ArrayBuffer 的所有權）。`,
    members: [
      [`new Worker(url, { type: 'module' })`, `建立 Worker，可使用 ES module。`],
      [`worker.postMessage(data, transfer)`, `傳送資料；transfer 陣列中的 ArrayBuffer 會轉移所有權而非複製。`],
      [`worker.onmessage / onerror`, `接收結果與錯誤。`],
      [`worker.terminate()`, `立即停止 Worker。`],
      [`self.postMessage() / self.onmessage`, `（Worker 內）與主執行緒溝通。`],
      [`importScripts()`, `（傳統 Worker 內）載入其他腳本。`],
    ],
    use: [`影像、音訊處理與壓縮`, `大量資料排序、解析 CSV / JSON`, `加密、雜湊等密集運算`],
    notes: [
      `Worker 無法存取 DOM、window、document。`,
      `可使用 fetch、IndexedDB、WebSocket、OffscreenCanvas 等 API。`,
      `每個 Worker 都有記憶體與啟動成本，不要建立太多。`,
    ],
    mdn: 'API/Worker',
    ex: String.raw`// main.js
const worker = new Worker('prime-worker.js');
worker.onmessage = e => console.log('質數數量：', e.data);
worker.postMessage(5_000_000);

// prime-worker.js — 埃拉托斯特尼篩法
self.onmessage = e => {
  const max = e.data;
  const sieve = new Uint8Array(max + 1);
  let count = 0;
  for (let i = 2; i <= max; i++) {
    if (sieve[i]) continue;
    count++;
    for (let j = i * i; j <= max; j += i) sieve[j] = 1;
  }
  self.postMessage(count);
};`,
  },

  SharedWorker: {
    desc: `可被同一 origin 的多個分頁、iframe 或視窗共同連線的 Worker。所有連線共用同一個執行環境與狀態，每個連線透過各自的 MessagePort 溝通。`,
    members: [
      [`new SharedWorker(url, name)`, `建立或連線到既有的 SharedWorker。`],
      [`worker.port`, `與 SharedWorker 溝通的 MessagePort。`],
      [`port.start() / postMessage() / onmessage`, `啟動、傳送與接收訊息。`],
      [`onconnect`, `（Worker 內）每有新的連線就觸發，e.ports[0] 為該連線的 port。`],
    ],
    use: [`多個分頁共用同一條 WebSocket 連線`, `集中管理快取或跨分頁狀態`, `減少重複的輪詢請求`],
    notes: [
      `Android 版 Chrome 長期不支援，Safari 16 起才重新支援。`,
      `除錯需到 chrome://inspect/#workers。`,
      `所有連線的分頁都關閉後，SharedWorker 才會結束。`,
    ],
    mdn: 'API/SharedWorker',
    ex: String.raw`// main.js（每個分頁）
const sw = new SharedWorker('counter.js');
sw.port.onmessage = e => console.log('目前連線分頁數：', e.data);
sw.port.start();

// counter.js
const ports = [];
onconnect = e => {
  const port = e.ports[0];
  ports.push(port);
  ports.forEach(p => p.postMessage(ports.length));
};`,
  },

  ServiceWorker: {
    desc: `註冊在某個網址範圍內、獨立於頁面之外運行的事件驅動 Worker，扮演網頁與網路之間的可程式化代理。它可以攔截所有網路請求並決定如何回應，是 PWA 離線支援、推播通知與背景同步的核心。`,
    members: [
      [`navigator.serviceWorker.register(url, { scope })`, `註冊 Service Worker。`],
      [`navigator.serviceWorker.ready`, `取得已啟用的 registration。`],
      [`navigator.serviceWorker.controller`, `目前控制此頁面的 Service Worker。`],
      [`install / activate 事件`, `安裝時預先快取資源，啟用時清理舊快取。`],
      [`fetch 事件`, `攔截請求，以 e.respondWith() 回傳自訂回應。`],
      [`push / notificationclick / sync 事件`, `推播、通知點擊、背景同步。`],
      [`self.skipWaiting() / clients.claim()`, `讓新版本立即接管頁面。`],
    ],
    use: [`PWA 離線瀏覽與快速載入`, `Web Push 推播通知`, `網路恢復後在背景同步送出資料`],
    notes: [
      `需要 HTTPS（localhost 除外）。`,
      `生命週期較複雜：更新後預設要等所有舊分頁關閉才會啟用。`,
      `無法存取 DOM；閒置時會被瀏覽器終止，不能依賴全域變數保存狀態。`,
    ],
    mdn: 'API/Service_Worker_API',
    ex: String.raw`// main.js
if ('serviceWorker' in navigator) {
  const reg = await navigator.serviceWorker.register('/sw.js');
  console.log('已註冊，範圍：', reg.scope);
}

// sw.js — 離線時回傳備用頁面
self.addEventListener('install', e => {
  e.waitUntil(caches.open('offline').then(c => c.add('/offline.html')));
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => caches.match('/offline.html')));
});`,
  },

  Worklet: {
    desc: `輕量級、直接掛入瀏覽器渲染或音訊管線的 Worker。與一般 Worker 不同，Worklet 的執行時機由瀏覽器控制。主要種類有 AudioWorklet（自訂音訊處理）、PaintWorklet（CSS Houdini 自訂繪製）、AnimationWorklet、LayoutWorklet 等。`,
    members: [
      [`worklet.addModule(url)`, `載入 Worklet 模組，回傳 Promise。`],
      [`audioContext.audioWorklet`, `AudioWorklet 的入口。`],
      [`registerProcessor(name, class)`, `（AudioWorklet 內）註冊音訊處理器，在 process() 中處理每個音訊區塊。`],
      [`CSS.paintWorklet`, `PaintWorklet 的入口（Chromium）。`],
      [`registerPaint(name, class)`, `（PaintWorklet 內）註冊繪製器，在 CSS 中以 paint(name) 使用。`],
    ],
    use: [`自訂音效、合成器、音訊分析（AudioWorklet）`, `以程式產生 CSS 背景、邊框圖樣（PaintWorklet）`],
    notes: [
      `AudioWorklet 各大瀏覽器皆支援；PaintWorklet 等 Houdini API 主要只有 Chromium 支援。`,
      `Worklet 內可用的 API 非常有限，不能使用 fetch 或 DOM。`,
      `需要安全環境。`,
    ],
    mdn: 'API/Worklet',
    ex: String.raw`// main.js
const ctx = new AudioContext();
await ctx.audioWorklet.addModule('noise.js');
const node = new AudioWorkletNode(ctx, 'white-noise');
node.connect(ctx.destination);

// noise.js — 產生白噪音
class WhiteNoise extends AudioWorkletProcessor {
  process(inputs, outputs) {
    for (const channel of outputs[0])
      for (let i = 0; i < channel.length; i++)
        channel[i] = Math.random() * 2 - 1;
    return true; // 回傳 true 表示持續運作
  }
}
registerProcessor('white-noise', WhiteNoise);`,
  },

  /* ================= Graphics 繪圖 ================= */

  Canvas2D: {
    desc: `透過 <canvas> 元素的 2D 繪圖環境（CanvasRenderingContext2D），以即時模式在點陣畫布上繪製圖形、文字與影像。畫出的內容是像素而非物件，需要更新時通常整個重繪。`,
    members: [
      [`canvas.getContext('2d')`, `取得 2D 繪圖環境。`],
      [`fillRect() / strokeRect() / clearRect()`, `繪製或清除矩形。`],
      [`beginPath() / moveTo() / lineTo() / arc() / fill() / stroke()`, `路徑繪圖。`],
      [`fillText() / measureText()`, `繪製與量測文字。`],
      [`drawImage()`, `繪製圖片、影片畫格或另一個 canvas。`],
      [`getImageData() / putImageData()`, `逐像素讀寫。`],
      [`save() / restore() / translate() / rotate() / scale()`, `狀態堆疊與座標變換。`],
    ],
    use: [`圖表、資料視覺化`, `2D 遊戲、動畫`, `圖片裁切、濾鏡、浮水印`],
    notes: [
      `高解析度螢幕需依 devicePixelRatio 放大畫布尺寸，否則會模糊。`,
      `繪製未開放 CORS 的跨域圖片後，canvas 會被「污染」，無法再 getImageData 或匯出。`,
      `畫布內容對螢幕報讀器不可見，需另外提供替代文字。`,
    ],
    mdn: 'API/Canvas_API',
    ex: String.raw`const canvas = document.querySelector('canvas');
const dpr = devicePixelRatio || 1;
canvas.width = 300 * dpr;
canvas.height = 150 * dpr;
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

ctx.fillStyle = '#3b82f6';
ctx.fillRect(20, 20, 100, 60);

ctx.beginPath();
ctx.arc(200, 50, 30, 0, Math.PI * 2);
ctx.strokeStyle = 'tomato';
ctx.lineWidth = 4;
ctx.stroke();

ctx.font = '16px sans-serif';
ctx.fillText('Hello Canvas', 20, 120);`,
  },

  WebGL: {
    desc: `基於 OpenGL ES 2.0 的低階 3D 繪圖 API，透過 <canvas> 使用 GPU 加速。開發者需撰寫 GLSL 著色器（vertex / fragment shader）並自行管理緩衝區與紋理；Three.js、Babylon.js、PixiJS 等函式庫都建構在它之上。`,
    members: [
      [`canvas.getContext('webgl')`, `取得 WebGL 繪圖環境。`],
      [`createShader() / shaderSource() / compileShader()`, `建立並編譯著色器。`],
      [`createProgram() / attachShader() / linkProgram() / useProgram()`, `組合並啟用著色器程式。`],
      [`createBuffer() / bindBuffer() / bufferData()`, `上傳頂點資料到 GPU。`],
      [`getAttribLocation() / vertexAttribPointer()`, `設定頂點屬性的格式。`],
      [`uniform*()`, `傳遞全域參數給著色器。`],
      [`drawArrays() / drawElements()`, `執行繪製。`],
    ],
    use: [`3D 模型檢視器、產品展示`, `遊戲與互動視覺效果`, `大量資料點的高效能視覺化（地圖、粒子）`],
    notes: [
      `API 非常底層，一般建議使用 Three.js 等函式庫。`,
      `GPU 可能遺失 context（webglcontextlost 事件），需處理恢復。`,
      `不同裝置支援的擴充與上限不同，可用 getParameter() / getExtension() 查詢。`,
    ],
    mdn: 'API/WebGL_API',
    ex: String.raw`const gl = canvas.getContext('webgl');
const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0, 1); }';
const fs = 'precision mediump float; void main(){ gl_FragColor = vec4(1, .4, .2, 1); }';

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

const prog = gl.createProgram();
gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
gl.linkProgram(prog);
gl.useProgram(prog);

gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, .8, -.8, -.8, .8, -.8]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, 'p');
gl.enableVertexAttribArray(loc);
gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
gl.drawArrays(gl.TRIANGLES, 0, 3); // 畫出一個三角形`,
  },

  WebGL2: {
    desc: `基於 OpenGL ES 3.0 的 WebGL 第二版，向下相容大部分 WebGL 1 程式。新增 GLSL ES 3.00、3D 紋理、實例化繪製、多重渲染目標、Transform Feedback、Uniform Buffer、VAO 等功能，許多 WebGL 1 需要擴充才有的功能都成為內建。`,
    members: [
      [`canvas.getContext('webgl2')`, `取得 WebGL2 繪圖環境。`],
      [`createVertexArray() / bindVertexArray()`, `頂點陣列物件 (VAO)，減少狀態切換。`],
      [`drawArraysInstanced() / vertexAttribDivisor()`, `實例化繪製，一次畫出大量相同物件。`],
      [`texImage3D()`, `3D 紋理與紋理陣列。`],
      [`drawBuffers()`, `多重渲染目標 (MRT)，用於延遲著色等技術。`],
      [`beginTransformFeedback()`, `在 GPU 上更新頂點資料，例如粒子系統。`],
    ],
    use: [`進階 3D 遊戲與渲染效果`, `草地、粒子等大量物件的實例化繪製`, `WebGPU 普及前的 GPU 通用運算`],
    notes: [
      `著色器需以 #version 300 es 開頭。`,
      `所有主流瀏覽器（含 Safari 15 以上）皆已支援。`,
      `若需相容極舊的裝置，可在取得失敗時退回 'webgl'。`,
    ],
    mdn: 'API/WebGL2RenderingContext',
    ex: String.raw`const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('不支援 WebGL2');

const vs = '#version 300 es\n' +
  'layout(location = 0) in vec2 pos;\n' +
  'layout(location = 1) in vec2 offset;\n' +
  'void main(){ gl_Position = vec4(pos * 0.1 + offset, 0, 1); }';

// 每個實例使用不同的 offset
const offsets = new Float32Array(1000 * 2).map(() => Math.random() * 2 - 1);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(1, 1); // 每個實例前進一次

// 一次呼叫畫出 1000 個三角形
gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 1000);`,
  },

  WebGPU: {
    desc: `新一代網頁 GPU API，對應現代原生圖形 API（Vulkan、Metal、Direct3D 12）。提供更低的 CPU 開銷、明確的資源管理與通用運算 (compute shader) 能力，著色器使用 WGSL 語言撰寫，可用於高階 3D 渲染與瀏覽器內的機器學習推論。`,
    members: [
      [`navigator.gpu.requestAdapter()`, `取得 GPU 介面卡。`],
      [`adapter.requestDevice()`, `取得邏輯裝置 GPUDevice。`],
      [`canvas.getContext('webgpu') / context.configure()`, `設定畫布輸出。`],
      [`device.createShaderModule({ code })`, `以 WGSL 原始碼建立著色器。`],
      [`device.createRenderPipeline() / createComputePipeline()`, `建立繪圖或運算管線。`],
      [`device.createBuffer() / createBindGroup()`, `建立緩衝區與資源綁定。`],
      [`device.createCommandEncoder() / queue.submit()`, `錄製並提交 GPU 指令。`],
    ],
    use: [`高效能 3D 渲染與遊戲引擎`, `在瀏覽器內執行 AI 模型（LLM、影像辨識）`, `物理模擬、影像處理等 GPU 運算`],
    notes: [
      `Chrome / Edge 113 起支援；Safari 26 與 Firefox 141（Windows）起陸續支援，使用前仍需檢查 navigator.gpu。`,
      `需要安全環境。`,
      `API 較冗長，可考慮 Three.js（WebGPURenderer）或 Babylon.js。`,
    ],
    mdn: 'API/WebGPU_API',
    ex: String.raw`if (!navigator.gpu) throw new Error('不支援 WebGPU');
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

// 用 compute shader 把陣列每個元素乘以 2
const module = device.createShaderModule({ code:
  '@group(0) @binding(0) var<storage, read_write> data: array<f32>;\n' +
  '@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id: vec3u) {\n' +
  '  data[id.x] = data[id.x] * 2.0;\n' +
  '}'
});

const input = new Float32Array([1, 2, 3, 4]);
const buffer = device.createBuffer({
  size: input.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
});
device.queue.writeBuffer(buffer, 0, input);

const pipeline = device.createComputePipeline({ layout: 'auto', compute: { module } });
const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer } }]
});

const encoder = device.createCommandEncoder();
const pass = encoder.beginComputePass();
pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(1);
pass.end();
device.queue.submit([encoder.finish()]);`,
  },

  OffscreenCanvas: {
    desc: `與 DOM 脫鉤的 canvas，可以直接在 Worker 中建立，或由頁面上的 <canvas> 轉交控制權。讓 2D、WebGL、WebGPU 繪圖在背景執行緒進行，主執行緒忙碌時也不影響動畫流暢度。`,
    members: [
      [`new OffscreenCanvas(width, height)`, `直接建立離屏畫布（可在 Worker 中）。`],
      [`canvas.transferControlToOffscreen()`, `把頁面上 <canvas> 的繪圖控制權轉交出去。`],
      [`offscreen.getContext(type)`, `取得 '2d'、'webgl'、'webgl2' 或 'webgpu' 繪圖環境。`],
      [`offscreen.convertToBlob()`, `匯出成圖片 Blob。`],
      [`offscreen.transferToImageBitmap()`, `產生 ImageBitmap，以便高效傳遞。`],
    ],
    use: [`在 Worker 中執行繁重的圖表或遊戲渲染`, `在背景產生縮圖、處理圖片`, `避免主執行緒的長任務造成動畫卡頓`],
    notes: [
      `轉交控制權後，主執行緒就不能再對該 <canvas> 呼叫 getContext。`,
      `Safari 16.4 起才完整支援。`,
      `Worker 中收不到滑鼠等 DOM 事件，互動需由主執行緒轉送。`,
    ],
    mdn: 'API/OffscreenCanvas',
    ex: String.raw`// main.js
const canvas = document.querySelector('canvas');
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('render.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);

// render.js
self.onmessage = e => {
  const ctx = e.data.canvas.getContext('2d');
  let x = 0;
  function frame() {
    ctx.clearRect(0, 0, 300, 150);
    ctx.fillRect(x, 60, 30, 30);
    x = (x + 2) % 300;
    requestAnimationFrame(frame);
  }
  frame();
};`,
  },

  'Web Animations': {
    desc: `以 JavaScript 建立與控制動畫的標準 API，和 CSS 動畫、轉場共用同一套動畫引擎與效能。與 CSS 相比，可以動態產生關鍵影格，並用程式暫停、倒轉、跳轉或調整播放速度。`,
    members: [
      [`element.animate(keyframes, options)`, `建立並播放動畫，回傳 Animation 物件。`],
      [`animation.play() / pause() / reverse() / cancel() / finish()`, `控制播放。`],
      [`animation.currentTime / playbackRate`, `跳轉到指定時間點、調整速度。`],
      [`animation.finished`, `動畫完成時 resolve 的 Promise。`],
      [`document.getAnimations()`, `取得頁面上所有動畫（包含 CSS 動畫）。`],
      [`new KeyframeEffect()`, `獨立建立關鍵影格效果，可重複使用。`],
    ],
    use: [`依使用者操作動態產生動畫`, `需要暫停、倒轉、同步多個動畫的互動`, `取代 jQuery animate 等動畫函式庫`],
    notes: [
      `對 transform 與 opacity 做動畫最順暢（可由合成器處理）。`,
      `動畫結束後預設回到原始樣式；可設 fill: 'forwards' 保留最終狀態，但較建議完成後把結果寫入 style。`,
      `應尊重使用者的 prefers-reduced-motion 設定。`,
    ],
    mdn: 'API/Web_Animations_API',
    ex: String.raw`const anim = box.animate(
  [
    { transform: 'translateX(0)', opacity: 1 },
    { transform: 'translateX(200px)', opacity: 0.5 }
  ],
  { duration: 800, easing: 'ease-in-out', iterations: 2, direction: 'alternate' }
);

pauseBtn.onclick = () => anim.pause();
playBtn.onclick = () => anim.play();
slowBtn.onclick = () => { anim.playbackRate = 0.5; };

await anim.finished;
console.log('動畫完成');`,
  },

  'View Transitions': {
    desc: `在 DOM 狀態改變前後自動擷取畫面，並在兩者之間產生轉場動畫（預設為淡入淡出）。可透過 CSS 的 view-transition-name 與 ::view-transition-* 偽元素自訂個別元素的轉場，同源的跨頁 (MPA) 轉場也已支援。`,
    members: [
      [`document.startViewTransition(callback)`, `在 callback 中更新 DOM，回傳 ViewTransition 物件。`],
      [`transition.ready / finished / updateCallbackDone`, `各階段完成時 resolve 的 Promise。`],
      [`transition.skipTransition()`, `略過動畫。`],
      [`CSS view-transition-name`, `為元素命名，讓它在前後狀態之間單獨做變形動畫。`],
      [`CSS ::view-transition-old() / ::view-transition-new()`, `自訂舊畫面與新畫面的動畫。`],
      [`CSS @view-transition { navigation: auto; }`, `啟用同源跨頁轉場。`],
    ],
    use: [`SPA 路由切換動畫`, `清單項目展開成詳細頁的「共享元素」動畫`, `主題切換、排序變更等狀態轉換`],
    notes: [
      `轉場期間頁面無法互動，動畫應保持簡短。`,
      `Firefox 支援較晚，應先檢查 document.startViewTransition 是否存在。`,
      `同一時間每個 view-transition-name 必須唯一。`,
    ],
    mdn: 'API/View_Transition_API',
    ex: String.raw`function switchView(update) {
  if (!document.startViewTransition) return update(); // 不支援時直接更新
  document.startViewTransition(() => update());
}

themeBtn.onclick = () => switchView(() => {
  document.documentElement.classList.toggle('dark');
});

// CSS：讓縮圖與大圖之間做共享元素動畫
// .thumb.active, .hero { view-transition-name: photo; }
// ::view-transition-old(root), ::view-transition-new(root) { animation-duration: .3s; }`,
  },

  /* ================= Media 影音 ================= */

  'Web Audio': {
    desc: `以「音訊節點圖」為核心的高階音訊處理 API。在 AudioContext 中把音源節點（振盪器、音檔、麥克風）連接到處理節點（音量、濾波、混響、分析器），最後輸出到喇叭。所有處理都在獨立的高優先音訊執行緒中進行，時間精準度高。`,
    members: [
      [`new AudioContext()`, `建立音訊環境。`],
      [`createOscillator()`, `產生正弦波、方波、鋸齒波、三角波。`],
      [`createGain()`, `控制音量。`],
      [`createBiquadFilter()`, `低通、高通、帶通等濾波器。`],
      [`createAnalyser()`, `取得頻譜與波形資料，用於視覺化。`],
      [`decodeAudioData() / createBufferSource()`, `解碼並播放音檔。`],
      [`createMediaStreamSource() / createMediaElementSource()`, `接入麥克風或 <audio> 元素。`],
      [`AudioParam.setValueAtTime() / linearRampToValueAtTime()`, `精確排程參數變化。`],
    ],
    use: [`網頁遊戲音效、合成器與音樂軟體`, `音樂視覺化（頻譜、波形）`, `語音處理、混音`],
    notes: [
      `受自動播放政策限制：AudioContext 需在使用者互動後建立或呼叫 resume()。`,
      `時間以 context.currentTime（秒）為準，比 setTimeout 精準得多。`,
      `自訂 DSP 處理請使用 AudioWorklet。`,
    ],
    mdn: 'API/Web_Audio_API',
    ex: String.raw`playBtn.onclick = () => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = 440; // A4
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1);
};`,
  },

  MediaDevices: {
    desc: `透過 navigator.mediaDevices 存取使用者的媒體裝置。可以請求相機、麥克風的即時串流，擷取螢幕畫面，並列出所有可用的輸入輸出裝置。取得的 MediaStream 可交給 <video>、WebRTC、MediaRecorder 或 Web Audio 使用。`,
    members: [
      [`getUserMedia(constraints)`, `請求相機及／或麥克風，回傳 MediaStream。`],
      [`getDisplayMedia(options)`, `請求分享螢幕、視窗或分頁。`],
      [`enumerateDevices()`, `列出相機、麥克風、喇叭（授權前裝置名稱可能為空）。`],
      [`ondevicechange`, `裝置插拔時觸發。`],
      [`stream.getTracks() / track.stop()`, `取得、停止個別的音視訊軌。`],
    ],
    use: [`視訊通話、線上會議`, `拍照、掃描 QR Code`, `錄音、螢幕錄影`],
    notes: [
      `需要安全環境與使用者授權，被拒絕時會拋出 NotAllowedError。`,
      `使用完畢務必呼叫 track.stop()，否則相機指示燈會持續亮著。`,
      `constraints 可指定解析度、前後鏡頭（facingMode）、裝置 ID 等。`,
    ],
    mdn: 'API/MediaDevices',
    ex: String.raw`try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720, facingMode: 'user' },
    audio: true
  });
  video.srcObject = stream;
  await video.play();

  stopBtn.onclick = () => stream.getTracks().forEach(t => t.stop());
} catch (err) {
  console.error(err.name === 'NotAllowedError' ? '使用者拒絕授權' : err);
}

// 列出所有相機
const devices = await navigator.mediaDevices.enumerateDevices();
devices.filter(d => d.kind === 'videoinput').forEach(d => console.log(d.label));`,
  },

  MediaRecorder: {
    desc: `把 MediaStream（相機、麥克風、螢幕分享、canvas.captureStream() 等）錄製成影音檔的 API。錄製過程中會分段產生 Blob 資料，結束後可合併成檔案下載或上傳。`,
    members: [
      [`new MediaRecorder(stream, options)`, `建立錄製器，options 可指定 mimeType、videoBitsPerSecond。`],
      [`MediaRecorder.isTypeSupported(mimeType)`, `檢查是否支援某種格式。`],
      [`start(timeslice)`, `開始錄製；timeslice 為每段資料的毫秒數。`],
      [`pause() / resume() / stop()`, `暫停、繼續、停止錄製。`],
      [`ondataavailable`, `取得錄製的資料片段（e.data）。`],
      [`onstop`, `錄製結束時觸發。`],
    ],
    use: [`錄音、語音留言`, `螢幕錄影、教學影片`, `錄下 canvas 動畫或遊戲畫面`],
    notes: [
      `支援格式依瀏覽器而異：Chrome / Firefox 多為 WebM，Safari 為 MP4。`,
      `錄出的 WebM 檔可能缺少時長資訊，需後處理。`,
      `需搭配 getUserMedia / getDisplayMedia 取得串流。`,
    ],
    mdn: 'API/MediaRecorder',
    ex: String.raw`const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
const type = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
const recorder = new MediaRecorder(stream, { mimeType: type });
const chunks = [];

recorder.ondataavailable = e => chunks.push(e.data);
recorder.onstop = () => {
  const blob = new Blob(chunks, { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'recording.' + (type.includes('webm') ? 'webm' : 'mp4');
  a.click();
};

recorder.start(1000);
stopBtn.onclick = () => {
  recorder.stop();
  stream.getTracks().forEach(t => t.stop());
};`,
  },

  'Speech Synthesis': {
    desc: `Web Speech API 的文字轉語音 (TTS) 部分。透過全域的 speechSynthesis 控制器，把 SpeechSynthesisUtterance 排入佇列朗讀；可以選擇作業系統提供的各種語言與聲音，並調整語速、音調與音量。`,
    members: [
      [`new SpeechSynthesisUtterance(text)`, `建立要朗讀的內容。`],
      [`utterance.lang / voice / rate / pitch / volume`, `語言、聲音、語速（0.1–10）、音調（0–2）、音量（0–1）。`],
      [`speechSynthesis.speak(utterance)`, `加入朗讀佇列。`],
      [`speechSynthesis.pause() / resume() / cancel()`, `暫停、繼續、清空佇列。`],
      [`speechSynthesis.getVoices()`, `取得可用的聲音清單。`],
      [`onvoiceschanged`, `聲音清單載入完成時觸發（Chrome 為非同步載入）。`],
      [`utterance.onend / onboundary`, `朗讀結束、讀到每個字詞邊界時觸發。`],
    ],
    use: [`無障礙朗讀網頁內容`, `語言學習的發音示範`, `導航、提醒等語音回饋`],
    notes: [
      `可用的聲音取決於作業系統與瀏覽器，品質差異很大。`,
      `Chrome 初次呼叫 getVoices() 可能回傳空陣列，需等待 voiceschanged 事件。`,
      `部分瀏覽器要求在使用者互動後才能發聲。`,
    ],
    mdn: 'API/SpeechSynthesis',
    ex: String.raw`function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-TW';
  u.rate = 1.1;
  const voice = speechSynthesis.getVoices().find(v => v.lang === 'zh-TW');
  if (voice) u.voice = voice;
  u.onend = () => console.log('朗讀完畢');

  speechSynthesis.cancel(); // 停止先前的朗讀
  speechSynthesis.speak(u);
}

speechSynthesis.onvoiceschanged = () =>
  console.log(speechSynthesis.getVoices().length + ' 種聲音可用');

readBtn.onclick = () => speak('歡迎使用網頁終端機');`,
  },

  'Speech Recognition': {
    desc: `Web Speech API 的語音辨識部分，把麥克風收到的語音即時轉成文字。可設定辨識語言、是否連續辨識、是否回傳暫時結果，每個結果還會附上多個候選與信心分數。`,
    members: [
      [`new SpeechRecognition()`, `建立辨識器（Chrome / Safari 為 webkitSpeechRecognition）。`],
      [`lang`, `辨識語言，例如 'zh-TW'、'en-US'。`],
      [`continuous`, `是否持續辨識；否則說完一句就停止。`],
      [`interimResults`, `是否回傳尚未確定的暫時結果。`],
      [`maxAlternatives`, `每個結果的候選數量。`],
      [`start() / stop() / abort()`, `開始、停止（並回傳結果）、中止。`],
      [`onresult / onerror / onend`, `結果、錯誤、結束事件。`],
    ],
    use: [`語音輸入、語音搜尋`, `語音指令控制`, `即時字幕`],
    notes: [
      `Firefox 不支援。`,
      `Chrome 會把音訊傳送到雲端伺服器辨識，需要網路且有隱私考量。`,
      `需要麥克風權限與安全環境。`,
    ],
    mdn: 'API/SpeechRecognition',
    ex: String.raw`const R = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!R) throw new Error('此瀏覽器不支援語音辨識');

const rec = new R();
rec.lang = 'zh-TW';
rec.continuous = true;
rec.interimResults = true;

rec.onresult = e => {
  let finalText = '', interim = '';
  for (const result of e.results) {
    if (result.isFinal) finalText += result[0].transcript;
    else interim += result[0].transcript;
  }
  output.textContent = finalText + interim;
};
rec.onerror = e => console.error('辨識錯誤：', e.error);

micBtn.onclick = () => rec.start();
stopBtn.onclick = () => rec.stop();`,
  },

  'Picture-in-Picture': {
    desc: `讓 <video> 元素以浮動的子母畫面小視窗播放，即使使用者切換到其他分頁或應用程式仍然可見。較新的 Document Picture-in-Picture API（Chromium）更能把任意 HTML 內容放進浮動視窗。`,
    members: [
      [`video.requestPictureInPicture()`, `進入子母畫面，回傳 PictureInPictureWindow。`],
      [`document.exitPictureInPicture()`, `離開子母畫面。`],
      [`document.pictureInPictureEnabled`, `目前環境是否允許使用。`],
      [`document.pictureInPictureElement`, `目前處於子母畫面的元素。`],
      [`enterpictureinpicture / leavepictureinpicture 事件`, `進入與離開時觸發。`],
      [`video.disablePictureInPicture`, `禁止某支影片使用子母畫面。`],
      [`documentPictureInPicture.requestWindow()`, `（Chromium）開啟可放入任意 HTML 的浮動視窗。`],
    ],
    use: [`影片播放器的子母畫面按鈕`, `視訊會議時一邊瀏覽其他內容`, `浮動計時器、直播聊天室（Document PiP）`],
    notes: [
      `必須由使用者手勢觸發。`,
      `Firefox 只提供瀏覽器內建的 PiP 按鈕，不支援此 JS API。`,
      `影片必須已載入中繼資料。`,
    ],
    mdn: 'API/Picture-in-Picture_API',
    ex: String.raw`pipBtn.hidden = !document.pictureInPictureEnabled;

pipBtn.onclick = async () => {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await video.requestPictureInPicture();
    }
  } catch (err) {
    console.error('無法切換子母畫面', err);
  }
};

video.addEventListener('enterpictureinpicture', () => pipBtn.textContent = '離開子母畫面');
video.addEventListener('leavepictureinpicture', () => pipBtn.textContent = '子母畫面');`,
  },

  WebCodecs: {
    desc: `直接存取瀏覽器內建影音編碼器與解碼器（通常有硬體加速）的低階 API。可逐格處理 VideoFrame 與 AudioData，搭配封裝 / 解封裝工具，實現網頁版影片剪輯、轉檔與低延遲串流。`,
    members: [
      [`VideoEncoder / VideoDecoder`, `視訊編碼與解碼。`],
      [`AudioEncoder / AudioDecoder`, `音訊編碼與解碼。`],
      [`configure(config)`, `設定編解碼器（如 'vp8'、'avc1.42001f'、AV1）、解析度、位元率。`],
      [`encode(frame) / decode(chunk)`, `送入資料，結果由 output 回呼取得。`],
      [`VideoFrame`, `一格影像，可由 canvas、video、ImageBitmap 建立。`],
      [`EncodedVideoChunk`, `編碼後的資料片段。`],
      [`VideoEncoder.isConfigSupported(config)`, `檢查是否支援某組設定。`],
    ],
    use: [`網頁影片剪輯器、轉檔工具`, `雲端遊戲、低延遲直播`, `逐格影像分析`],
    notes: [
      `只負責編解碼，不處理 MP4 / WebM 容器格式，需搭配 mp4box.js 等函式庫。`,
      `VideoFrame 使用完畢必須呼叫 close() 釋放記憶體。`,
      `Safari 對音訊編解碼的支援較晚。`,
    ],
    mdn: 'API/WebCodecs_API',
    ex: String.raw`const chunks = [];
const encoder = new VideoEncoder({
  output: chunk => chunks.push(chunk),
  error: e => console.error(e)
});

const config = { codec: 'vp8', width: 640, height: 480, bitrate: 1_000_000, framerate: 30 };
if (!(await VideoEncoder.isConfigSupported(config)).supported) throw new Error('不支援此設定');
encoder.configure(config);

// 把 canvas 動畫逐格編碼
for (let i = 0; i < 90; i++) {
  drawFrame(ctx, i);
  const frame = new VideoFrame(canvas, { timestamp: i * 33_333 });
  encoder.encode(frame, { keyFrame: i % 30 === 0 });
  frame.close();
}
await encoder.flush();
console.log('產生 ' + chunks.length + ' 個編碼片段');`,
  },

  /* ================= Device 裝置 ================= */

  Geolocation: {
    desc: `取得裝置目前的地理位置。瀏覽器會綜合 GPS、Wi-Fi、行動網路與 IP 等來源估算位置，回傳經緯度與精確度，以及可能的海拔、速度與方向。`,
    members: [
      [`getCurrentPosition(success, error, options)`, `取得一次位置。`],
      [`watchPosition(success, error, options)`, `持續追蹤位置變化，回傳 watch ID。`],
      [`clearWatch(id)`, `停止追蹤。`],
      [`options.enableHighAccuracy`, `要求高精確度（較耗電、較慢）。`],
      [`options.timeout / maximumAge`, `逾時毫秒數、可接受的快取位置時間。`],
      [`position.coords`, `latitude、longitude、accuracy、altitude、speed、heading。`],
    ],
    use: [`地圖與導航`, `顯示附近的店家或服務`, `運動軌跡記錄`],
    notes: [
      `需要安全環境與使用者授權。`,
      `精確度差異很大，桌機通常只有 IP 或 Wi-Fi 等級。`,
      `錯誤碼：1 拒絕授權、2 無法取得位置、3 逾時。`,
    ],
    mdn: 'API/Geolocation_API',
    ex: String.raw`if (!('geolocation' in navigator)) throw new Error('不支援定位');

navigator.geolocation.getCurrentPosition(
  pos => {
    const { latitude, longitude, accuracy } = pos.coords;
    console.log('位置：' + latitude.toFixed(5) + ', ' + longitude.toFixed(5) +
                '（±' + Math.round(accuracy) + ' 公尺）');
  },
  err => console.error(['', '使用者拒絕', '無法取得位置', '逾時'][err.code]),
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
);

// 持續追蹤
const id = navigator.geolocation.watchPosition(pos => updateMarker(pos.coords));
// 停止追蹤：navigator.geolocation.clearWatch(id);`,
  },

  Vibration: {
    desc: `讓具備震動馬達的裝置（主要是 Android 手機）震動。可以指定單次震動長度，或用陣列描述「震動、停頓、震動…」的模式。`,
    members: [
      [`navigator.vibrate(ms)`, `震動指定的毫秒數。`],
      [`navigator.vibrate([震動, 停頓, 震動, ...])`, `依模式震動。`],
      [`navigator.vibrate(0)`, `停止震動。`],
    ],
    use: [`表單錯誤、操作完成時的觸覺回饋`, `遊戲中的碰撞或爆炸效果`, `計時器、提醒通知`],
    notes: [
      `iOS Safari 不支援，桌面裝置也沒有效果。`,
      `必須在使用者與頁面互動後才能觸發。`,
      `應適度使用，並提供關閉選項。`,
    ],
    mdn: 'API/Vibration_API',
    ex: String.raw`function haptic(type) {
  if (!('vibrate' in navigator)) return;
  const patterns = {
    tap: 10,
    success: [30, 50, 30],
    error: [100, 50, 100, 50, 100]
  };
  navigator.vibrate(patterns[type]);
}

submitBtn.onclick = () => form.checkValidity() ? haptic('success') : haptic('error');`,
  },

  Battery: {
    desc: `Battery Status API，透過 navigator.getBattery() 取得裝置的電池資訊，包括目前電量、是否正在充電、預估充飽或耗盡的時間，並可監聽這些數值的變化。`,
    members: [
      [`navigator.getBattery()`, `回傳 Promise<BatteryManager>。`],
      [`battery.level`, `電量，0 到 1。`],
      [`battery.charging`, `是否正在充電。`],
      [`battery.chargingTime / dischargingTime`, `預估充飽、耗盡的秒數（未知時為 Infinity）。`],
      [`onlevelchange / onchargingchange`, `電量或充電狀態改變時觸發。`],
    ],
    use: [`低電量時自動減少動畫、降低輪詢頻率`, `在長時間任務開始前提醒使用者充電`],
    notes: [
      `因可被用於瀏覽器指紋追蹤，Firefox 與 Safari 已移除，只有 Chromium 支援。`,
      `需要安全環境。`,
      `沒有電池的桌機通常回報 level 為 1、charging 為 true。`,
    ],
    mdn: 'API/Battery_Status_API',
    ex: String.raw`if ('getBattery' in navigator) {
  const battery = await navigator.getBattery();

  function update() {
    const pct = Math.round(battery.level * 100);
    console.log('電量 ' + pct + '%' + (battery.charging ? '（充電中）' : ''));
    document.body.classList.toggle('power-saving', !battery.charging && pct < 20);
  }

  update();
  battery.addEventListener('levelchange', update);
  battery.addEventListener('chargingchange', update);
}`,
  },

  'Device Orientation': {
    desc: `透過裝置的陀螺儀、加速度計與磁力計取得方向與動作資料。deviceorientation 事件提供裝置的旋轉角度，devicemotion 事件提供加速度與旋轉速率。`,
    members: [
      [`deviceorientation 事件`, `alpha（繞 Z 軸 0–360°）、beta（前後傾 -180–180°）、gamma（左右傾 -90–90°）。`],
      [`deviceorientationabsolute 事件`, `以磁北為基準的絕對方向（Chromium）。`],
      [`devicemotion 事件`, `acceleration、accelerationIncludingGravity、rotationRate、interval。`],
      [`DeviceOrientationEvent.requestPermission()`, `（iOS 13+）請求權限，必須由使用者手勢觸發。`],
    ],
    use: [`以傾斜手機操控的遊戲`, `360° 全景照片或 VR 檢視`, `指南針、水平儀、搖一搖功能`],
    notes: [
      `需要安全環境。`,
      `iOS 必須先呼叫 requestPermission() 並取得同意。`,
      `桌機通常會觸發事件但數值為 null。`,
    ],
    mdn: 'API/Device_orientation_events',
    ex: String.raw`startBtn.onclick = async () => {
  // iOS 需要先請求權限
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const state = await DeviceOrientationEvent.requestPermission();
    if (state !== 'granted') return;
  }

  window.addEventListener('deviceorientation', e => {
    // 讓小球隨手機傾斜移動
    ball.style.transform = 'translate(' + e.gamma * 3 + 'px, ' + e.beta * 3 + 'px)';
  });

  window.addEventListener('devicemotion', e => {
    const a = e.accelerationIncludingGravity;
    if (Math.abs(a.x) > 15) console.log('偵測到搖晃！');
  });
};`,
  },

  Bluetooth: {
    desc: `Web Bluetooth API，讓網頁透過 GATT 協定連線並讀寫藍牙低功耗 (BLE) 裝置。使用者會看到瀏覽器的裝置選擇對話框，網頁只能存取使用者選擇的裝置與事先宣告的服務。`,
    members: [
      [`navigator.bluetooth.requestDevice(options)`, `顯示裝置選擇器，可依服務、名稱篩選。`],
      [`navigator.bluetooth.getAvailability()`, `檢查是否有可用的藍牙介面卡。`],
      [`device.gatt.connect()`, `連線到裝置的 GATT 伺服器。`],
      [`server.getPrimaryService(uuid)`, `取得服務，例如 'heart_rate'、'battery_service'。`],
      [`service.getCharacteristic(uuid)`, `取得特徵值。`],
      [`characteristic.readValue() / writeValue() / startNotifications()`, `讀取、寫入、訂閱通知。`],
    ],
    use: [`連接心率帶、體重計等健康裝置`, `控制 IoT 裝置、智慧燈泡`, `硬體教學與設定工具`],
    notes: [
      `只有 Chromium（Chrome、Edge、Opera）支援，Firefox 與 Safari 不支援。`,
      `必須由使用者手勢觸發，並需要安全環境。`,
      `只支援 BLE，不支援傳統藍牙（例如藍牙耳機音訊）。`,
    ],
    mdn: 'API/Web_Bluetooth_API',
    ex: String.raw`connectBtn.onclick = async () => {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['heart_rate'] }]
  });
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService('heart_rate');
  const ch = await service.getCharacteristic('heart_rate_measurement');

  await ch.startNotifications();
  ch.addEventListener('characteristicvaluechanged', e => {
    const bpm = e.target.value.getUint8(1);
    console.log('心率：' + bpm + ' bpm');
  });
};`,
  },

  USB: {
    desc: `WebUSB API 讓網頁直接與 USB 裝置通訊，不需要安裝原生驅動程式或應用程式。透過控制傳輸、批量傳輸、中斷傳輸等方式交換資料，常用於硬體工具的韌體更新與設定。`,
    members: [
      [`navigator.usb.requestDevice({ filters })`, `顯示裝置選擇器，可依 vendorId、productId 篩選。`],
      [`navigator.usb.getDevices()`, `取得先前已授權的裝置。`],
      [`device.open() / close()`, `開啟、關閉裝置。`],
      [`device.selectConfiguration() / claimInterface()`, `選擇設定並宣告介面。`],
      [`device.transferIn() / transferOut()`, `以批量或中斷傳輸讀寫資料。`],
      [`device.controlTransferIn() / controlTransferOut()`, `控制傳輸。`],
      [`connect / disconnect 事件`, `裝置插入或拔除時觸發。`],
    ],
    use: [`開發板、3D 印表機的韌體燒錄`, `硬體裝置的網頁設定工具`, `實驗室儀器的資料擷取`],
    notes: [
      `只有 Chromium 支援。`,
      `作業系統已有驅動的裝置類別（鍵盤、隨身碟等）會被封鎖。`,
      `需要安全環境與使用者手勢。`,
    ],
    mdn: 'API/WebUSB_API',
    ex: String.raw`connectBtn.onclick = async () => {
  const device = await navigator.usb.requestDevice({
    filters: [{ vendorId: 0x2341 }] // Arduino
  });
  await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);
  await device.claimInterface(2);

  await device.transferOut(4, new TextEncoder().encode('LED ON'));
  const result = await device.transferIn(5, 64);
  console.log(new TextDecoder().decode(result.data));
};

navigator.usb.addEventListener('disconnect', e => console.log('已拔除', e.device.productName));`,
  },

  Serial: {
    desc: `Web Serial API 讓網頁讀寫序列埠（實體 RS-232 或 USB 轉序列裝置），以串流方式收發資料。常用於與 Arduino、ESP32、GPS 模組、3D 印表機等裝置溝通。`,
    members: [
      [`navigator.serial.requestPort({ filters })`, `顯示序列埠選擇器。`],
      [`navigator.serial.getPorts()`, `取得已授權的序列埠。`],
      [`port.open({ baudRate })`, `以指定鮑率開啟序列埠。`],
      [`port.readable / writable`, `讀寫用的 ReadableStream / WritableStream。`],
      [`port.setSignals() / getSignals()`, `控制與讀取 DTR、RTS 等訊號。`],
      [`port.close()`, `關閉序列埠（需先釋放讀寫鎖）。`],
    ],
    use: [`網頁版序列監控器`, `微控制器的韌體上傳與設定工具`, `讀取 GPS、感測器資料`],
    notes: [
      `主要是 Chromium 桌面版支援。`,
      `需要安全環境與使用者手勢。`,
      `關閉前必須先呼叫 reader.cancel() 並 releaseLock()。`,
    ],
    mdn: 'API/Web_Serial_API',
    ex: String.raw`connectBtn.onclick = async () => {
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  // 寫入
  const writer = port.writable.getWriter();
  await writer.write(new TextEncoder().encode('hello\n'));
  writer.releaseLock();

  // 持續讀取
  const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    log.textContent += value;
  }
};`,
  },

  HID: {
    desc: `WebHID API 讓網頁存取人機介面裝置 (Human Interface Device) 的原始輸入與輸出報告。適用於標準 API 無法完整支援的裝置，例如特殊遊戲手把、繪圖板、串流控制台、可程式化鍵盤。`,
    members: [
      [`navigator.hid.requestDevice({ filters })`, `顯示裝置選擇器。`],
      [`navigator.hid.getDevices()`, `取得已授權的裝置。`],
      [`device.open() / close()`, `開啟、關閉裝置。`],
      [`device.oninputreport`, `接收輸入報告（e.reportId；e.data 為 DataView）。`],
      [`device.sendReport(reportId, data)`, `傳送輸出報告，例如控制 LED。`],
      [`device.sendFeatureReport() / receiveFeatureReport()`, `讀寫功能報告。`],
      [`device.collections`, `裝置的報告描述結構。`],
    ],
    use: [`支援特殊按鍵的遊戲手把或控制器`, `鍵盤、滑鼠的燈光與巨集設定工具`, `Stream Deck 等控制面板`],
    notes: [
      `只有 Chromium 桌面版支援。`,
      `基於安全理由，一般鍵盤與滑鼠的輸入被封鎖，無法用來側錄按鍵。`,
      `需要安全環境與使用者手勢。`,
    ],
    mdn: 'API/WebHID_API',
    ex: String.raw`connectBtn.onclick = async () => {
  const [device] = await navigator.hid.requestDevice({
    filters: [{ vendorId: 0x057e }] // Nintendo
  });
  if (!device) return;
  await device.open();
  console.log('已連線：' + device.productName);

  device.addEventListener('inputreport', e => {
    const bytes = new Uint8Array(e.data.buffer);
    console.log('報告 ' + e.reportId + '：', bytes);
  });
};`,
  },

  Gamepad: {
    desc: `讀取遊戲手把的按鈕與搖桿狀態。與鍵盤事件不同，Gamepad API 主要採用輪詢方式：在每個 requestAnimationFrame 中呼叫 navigator.getGamepads() 取得最新狀態，也可以透過 vibrationActuator 觸發震動。`,
    members: [
      [`navigator.getGamepads()`, `回傳目前連接的手把陣列（未連接的位置為 null）。`],
      [`gamepadconnected / gamepaddisconnected 事件`, `手把連接、斷線時觸發。`],
      [`gamepad.buttons`, `按鈕陣列，每個包含 pressed、touched、value（0–1）。`],
      [`gamepad.axes`, `搖桿軸數值陣列（-1 到 1）。`],
      [`gamepad.mapping`, `為 'standard' 時，按鈕位置依標準配置排列。`],
      [`gamepad.vibrationActuator.playEffect()`, `觸發震動回饋。`],
    ],
    use: [`網頁遊戲的手把操作`, `模擬器、雲端遊戲`, `簡報遙控、無障礙輸入`],
    notes: [
      `使用者必須先在頁面上按下手把按鈕，瀏覽器才會公開該手把。`,
      `需要安全環境。`,
      `搖桿會有微小飄移，應設定死區 (deadzone)。`,
    ],
    mdn: 'API/Gamepad_API',
    ex: String.raw`window.addEventListener('gamepadconnected', e => {
  console.log('手把已連接：' + e.gamepad.id);
  requestAnimationFrame(loop);
});

function loop() {
  const pad = navigator.getGamepads()[0];
  if (!pad) return;

  const dead = v => Math.abs(v) < 0.15 ? 0 : v; // 死區
  player.x += dead(pad.axes[0]) * 5;
  player.y += dead(pad.axes[1]) * 5;

  if (pad.buttons[0].pressed) {
    jump();
    pad.vibrationActuator?.playEffect('dual-rumble', { duration: 100, strongMagnitude: 0.5 });
  }
  requestAnimationFrame(loop);
}`,
  },

  'Wake Lock': {
    desc: `Screen Wake Lock API，讓頁面在顯示期間防止螢幕自動變暗、關閉或鎖定。適用於使用者需要長時間看著螢幕、卻不會頻繁觸碰的情境。`,
    members: [
      [`navigator.wakeLock.request('screen')`, `請求螢幕喚醒鎖，回傳 WakeLockSentinel。`],
      [`sentinel.release()`, `釋放喚醒鎖。`],
      [`sentinel.released`, `是否已被釋放。`],
      [`sentinel.onrelease`, `被釋放時觸發（包含系統自動釋放）。`],
    ],
    use: [`食譜、閱讀器、樂譜`, `導航與地圖`, `簡報、計時器、健身影片`],
    notes: [
      `分頁切到背景或視窗最小化時會自動釋放，回到前景時需重新請求。`,
      `電量過低或省電模式下，請求可能被拒絕。`,
      `需要安全環境。`,
    ],
    mdn: 'API/Screen_Wake_Lock_API',
    ex: String.raw`let lock = null;

async function keepAwake() {
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => console.log('喚醒鎖已釋放'));
  } catch (err) {
    console.error('無法取得喚醒鎖：', err.message);
  }
}

startBtn.onclick = keepAwake;

// 回到前景時重新取得
document.addEventListener('visibilitychange', () => {
  if (lock !== null && document.visibilityState === 'visible') keepAwake();
});`,
  },

  /* ================= UI / DOM 介面 ================= */

  IntersectionObserver: {
    desc: `非同步觀察目標元素與其祖先元素（或視窗）之間的交集變化。當元素進入或離開可視範圍、或可見比例跨過指定門檻時，瀏覽器會呼叫回呼。效能遠優於在 scroll 事件中呼叫 getBoundingClientRect()。`,
    members: [
      [`new IntersectionObserver(callback, options)`, `建立觀察器。`],
      [`options.root`, `作為可視範圍的祖先元素，預設為視窗。`],
      [`options.rootMargin`, `擴大或縮小可視範圍，例如 '200px' 可提前觸發。`],
      [`options.threshold`, `觸發門檻，例如 [0, 0.5, 1]。`],
      [`observe(el) / unobserve(el) / disconnect()`, `開始、停止觀察。`],
      [`entry.isIntersecting / intersectionRatio / boundingClientRect`, `交集狀態、可見比例、元素位置。`],
    ],
    use: [`圖片、元件的懶載入`, `無限捲動載入下一頁`, `廣告曝光統計、捲動進場動畫`],
    notes: [
      `回呼為非同步執行，不適合需要逐像素精準追蹤的情境。`,
      `開始 observe 時會立即觸發一次回呼。`,
      `單純的圖片懶載入可直接使用 <img loading="lazy">。`,
    ],
    mdn: 'API/IntersectionObserver',
    ex: String.raw`// 無限捲動：底部哨兵元素出現時載入更多
const sentinel = document.querySelector('#sentinel');
const io = new IntersectionObserver(async ([entry]) => {
  if (!entry.isIntersecting) return;
  io.unobserve(sentinel);
  await loadMoreItems();
  io.observe(sentinel);
}, { rootMargin: '300px' });
io.observe(sentinel);

// 捲動進場動畫
const reveal = new IntersectionObserver(entries => {
  entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting));
}, { threshold: 0.2 });
document.querySelectorAll('.card').forEach(el => reveal.observe(el));`,
  },

  ResizeObserver: {
    desc: `監聽元素本身尺寸的變化，不論是因為視窗大小、內容變動、CSS 變更或父元素調整所造成。適合讓元件根據自己實際可用的空間調整版面，而不只依賴視窗寬度。`,
    members: [
      [`new ResizeObserver(callback)`, `建立觀察器。`],
      [`observe(el, { box })`, `開始觀察；box 可為 'content-box'、'border-box'、'device-pixel-content-box'。`],
      [`unobserve(el) / disconnect()`, `停止觀察。`],
      [`entry.contentRect`, `內容區的寬高。`],
      [`entry.borderBoxSize / contentBoxSize`, `更精確的尺寸資訊（陣列形式）。`],
    ],
    use: [`圖表、canvas 隨容器大小重繪`, `依元件寬度切換版面`, `文字區塊自動調整、截斷`],
    notes: [
      `在回呼中修改被觀察元素的尺寸可能造成無限循環，瀏覽器會出現「ResizeObserver loop」警告。`,
      `開始 observe 時會觸發一次回呼。`,
      `單純依寬度切換版面時，可優先考慮 CSS container queries。`,
    ],
    mdn: 'API/ResizeObserver',
    ex: String.raw`const ro = new ResizeObserver(entries => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    const canvas = entry.target.querySelector('canvas');
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    drawChart(canvas);

    entry.target.classList.toggle('compact', width < 400);
  }
});

ro.observe(document.querySelector('.chart-container'));`,
  },

  MutationObserver: {
    desc: `監聽 DOM 樹的變動，包括子節點的新增與移除、屬性改變、文字內容改變。變動會被批次收集，在微任務 (microtask) 中一次交給回呼處理，取代已廢棄的 Mutation Events。`,
    members: [
      [`new MutationObserver(callback)`, `建立觀察器。`],
      [`observe(target, options)`, `開始觀察指定節點。`],
      [`options.childList / attributes / characterData`, `要觀察的變動類型。`],
      [`options.subtree`, `是否包含所有子孫節點。`],
      [`options.attributeFilter / attributeOldValue`, `只觀察特定屬性、記錄舊值。`],
      [`disconnect() / takeRecords()`, `停止觀察、取出尚未處理的紀錄。`],
      [`record.type / addedNodes / removedNodes / attributeName`, `每筆變動的詳細資訊。`],
    ],
    use: [`偵測第三方腳本或框架動態插入的元素`, `瀏覽器擴充功能修改網頁內容`, `自動為新加入的元素綁定行為`],
    notes: [
      `觀察整個 document 的 subtree 且變動頻繁時可能影響效能，應盡量縮小範圍。`,
      `在回呼中修改 DOM 會產生新的紀錄，小心造成無限循環。`,
      `只能觀察 DOM 結構，無法觀察 JS 物件或 <input> 的 value 屬性變化。`,
    ],
    mdn: 'API/MutationObserver',
    ex: String.raw`const observer = new MutationObserver(records => {
  for (const r of records) {
    r.addedNodes.forEach(node => {
      if (node.nodeType === 1 && node.matches('img:not([alt])'))
        console.warn('發現缺少 alt 的圖片', node);
    });
    if (r.type === 'attributes')
      console.log(r.attributeName + ' 原本是 ' + r.oldValue);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class'],
  attributeOldValue: true
});`,
  },

  'Custom Elements': {
    desc: `Web Components 的核心規範之一，讓開發者以 class 定義自己的 HTML 標籤，並擁有完整的生命週期回呼。自訂元素可在純 HTML 或任何框架（React、Vue、Svelte）中使用。`,
    members: [
      [`customElements.define(name, class)`, `註冊自訂元素，名稱必須包含連字號，例如 'my-card'。`],
      [`connectedCallback()`, `元素加入 DOM 時呼叫。`],
      [`disconnectedCallback()`, `元素從 DOM 移除時呼叫。`],
      [`attributeChangedCallback(name, oldValue, newValue)`, `被觀察的屬性改變時呼叫。`],
      [`static observedAttributes`, `宣告要觀察的屬性名稱陣列。`],
      [`customElements.whenDefined(name)`, `元素定義完成時 resolve。`],
      [`customElements.get(name)`, `取得已註冊的類別。`],
    ],
    use: [`跨框架共用的設計系統元件`, `在 CMS 或靜態網站中加入互動元件`, `微前端架構`],
    notes: [
      `元素名稱必須全部小寫且包含連字號。`,
      `同一個名稱只能 define 一次，重複定義會拋出錯誤。`,
      `Safari 不支援擴充內建元素（is="..."），建議只使用自主自訂元素。`,
    ],
    mdn: 'API/Web_components/Using_custom_elements',
    ex: String.raw`class CountButton extends HTMLElement {
  static observedAttributes = ['count'];

  connectedCallback() {
    this.addEventListener('click', () => {
      this.setAttribute('count', Number(this.getAttribute('count') || 0) + 1);
    });
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    this.textContent = '點了 ' + (this.getAttribute('count') || 0) + ' 次';
  }
}
customElements.define('count-button', CountButton);

// HTML：<count-button count="0"></count-button>`,
  },

  'Shadow DOM': {
    desc: `為元素附加一棵封裝的隱藏 DOM 子樹 (shadow tree)。Shadow DOM 內部的樣式不會影響外部，外部樣式（除了可繼承的屬性與 CSS 變數）也不會影響內部，是 Web Components 的樣式隔離機制；瀏覽器內建的 <video> 控制列也是以此實作。`,
    members: [
      [`element.attachShadow({ mode })`, `建立 shadow root，mode 為 'open' 或 'closed'。`],
      [`element.shadowRoot`, `取得 open 模式的 shadow root。`],
      [`<slot> / <slot name="...">`, `把外部的子元素投影到 shadow tree 的指定位置。`],
      [`:host / :host() / ::slotted()`, `從內部設定宿主元素與投影內容的樣式。`],
      [`::part() 與 part 屬性`, `讓外部可選擇性地設定內部元素的樣式。`],
      [`shadowRoot.adoptedStyleSheets`, `共用可建構的樣式表（CSSStyleSheet）。`],
      [`<template shadowrootmode="open">`, `宣告式 Shadow DOM，可用於伺服器端渲染。`],
    ],
    use: [`元件樣式隔離，避免全域 CSS 衝突`, `在第三方網站嵌入小工具而不受其樣式影響`, `搭配 Custom Elements 建立元件`],
    notes: [
      `CSS 變數與可繼承屬性（color、font）會穿透 shadow 邊界，可用來做主題化。`,
      `事件從 shadow tree 冒泡到外部時，target 會被重新指向宿主元素。`,
      `shadow tree 中的表單元素預設不會參與外部 <form>，需搭配 ElementInternals。`,
    ],
    mdn: 'API/Web_components/Using_shadow_DOM',
    ex: String.raw`class UserCard extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML =
      '<style>' +
      '  :host { display: block; border: 1px solid #ddd; border-radius: 8px; padding: 12px; }' +
      '  h3 { margin: 0; color: var(--card-accent, #2563eb); }' +
      '</style>' +
      '<h3><slot name="name">無名氏</slot></h3>' +
      '<slot></slot>';
  }
}
customElements.define('user-card', UserCard);

// HTML：
// <user-card><span slot="name">小明</span><p>前端工程師</p></user-card>`,
  },

  Fullscreen: {
    desc: `讓指定的元素（或整個頁面）佔滿整個螢幕，並隱藏瀏覽器介面。常用於影片播放器、遊戲、簡報與圖片檢視器，使用者按 Esc 即可離開。`,
    members: [
      [`element.requestFullscreen(options)`, `讓元素進入全螢幕；options.navigationUI 可控制行動裝置的導覽列。`],
      [`document.exitFullscreen()`, `離開全螢幕。`],
      [`document.fullscreenElement`, `目前全螢幕的元素，沒有時為 null。`],
      [`document.fullscreenEnabled`, `是否允許使用全螢幕。`],
      [`fullscreenchange / fullscreenerror 事件`, `狀態改變、請求失敗時觸發。`],
      [`CSS :fullscreen / ::backdrop`, `設定全螢幕時的樣式與背景。`],
    ],
    use: [`影片播放器、網頁遊戲`, `簡報模式、相簿檢視`, `資料儀表板展示`],
    notes: [
      `必須由使用者手勢觸發。`,
      `iPhone Safari 只支援 <video> 全螢幕（webkitEnterFullscreen），不支援一般元素。`,
      `iframe 需設定 allow="fullscreen"。`,
    ],
    mdn: 'API/Fullscreen_API',
    ex: String.raw`fullBtn.onclick = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await player.requestFullscreen();
  }
};

document.addEventListener('fullscreenchange', () => {
  fullBtn.textContent = document.fullscreenElement ? '離開全螢幕' : '全螢幕';
});

// CSS：
// #player:fullscreen { background: black; }
// #player::backdrop { background: black; }`,
  },

  Clipboard: {
    desc: `非同步的剪貼簿 API，透過 navigator.clipboard 讀寫系統剪貼簿。除了純文字，也能以 ClipboardItem 處理圖片 (PNG)、HTML 等多種格式，取代舊的 document.execCommand('copy')。`,
    members: [
      [`navigator.clipboard.writeText(text)`, `寫入純文字。`],
      [`navigator.clipboard.readText()`, `讀取純文字。`],
      [`navigator.clipboard.write([ClipboardItem])`, `寫入多種格式，例如圖片。`],
      [`navigator.clipboard.read()`, `讀取多種格式的內容。`],
      [`new ClipboardItem({ 'image/png': blob })`, `建立剪貼簿項目。`],
      [`copy / cut / paste 事件`, `攔截使用者的複製、剪下、貼上操作。`],
    ],
    use: [`「複製」按鈕（程式碼、連結、優惠碼）`, `貼上圖片直接上傳`, `把圖表或 canvas 複製為圖片`],
    notes: [
      `需要安全環境，且頁面必須處於焦點中。`,
      `寫入通常需要使用者手勢；讀取需要使用者授權（Safari 會顯示「貼上」確認）。`,
      `Firefox 對 read() 等進階功能的支援較晚。`,
    ],
    mdn: 'API/Clipboard_API',
    ex: String.raw`copyBtn.onclick = async () => {
  try {
    await navigator.clipboard.writeText(codeBlock.textContent);
    copyBtn.textContent = '已複製！';
  } catch {
    copyBtn.textContent = '複製失敗';
  }
};

// 把 canvas 複製為圖片
async function copyCanvas(canvas) {
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

// 貼上圖片
document.addEventListener('paste', e => {
  const file = [...e.clipboardData.files].find(f => f.type.startsWith('image/'));
  if (file) preview.src = URL.createObjectURL(file);
});`,
  },

  Notification: {
    desc: `Notifications API 用來顯示作業系統層級的通知，即使使用者正在使用其他應用程式也能看到。單獨使用時頁面必須開著；搭配 Service Worker 與 Push API，則可以在網站關閉時接收伺服器推播。`,
    members: [
      [`Notification.requestPermission()`, `請求通知權限，回傳 'granted'、'denied' 或 'default'。`],
      [`Notification.permission`, `目前的權限狀態。`],
      [`new Notification(title, options)`, `顯示通知；options 包含 body、icon、tag、data、silent 等。`],
      [`notification.onclick / onclose`, `點擊、關閉通知時觸發。`],
      [`notification.close()`, `以程式關閉通知。`],
      [`registration.showNotification()`, `在 Service Worker 中顯示通知，可加入 actions 按鈕。`],
    ],
    use: [`新訊息、被提及時的提醒`, `長時間任務完成通知`, `行事曆、待辦事項提醒`],
    notes: [
      `需要安全環境；應在使用者明確操作後才請求權限，否則容易被拒絕或被瀏覽器靜音。`,
      `使用者拒絕後無法再以程式請求，只能請使用者到瀏覽器設定中更改。`,
      `iOS 需將網站加入主畫面（安裝為 PWA）才能使用。`,
    ],
    mdn: 'API/Notifications_API',
    ex: String.raw`notifyBtn.onclick = async () => {
  if (!('Notification' in window)) return alert('不支援通知');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const n = new Notification('匯出完成', {
    body: '報表已下載到你的電腦',
    icon: '/icon.png',
    tag: 'export' // 相同 tag 的通知會取代舊的
  });
  n.onclick = () => {
    window.focus();
    n.close();
  };
};`,
  },

  'Web Share': {
    desc: `呼叫作業系統原生的分享介面，讓使用者把網址、文字或檔案分享到已安裝的 App（通訊軟體、郵件、社群網站等）。在行動裝置上體驗最好，Windows、macOS、ChromeOS 桌面版也有支援。`,
    members: [
      [`navigator.share({ title, text, url, files })`, `開啟分享介面；使用者完成時 resolve、取消時 reject。`],
      [`navigator.canShare(data)`, `檢查資料（特別是檔案）是否可以分享。`],
      [`Web Share Target`, `在 PWA manifest 設定 share_target，讓自己的 App 成為分享目標。`],
    ],
    use: [`文章、商品頁的分享按鈕`, `分享產生的圖片或檔案`, `取代多個社群網站各自的分享按鈕`],
    notes: [
      `需要安全環境與使用者手勢。`,
      `使用者取消分享時會 reject（AbortError），應安靜處理。`,
      `Firefox 桌面版不支援，需提供「複製連結」等替代方案。`,
    ],
    mdn: 'API/Web_Share_API',
    ex: String.raw`shareBtn.onclick = async () => {
  const data = {
    title: document.title,
    text: '來看看這個網頁終端機',
    url: location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(data);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  } else {
    await navigator.clipboard.writeText(data.url);
    alert('已複製連結');
  }
};

// 分享檔案
// if (navigator.canShare({ files: [file] })) navigator.share({ files: [file] });`,
  },

  Popover: {
    desc: `HTML 原生的 popover 屬性與對應的 JS 方法，讓任何元素都能成為彈出層。瀏覽器會自動處理最上層顯示 (top layer)、點擊外部或按 Esc 關閉、焦點管理與無障礙屬性，不需要 z-index，也不一定要寫 JavaScript。`,
    members: [
      [`popover 屬性`, `auto（預設：點擊外部自動關閉，同時只開一個）、manual（需手動關閉）、hint。`],
      [`popovertarget 屬性`, `放在 <button> 上，指定要切換的 popover 元素 id。`],
      [`popovertargetaction 屬性`, `'toggle'、'show' 或 'hide'。`],
      [`element.showPopover() / hidePopover() / togglePopover()`, `以 JavaScript 控制。`],
      [`beforetoggle / toggle 事件`, `開啟或關閉前後觸發。`],
      [`CSS :popover-open / ::backdrop`, `開啟狀態與背景的樣式。`],
    ],
    use: [`下拉選單、工具提示`, `通知訊息 (toast)、說明面板`, `搭配 CSS Anchor Positioning 定位在按鈕旁`],
    notes: [
      `2024 年起各大瀏覽器皆已支援。`,
      `popover 不是模態對話框，背景仍可互動；需要模態請使用 <dialog> 的 showModal()。`,
      `預設樣式會置中顯示，通常需要自訂位置。`,
    ],
    mdn: 'API/Popover_API',
    ex: String.raw`<!-- HTML：完全不需要 JavaScript -->
<button popovertarget="menu">選單</button>
<div id="menu" popover>
  <a href="/profile">個人資料</a>
  <a href="/logout">登出</a>
</div>

<script>
  const menu = document.getElementById('menu');
  menu.addEventListener('toggle', e => {
    console.log('選單狀態：', e.newState); // 'open' 或 'closed'
  });

  // 也可以用程式控制
  setTimeout(() => menu.showPopover(), 1000);
</script>`,
  },

  /* ================= Security 安全 ================= */

  'Web Crypto': {
    desc: `Web Cryptography API 透過 crypto.subtle 提供瀏覽器原生、經過安全實作的密碼學功能，包含雜湊、HMAC、對稱加密 (AES)、非對稱加密與簽章（RSA、ECDSA、Ed25519）、金鑰交換 (ECDH) 與金鑰衍生（PBKDF2、HKDF）。所有操作皆為非同步。`,
    members: [
      [`crypto.subtle.digest(algorithm, data)`, `計算雜湊，例如 'SHA-256'。`],
      [`crypto.subtle.generateKey(algorithm, extractable, usages)`, `產生金鑰或金鑰對。`],
      [`crypto.subtle.importKey() / exportKey()`, `匯入、匯出金鑰（raw、jwk、spki、pkcs8 格式）。`],
      [`crypto.subtle.encrypt() / decrypt()`, `加密與解密。`],
      [`crypto.subtle.sign() / verify()`, `數位簽章與驗證。`],
      [`crypto.subtle.deriveKey() / deriveBits()`, `由密碼或共享密鑰衍生金鑰。`],
      [`crypto.getRandomValues(typedArray)`, `產生密碼學安全的亂數（不需要安全環境）。`],
    ],
    use: [`端對端加密的聊天或筆記`, `計算雜湊做檔案完整性檢查`, `驗證伺服器簽章、產生 JWT 簽章`],
    notes: [
      `crypto.subtle 只能在安全環境中使用。`,
      `屬於低階 API，參數設定錯誤就會造成安全漏洞，例如 AES-GCM 的 IV 絕不能重複使用。`,
      `金鑰可設為不可匯出（extractable: false），降低被竊取的風險。`,
    ],
    mdn: 'API/Web_Crypto_API',
    ex: String.raw`// SHA-256 雜湊
const data = new TextEncoder().encode('hello');
const hash = await crypto.subtle.digest('SHA-256', data);
const hex = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
console.log(hex);

// AES-GCM 加解密
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12)); // 每次加密都要用新的 IV
const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
console.log(new TextDecoder().decode(plain)); // 'hello'`,
  },

  randomUUID: {
    desc: `crypto.randomUUID() 使用密碼學安全的亂數產生器，回傳符合 RFC 4122 第 4 版格式的 UUID 字串（36 個字元，例如 '3b241101-e2bb-4255-8caf-4136c566a962'），不需要安裝 uuid 等第三方套件。`,
    members: [
      [`crypto.randomUUID()`, `回傳一個新的 v4 UUID 字串。`],
      [`crypto.getRandomValues(typedArray)`, `需要自訂格式的隨機值時，可改用此方法。`],
    ],
    use: [`為新建立的資料或 DOM 元素產生唯一 ID`, `樂觀更新時使用的暫時 ID`, `請求追蹤 ID、冪等鍵 (idempotency key)`],
    notes: [
      `只能在安全環境（HTTPS、localhost）使用，在 http 頁面上為 undefined。`,
      `v4 UUID 完全隨機，不具時間排序性；需要可排序的 ID 可考慮 UUID v7。`,
    ],
    mdn: 'API/Crypto/randomUUID',
    ex: String.raw`const todo = {
  id: crypto.randomUUID(),
  title: '寫 API 文件',
  createdAt: Date.now()
};
console.log(todo.id); // 例如 '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'

// 不支援時的備援（以 getRandomValues 產生）
function uuidFallback() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // 版本 4
  b[8] = (b[8] & 0x3f) | 0x80; // 變體
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' +
         h.slice(16, 20) + '-' + h.slice(20);
}
const id = crypto.randomUUID?.() ?? uuidFallback();`,
  },

  'Credential Mgmt': {
    desc: `Credential Management API 透過 navigator.credentials 以程式存取瀏覽器的憑證管理器，可以儲存與取出帳號密碼 (PasswordCredential)、聯合登入身分 (FederatedCredential)；它同時也是 WebAuthn、FedCM、WebOTP 等登入 API 的共同入口。`,
    members: [
      [`navigator.credentials.get(options)`, `取得憑證：{ password: true }、{ publicKey }（WebAuthn）、{ identity }（FedCM）、{ otp }（WebOTP）。`],
      [`navigator.credentials.store(credential)`, `請瀏覽器儲存憑證。`],
      [`navigator.credentials.create(options)`, `建立新的憑證。`],
      [`navigator.credentials.preventSilentAccess()`, `登出後避免自動登入。`],
      [`new PasswordCredential(form)`, `由登入表單建立密碼憑證（Chromium）。`],
      [`mediation 選項`, `'silent'、'optional'、'required'，控制是否顯示帳號選擇介面。`],
    ],
    use: [`一鍵或自動登入`, `登入成功後主動請瀏覽器記住密碼`, `簡訊驗證碼自動填入 (WebOTP)`],
    notes: [
      `PasswordCredential 與 FederatedCredential 只有 Chromium 支援。`,
      `需要安全環境。`,
      `登出時應呼叫 preventSilentAccess()，避免使用者被自動登入回去。`,
    ],
    mdn: 'API/Credential_Management_API',
    ex: String.raw`// 頁面載入時嘗試自動登入（Chromium）
if ('PasswordCredential' in window) {
  const cred = await navigator.credentials.get({ password: true, mediation: 'optional' });
  if (cred) await login(cred.id, cred.password);
}

// 登入成功後請瀏覽器儲存
loginForm.onsubmit = async e => {
  e.preventDefault();
  const ok = await login(loginForm.username.value, loginForm.password.value);
  if (ok && 'PasswordCredential' in window) {
    await navigator.credentials.store(new PasswordCredential(loginForm));
  }
};

// 登出
logoutBtn.onclick = () => navigator.credentials.preventSilentAccess();`,
  },

  WebAuthn: {
    desc: `Web Authentication API 以公開金鑰密碼學取代密碼登入。私鑰保存在使用者的裝置（手機、筆電的安全晶片或實體安全金鑰）中，以指紋、臉部辨識或 PIN 解鎖；伺服器只保存公鑰，且憑證綁定網域，可有效防範釣魚與資料外洩。Passkey 即建立在此標準之上。`,
    members: [
      [`navigator.credentials.create({ publicKey })`, `註冊：建立新的公鑰憑證。`],
      [`navigator.credentials.get({ publicKey })`, `登入：以既有憑證對伺服器的 challenge 簽章。`],
      [`publicKey.challenge`, `伺服器產生的隨機值，用來防止重送攻擊。`],
      [`publicKey.rp / user`, `依賴方（網站）與使用者資訊。`],
      [`authenticatorSelection`, `指定平台或跨裝置驗證器、是否需要可探索憑證 (Passkey)。`],
      [`PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`, `檢查裝置是否有內建生物辨識。`],
      [`mediation: 'conditional'`, `在帳號欄位的自動填入選單中顯示 Passkey。`],
    ],
    use: [`Passkey 無密碼登入`, `以安全金鑰做雙因素驗證`, `轉帳、改密碼等高風險操作前的再次驗證`],
    notes: [
      `必須搭配伺服器端驗證（產生 challenge、驗證簽章），建議使用 SimpleWebAuthn 等函式庫。`,
      `需要安全環境；rp.id 必須是目前網域或其上層網域。`,
      `應提供帳號復原機制，以防使用者遺失裝置。`,
    ],
    mdn: 'API/Web_Authentication_API',
    ex: String.raw`// 註冊 Passkey（challenge 與 user.id 應由伺服器提供）
const cred = await navigator.credentials.create({
  publicKey: {
    challenge: serverChallenge, // Uint8Array
    rp: { name: 'Web Terminal', id: location.hostname },
    user: { id: userIdBytes, name: 'user@example.com', displayName: '使用者' },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256
      { type: 'public-key', alg: -257 }  // RS256
    ],
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' }
  }
});
await fetch('/webauthn/register', { method: 'POST', body: JSON.stringify(cred.toJSON()) });

// 登入
const assertion = await navigator.credentials.get({
  publicKey: { challenge: serverChallenge, rpId: location.hostname }
});
await fetch('/webauthn/login', { method: 'POST', body: JSON.stringify(assertion.toJSON()) });`,
  },

  'Payment Request': {
    desc: `Payment Request API 讓網站透過瀏覽器原生的付款介面收款。瀏覽器會帶入使用者已儲存的付款方式、運送地址與聯絡資訊，並支援 Google Pay、Apple Pay 等付款處理器，簡化結帳流程。`,
    members: [
      [`new PaymentRequest(methodData, details, options)`, `建立付款請求：付款方式、金額明細、是否需要運送地址等。`],
      [`request.canMakePayment()`, `檢查使用者是否能以指定方式付款。`],
      [`request.show()`, `顯示付款介面，回傳 PaymentResponse。`],
      [`response.complete('success' | 'fail')`, `通知瀏覽器付款結果並關閉介面。`],
      [`request.abort()`, `取消付款。`],
      [`shippingaddresschange / shippingoptionchange 事件`, `地址或運送方式改變時重新計算金額。`],
    ],
    use: [`電商快速結帳`, `數位內容購買、捐款`, `搭配 Apple Pay / Google Pay 一鍵付款`],
    notes: [
      `需要安全環境與使用者手勢。`,
      `實際扣款仍需由付款處理器與伺服器完成，此 API 只負責收集付款資訊。`,
      `各瀏覽器支援的付款方式不同（Safari 主要是 Apple Pay）。`,
    ],
    mdn: 'API/Payment_Request_API',
    ex: String.raw`buyBtn.onclick = async () => {
  const request = new PaymentRequest(
    [{ supportedMethods: 'https://google.com/pay', data: googlePayConfig }],
    {
      displayItems: [{ label: '終端機主題包', amount: { currency: 'TWD', value: '90' } }],
      total: { label: '總計', amount: { currency: 'TWD', value: '90' } }
    }
  );

  if (!(await request.canMakePayment())) return showFallbackCheckout();

  const response = await request.show();
  const ok = await fetch('/pay', { method: 'POST', body: JSON.stringify(response.details) })
    .then(r => r.ok);
  await response.complete(ok ? 'success' : 'fail');
};`,
  },

  isSecureContext: {
    desc: `window.isSecureContext 是唯讀的布林值，表示目前頁面是否處於「安全環境」。安全環境指透過 HTTPS 載入，或來自 localhost、127.0.0.1、file:// 等本機來源的頁面。許多強大或涉及隱私的 API 只在安全環境中提供。`,
    members: [
      [`window.isSecureContext`, `目前環境是否安全（Worker 中為 self.isSecureContext）。`],
      [`僅限安全環境的 API`, `Service Worker、Clipboard、crypto.subtle、Geolocation、getUserMedia、WebAuthn、Web Bluetooth、randomUUID 等。`],
    ],
    use: [`使用受限 API 前先檢查並給出提示`, `開發時找出 API 無法使用的原因`],
    notes: [
      `頁面若被嵌在不安全的 iframe 中，即使本身是 HTTPS 也可能不算安全環境。`,
      `在區網用 http://192.168.x.x 測試時不是安全環境，需改用 localhost 或設定 HTTPS。`,
      `HTTPS 頁面載入 HTTP 資源（混合內容）會被封鎖。`,
    ],
    mdn: 'API/Window/isSecureContext',
    ex: String.raw`if (!window.isSecureContext) {
  console.warn('目前不是安全環境：', location.protocol);
  banner.textContent = '請改用 HTTPS 開啟此頁面以啟用相機與剪貼簿功能';
}

console.table({
  isSecureContext: window.isSecureContext,
  serviceWorker: 'serviceWorker' in navigator,
  clipboard: !!navigator.clipboard,
  cryptoSubtle: !!window.crypto?.subtle
});`,
  },

  /* ================= Performance 效能 ================= */

  Performance: {
    desc: `透過全域的 performance 物件提供高精度時間與效能時間軸。可以讀取瀏覽器自動記錄的頁面導覽、資源載入、繪製等效能項目，也能用 mark / measure 建立自訂的量測點。`,
    members: [
      [`performance.now()`, `從頁面開始 (timeOrigin) 以來的高精度毫秒數。`],
      [`performance.mark(name, { detail })`, `建立自訂時間標記。`],
      [`performance.measure(name, startMark, endMark)`, `計算兩個標記之間的時間。`],
      [`performance.getEntriesByType(type)`, `取得 'navigation'、'resource'、'paint'、'mark'、'measure' 等項目。`],
      [`performance.timeOrigin`, `時間基準點的 Unix 毫秒時間戳。`],
      [`performance.clearMarks() / clearMeasures()`, `清除自訂項目。`],
    ],
    use: [`量測函式執行時間、找出效能瓶頸`, `分析頁面載入的各個階段（DNS、TTFB、DOM 完成）`, `在 DevTools 效能面板中顯示自訂標記`],
    notes: [
      `為防止時序攻擊，瀏覽器會降低 performance.now() 的精度。`,
      `跨域資源的詳細時間資訊需伺服器回傳 Timing-Allow-Origin 標頭。`,
      `大量的 mark 會佔用記憶體，量測完應清除。`,
    ],
    mdn: 'API/Performance',
    ex: String.raw`performance.mark('render-start');
renderList(items);
performance.mark('render-end');

const m = performance.measure('render', 'render-start', 'render-end');
console.log('渲染耗時 ' + m.duration.toFixed(1) + ' ms');

// 頁面載入分析
const [nav] = performance.getEntriesByType('navigation');
console.table({
  DNS: nav.domainLookupEnd - nav.domainLookupStart,
  TTFB: nav.responseStart - nav.requestStart,
  DOMContentLoaded: nav.domContentLoadedEventEnd,
  Load: nav.loadEventEnd
});`,
  },

  PerformanceObserver: {
    desc: `以訂閱方式非同步接收效能項目，不需要反覆輪詢 performance.getEntries()。可以觀察與 Core Web Vitals 相關的 largest-contentful-paint、layout-shift、event（INP），以及長任務、資源載入等資料，是 web-vitals 等函式庫的基礎。`,
    members: [
      [`new PerformanceObserver(callback)`, `建立觀察器。`],
      [`observe({ type, buffered })`, `觀察指定類型；buffered: true 會一併取得觀察前已發生的項目。`],
      [`observe({ entryTypes: [...] })`, `同時觀察多種類型（不支援 buffered）。`],
      [`PerformanceObserver.supportedEntryTypes`, `目前瀏覽器支援的項目類型。`],
      [`list.getEntries()`, `在回呼中取得新項目。`],
      [`disconnect()`, `停止觀察。`],
    ],
    use: [`收集真實使用者的 Core Web Vitals（LCP、CLS、INP）`, `偵測造成卡頓的長任務`, `監控緩慢的 API 或圖片載入`],
    notes: [
      `支援的項目類型依瀏覽器而異，Safari 不支援 longtask、layout-shift 等，使用前請檢查 supportedEntryTypes。`,
      `實際收集 Web Vitals 建議使用 Google 的 web-vitals 函式庫，計算規則較完整。`,
      `回呼不保證即時執行。`,
    ],
    mdn: 'API/PerformanceObserver',
    ex: String.raw`// LCP：最大內容繪製
new PerformanceObserver(list => {
  const last = list.getEntries().at(-1);
  console.log('LCP', Math.round(last.startTime) + ' ms', last.element);
}).observe({ type: 'largest-contentful-paint', buffered: true });

// CLS：累計版面位移
let cls = 0;
new PerformanceObserver(list => {
  for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
  console.log('CLS', cls.toFixed(3));
}).observe({ type: 'layout-shift', buffered: true });

// 長任務（超過 50 ms）
if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
  new PerformanceObserver(list => list.getEntries().forEach(e =>
    console.warn('長任務 ' + Math.round(e.duration) + ' ms'))
  ).observe({ type: 'longtask' });
}`,
  },

  requestIdleCallback: {
    desc: `把低優先度的工作排入佇列，等瀏覽器處理完繪製與使用者輸入、主執行緒閒置時才執行。回呼會收到 IdleDeadline 物件，可查詢本次閒置還剩多少時間，藉此把大型工作切成小段，不影響互動流暢度。`,
    members: [
      [`requestIdleCallback(callback, { timeout })`, `排入閒置工作，回傳 ID；timeout 為最長等待毫秒數，逾時會強制執行。`],
      [`cancelIdleCallback(id)`, `取消排程。`],
      [`deadline.timeRemaining()`, `本次閒置剩餘的毫秒數（最多約 50 ms）。`],
      [`deadline.didTimeout`, `是否因 timeout 而被強制執行。`],
    ],
    use: [`傳送分析資料、寫入記錄`, `預先載入或預先計算下一頁的資料`, `分批處理大量非緊急工作`],
    notes: [
      `Safari 預設不支援，需以 setTimeout 作為備援。`,
      `回呼中不要修改 DOM（可能觸發額外的版面計算），DOM 更新應交給 requestAnimationFrame。`,
      `頁面持續忙碌時回呼可能遲遲不執行，必要時應設定 timeout。`,
    ],
    mdn: 'API/Window/requestIdleCallback',
    ex: String.raw`const ric = window.requestIdleCallback ||
  (cb => setTimeout(() => cb({ timeRemaining: () => 10, didTimeout: false }), 1));

const queue = [...Array(10000).keys()];

function processQueue(deadline) {
  // 只在有空閒時間時處理
  while (deadline.timeRemaining() > 1 && queue.length) {
    indexItem(queue.shift());
  }
  if (queue.length) ric(processQueue);
  else console.log('索引完成');
}

ric(processQueue, { timeout: 2000 });`,
  },

  'Scheduler API': {
    desc: `Prioritized Task Scheduling API 透過全域的 scheduler 物件，以三種優先級排程主執行緒任務：user-blocking（最高）、user-visible（預設）、background（最低）。scheduler.yield() 讓長任務暫時讓出主執行緒，先處理使用者輸入再接續執行，有助於改善 INP。`,
    members: [
      [`scheduler.postTask(callback, { priority, delay, signal })`, `以指定優先級排程任務，回傳 Promise。`],
      [`scheduler.yield()`, `讓出主執行緒，之後以較高的優先順序繼續執行。`],
      [`TaskController`, `排程後可動態更改優先級（setPriority）或取消任務（abort）。`],
      [`TaskSignal`, `類似 AbortSignal，傳給 postTask 以控制任務。`],
    ],
    use: [`把長任務拆成小段，避免頁面無回應`, `區分緊急 UI 更新與背景工作的執行順序`, `改善 Core Web Vitals 的 INP 指標`],
    notes: [
      `目前 Chromium 與 Firefox 支援，Safari 尚未支援，使用前需檢查 'scheduler' in window。`,
      `scheduler.yield() 較晚推出，支援度比 postTask 更低。`,
      `不支援時可用 setTimeout(0) 作為讓出主執行緒的備援。`,
    ],
    mdn: 'API/Scheduler',
    ex: String.raw`const yieldToMain = () =>
  window.scheduler?.yield ? scheduler.yield() : new Promise(r => setTimeout(r, 0));

async function processLargeList(items) {
  for (let i = 0; i < items.length; i++) {
    renderItem(items[i]);
    if (i % 50 === 0) await yieldToMain(); // 每 50 筆讓出一次
  }
}

if ('scheduler' in window) {
  scheduler.postTask(() => updateSearchResults(), { priority: 'user-blocking' });
  scheduler.postTask(() => sendAnalytics(), { priority: 'background' });
}`,
  },

  WebAssembly: {
    desc: `WebAssembly (Wasm) 是可攜式的二進位指令格式，可由 C、C++、Rust、Go 等語言編譯產生，在瀏覽器中以接近原生的速度執行，並能與 JavaScript 互相呼叫。JavaScript 透過全域的 WebAssembly 物件載入、編譯與實例化模組。`,
    members: [
      [`WebAssembly.instantiateStreaming(fetch(url), imports)`, `邊下載邊編譯並實例化（建議的方式）。`],
      [`WebAssembly.compile() / compileStreaming()`, `只編譯成 Module，可快取或傳給 Worker。`],
      [`WebAssembly.instantiate(module, imports)`, `實例化模組。`],
      [`instance.exports`, `模組匯出的函式、記憶體與全域變數。`],
      [`WebAssembly.Memory`, `JS 與 Wasm 之間共享的線性記憶體 (ArrayBuffer)。`],
      [`WebAssembly.Table / Global`, `函式表與全域變數。`],
      [`WebAssembly.validate(bytes)`, `檢查位元組是否為有效的模組。`],
    ],
    use: [`影像、影音處理（例如 ffmpeg.wasm）`, `遊戲引擎（Unity、Unreal 網頁版）`, `在瀏覽器中執行 SQLite、Python (Pyodide)、機器學習模型`],
    notes: [
      `instantiateStreaming 需要伺服器以 application/wasm MIME 類型回傳檔案。`,
      `Wasm 無法直接操作 DOM，需透過 JS 膠水程式碼（Emscripten、wasm-bindgen 會自動產生）。`,
      `JS 與 Wasm 之間頻繁傳遞大量資料會有額外開銷。`,
    ],
    mdn: 'JavaScript/Reference/Global_Objects/WebAssembly',
    ex: String.raw`// add.wasm 由以下 C 程式編譯而來：
// int add(int a, int b) { return a + b; }

const imports = {
  env: { log: value => console.log('來自 Wasm：', value) }
};

const { instance } = await WebAssembly.instantiateStreaming(fetch('add.wasm'), imports);
console.log(instance.exports.add(2, 3)); // 5

// 讀取 Wasm 的記憶體
const memory = new Uint8Array(instance.exports.memory.buffer);
console.log(memory.slice(0, 16));`,
  },

  SharedArrayBuffer: {
    desc: `可在主執行緒與多個 Worker 之間共享的固定長度記憶體。一般 ArrayBuffer 在 postMessage 時會被複製或轉移，而 SharedArrayBuffer 讓所有執行緒看到同一塊記憶體；需搭配 Atomics 進行原子操作與同步，是 Wasm 多執行緒的基礎。`,
    members: [
      [`new SharedArrayBuffer(byteLength)`, `建立共享記憶體。`],
      [`new Int32Array(sab) 等 TypedArray`, `透過型別陣列讀寫共享記憶體。`],
      [`Atomics.add() / sub() / load() / store() / compareExchange()`, `原子操作，避免競爭條件。`],
      [`Atomics.wait(view, index, value)`, `讓 Worker 阻塞等待（主執行緒不能使用）。`],
      [`Atomics.notify(view, index, count)`, `喚醒等待中的執行緒。`],
      [`Atomics.waitAsync()`, `非阻塞版本的等待，可在主執行緒使用。`],
    ],
    use: [`Wasm 多執行緒（例如 ffmpeg.wasm、遊戲引擎）`, `多個 Worker 平行處理大型資料`, `高效能的執行緒間通訊`],
    notes: [
      `因 Spectre 漏洞，頁面必須啟用 cross-origin isolation 才能使用：回應標頭需包含 Cross-Origin-Opener-Policy: same-origin 與 Cross-Origin-Embedder-Policy: require-corp。`,
      `可用全域變數 crossOriginIsolated 檢查是否已啟用。`,
      `共享記憶體容易產生競爭條件，務必使用 Atomics。`,
    ],
    mdn: 'JavaScript/Reference/Global_Objects/SharedArrayBuffer',
    ex: String.raw`// main.js（頁面需設定 COOP / COEP 標頭）
if (!crossOriginIsolated) throw new Error('需要 cross-origin isolation');

const sab = new SharedArrayBuffer(4);
const counter = new Int32Array(sab);
const workers = [1, 2, 3, 4].map(() => new Worker('count.js'));
workers.forEach(w => w.postMessage(sab));

setTimeout(() => console.log('總計：', Atomics.load(counter, 0)), 1000); // 40000

// count.js
self.onmessage = e => {
  const counter = new Int32Array(e.data);
  for (let i = 0; i < 10000; i++) Atomics.add(counter, 0, 1);
};`,
  },
};
