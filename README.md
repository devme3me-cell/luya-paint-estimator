# 祿亞空間｜油漆估價 LINE Mini App

依 **2026 台灣公開行情** 製作的客戶自助油漆估價工具，可在 LINE 內以 Mini App（LIFF）開啟。

## 本機開發

```bash
cp .env.example .env
# 填入 VITE_LIFF_ID
npm install
npm run dev
```

**LINE Mini App：** https://miniapp.line.me/2011129407-qwlCLl3X  
**GitHub Pages（Endpoint URL）：** https://devme3me-cell.github.io/luya-paint-estimator/

請在 LINE Developers Console 把該環境的 **Endpoint URL** 設成 GitHub Pages 網址（結尾保留 `/`）。

## 上架 LINE Mini App

1. 到 [LINE Developers Console](https://developers.line.biz/console/) 建立 **LINE MINI App** channel（地區選台灣）。
2. 將建置後的 `dist/` 放到 **HTTPS** 網站（GitHub Pages、Vercel、自有主機皆可）。
3. 在 channel 的 **Developing / Review / Published** 各環境填：
   - **Endpoint URL**：例如 `https://你的網域/`
   - 複製該環境的 **LIFF ID** 到 `.env` 的 `VITE_LIFF_ID` 後重新 `npm run build`
4. 開啟 **Share target picker**（分享給好友需要）。
5. 頻道圖示用 `public/luya-logo.png`。
6. 隱私權／條款 URL：
   - `https://你的網域/privacy.html`
   - `https://你的網域/terms.html`
7. 用該環境的 LIFF URL 測試：`https://miniapp.line.me/{LIFF_ID}`

開發環境即可給內部測試；要出現在 LINE 搜尋／通過審核，需送 **Verified MINI App** 審查。

## Mini App 功能

- 在 LINE 內自動初始化 LIFF，顯示使用者名稱
- 估價結果可 **分享給好友**（Flex 訊息）
- 從聊天室開啟時可 **傳送到目前對話**
- **官方 LINE 諮詢**（請先把 `src/contact.ts` 換成真實帳號）
- 關閉小程式

## 聯絡資料

請編輯 `src/contact.ts`，填入真實電話、地址、官方 LINE Basic ID。
