# Phần 3 của Trâm – hướng dẫn ghép vào sườn của Long

Phạm vi (tiêu chí 23–28, 31): khóa mật khẩu note · chia sẻ note · cộng tác realtime (WebSocket) · AI Summary · AI Q&A (RAG) · Offline/PWA.

Code được viết để **chỉ thêm file mới**; sườn của Long chỉ sửa **6 chỗ nhỏ** (có patch sẵn). Không đổi schema MySQL (dùng đúng các bảng `notes`, `note_shares`… trong `schema.sql`).

---

## 1. Cấu trúc thư mục (giả định repo có `backend/` và `frontend/`)

```
backend/src/modules/advanced/     ← MỚI: ot.js, collabDoc.js, realtime.js, lock.routes.js, share.routes.js,
                                          ai.routes.js, llm.js, rag.js, noteAccess.js, auth.js, mailer.js, index.js
backend/.env.example.member3      ← biến môi trường cần thêm
frontend/src/features/advanced/   ← MỚI: lock/, share/, ai/, collab/, components/, NoteAdvancedToolbar.jsx, AdvancedHost.jsx
frontend/src/offline/             ← MỚI: IndexedDB, lớp offline cho axios, đồng bộ, banner
frontend/public/                  ← MỚI: sw.js, manifest.webmanifest, icons/
tests/                            ← ot-fuzz.test.mjs, backend-smoke.test.cjs (chạy bằng node, không cần npm install)
patches/                          ← 6 patch cho file của Long
```

## 2. Cài đặt (5 bước)

1. Copy `backend/`, `frontend/`, `tests/` của gói này **gộp vào** repo (không ghi đè file của Long).
2. Ở thư mục gốc repo: `git apply patches/all-in-one.patch`
   (nếu lỗi do khác dòng/CRLF thì sửa tay theo mục 3).
3. `cd backend && npm install` (patch đã thêm `ws` vào `package.json`).
4. Thêm nội dung `backend/.env.example.member3` vào `backend/.env`, điền `LLM_API_KEY` (key miễn phí tại aistudio.google.com/apikey). `JWT_SECRET` phải **trùng** secret Long dùng khi ký token đăng nhập.
5. Chạy: backend `npm run dev`, frontend `npm run dev`.

> Backend đọc user id trong JWT từ `id | userId | user_id | sub`. Nếu Long đặt tên khác, sửa 1 dòng trong `backend/src/modules/advanced/auth.js`.

## 3. 6 chỗ sửa trong file của Long (nếu không dùng patch)

| File | Thêm |
|---|---|
| `backend/src/app.js` | `const advanced = require('./modules/advanced');` · sau các middleware: `advanced.mountRoutes(app);` · đổi `app.listen(...)` thành `const server = app.listen(...)` rồi `advanced.attachRealtime(server);` |
| `backend/package.json` | `"ws": "^8.18.0"` trong `dependencies` |
| `frontend/vite.config.js` | trong `proxy`: `'/ws': { target: 'http://localhost:5000', ws: true }` |
| `frontend/src/App.jsx` | import `SharedWithMe`, `SharedNoteEditor`; route `/shared` → `<SharedWithMe />` và thêm `/shared/:id` → `<SharedNoteEditor />` |
| `frontend/src/components/MainLayout.jsx` | import `AdvancedHost` và render `<AdvancedHost />` ở cuối layout |
| `frontend/src/main.jsx` | `import { initOffline } from './offline'; initOffline();` |

## 4. Việc phải thống nhất với Anh (Member 2) – quan trọng nhất

Phần của em hoạt động độc lập, nhưng **khóa note** và **realtime** chỉ đầy đủ khi route/giao diện của Anh gọi vào:

**Backend (route `/api/notes` của Anh)**
```js
const { noteLockGuard, toPublicNote } = require('../modules/advanced');
router.get('/:id',    authenticate, noteLockGuard, getNote);     // xem
router.put('/:id',    authenticate, noteLockGuard, updateNote);  // sửa
router.delete('/:id', authenticate, noteLockGuard, deleteNote);  // xóa (và mọi route con có :id: pin, labels, attachments…)
// danh sách: res.json({ notes: rows.map(toPublicNote) })  → bỏ password_hash, che content của note khóa
```
- Danh sách phải trả `is_locked` (để hiện icon khóa). Tìm kiếm live **không** được so khớp `content` của note đã khóa.
- Note bị khóa mà thiếu `X-Note-Token` → server trả HTTP **423** `{code:'NOTE_LOCKED'}`.

**Frontend (màn hình soạn note của Anh)**
```jsx
import CollabTextarea from '../advanced/collab/CollabTextarea';
import NoteAdvancedToolbar from '../advanced/NoteAdvancedToolbar';

<CollabTextarea noteId={note.id} value={content} onChange={setContent}
                title={title} onTitleChange={setTitle}
                onActiveChange={setCollabLive} rows={12} />   {/* thay <textarea> nội dung */}
<NoteAdvancedToolbar noteId={note.id} />                      {/* nút Lock / Share / AI Summary */}
```
- Khi `collabLive === true`, auto-save của Anh **đừng gửi `content`** qua REST (chỉ gửi title…) – server đã tự lưu nội dung realtime.
- Không cần code gì cho mật khẩu: interceptor tự mở hộp thoại nhập mật khẩu khi gặp 423 rồi gọi lại request. Chỉ cần bắt trường hợp người dùng bấm Cancel (`err.canceled === true`) → quay về danh sách.
- Route màn hình soạn note đang giả định là `/notes/:id` – nếu khác, sửa 1 dòng `NOTE_EDIT_ROUTE` trong `frontend/src/features/advanced/config.js`.
- Offline: thao tác tạo/sửa/xóa lúc offline sẽ trả `{ success:true, queued:true, offline:true, note, id }`. Có thể hiện “Saved offline”. Sau khi đồng bộ xong có event `offline-sync-complete` (Anh có thể lắng nghe để tải lại danh sách).

## 5. Việc cho Long (deploy – tiêu chí 32)

- **Reverse proxy phải cho WebSocket đi qua `/ws`** (nginx):
  ```
  location /ws { proxy_pass http://backend:5000; proxy_http_version 1.1;
                 proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";
                 proxy_set_header Host $host; proxy_read_timeout 3600s; }
  ```
- Service worker cần **HTTPS** (localhost thì được), file `/sw.js` phục vụ ở gốc domain và không cache lâu.
- Docker/hosting: thêm biến môi trường ở mục 2.4.
- (Tùy chọn) khi đăng xuất gọi `clearOfflineCache()` từ `frontend/src/offline` để xóa dữ liệu note cache trên máy dùng chung.

## 6. API em thêm

| Tính năng | Endpoint |
|---|---|
| Đặt / mở / đổi / tắt mật khẩu | `POST /api/notes/:id/lock` · `POST /api/notes/:id/unlock` · `PUT /api/notes/:id/lock/password` · `POST /api/notes/:id/lock/disable` |
| Thông tin quyền của note | `GET /api/notes/:id/meta` |
| Chia sẻ (chủ note) | `GET/POST /api/notes/:id/shares` · `PUT/DELETE /api/notes/:id/shares/:shareId` |
| Người nhận | `GET /api/shared-notes` · `GET /api/shared-notes/:id` |
| AI | `POST /api/ai/notes/:id/summary` · `POST /api/ai/ask` |
| Realtime | WebSocket `/ws` |

## 7. Tự kiểm tra từng tiêu chí (cũng là kịch bản quay demo)

Tài khoản trong `seed.sql`: `student1@tdtu.edu.vn`, `student2@tdtu.edu.vn` (mật khẩu `Password123@`). Mở 2 trình duyệt (1 cửa sổ ẩn danh).

- **23 Bật/tắt mật khẩu**: mở note → nút **Lock** → nhập 2 lần → biểu tượng đổi thành **Password** → mở lại note phải hỏi mật khẩu → **Remove password** phải nhập mật khẩu hiện tại.
- **24 Đổi mật khẩu / bảo vệ**: **Password → Change password** (mật khẩu cũ + mới 2 lần). Sai mật khẩu 5 lần → khóa 60 giây. Xem/sửa/xóa note khóa đều bị hỏi mật khẩu.
- **25 Chia sẻ**: **Share** → nhập email (nhiều email, Enter) → chọn Read only / Can edit. Email chưa đăng ký bị báo lỗi. Người nhận vào **Shared with me** thấy: người chia sẻ, quyền, thời điểm; có thông báo nổi + email (nếu cấu hình SMTP). Chủ note đổi quyền/thu hồi ngay trong hộp thoại.
- **26 Realtime**: student1 mở note 1, student2 mở note đó trong **Shared with me** (quyền Can edit) → gõ cùng lúc ở 2 bên, hai bên thấy nhau ngay, không mất chữ. Ngắt mạng 1 bên → hiện “Reconnecting”, nối lại tự đồng bộ. Thu hồi quyền → bên kia bị đưa ra khỏi note.
- **27 AI Summary**: nút **AI Summary** → *Generate summary* → *Regenerate*.
- **28 AI Q&A**: nút tròn ✨ góc phải dưới → hỏi bằng ngôn ngữ tự nhiên → câu trả lời kèm nguồn `[1] [2]`; bấm để mở note. Note đã khóa không bao giờ được gửi cho AI.
- **31 Offline**: `npm run build && npm run preview` (service worker chỉ chạy bản build; `VITE_ENABLE_SW=true` để bật ở dev). Mở app khi online 1 lần → DevTools → Network → *Offline* → tải lại: vẫn xem được note, tạo/sửa/xóa vẫn được; banner vàng báo số thay đổi chờ; bật mạng lại → tự đồng bộ.

Chạy test tự động (từ thư mục gốc repo): `node tests/ot-fuzz.test.mjs` và `node tests/backend-smoke.test.cjs`.

## 8. Giải thích nhanh cho buổi vấn đáp

- **Khóa note**: mật khẩu băm bcrypt trong `notes.password_hash`. Nhập đúng → server cấp *note token* (JWT 15 phút, gắn với đúng note + đúng user). Middleware `noteLockGuard` ở **server** chặn mọi request thiếu token (HTTP 423), nên không thể lách bằng cách gọi API trực tiếp. Có giới hạn đoán sai 5 lần/phút.
- **Realtime**: dùng *Operational Transformation*. Mỗi lần gõ, client tính 1 thao tác `{p, d, s}` (vị trí, số ký tự xóa, chuỗi chèn) kèm số phiên bản; server xếp thứ tự và “biến đổi” thao tác cho khớp với những thao tác đến trước, rồi phát cho người khác. `tests/ot-fuzz.test.mjs` chứng minh mọi client hội tụ về cùng văn bản. Nội dung lưu vào MySQL sau 0,8 giây không gõ.
- **RAG**: note → cắt đoạn ~1000 ký tự → embedding (cache) → cosine similarity (+ điểm từ khóa) → lấy 5 note gần nhất → LLM chỉ được trả lời từ các đoạn đó và gắn `[n]` → server trả về danh sách note đã dùng. Embedding lỗi thì tự chuyển sang tìm theo từ khóa.
- **Offline**: Service Worker cache giao diện/ảnh; dữ liệu API lưu trong IndexedDB (mọi GET thành công). Thay đổi lúc offline vào hàng đợi `outbox`, gộp các lần auto-save, và gửi theo thứ tự khi có mạng (id tạm `local-…` được thay bằng id thật). Xung đột: *last write wins*.

## 9. Giới hạn đã biết (nói thật để khỏi bất ngờ)

- Chưa chạy được thử với MySQL/trình duyệt thật trong môi trường tạo code; phần **logic** đã test bằng DB giả + fuzz test + bundle thử toàn bộ React app. Em cần chạy thử end-to-end trên máy sau khi ghép (MySQL + trình duyệt thật).
- `seed.sql`: chuỗi bcrypt dùng cho note 3 (đã khóa) **chưa được kiểm chứng** là có khớp `Password123@`. Nếu không mở được, tạo hash mới: `node -e "console.log(require('bcryptjs').hashSync('Password123@',10))"` rồi thay vào seed.
- Tên model mặc định `gemini-3.8-flash` lấy theo tài liệu Google lúc viết; nếu báo lỗi model, đổi `LLM_MODEL` trong `.env` theo AI Studio.
- Cộng tác realtime áp dụng cho **văn bản thuần** (textarea). Note được chia sẻ quyền sửa sẽ **chỉ đọc khi mất mạng** (để không ghi đè lên chỉnh sửa của người khác).
- File đính kèm của note khóa vẫn truy cập được nếu biết đúng URL `/uploads/...` (tên file ngẫu nhiên); mật khẩu bảo vệ nội dung note, không mã hóa file.
- Mật khẩu note tối thiểu 6 ký tự.

## 10. Về quy chế môn học

Đề ghi rõ có **vấn đáp cá nhân** và có thể trừ điểm nếu dùng AI sinh code vi phạm quy định môn học. Em nên (1) kiểm tra quy định cụ thể của thầy về việc dùng AI hỗ trợ, (2) tự đọc kỹ từng file, chạy thử và đọc mục 8 để giải thích được từng phần, (3) commit phần của mình bằng tài khoản GitHub của em, chia thành các commit có ý nghĩa (mỗi tuần ≥ 2 commit trong 4 tuần liên tiếp).

## 11. Tin nhắn mẫu gửi Long / Anh

> **Long**: mình có 6 chỗ sửa nhỏ trong sườn (app.js, package.json, vite.config.js, App.jsx, MainLayout.jsx, main.jsx) – patch ở `patches/`. Cần thêm `ws` và proxy `/ws` cho WebSocket, và JWT_SECRET trùng nhau. Lúc deploy nhớ cho WebSocket đi qua `/ws`.
> **Anh**: ở route `/api/notes` anh gắn `noteLockGuard` cho các route có `:id` và dùng `toPublicNote` cho danh sách; ở màn hình soạn note dùng `<CollabTextarea>` thay textarea nội dung + `<NoteAdvancedToolbar noteId=… />`; route soạn note mình đang giả định `/notes/:id`. Chi tiết trong GUIDE_TRAM.md mục 4.
