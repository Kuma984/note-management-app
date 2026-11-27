# Bản triển khai Thành viên 2 — đọc file này trước

Source nền: `Kuma984/note-management-app`, commit `9c943b03e505063eeb4d50b517b7323e385c8f79`. Bản này triển khai phần core notes/labels/attachments của TV2. Không phải toàn bộ đồ án 32 tiêu chí đã hoàn thành.

## 1. Có gì trong bản này?

| Rubric | Triển khai |
|---|---|
| 9–10 | Grid mặc định, chuyển List; cùng dữ liệu, có loading/empty/error |
| 11–12 | Một NoteEditor dùng cho thêm/sửa; title/content bắt buộc |
| 13 | Xóa có xác nhận, cancel giữ note; owner-only |
| 14 | Auto-save 700ms, một request tại một thời điểm, không Save; giữ draft khi lỗi, UUID chống tạo trùng, version chống ghi đè |
| 15–16 | Nhiều JPEG/PNG/WebP/MP4/WebM/PDF/TXT; preview ảnh/video, download; API kiểm quyền và bytes/type/size/count |
| 17 | Pin bằng thời điểm ghim, độc lập thời điểm sửa; ghim gần nhất trước |
| 18 | Icon pin/lock/shared có ở Grid và List, tên truy cập cho trình đọc màn hình |
| 19 | Live search 300ms, title+content; note khóa chỉ title; hủy response cũ |
| 20–22 | CRUD label riêng user, quan hệ ID nhiều-nhiều, rename/delete không mất note, filter nhiều label theo OR |

Note khóa mặc định bị chặn 423 khi đọc/sửa/xóa/file; TV3 phải nối password-grant verifier trước khi nghiệm thu các thao tác trên note khóa. UI chỉ hiển thị icon và gửi yêu cầu mở khóa; không tự giải khóa bằng frontend.

## 2. Cách đưa vào repo trên máy của bạn

### Nếu đọc file này trên nhánh GitHub feat/member-2-notes

Không cần tải ZIP hoặc áp dụng patch. Trong Git Bash tại repo đã clone, kiểm tra thay đổi của mình rồi kéo nhánh:

```bash
git status
git fetch origin
git switch feat/member-2-notes
git pull --ff-only origin feat/member-2-notes
```

Nếu chưa có nhánh local, `git switch` có thể tự tạo nhánh theo remote vừa fetch. Nếu Git báo file local sẽ bị ghi đè hoặc branch đã phân kỳ, giữ nguyên file và xử lý thay đổi đó trước; không dùng reset/force để vượt qua. Tiếp tục phần 3 bên dưới để cấu hình database và chạy thử. Chưa merge vào main; TV1/TV3 cần review các điểm nối.

### Nếu dùng gói ZIP/patch đã nhận trước đó

Nên dùng patch để giữ nguyên `.git` và branch của mình. Đặt `member-2-notes.patch` vào thư mục repo, đứng ở root repo trong Git Bash:

```bash
git status
git branch --show-current
git apply --check member-2-notes.patch
git apply member-2-notes.patch
git diff --stat
```

Chỉ chạy apply sau khi check thành công. Nếu có conflict hoặc bạn/teammate đã sửa các file chung, giữ thay đổi hiện có và merge từng phần; không force ghi đè hoặc reset main. Patch dựa trên commit nền ghi đầu file. Các lockfile được cung cấp trong ZIP source; patch không chèn lockfile để tránh đè file npm vừa tạo trên máy bạn.

ZIP source là snapshot sạch để tham khảo/chạy riêng; không thay `.git` của repo đang clone và không dùng Download ZIP làm lịch sử Git nộp bài. Source nộp vẫn lấy từ repo clone thật theo hướng dẫn giảng viên. Bỏ qua việc tối ưu số tuần/commit theo yêu cầu mới của người dùng; cứ commit thay đổi thật.

## 3. Chạy thử ngay khi auth của TV1 chưa có

### Terminal backend

Bật MySQL trong XAMPP hoặc MySQL Server. Từ root repo:

```bash
cd backend
npm install
cp -n .env.example .env
```

Mở `.env`, sửa DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME theo máy. Nên dùng **database local riêng**, ví dụ `note_app_db_tv2`. Không đưa `.env` lên GitHub. Trong môi trường app chính, JWT_SECRET phải là chuỗi ngẫu nhiên riêng tối thiểu 32 ký tự; key mẫu trong .env.example bị từ chối bởi module notes. Playground tự tạo key RAM riêng mỗi lần chạy.

Đối với database local mới, chạy:

```bash
npm run notes:setup -- --seed
npm run notes:dev
```

`notes:setup` tạo các bảng từ schema hiện có và áp dụng migration TV2 một lần. `--seed` là tùy chọn chủ động để thêm dữ liệu mẫu; không dùng trên DB chứa user/data thật. Nếu DB đã có dữ liệu, backup, đọc migration rồi chạy `npm run notes:setup` không có --seed. Khi schema có dấu hiệu migration dở dang, script dừng thay vì drop dữ liệu.

Migration chuyển pinned_at cũ từ múi giờ session cũ sang UTC, phù hợp seed NOW() ban đầu. Nếu dữ liệu pinned_at của nhóm đã là UTC, đặt session UTC trước khi chạy migration thủ công để tránh dịch giờ hai lần. Không sửa database production theo giả định này mà chưa đối chiếu TV1.

### Terminal frontend

```bash
cd frontend
npm install
npm run dev
```

Mở URL Vite in trong terminal, thêm **`/notes-dev.html`**, ví dụ `http://localhost:3000/notes-dev.html` với cấu hình repo hiện tại. Chọn **User 1** để thử note/label của chủ sở hữu. User 2/3 giúp kiểm tra tài khoản khác; note shared có thể kiểm bằng API/test harness trước khi TV3 hoàn thiện SharedWithMe.

Playground là công cụ local: backend chỉ bind 127.0.0.1, từ chối NODE_ENV=production, không được import trong app.js. Token thử chỉ ở RAM, không thay localStorage phiên app chính. Tuyệt đối không dùng `npm run notes:dev` để deploy hoặc khai đã có chức năng đăng nhập thật.

## 4. Khi nối vào app chính

Chạy backend bằng `npm run dev` hoặc `npm start`, không chạy hai backend cùng cổng. `app.js` đã mount `/api/notes` và `/api/labels`; route guard login chính giữ nguyên. Đăng nhập thật của TV1 cần hoạt động thì mới truy cập root app chính bình thường.

TV1 chọn một trong hai interface xác thực:

1. Middleware đáng tin cậy đặt `req.auth.userId` trước khi mount notes; TV1 chịu trách nhiệm kiểm JWT/session/revocation/CSRF theo cơ chế auth của mình.
2. Adapter hiện tại đọc Bearer JWT HS256, xác minh signature/expiry, lấy `id` hoặc `user_id` hoặc `sub`, kiểm user còn tồn tại. Adapter này **chưa có session revocation**; TV1 phải bổ sung nếu dùng cho change/reset/logout. Không coi adapter là toàn bộ auth 1–8.

`JWT_SECRET` vẫn cần cho HMAC receipt; phải giữ ổn định để retry hoạt động. Secret không gửi frontend.

## 5. Contract API thực tế của bản này

Thành công: `{data:{...}}`; lỗi: `{error:{code,message,details?}}`. Các endpoint dưới đây đều private; backend lấy user từ auth, không tin user_id trong body.

| API | Request | Response chính |
|---|---|---|
| GET /api/notes | q,label_ids,page,limit | data.items, data.meta |
| POST /api/notes | title,content,operation_id UUID v4 | data.note, data.mutation |
| GET /api/notes/:id | — | data.note |
| PATCH /api/notes/:id | title,content,base_version,operation_id | data.note, data.mutation |
| DELETE /api/notes/:id | base_version,operation_id | 204 |
| PUT /api/notes/:id/pin | pinned boolean,base_version,operation_id | data.note, data.mutation |
| PUT /api/notes/:id/labels | label_ids array,base_version,operation_id | data.note, data.mutation |
| GET/POST /api/labels | POST name | items hoặc label |
| PATCH/DELETE /api/labels/:id | PATCH name | label hoặc204 |
| POST /api/notes/:id/attachments | multipart files,base_version,operation_id | note,mutation |
| DELETE /api/notes/:id/attachments/:fileId | base_version,operation_id | note,mutation |
| GET/HEAD /api/notes/:id/attachments/:fileId/content | Bearer auth; optional Range | file bytes, no-store,206/416 cho Range |

Tất cả note mutations dùng base_version, trừ create. Retry phải dùng operation_id và body cũ. Receipt dùng HMAC, không lưu bản copy plaintext note. UUID thao tác khác với ID note: ID note vẫn INT của schema nhóm.

Status đáng nhớ:401 auth,403 không đủ quyền,404 không có access/đối tượng,409 conflict/reused operation,413 upload limit,415 file type,422 validation,423 locked. Shared read không mutation; shared edit chỉ content/attachments; pin/labels/delete owner-only. Label của user khác không được gắn vào note.

## 6. Điểm nối TV3 — chưa triển khai thay phần TV3

- Backend: đặt `app.locals.noteSecurity.authorizeLockedNote = async ({req,db,noteId,action,userId}) => boolean`. Hàm phải xác minh password grant server-side, note/session/password-version, expiry; delete cần fresh one-use grant. Không return true chỉ dựa vào field client gửi. Không lộ hash/content trong lỗi.
- Backend: đặt `app.locals.noteEvents.publishNoteChange = async ({noteId,version,operationId,kind,actorId}) => ...`. Callback chạy sau commit; TV3 kiểm quyền room hiện hành và phát invalidation bằng Socket.io. Không ghi DB lần hai trong callback.
- Frontend: TV3 nhận `notes:unlock-request` từ window, mở dialog, lấy grant thật rồi gọi `detail.onUnlocked()`. Callback chỉ thử lại API, không bypass backend.
- Frontend: sau socket event, phát `notes:changed` với detail `{noteId,version,operationId,kind}`. Editor clean tải/apply, editor dirty giữ draft và hiện conflict; deleted/locked/revoked đóng editor. Reconnect phải refetch; không dựa vào socket để giữ toàn bộ lịch sử.
- Offline: chưa có Dexie/outbox/sync trong bản TV2. TV3 cần nối adapter vào `notes.api.js` hoặc truyền prop `api` cho NoteList. Giữ API trả Promise, operation/version semantics và safe locked fields. Không lưu locked detail/blob/token vào IndexedDB/SW. Hiện mất mạng giữ draft trong RAM và báo lỗi, **không giả báo đã lưu offline**.
- Preferences: NoteList nhận prop `preferences` gồm font_size/note_color; TV1 truyền dữ liệu DB thật sau khi hoàn thiện preferences. Dark/light Bootstrap vẫn kế thừa từ layout.
- Modal hiện dùng NoteDialog riêng trong feature vì shared ConfirmModal/Toast chưa tồn tại. TV1 có thể thay bằng shared component cùng contract; không cần duy trì hai bộ modal sau tích hợp.

## 7. Những file chung đã sửa để nối module

`backend/src/app.js`: mount routers, bỏ static public uploads. `backend/src/config/db.js`: UTC. `backend/package.json`: lệnh setup/dev/test. `database/seed.sql`: sửa hash password mẫu. `database/migrations/001_member2_notes.sql`: bổ sung schema. `MainLayout.jsx`/`Navbar.jsx`: nối search context. `services/api.js`: không đè Authorization đã truyền rõ ràng. `.gitignore`: cho phép commit lockfile. TV1 cần review các thay đổi này trước merge.

Không có đăng ký/login/reset/profile/share/AI/socket/PWA đầy đủ trong bản này. Các route /shared/preferences và điều hướng scaffold của TV1 vẫn cần phần tương ứng của nhóm, không dùng chúng để khẳng định #25/#31 đã đạt. Không thêm tính năng ngoài đề.

## 8. Tự test và học code

Backend `npm test`: chạy unit/regression; bài DB được skip khi chưa cấp database test riêng. Frontend `npm run build`: kiểm JSX/import/build. Xem `docs/TV2_TEST_REPORT.md` để biết kiểm thử thực tế và giới hạn môi trường.

Để chạy DB tests: tạo file config JSON riêng ngoài repo, gồm host/port/user/password/database (`note_tv2_test...`) và `disposable:true`; đặt NOTES_TEST_DB_CONFIG tới đường dẫn file rồi chạy npm test. Test tạo/xóa database test đó, tuyệt đối không trỏ tới DB thật. Kiểm tên và flag là hàng rào bổ sung, không thay cho kiểm credentials trước chạy.

Đọc `docs/TV2_TUNG_DONG.md` theo thứ tự đề xuất. Mở code bên trái, tài liệu bên phải; số L tương ứng số dòng thật của snapshot này. Nếu sửa code, số dòng có thể đổi. Thử sửa một câu UI, rồi một điều kiện validation; tự dự đoán kết quả trước khi chạy. Chưa xác nhận quy định AI của môn: phải hỏi giảng viên và giải thích trung thực phần có hỗ trợ AI.
