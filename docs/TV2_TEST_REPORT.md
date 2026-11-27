# Kết quả kiểm thử TV2

Ngày kiểm: 27/11/2026. Source nền: commit `9c943b03e505063eeb4d50b517b7323e385c8f79`. Đây là kết quả kiểm thử trước khi publish nhánh TV2; không thay thế việc kiểm thử tích hợp sau khi merge.

## Đã chạy và đạt

| Kiểm tra | Kết quả |
|---|---|
| Node test runner, đủ database test riêng | 21 pass, 0 fail, 0 skip |
| Frontend `npm run build` | Thành công, 108 modules |
| Chromium headless, UI gọi Express và DB thật | Tất cả các luồng bên dưới qua; không có pageerror |
| Responsive | Không tràn ngang ở 360px, 768px, 1440px |
| Production bundle | Không chứa trang playground hoặc `/api/dev/session` |
| `git diff --check` | Không có lỗi whitespace |

21 bài test gồm 6 bài state machine auto-save, 7 bài validation/security và 8 bài integration DB/API. Integration test dùng database dùng một lần, không dùng database người dùng.

## Các tình huống đã kiểm

- Gõ tiếp trong lúc request tạo chậm: không tạo hai note và không báo chữ mới đã lưu khi chưa nhận ACK.
- Mất ACK: retry giữ nguyên operation_id và body; lỗi validation chắc chắn cho phép gửi bản sửa đúng.
- Draft rỗng không tạo row; xóa trắng nội dung không ghi đè note hợp lệ; ACK cũ không che trạng thái invalid mới.
- Remote update khi clean không tạo vòng lặp auto-save; khi dirty giữ draft và yêu cầu chọn bản.
- API từ chối anonymous; danh sách/search/detail note khóa không lộ nội dung/hash; request stale version trả conflict.
- Hai request song song được serialize; cùng thao tác không ghi hai lần; cùng ID thao tác với body khác bị từ chối.
- Ghim gần nhất lên đầu, thời điểm ghim không thay đổi khi sửa text; dữ liệu seed giờ cũ được chuyển đúng.
- Nhãn riêng user, lọc OR không trùng note, đổi tên lan truyền, xóa nhãn giữ note, không gắn nhãn user khác.
- Share read không sửa; share edit không xóa note; thu hồi share áp dụng cho request tiếp theo.
- Upload kiểm type/signature/giới hạn và replay; file yêu cầu auth; byte Range hợp lệ/không hợp lệ; delete không vượt quyền.
- Xóa chỉ owner; retry sau mất ACK vẫn nhận được kết quả dù row đã xóa.

Trên Chromium, đã thao tác Grid/List, tạo/sửa/đóng sau auto-save, live search, không tìm theo content của note khóa, tạo/gắn nhãn, upload TXT/PNG/MP4 thật và đợi ảnh/video tải metadata, ghim, lọc, cancel/confirm xóa, kiểm chặn note khóa và tìm kiếm trên mobile.

## Cách chạy lại

```bash
cd backend
npm test
```

Không cấp `NOTES_TEST_DB_CONFIG` thì 8 bài integration được skip, không được báo là đã kiểm DB. Để chạy đủ, tạo JSON config ở ngoài repo:

```json
{
  "host": "127.0.0.1",
  "port": 3306,
  "user": "tai_khoan_test",
  "password": "mat_khau_test",
  "database": "note_tv2_test_local",
  "disposable": true
}
```

Database này sẽ bị test tạo và xóa. Dùng tài khoản/database test riêng, không có data cần giữ. Trong Git Bash, thay đường dẫn thực tế:

```bash
NOTES_TEST_DB_CONFIG=/c/duong-dan-rieng/notes-test-db.json npm test
cd ../frontend
npm run build
```

Để tự kiểm UI, làm theo README_TV2.md rồi lặp lại các thao tác Chromium mô tả trên. Bộ test browser được chạy bằng trình điều phối môi trường kiểm thử; không được đóng gói thành dependency của dự án.

## Giới hạn kết luận

- Database chạy thực tế trong môi trường kiểm thử là **MariaDB 11.8.9**, driver mysql2. Target của nhóm vẫn là MySQL 8; chưa chạy được native MySQL 8 ở môi trường này. Trước nộp, chạy lại migration và đủ test trên MySQL 8 của nhóm.
- Playground local dùng tài khoản seed và token RAM để kiểm TV2. Đây không phải nghiệm thu đăng nhập/đăng ký/reset của TV1.
- Chưa nghiệm thu password grant của TV3, Socket.io, offline sync/IndexedDB, AI, gửi email, preferences lưu DB hoặc deploy HTTPS. Hook đã có không đồng nghĩa các chức năng đó đã hoàn thiện.
- Preview được kiểm bằng file nhỏ; giới hạn 10 MiB/tệp và tối đa 10 tệp/note là quyết định triển khai cần đối chiếu đề gốc. Không có antivirus hoặc giải mã toàn bộ container media; signature check là một lớp kiểm tra cơ bản.
- Không có load test hay cam kết đạt toàn bộ 32 tiêu chí. Nhóm cần test tích hợp quyền/trạng thái note sau khi nối phần của TV1/TV3.

## Trước khi merge

TV1 review migration, UTC, JWT adapter, mount routes và bỏ public uploads. TV3 review password grant và callback sau commit. Sau khi nối, kiểm hai trình duyệt/tài khoản, khóa note khi editor đang mở, thu hồi quyền, mất mạng và reconnect. Không ghi trong báo cáo là các luồng chưa kiểm đã pass.
