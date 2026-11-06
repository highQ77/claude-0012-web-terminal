# Web Terminal

<sub>Claude x William77</sub>

一個在瀏覽器中執行的網頁終端機。右側是終端機面板，輸入指令即可檢查瀏覽器的環境、儲存空間、API 與 CSS 支援度及效能；左側則會顯示主頁、API 說明，或開啟 16 個常用小工具。共 40 個指令，搭配灰暗色系介面、可切換的終端機配色與動畫滑鼠指標。

不需要安裝、不需要建置，直接用瀏覽器開啟 `index.html` 即可使用。所有資料都在本機處理，不會傳送到任何伺服器。

## 快速開始

```bash
# 直接開啟
open index.html

# 或啟動本機伺服器（部分 API 需要安全環境，localhost 也算）
python3 -m http.server 8000
# 然後開啟 http://localhost:8000
```

開啟後在右側 `user%` 後面輸入指令並按 Enter，或直接點選左側主頁的卡片執行。

## 畫面

- **右側：終端機**：固定在畫面右側，可拖曳左緣調整寬度。`user%` 後輸入指令，結果顯示在下一行；顏色主題可在面板右上角或用 `theme` 切換。
- **左側：主頁**：依「瀏覽器環境」「支援度與效能」「儲存空間」「小工具」「終端機」分組列出所有指令，點卡片即可執行。
- **左側：API 說明**：執行 `checkapi` 後點選任一 API 名稱，顯示說明、主要方法與屬性、使用情境、注意事項、語法高亮的範例程式碼與 MDN 連結。
- **左側：小工具**：執行 `calc`、`color`、`json` 等指令開啟；離開後狀態會保留（例如計時器會繼續計時）。

任何時候輸入 `welcome` 都會讓左側回到主頁。

## 檔案結構

| 檔案 | 說明 |
|---|---|
| `index.html` | 主程式：版面、樣式、終端機與所有指令 |
| `api-docs.js` | `checkapi` 中 65 個 API 的完整說明與範例程式碼 |
| `tools.js` | 左側 14 個小工具（`calc` 小算盤內建在 `index.html`） |

三個檔案需放在同一個資料夾。

## 指令

### 瀏覽器環境

| 指令 | 說明 |
|---|---|
| `useragent` | User-Agent、瀏覽器、作業系統、語言、硬體與時區 |
| `window` | 視窗寬高、可用內容區、devicePixelRatio、實體像素 |
| `screen` | 螢幕解析度、色彩深度、色域、HDR、更新率、方向 |
| `locale` | 語言、時區、曆法，以及日期、數字、貨幣格式範例 |
| `network` | 連線狀態、類型、下載速度與延遲估計、HTTP 版本 |
| `permissions` | 18 項權限的狀態（只查詢，不會跳出授權視窗） |

### 支援度與效能

| 指令 | 說明 |
|---|---|
| `checkapi` | 依分類檢查 65 個瀏覽器 JS API；點 API 名稱會在左側顯示完整說明 |
| `css` | 檢查 40 項新 CSS 功能（`:has()`、Container Queries、Nesting…） |
| `codecs` | 11 種影音格式的播放、MSE 串流、錄製與硬體解碼支援 |
| `gpu` | 顯示卡名稱、WebGL / WebGL2 限制、WebGPU 資訊 |
| `perf` | 頁面載入時間、FCP / LCP、資源數、JS 記憶體、目前 FPS |

### 儲存空間

| 指令 | 說明 |
|---|---|
| `storage` | 整體用量與配額、各類型明細、是否為持久化儲存 |
| `localstorage` | localStorage 使用佔比與最大的項目 |
| `sessionstorage` | sessionStorage 使用佔比與最大的項目 |
| `indexeddb` | IndexedDB 用量、各資料庫與資料表的筆數及大小 |
| `cookie` | cookie 列表、大小、到期日與屬性 |

### 小工具

以下指令會在左側開啟對應的工具，輸入 `welcome` 或按「✕ 關閉」回到主頁。

| 指令 | 工具 | 終端機直接輸出 |
|---|---|---|
| `calc` | 小算盤（四則、%、√、x²、1/x、計算紀錄、鍵盤操作） | `calc (1+2)*3^2` |
| `color` | 顏色轉換（HEX / RGB / HSL / OKLCH）、螢幕取色、色階、隨機配色（雙色 / 3 / 4 / 5 色）、WCAG 對比度 | |
| `json` | JSON 驗證、格式化、壓縮、排序鍵、錯誤定位、樹狀檢視 | |
| `time` | Unix 時間戳與日期互轉、世界時區 | `time 1700000000` |
| `encode` | Base64、Base64URL、URL、HTML 實體、Unicode、Hex 互轉 | |
| `timer` | 倒數計時、碼錶、番茄鐘（提示音 + 系統通知） | |
| `regex` | 正規表示式即時比對、擷取群組、取代、常用範本 | |
| `hash` | MD5、SHA-1、SHA-256 / 384 / 512（文字或檔案） | `hash abc` |
| `diff` | 兩段文字逐行比對，標示字元差異 | |
| `password` | 密碼學亂數密碼產生器與強度評估 | `password 24` |
| `uuid` | UUID v4 / v7 批次產生與解析 | `uuid 5` |
| `qr` | QR Code 產生，下載 PNG / SVG | |
| `units` | 長度、重量、溫度、面積、速度、時間、資料大小、CSS 單位換算 | |
| `count` | 字元、中文字、英文單字、行數、位元組、閱讀時間 | |
| `notes` | 自動儲存的便條紙 | |
| `idbmanager` | IndexedDB 管理：資料庫 / 資料表 / 索引的建立與刪除，紀錄瀏覽、搜尋、新增、編輯、刪除，JSON 匯入匯出；附可執行的增刪改查 API 教學，執行結果即時同步到資料庫 | |

### 終端機

| 指令 | 說明 |
|---|---|
| `theme [名稱]` | 列出或切換終端機顏色主題：green、amber、cyan、magenta、violet、mono、light |
| `history` | 列出歷史指令（最多 100 筆）；`history clear` 清除 |
| `copy` | 複製上一個指令的輸出（純文字，欄位已對齊） |
| `export` | 把終端機內容下載成 `terminal-日期-時間.txt` |
| `cursor on` / `cursor off` | 開啟或關閉動畫滑鼠指標（預設開啟） |
| `welcome` | 左側畫面回到主頁 |
| `clear` | 清除終端機畫面 |
| `help` | 列出所有指令 |

## 快捷鍵

| 按鍵 | 功能 |
|---|---|
| `↑` / `↓` | 叫出歷史指令 |
| `Tab` | 補完指令名稱 |
| `Ctrl` + `L` | 清除畫面 |
| 拖曳終端機左緣 | 調整面板寬度 |

小算盤開啟時可直接用鍵盤輸入：數字、`+ - * /`、`Enter`、`Backspace`、`Esc`（C）、`Delete`（CE）、`%`。

## 儲存在 localStorage 的資料

| Key | 內容 |
|---|---|
| `term.theme` | 終端機顏色主題 |
| `term.size.right` | 終端機面板寬度 |
| `term.history` | 歷史指令（最多 100 筆） |
| `term.calc.history` | 小算盤計算紀錄（最多 50 筆） |
| `term.color` | 顏色工具最後選擇的顏色 |
| `term.palettes` | 顏色工具的配色系統（各組配色與鎖定狀態） |
| `term.notes` | 便條紙內容 |
| `term.idb.known` | IndexedDB 管理工具中手動開啟過的資料庫名稱 |
| `term.cursor` | 動畫滑鼠指標開關 |

在無痕模式或封鎖網站資料時，以上資料無法保存，但頁面仍可正常使用。

## 注意事項

- **外部資源**：字型（Inter、JetBrains Mono）從 Google Fonts 載入，`qr` 工具的 QR Code 函式庫（qrcode-generator 1.4.4）從 cdnjs 載入。離線時字型會改用系統字型，`qr` 會顯示錯誤訊息，其他功能不受影響。
- **file:// 開啟的限制**：cookie 通常無法使用，`origin` 顯示為 `null`。需要完整功能時建議用本機伺服器開啟。
- **瀏覽器差異**：部分資訊只有 Chromium（Chrome、Edge）提供，例如 `usageDetails`、`performance.memory`、Network Information API、螢幕取色。在其他瀏覽器會顯示「不支援」或略過該項。
- **動畫滑鼠指標**：只在使用滑鼠或觸控板的裝置啟用；觸控裝置或系統開啟「減少動態效果」時會自動停用。在文字輸入框上會改回原生的 I 形游標。
- **估計值**：localStorage 上限（約 5 MB）、IndexedDB 各資料庫大小、網路速度、螢幕更新率皆為估計值。
- **逾時保護**：權限、解碼能力、儲存配額等瀏覽器查詢都設有逾時，避免單一指令卡住；指令會依序執行，輸出不會交錯。
