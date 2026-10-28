# McGraw Hill Connect｜教師教學支援指南

由使用者提供的 10 頁教師推薦簡報製作，採用華泰暗紅色與暖白底的沉浸式版面。

![網頁預覽](preview.jpg)

## 內容與互動

- AI Reader、SmartBook、Test Builder、Question Bank、Integrated Excel、ABA 情境活動與教師備課資源。
- 10 個章節的快速導覽、簡報模式與原始講者備註。
- 12 張原始操作畫面的放大檢視。
- 在本機保留的導入準備清單。
- 可複製及下載的一章試跑計畫。

## 本機預覽

網站使用原生 HTML、CSS 與 JavaScript，不需要安裝套件或執行建置。

在儲存庫根目錄執行：

```bash
python -m http.server 8000
```

瀏覽器開啟 `http://localhost:8000`。

## 檔案

- `index.html`：網站內容。
- `styles.css`：桌機與手機版面。
- `app.js`：章節導覽、圖片檢視、簡報模式與試跑計畫。
- `data.js`：章節資料、原始講者備註與圖片索引。
- `assets/`：原始圖片、教師推薦簡報 PDF 及 PPTX。

## 資料說明

內容與操作畫面依使用者提供的教師推薦簡報整理。功能、教材資源與介面以實際課程及帳號權限為準。

清單與試跑章節僅記錄在瀏覽器本機；試跑規劃不會送出帳號申請。
