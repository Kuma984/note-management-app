# Giải thích từng dòng — phần TV2

Tài liệu đi cùng snapshot code trong bản triển khai này. Mỗi dòng có nội dung trong các file được liệt kê đều có một dòng giải thích; dòng trống chỉ để phân cách nên không đưa vào bảng. Lockfile là metadata npm sinh tự động, không phải source nghiệp vụ cần học thuộc.

## Cách đọc

Mở file code và tài liệu cạnh nhau trong VS Code. L12 tương ứng dòng12 của đúng snapshot; sửa code có thể làm lệch số dòng. Đọc lần lượt component nhỏ → trang/hook → API → backend → SQL → test. Với dòng ghép nhiều biểu thức, đọc thêm mục từ vựng và hàm bao quanh; không cần học thuộc các dấu đóng khối.

## Từ vựng JavaScript/React cần biết

| Cú pháp | Ý nghĩa |
|---|---|
| const / let | Đặt tên cho giá trị; let có thể gán lại, const không gán lại binding |
| function / mũi tên => | Khai báo hàm nhận đầu vào, thực hiện việc và có thể return đầu ra |
| return | Kết thúc hàm và trả kết quả; trong component thường là JSX |
| import / export | Chia code thành module để dùng lại |
| {title,content} | Object hoặc destructuring tùy vị trí trong cú pháp |
| [...items] / {...item} | Tạo bản sao nông array/object để cập nhật mà không sửa dữ liệu gốc |
| ?. / ?? / || | Đọc an toàn khi null; giá trị thay thế khi nullish; giá trị thay thế khi falsy |
| async / await | Chờ tác vụ như HTTP/DB; không có nghĩa giữ toàn bộ trình duyệt đứng lại |
| Promise | Kết quả sẽ hoàn thành hoặc thất bại trong tương lai |
| useState | Dữ liệu React ghi nhớ; setter yêu cầu render lại |
| useEffect | Tác vụ sau render và cleanup theo dependency |
| useRef | Giữ DOM/controller/tham chiếu không tự gây render |
| props | Dữ liệu/hàm cha truyền cho component con |
| JSX / className | Mô tả giao diện, dùng className để gắn CSS |
| map / filter | Biến đổi phần tử / giữ phần tử thỏa điều kiện |
| try / catch / finally | Luồng thử xử lý, lỗi và cleanup luôn chạy |
| transaction | Nhóm thay đổi DB commit cùng nhau hoặc rollback |
| version / operation_id | Phát hiện ghi đè / nhận biết request retry |

## Bốn luồng cần tự giải thích

1. Mở trang: NoteList đọc search context → debounce → notesApi.list → GET /notes → JWT/ACL → SQL → DTO an toàn → render NoteCard.
2. Gõ note: editor.change → generation tăng → timer700ms → một request POST/PATCH → transaction + receipt/version → ACK đúng snapshot; chữ gõ thêm vẫn dirty.
3. Upload: text flush → FormData → auth trước Multer → kiểm bytes → transaction kiểm lại quyền/version/count → rename file + metadata → commit → preview blob qua API private.
4. Conflict: version cũ bị409 → GET bản mới có quyền → giữ draft local và hiển thị hai lựa chọn; không tự last-write-wins.

## Giới hạn cần hiểu trước vấn đáp

Phần này không tự tạo auth account, password unlock, Socket.io server, AI hoặc Dexie. Các điểm nối TV1/TV3 được ghi trong README_TV2.md. Playground chỉ local và không tính là login thật. Backend tests dùng DB test riêng, không dùng DB người dùng.

## frontend/src/features/notes/NoteStatusIcons.jsx

Mã nguồn có 11 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` export default function NoteStatusIcons({ note }) { ` | chọn và hiển thị các icon ghim, khóa, chia sẻ từ trạng thái note. Export cho phép file khác import nó. |
| L2 | ` const icons = [ ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong NoteStatusIcons. |
| L3 | ` [note.is_pinned, 'bi-pin-angle-fill', 'Đã ghim'], ` | Bộ ba cấu hình icon: điều kiện is_pinned, class Bootstrap bi-pin-angle-fill, tên truy cập “Đã ghim”. Chỉ điều kiện đúng mới hiển thị. |
| L4 | ` [note.is_locked, 'bi-lock-fill', 'Đã khóa'], ` | Bộ ba cấu hình icon: điều kiện is_locked, class Bootstrap bi-lock-fill, tên truy cập “Đã khóa”. Chỉ điều kiện đúng mới hiển thị. |
| L5 | ` [note.is_shared, 'bi-people-fill', 'Đã chia sẻ'], ` | Bộ ba cấu hình icon: điều kiện is_shared, class Bootstrap bi-people-fill, tên truy cập “Đã chia sẻ”. Chỉ điều kiện đúng mới hiển thị. |
| L6 | ` ]; ` | Đóng cấu trúc mảng/object/JSX hoặc kết thúc câu lệnh đang mở; xem khối bao quanh để ghép cặp dấu. Trong NoteStatusIcons. |
| L7 | ` return <span className="d-inline-flex gap-2 note-status-icons"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L8 | ` {icons.filter(([visible]) => visible).map(([, icon, label]) => ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong icons.filter(). |
| L9 | `` <span key={label} role="img" aria-label={label} title={label}><i className={`bi ${icon}`} aria-hidden="true" /></span>)} `` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L10 | ` </span>; ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L11 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong NoteStatusIcons. |

## frontend/src/features/notes/NoteCard.jsx

Mã nguồn có 23 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import NoteStatusIcons from './NoteStatusIcons'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` export default function NoteCard({ note, list, onOpen, onPin, onDelete, pending }) { ` | hiển thị một ghi chú và chuyển thao tác mở/ghim/xóa lên trang cha. Export cho phép file khác import nó. |
| L4 | `` return <article className={`note-card ${list ? 'note-card-list' : ''}`}> `` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L5 | `` <button className="note-card-open" onClick={() => onOpen(note)} aria-label={`Mở ghi chú ${note.title}`}> `` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L6 | ` <span className="d-flex align-items-start justify-content-between gap-3"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L7 | ` <strong className="note-title">{note.title}</strong> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L8 | ` <NoteStatusIcons note={note} /> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L9 | ` </span> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L10 | ` <span className="note-preview">{note.is_locked ? 'Cần mật khẩu để mở ghi chú.' : note.content_preview}</span> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L11 | ` </button> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L12 | ` <div className="note-card-footer"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L13 | ` <div className="d-flex flex-wrap gap-1">{note.labels.map(label => <span key={label.id} className="badge text-bg-secondary">{label.name}</span>)}</div> ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong undefined.map(). |
| L14 | ` <div className="d-flex align-items-center gap-1"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L15 | ` <small className="text-body-secondary me-2">{new Date(note.updated_at).toLocaleDateString('vi-VN')}</small> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L16 | ` {note.access.can_manage && <> ` | Render có điều kiện bằng &&: chỉ khi điều kiện phía trái đúng thì JSX phía phải xuất hiện. Điều này chỉ điều khiển UI, không thay kiểm quyền backend. |
| L17 | `` <button className="btn btn-sm btn-outline-secondary" disabled={pending} title={note.is_pinned ? 'Bỏ ghim' : 'Ghim'} aria-label={`${note.is_pinned ? 'Bỏ ghim' : 'Ghim'} ${note.title}`} onClick={() => onPin(note)}><i className={`bi ${note.is_pinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'}`} aria-hidden="true" /></button> `` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L18 | `` <button className="btn btn-sm btn-outline-danger" disabled={pending} aria-label={`Xóa ${note.title}`} onClick={() => onDelete(note)}><i className="bi bi-trash" aria-hidden="true" /></button> `` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L19 | ` </>} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L20 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L21 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L22 | ` </article>; ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L23 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong NoteCard. |

## frontend/src/features/notes/NotesSearchContext.jsx

Mã nguồn có 14 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import { createContext, useContext, useState } from 'react'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` const NotesSearchContext = createContext(null); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L5 | ` export function NotesSearchProvider({ children }) { ` | cấp chung query và setQuery cho thanh tìm kiếm và trang note. Export cho phép file khác import nó. |
| L6 | ` const [query, setQuery] = useState(''); ` | Tạo state query (từ khóa đang gõ, dùng chung navbar và trang note) và hàm cập nhật setQuery; cập nhật qua setter khiến React render lại. |
| L7 | ` return <NotesSearchContext.Provider value={{ query, setQuery }}>{children}</NotesSearchContext.Provider>; ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L8 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong NotesSearchProvider. |
| L10 | ` export function useNotesSearch() { ` | đọc search context và phát hiện khi quên bọc Provider. Export cho phép file khác import nó. |
| L11 | ` const context = useContext(NotesSearchContext); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong useNotesSearch. |
| L12 | ` if (!context) throw new Error('NotesSearchProvider is required.'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong useNotesSearch. |
| L13 | ` return context; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong useNotesSearch. |
| L14 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong useNotesSearch. |

## frontend/src/features/notes/notes.api.js

Mã nguồn có 44 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import api from '../../services/api'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` export function makeNotesApi(token) { ` | tạo các hàm gọi API; token riêng chỉ được dùng cho playground. Export cho phép file khác import nó. |
| L4 | `` const headers = token ? { Authorization: `Bearer ${token}` } : {}; `` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong makeNotesApi. |
| L5 | ` async function call(method, url, data, config = {}) { ` | gửi request bằng Axios chung, bóc data và chuẩn hóa lỗi. Export cho phép file khác import nó. |
| L6 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong call. |
| L7 | ` const response = await api.request({ method, url, data, ...config, headers: { ...headers, ...config.headers } }); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong call. |
| L8 | ` return response.data?.data; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong call. |
| L9 | ` } catch (original) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong call. |
| L10 | ` const error = new Error(original.response?.data?.error?.message \|\| (original.code === 'ERR_CANCELED' ? 'Đã hủy yêu cầu.' : 'Không thể kết nối máy chủ. Bản đang nhập vẫn được giữ trên màn hình.')); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong call. |
| L11 | ` error.status = original.response?.status; ` | Gắn status vào lỗi chuẩn hóa từ response Axios; optional chaining tránh crash khi mất mạng không có response. |
| L12 | ` error.code = original.response?.data?.error?.code \|\| original.code; ` | Gắn code vào lỗi chuẩn hóa từ response Axios; optional chaining tránh crash khi mất mạng không có response. |
| L13 | ` error.details = original.response?.data?.error?.details; ` | Gắn details vào lỗi chuẩn hóa từ response Axios; optional chaining tránh crash khi mất mạng không có response. |
| L14 | ` throw error; ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong call. |
| L15 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong call. |
| L16 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong call. |
| L17 | ` return { ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong makeNotesApi. |
| L18 | ` list: (params, signal) => call('get', '/notes', undefined, { params, signal }), ` | Phương thức API list chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L19 | `` get: id => call('get', `/notes/${id}`).then(data => data.note), `` | Phương thức API get chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L20 | ` create: body => call('post', '/notes', body), ` | Phương thức API create chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L21 | `` update: (id, body) => call('patch', `/notes/${id}`, body), `` | Phương thức API update chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L22 | `` remove: (id, body) => call('delete', `/notes/${id}`, body), `` | Phương thức API remove chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L23 | `` pin: (id, body) => call('put', `/notes/${id}/pin`, body), `` | Phương thức API pin chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L24 | `` setLabels: (id, body) => call('put', `/notes/${id}/labels`, body), `` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong setLabels. |
| L25 | ` labels: () => call('get', '/labels').then(data => data.items), ` | Phương thức API labels chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L26 | ` addLabel: name => call('post', '/labels', { name }), ` | Phương thức API addLabel chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L27 | `` renameLabel: (id, name) => call('patch', `/labels/${id}`, { name }), `` | Phương thức API renameLabel chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L28 | `` deleteLabel: id => call('delete', `/labels/${id}`), `` | Phương thức API deleteLabel chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L29 | `` upload: (id, body) => call('post', `/notes/${id}/attachments`, body), `` | Phương thức API upload chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L30 | `` removeFile: (noteId, fileId, body) => call('delete', `/notes/${noteId}/attachments/${fileId}`, body), `` | Phương thức API removeFile chuyển đối số vào method/path được ghi trên dòng, rồi trả Promise từ call; người gọi await và xử lý lỗi. |
| L31 | ` async file(noteId, fileId, signal) { ` | Khai báo phương thức bất đồng bộ: trả Promise, bên gọi dùng await để lấy kết quả. |
| L32 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong file. |
| L33 | `` const response = await api.get(`/notes/${noteId}/attachments/${fileId}/content`, { headers, responseType: 'blob', signal }); `` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong file. |
| L34 | ` return response.data; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong file. |
| L35 | ` } catch (error) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong file. |
| L36 | ` const failure = new Error('Không thể tải tệp. Quyền truy cập hoặc trạng thái khóa có thể đã thay đổi.'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong file. |
| L37 | ` failure.status = error.response?.status; ` | Gán giá trị biểu thức bên phải vào failure.status. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong file. |
| L38 | ` throw failure; ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong file. |
| L39 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong file. |
| L40 | ` }, ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong file. |
| L41 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong makeNotesApi. |
| L42 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong makeNotesApi. |
| L44 | ` export const notesApi = makeNotesApi(); ` | Tạo một API client mặc định dùng Bearer token từ Axios chung và export để NoteList dùng khi không truyền client riêng. |

## frontend/src/features/notes/NoteDialog.jsx

Mã nguồn có 31 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import { useEffect, useId, useRef } from 'react'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` export default function NoteDialog({ title, children, onCancel, busy = false, wide = false }) { ` | hiển thị modal native có tiêu đề, focus và thao tác đóng. Export cho phép file khác import nó. |
| L4 | ` const ref = useRef(null); ` | Giữ tham chiếu ổn định qua render mà thay đổi current không tự render; dùng cho DOM, controller hoặc callback mới nhất. |
| L5 | ` const titleId = useId(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong NoteDialog. |
| L6 | ` useEffect(() => { ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L7 | ` const dialog = ref.current; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong useEffect. |
| L8 | ` dialog.showModal(); ` | Gọi dialog.showModal với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong useEffect. |
| L9 | ` return () => dialog.close(); ` | Trả hàm cleanup cho effect: React gọi khi dependency đổi hoặc component unmount, giúp tránh timer/listener/request bị bỏ quên. |
| L10 | ` }, []); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L11 | ` return ( ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong NoteDialog. |
| L12 | `` <dialog ref={ref} className={`note-dialog ${wide ? 'note-dialog-wide' : ''}`} aria-labelledby={titleId} `` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L13 | ` onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}> ` | Nối thao tác đóng/hủy dialog với hàm cha; pending/busy có thể chặn đóng khi tác vụ đang chạy. |
| L14 | ` <header className="d-flex justify-content-between align-items-center gap-3 mb-3"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L15 | ` <h2 id={titleId} className="h5 mb-0">{title}</h2> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L16 | ` <button type="button" className="btn btn-outline-secondary" aria-label="Đóng hộp thoại" disabled={busy} onClick={onCancel}>×</button> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L17 | ` </header> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L18 | ` {children} ` | Đặt nội dung cha truyền qua prop children vào thân dialog; cùng một vỏ dialog dùng được cho editor, quản lý nhãn và xác nhận. |
| L19 | ` </dialog> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L20 | ` ); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong NoteDialog. |
| L21 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong NoteDialog. |
| L23 | ` export function ConfirmNoteDialog({ title, message, busy, onCancel, onConfirm, confirmText = 'Xóa' }) { ` | dùng lại dialog để yêu cầu xác nhận trước thao tác phá hủy dữ liệu. Export cho phép file khác import nó. |
| L24 | ` return <NoteDialog title={title} onCancel={onCancel} busy={busy}> ` | Nối thao tác đóng/hủy dialog với hàm cha; pending/busy có thể chặn đóng khi tác vụ đang chạy. |
| L25 | ` <p>{message}</p> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L26 | ` <div className="d-flex justify-content-end gap-2"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L27 | ` <button className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>Hủy</button> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L28 | ` <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Đang xử lý…' : confirmText}</button> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L29 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L30 | ` </NoteDialog>; ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L31 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong ConfirmNoteDialog. |

## frontend/src/features/notes/LabelManager.jsx

Mã nguồn có 58 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import { useState } from 'react'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L2 | ` import NoteDialog, { ConfirmNoteDialog } from './NoteDialog'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L4 | ` export default function LabelManager({ labels, api, onChanged, onClose, notify }) { ` | quản lý form thêm/đổi tên và danh sách nhãn của user. Export cho phép file khác import nó. |
| L5 | ` const [name, setName] = useState(''); ` | Tạo state name (tên nhãn đang nhập) và hàm cập nhật setName; cập nhật qua setter khiến React render lại. |
| L6 | ` const [editing, setEditing] = useState(null); ` | Tạo state editing (ID nhãn đang đổi tên) và hàm cập nhật setEditing; cập nhật qua setter khiến React render lại. |
| L7 | ` const [deleting, setDeleting] = useState(null); ` | Tạo state deleting (đối tượng đang chờ xác nhận xóa) và hàm cập nhật setDeleting; cập nhật qua setter khiến React render lại. |
| L8 | ` const [busy, setBusy] = useState(false); ` | Tạo state busy (cờ tác vụ đang chạy để khóa input/nút) và hàm cập nhật setBusy; cập nhật qua setter khiến React render lại. |
| L9 | ` const [error, setError] = useState(''); ` | Tạo state error (thông báo lỗi thao tác) và hàm cập nhật setError; cập nhật qua setter khiến React render lại. |
| L10 | ` async function submit(event) { ` | xử lý gửi form nhãn, chặn rỗng và gọi thêm hoặc đổi tên. Export cho phép file khác import nó. |
| L11 | ` event.preventDefault(); ` | Gọi event.preventDefault với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong submit. |
| L12 | ` if (!name.trim()) return setError('Tên nhãn không được để trống.'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong submit. |
| L13 | ` setBusy(true); setError(''); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong submit. |
| L14 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong submit. |
| L15 | ` if (editing) await api.renameLabel(editing, name.trim()); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong submit. |
| L16 | ` else await api.addLabel(name.trim()); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong submit. |
| L17 | ` setName(''); setEditing(null); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong submit. |
| L18 | ` await onChanged(); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong submit. |
| L19 | ` notify('Đã cập nhật nhãn.'); ` | Gọi notify với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong submit. |
| L20 | ` } catch (failure) { setError(failure.message); } ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong submit. |
| L21 | ` finally { setBusy(false); } ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L22 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong submit. |
| L23 | ` async function remove() { ` | thực hiện xóa đã xác nhận rồi cập nhật danh sách. Export cho phép file khác import nó. |
| L24 | ` setBusy(true); setError(''); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong remove. |
| L25 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong remove. |
| L26 | ` await api.deleteLabel(deleting.id); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong remove. |
| L27 | ` if (editing === deleting.id) { setEditing(null); setName(''); } ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong remove. |
| L28 | ` setDeleting(null); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong remove. |
| L29 | ` await onChanged(); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong remove. |
| L30 | ` notify('Đã xóa nhãn. Các ghi chú vẫn được giữ nguyên.'); ` | Gọi notify với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong remove. |
| L31 | ` } catch (failure) { setError(failure.message); setDeleting(null); } ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong remove. |
| L32 | ` finally { setBusy(false); } ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L33 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong remove. |
| L34 | ` return <> ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong LabelManager. |
| L35 | ` <NoteDialog title="Quản lý nhãn" onCancel={onClose} busy={busy}> ` | Nối thao tác đóng/hủy dialog với hàm cha; pending/busy có thể chặn đóng khi tác vụ đang chạy. |
| L36 | ` {error && <p role="alert" className="alert alert-danger">{error}</p>} ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L37 | ` <form onSubmit={submit} className="mb-3"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L38 | ` <label htmlFor="label-name" className="form-label">{editing ? 'Đổi tên nhãn' : 'Thêm nhãn'}</label> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L39 | ` <div className="d-flex gap-2"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L40 | ` <input id="label-name" className="form-control" value={name} maxLength={50} onChange={event => setName(event.target.value)} required disabled={busy} autoFocus /> ` | Khai báo control có value/checked từ state và event onChange để cập nhật state; không sửa DOM trực tiếp. |
| L41 | ` <button className="btn btn-primary" disabled={busy}>{editing ? 'Đổi tên' : 'Thêm'}</button> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L42 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L43 | ` {editing && <button type="button" className="btn btn-link" onClick={() => { setEditing(null); setName(''); }}>Hủy đổi tên</button>} ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L44 | ` </form> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L45 | ` {!labels.length && <p className="text-body-secondary">Bạn chưa có nhãn nào.</p>} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L46 | ` <ul className="list-group"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L47 | ` {labels.map(label => <li key={label.id} className="list-group-item d-flex justify-content-between gap-2 align-items-center"> ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong labels.map(). |
| L48 | ` <span className="note-title">{label.name}</span> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L49 | ` <span className="d-flex gap-1"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L50 | ` <button className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => { setEditing(label.id); setName(label.name); }}>Đổi tên</button> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L51 | ` <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => setDeleting(label)}>Xóa</button> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L52 | ` </span> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L53 | ` </li>)} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L54 | ` </ul> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L55 | ` </NoteDialog> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L56 | `` {deleting && <ConfirmNoteDialog title="Xóa nhãn?" message={`Xóa nhãn “${deleting.name}”? Các ghi chú không bị xóa.`} busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove} />} `` | Nối thao tác đóng/hủy dialog với hàm cha; pending/busy có thể chặn đóng khi tác vụ đang chạy. |
| L57 | ` </>; ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L58 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong LabelManager. |

## frontend/src/features/notes/NoteList.jsx

Mã nguồn có 137 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import { useCallback, useEffect, useState } from 'react'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L2 | ` import { notesApi } from './notes.api'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` import { useNotesSearch } from './NotesSearchContext'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L4 | ` import NoteCard from './NoteCard'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L5 | ` import NoteEditor from './NoteEditor'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L6 | ` import LabelManager from './LabelManager'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L7 | ` import { ConfirmNoteDialog } from './NoteDialog'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L8 | ` import './notes.css'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L10 | ` export default function NoteList({ api = notesApi, preferences = {} }) { ` | điều phối danh sách, search, label filter, phân trang và editor. Export cho phép file khác import nó. |
| L11 | ` const { query, setQuery } = useNotesSearch(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong NoteList. |
| L12 | ` const [debounced, setDebounced] = useState(query); ` | Tạo state debounced (từ khóa đã chờ300ms để gọi API) và hàm cập nhật setDebounced; cập nhật qua setter khiến React render lại. |
| L13 | ` const [view, setView] = useState('grid'); ` | Tạo state view (chế độ grid/list, khởi đầu grid) và hàm cập nhật setView; cập nhật qua setter khiến React render lại. |
| L14 | ` const [items, setItems] = useState([]); ` | Tạo state items (các note của trang hiện tại) và hàm cập nhật setItems; cập nhật qua setter khiến React render lại. |
| L15 | ` const [labels, setLabels] = useState([]); ` | Tạo state labels (danh sách nhãn của user) và hàm cập nhật setLabels; cập nhật qua setter khiến React render lại. |
| L16 | ` const [filters, setFilters] = useState([]); ` | Tạo state filters (các label IDs đang được chọn) và hàm cập nhật setFilters; cập nhật qua setter khiến React render lại. |
| L17 | ` const [page, setPage] = useState(1); ` | Tạo state page (số trang hiện tại) và hàm cập nhật setPage; cập nhật qua setter khiến React render lại. |
| L18 | ` const [meta, setMeta] = useState({ total: 0, has_more: false }); ` | Tạo state meta (total/has_more từ backend) và hàm cập nhật setMeta; cập nhật qua setter khiến React render lại. |
| L19 | ` const [revision, setRevision] = useState(0); ` | Tạo state revision (bộ đếm thay đổi để effect tải lại dữ liệu) và hàm cập nhật setRevision; cập nhật qua setter khiến React render lại. |
| L20 | ` const [loading, setLoading] = useState(true); ` | Tạo state loading (trạng thái đang tải danh sách) và hàm cập nhật setLoading; cập nhật qua setter khiến React render lại. |
| L21 | ` const [error, setError] = useState(''); ` | Tạo state error (thông báo lỗi thao tác) và hàm cập nhật setError; cập nhật qua setter khiến React render lại. |
| L22 | ` const [notice, setNotice] = useState(null); ` | Tạo state notice (phản hồi thành công/cảnh báo/lỗi) và hàm cập nhật setNotice; cập nhật qua setter khiến React render lại. |
| L23 | ` const [editor, setEditor] = useState(null); ` | Tạo state editor (note và key ổn định của editor đang mở) và hàm cập nhật setEditor; cập nhật qua setter khiến React render lại. |
| L24 | ` const [manager, setManager] = useState(false); ` | Tạo state manager (cờ mở dialog quản lý nhãn) và hàm cập nhật setManager; cập nhật qua setter khiến React render lại. |
| L25 | ` const [deleting, setDeleting] = useState(null); ` | Tạo state deleting (đối tượng đang chờ xác nhận xóa) và hàm cập nhật setDeleting; cập nhật qua setter khiến React render lại. |
| L26 | ` const [pending, setPending] = useState(false); ` | Tạo state pending (cờ chặn bấm lặp trong request) và hàm cập nhật setPending; cập nhật qua setter khiến React render lại. |
| L27 | ` const refresh = useCallback(() => setRevision(value => value + 1), []); ` | Giữ tham chiếu hàm ổn định theo dependency, tránh effect chạy lại chỉ vì tạo hàm mới sau mỗi render. |
| L28 | ` const notify = useCallback((message, type = 'success') => setNotice({ message, type }), []); ` | Giữ tham chiếu hàm ổn định theo dependency, tránh effect chạy lại chỉ vì tạo hàm mới sau mỗi render. |
| L29 | ` const filterKey = filters.slice().sort((a, b) => a - b).join(','); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong undefined.sort(). |
| L31 | ` useEffect(() => { ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L32 | ` const timer = setTimeout(() => setDebounced(query), 300); ` | Tạo/hủy timer. Debounce thay timer cũ khi gõ; các timer cleanup/download có mục đích ghi trong hàm bao quanh. Trong setTimeout. |
| L33 | ` return () => clearTimeout(timer); ` | Trả hàm cleanup cho effect: React gọi khi dependency đổi hoặc component unmount, giúp tránh timer/listener/request bị bỏ quên. |
| L34 | ` }, [query]); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L35 | ` useEffect(() => { setPage(1); }, [debounced, filterKey]); ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L36 | ` useEffect(() => { ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L37 | ` const abort = new AbortController(); ` | Quản lý hủy request cũ và ngăn response cũ cập nhật UI khi filter đổi hoặc component đã đóng. |
| L38 | ` setLoading(true); setError(''); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong useEffect. |
| L39 | ` api.list({ q: debounced, label_ids: filterKey \|\| undefined, page, limit: 20 }, abort.signal) ` | Quản lý hủy request cũ và ngăn response cũ cập nhật UI khi filter đổi hoặc component đã đóng. |
| L40 | ` .then(result => { if (!abort.signal.aborted) { setItems(result.items); setMeta(result.meta); } }) ` | Quản lý hủy request cũ và ngăn response cũ cập nhật UI khi filter đổi hoặc component đã đóng. |
| L41 | ` .catch(failure => { if (!abort.signal.aborted) setError(failure.message); }) ` | Quản lý hủy request cũ và ngăn response cũ cập nhật UI khi filter đổi hoặc component đã đóng. |
| L42 | ` .finally(() => { if (!abort.signal.aborted) setLoading(false); }); ` | Quản lý hủy request cũ và ngăn response cũ cập nhật UI khi filter đổi hoặc component đã đóng. |
| L43 | ` return () => abort.abort(); ` | Trả hàm cleanup cho effect: React gọi khi dependency đổi hoặc component unmount, giúp tránh timer/listener/request bị bỏ quên. |
| L44 | ` }, [api, debounced, filterKey, page, revision]); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L46 | ` const reloadLabels = useCallback(async () => { ` | Giữ tham chiếu hàm ổn định theo dependency, tránh effect chạy lại chỉ vì tạo hàm mới sau mỗi render. |
| L47 | ` const current = await api.labels(); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong useCallback. |
| L48 | ` setLabels(current); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong useCallback. |
| L49 | ` setFilters(previous => previous.filter(id => current.some(label => label.id === id))); ` | Giữ các phần tử thỏa điều kiện mà không sửa mảng gốc, ví dụ lọc ID/icon cần hiển thị. Trong setFilters. |
| L50 | ` refresh(); ` | Gọi refresh với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong useCallback. |
| L51 | ` }, [api, refresh]); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L52 | ` useEffect(() => { ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L53 | ` let active = true; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong useEffect. |
| L54 | ` api.labels().then(result => { if (active) setLabels(result); }).catch(failure => { if (active) notify(failure.message, 'danger'); }); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong undefined.then(). |
| L55 | ` return () => { active = false; }; ` | Trả hàm cleanup cho effect: React gọi khi dependency đổi hoặc component unmount, giúp tránh timer/listener/request bị bỏ quên. |
| L56 | ` }, [api, notify]); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L57 | ` useEffect(() => { ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L58 | ` window.addEventListener('notes:changed', refresh); ` | Đăng ký hoặc tháo listener cho event ghi trên dòng; cleanup dùng cùng tham chiếu hàm để tránh chạy lặp. |
| L59 | ` return () => window.removeEventListener('notes:changed', refresh); ` | Trả hàm cleanup cho effect: React gọi khi dependency đổi hoặc component unmount, giúp tránh timer/listener/request bị bỏ quên. |
| L60 | ` }, [refresh]); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L61 | ` useEffect(() => { ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L62 | ` if (page > 1 && !loading && !error && !items.length) setPage(value => Math.max(1, value - 1)); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong setPage. |
| L63 | ` }, [page, loading, error, items.length]); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L65 | ` function unlockRequest(note, action, onUnlocked) { ` | gửi yêu cầu mở khóa tới điểm nối TV3; không tự vượt quyền backend. Export cho phép file khác import nó. |
| L66 | ` window.dispatchEvent(new CustomEvent('notes:unlock-request', { detail: { noteId: note.id, action, onUnlocked } })); ` | Phát sự kiện nội bộ để module khác tích hợp; event không cấp quyền và không thay kiểm tra backend. |
| L67 | ` notify('Bạn cần mở khóa ghi chú trước khi thực hiện thao tác này.', 'warning'); ` | Gọi notify với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong unlockRequest. |
| L68 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong unlockRequest. |
| L69 | ` async function open(note) { ` | tải detail có kiểm quyền rồi mở editor;423 chuyển sang yêu cầu unlock. Export cho phép file khác import nó. |
| L70 | ` setPending(true); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong open. |
| L71 | ` try { setEditor({ key: crypto.randomUUID(), note: await api.get(note.id) }); } ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong open. |
| L72 | ` catch (failure) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong open. |
| L73 | ` if (failure.status === 423) unlockRequest(note, 'read', () => open(note)); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong unlockRequest. |
| L74 | ` else notify(failure.message, 'danger'); ` | Nếu lỗi không thuộc nhánh unlock phía trên, hiện message của lỗi với kiểu danger để người dùng biết thao tác thất bại. |
| L75 | ` } finally { setPending(false); } ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L76 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong open. |
| L77 | ` async function pin(note) { ` | gửi pin/unpin kèm version và mã thao tác rồi tải lại danh sách. Export cho phép file khác import nó. |
| L78 | ` setPending(true); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong pin. |
| L79 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong pin. |
| L80 | ` await api.pin(note.id, { pinned: !note.is_pinned, base_version: note.version, operation_id: crypto.randomUUID() }); ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong pin. |
| L81 | ` refresh(); notify(note.is_pinned ? 'Đã bỏ ghim.' : 'Đã ghim ghi chú.'); ` | Gọi refresh với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong pin. |
| L82 | ` } catch (failure) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong pin. |
| L83 | ` if (failure.status === 423) unlockRequest(note, 'pin', () => pin(note)); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong unlockRequest. |
| L84 | ` else notify(failure.message, 'danger'); ` | Nếu lỗi không thuộc nhánh unlock phía trên, hiện message của lỗi với kiểu danger để người dùng biết thao tác thất bại. |
| L85 | ` refresh(); ` | Gọi refresh với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong pin. |
| L86 | ` } finally { setPending(false); } ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L87 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong pin. |
| L88 | ` async function remove() { ` | thực hiện xóa đã xác nhận rồi cập nhật danh sách. Export cho phép file khác import nó. |
| L89 | ` const note = deleting; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong remove. |
| L90 | ` setPending(true); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong remove. |
| L91 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong remove. |
| L92 | ` await api.remove(note.id, { base_version: note.version, operation_id: crypto.randomUUID() }); ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong remove. |
| L93 | ` setDeleting(null); refresh(); notify('Đã xóa ghi chú.'); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong remove. |
| L94 | ` } catch (failure) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong remove. |
| L95 | ` setDeleting(null); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong remove. |
| L96 | ` if (failure.status === 423) unlockRequest(note, 'delete', () => setDeleting(note)); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong unlockRequest. |
| L97 | ` else notify(failure.message, 'danger'); ` | Nếu lỗi không thuộc nhánh unlock phía trên, hiện message của lỗi với kiểu danger để người dùng biết thao tác thất bại. |
| L98 | ` refresh(); ` | Gọi refresh với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong remove. |
| L99 | ` } finally { setPending(false); } ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L100 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong remove. |
| L102 | ` const fontSize = { small: 14, medium: 16, large: 20 }[preferences.font_size] \|\| Number(preferences.font_size) \|\| 16; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong NoteList. |
| L103 | `` return <section className="notes-page" style={{ '--note-font-size': `${fontSize}px`, '--note-color': preferences.note_color \|\| 'var(--bs-body-bg)' }}> `` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L104 | ` <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L105 | ` <div><h1 className="h4 fw-bold mb-1">Ghi chú của tôi</h1><p className="text-body-secondary small mb-0">{meta.total} ghi chú · Ghim trước, cập nhật gần nhất ở trên.</p></div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L106 | ` <div className="d-flex flex-wrap gap-2"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L107 | ` <div className="btn-group" role="group" aria-label="Chế độ hiển thị"> ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L108 | `` <button className={`btn btn-outline-secondary ${view === 'grid' ? 'active' : ''}`} aria-label="Dạng lưới" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><i className="bi bi-grid" aria-hidden="true" /></button> `` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L109 | `` <button className={`btn btn-outline-secondary ${view === 'list' ? 'active' : ''}`} aria-label="Dạng danh sách" aria-pressed={view === 'list'} onClick={() => setView('list')}><i className="bi bi-list-ul" aria-hidden="true" /></button> `` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L110 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L111 | ` <button className="btn btn-outline-secondary" onClick={() => setManager(true)}>Quản lý nhãn</button> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L112 | ` <button className="btn btn-primary" disabled={pending} onClick={() => setEditor({ key: crypto.randomUUID(), note: null })}>Thêm ghi chú</button> ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. |
| L113 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L114 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L115 | ` <div className="mb-3 d-sm-none"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L116 | ` <label htmlFor="mobile-note-search" className="form-label">Tìm tiêu đề hoặc nội dung</label> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L117 | ` <input id="mobile-note-search" type="search" className="form-control" value={query} maxLength={200} onChange={event => setQuery(event.target.value)} placeholder="Nhập để tìm kiếm…" /> ` | Khai báo control có value/checked từ state và event onChange để cập nhật state; không sửa DOM trực tiếp. |
| L118 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L119 | `` {notice && <div className={`alert alert-${notice.type} d-flex justify-content-between gap-3`} role={notice.type === 'danger' ? 'alert' : 'status'}><span>{notice.message}</span><button className="btn-close" aria-label="Đóng thông báo" onClick={() => setNotice(null)} /></div>} `` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L120 | ` <fieldset className="note-filters mb-3"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L121 | ` <legend className="h6 mb-2">Lọc theo nhãn <span className="text-body-secondary fw-normal small">— khớp ít nhất một nhãn</span></legend> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L122 | ` <div className="d-flex flex-wrap gap-2"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L123 | ` {!labels.length && <span className="small text-body-secondary">Chưa có nhãn.</span>} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L124 | ` {labels.map(label => <label key={label.id} className="note-label-option"><input type="checkbox" checked={filters.includes(label.id)} onChange={event => setFilters(current => event.target.checked ? [...current, label.id] : current.filter(id => id !== label.id))} /> {label.name}</label>)} ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong labels.map(). |
| L125 | ` {(filters.length > 0 \|\| query) && <button className="btn btn-sm btn-outline-secondary" onClick={() => { setFilters([]); setQuery(''); }}>Xóa bộ lọc</button>} ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L126 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L127 | ` </fieldset> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L128 | ` {error ? <div className="alert alert-danger" role="alert"><p>{error}</p><button className="btn btn-outline-danger" onClick={refresh}>Thử tải lại</button></div> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L129 | ` : loading ? <p role="status" className="notes-empty"><span className="spinner-border spinner-border-sm me-2" />Đang tải ghi chú…</p> ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L130 | ` : !items.length ? <div className="notes-empty"><i className="bi bi-journal-text display-5" aria-hidden="true" /><h2 className="h5 mt-3">{debounced \|\| filters.length ? 'Không có kết quả' : 'Chưa có ghi chú'}</h2><p>{debounced \|\| filters.length ? 'Thử từ khóa hoặc nhãn khác.' : 'Tạo ghi chú đầu tiên bằng nút Thêm ghi chú.'}</p></div> ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L131 | ` : <div className={view === 'grid' ? 'notes-grid' : 'notes-list'}>{items.map(note => <NoteCard key={note.id} note={note} list={view === 'list'} onOpen={open} onPin={pin} onDelete={setDeleting} pending={pending} />)}</div>} ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong items.map(). |
| L132 | ` {!error && !loading && (page > 1 \|\| meta.has_more) && <nav aria-label="Phân trang ghi chú" className="d-flex justify-content-center align-items-center gap-3 mt-4"><button className="btn btn-outline-secondary" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Trước</button><span>Trang {page}</span><button className="btn btn-outline-secondary" disabled={!meta.has_more} onClick={() => setPage(value => value + 1)}>Sau</button></nav>} ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L133 | ` {editor && <NoteEditor key={editor.key} initialNote={editor.note} api={api} labels={labels} onSaved={refresh} onClose={() => { setEditor(null); refresh(); }} notify={notify} />} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L134 | ` {manager && <LabelManager labels={labels} api={api} onChanged={reloadLabels} onClose={() => setManager(false)} notify={notify} />} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L135 | `` {deleting && <ConfirmNoteDialog title="Xóa ghi chú?" message={`Xóa vĩnh viễn “${deleting.title}”? Thao tác này không thể hoàn tác.`} busy={pending} onCancel={() => setDeleting(null)} onConfirm={remove} />} `` | Nối thao tác đóng/hủy dialog với hàm cha; pending/busy có thể chặn đóng khi tác vụ đang chạy. |
| L136 | ` </section>; ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L137 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong NoteList. |

## frontend/src/features/notes/NoteEditor.jsx

Mã nguồn có 132 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import { useEffect, useRef, useState } from 'react'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L2 | ` import { AutosaveSession, validDraft } from './autosave'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` import NoteDialog, { ConfirmNoteDialog } from './NoteDialog'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L4 | ` import AttachmentPanel from './AttachmentPanel'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L5 | ` import NoteStatusIcons from './NoteStatusIcons'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L7 | ` const STATUS = { empty: 'Nhập tiêu đề và nội dung', invalid: 'Chưa lưu: cần đủ tiêu đề và nội dung hợp lệ', dirty: 'Chờ tự lưu…', saving: 'Đang lưu…', saved: 'Đã lưu', error: 'Lỗi lưu', conflict: 'Có xung đột — cần kiểm tra' }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L9 | ` export default function NoteEditor({ initialNote, api, labels, onSaved, onClose, notify }) { ` | quản lý cùng một editor cho thêm/sửa, trạng thái lưu và metadata. Export cho phép file khác import nó. |
| L10 | ` const session = useRef(null); ` | Giữ tham chiếu ổn định qua render mà thay đổi current không tự render; dùng cho DOM, controller hoặc callback mới nhất. |
| L11 | ` const callbacks = useRef({ onSaved, onClose, notify }); ` | Giữ tham chiếu ổn định qua render mà thay đổi current không tự render; dùng cho DOM, controller hoặc callback mới nhất. |
| L12 | ` callbacks.current = { onSaved, onClose, notify }; ` | Cập nhật tham chiếu callbacks.current; callback có thể đọc giá trị mới nhất mà không tạo lại controller hay làm mất draft. |
| L13 | ` const [state, setState] = useState({ title: initialNote?.title \|\| '', content: initialNote?.content \|\| '', note: initialNote, status: initialNote ? 'saved' : 'empty', dirty: false }); ` | Tạo state state (snapshot editor/autosave để render title/content/note/status) và hàm cập nhật setState; cập nhật qua setter khiến React render lại. |
| L14 | ` const [busy, setBusy] = useState(false); ` | Tạo state busy (cờ tác vụ đang chạy để khóa input/nút) và hàm cập nhật setBusy; cập nhật qua setter khiến React render lại. |
| L15 | ` const [error, setError] = useState(''); ` | Tạo state error (thông báo lỗi thao tác) và hàm cập nhật setError; cập nhật qua setter khiến React render lại. |
| L16 | ` const [confirm, setConfirm] = useState(null); ` | Tạo state confirm (loại xác nhận bỏ draft hoặc xóa file) và hàm cập nhật setConfirm; cập nhật qua setter khiến React render lại. |
| L17 | ` const readOnly = state.note?.access?.can_edit === false; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong NoteEditor. |
| L19 | ` useEffect(() => { ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L20 | ` // Construct inside the effect so React StrictMode cleanup cannot permanently dispose it. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L21 | ` const controller = new AutosaveSession({ note: initialNote, api, onChange: setState, ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong useEffect. |
| L22 | ` onSaved: note => callbacks.current.onSaved(note), ` | Thuộc tính onSaved: callback sau save thành công. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong onSaved. |
| L23 | ` onAccessLost: failure => { ` | Thuộc tính onAccessLost: callback khi không còn quyền. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong onAccessLost. |
| L24 | ` callbacks.current.notify(failure.message, 'danger'); ` | Gọi callbacks.current.notify với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong onAccessLost. |
| L25 | ` callbacks.current.onClose(); ` | Gọi callbacks.current.onClose với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong onAccessLost. |
| L26 | ` }, ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong onAccessLost. |
| L27 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong useEffect. |
| L28 | ` session.current = controller; ` | Cập nhật tham chiếu session.current; callback có thể đọc giá trị mới nhất mà không tạo lại controller hay làm mất draft. |
| L29 | ` setState(controller.snapshot()); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong useEffect. |
| L30 | ` const beforeUnload = event => { if (controller.snapshot().dirty) { event.preventDefault(); event.returnValue = ''; } }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong beforeUnload. |
| L31 | ` const online = () => { if (controller.status === 'error') controller.save(); }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong online. |
| L32 | ` const remote = async event => { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong remote. |
| L33 | ` const change = event.detail \|\| {}; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong remote. |
| L34 | ` if (Number(change.note_id ?? change.noteId) !== controller.note?.id) return; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong remote. |
| L35 | ` if (['deleted', 'locked', 'revoked'].includes(change.kind)) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong remote. |
| L36 | ` callbacks.current.notify('Quyền truy cập hoặc trạng thái ghi chú đã thay đổi.', 'warning'); ` | Gọi callbacks.current.notify với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong remote. |
| L37 | ` return callbacks.current.onClose(); ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong remote. |
| L38 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong remote. |
| L39 | ` try { controller.receiveRemote(await api.get(controller.note.id), change.operation_id ?? change.operationId); } ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong remote. |
| L40 | ` catch (failure) { callbacks.current.notify(failure.message, 'danger'); if ([401, 403, 404, 423].includes(failure.status)) callbacks.current.onClose(); } ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong remote. |
| L41 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong remote. |
| L42 | ` window.addEventListener('beforeunload', beforeUnload); ` | Đăng ký hoặc tháo listener cho event ghi trên dòng; cleanup dùng cùng tham chiếu hàm để tránh chạy lặp. |
| L43 | ` window.addEventListener('online', online); ` | Đăng ký hoặc tháo listener cho event ghi trên dòng; cleanup dùng cùng tham chiếu hàm để tránh chạy lặp. |
| L44 | ` window.addEventListener('notes:changed', remote); ` | Đăng ký hoặc tháo listener cho event ghi trên dòng; cleanup dùng cùng tham chiếu hàm để tránh chạy lặp. |
| L45 | ` return () => { ` | Trả hàm cleanup cho effect: React gọi khi dependency đổi hoặc component unmount, giúp tránh timer/listener/request bị bỏ quên. |
| L46 | ` controller.dispose(); ` | Gọi controller.dispose với các đối số trên dòng: hủy timer và ngăn cập nhật state sau khi editor unmount. |
| L47 | ` window.removeEventListener('beforeunload', beforeUnload); ` | Đăng ký hoặc tháo listener cho event ghi trên dòng; cleanup dùng cùng tham chiếu hàm để tránh chạy lặp. |
| L48 | ` window.removeEventListener('online', online); ` | Đăng ký hoặc tháo listener cho event ghi trên dòng; cleanup dùng cùng tham chiếu hàm để tránh chạy lặp. |
| L49 | ` window.removeEventListener('notes:changed', remote); ` | Đăng ký hoặc tháo listener cho event ghi trên dòng; cleanup dùng cùng tham chiếu hàm để tránh chạy lặp. |
| L50 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L51 | ` }, [api]); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L53 | ` async function close() { ` | flush dữ liệu trước khi đóng; nếu chưa lưu được thì xin xác nhận bỏ draft. Export cho phép file khác import nó. |
| L54 | ` setBusy(true); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong close. |
| L55 | ` const saved = await session.current.flush(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong close. |
| L56 | ` setBusy(false); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong close. |
| L57 | ` if (saved) onClose(); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong close. |
| L58 | ` else setConfirm({ kind: 'discard' }); ` | Khi flush chưa lưu được, mở xác nhận bỏ draft; chưa đóng editor và chưa xóa chữ người dùng đang nhập. |
| L59 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong close. |
| L61 | ` async function metadata(action) { ` | lưu hết text trước, rồi sửa label/file trên đúng version mới nhất. Export cho phép file khác import nó. |
| L62 | ` setBusy(true); setError(''); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong metadata. |
| L63 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong metadata. |
| L64 | ` const saved = await session.current.flush(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong metadata. |
| L65 | ` if (!saved?.id) throw new Error('Hãy nhập đủ tiêu đề/nội dung và xử lý lỗi lưu trước.'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong metadata. |
| L66 | ` const result = await action(saved, { base_version: saved.version, operation_id: crypto.randomUUID() }); ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong metadata. |
| L67 | ` session.current.accept(result.note); ` | Gọi session.current.accept với các đối số trên dòng: nhận snapshot server đã được chấp nhận và đánh draft hiện tại sạch. Trong metadata. |
| L68 | ` onSaved(result.note); ` | Gọi onSaved với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong metadata. |
| L69 | ` } catch (failure) { setError(failure.message); } ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong metadata. |
| L70 | ` finally { setBusy(false); } ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L71 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong metadata. |
| L73 | ` async function changeLabel(labelId, checked) { ` | tạo tập label IDs mới và gọi endpoint replace labels. Export cho phép file khác import nó. |
| L74 | ` const ids = new Set((session.current.note?.labels \|\| []).map(label => label.id)); ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong undefined.map(). |
| L75 | ` if (checked) ids.add(labelId); else ids.delete(labelId); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong changeLabel. |
| L76 | ` await metadata((note, body) => api.setLabels(note.id, { ...body, label_ids: [...ids] })); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong metadata. |
| L77 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong changeLabel. |
| L79 | ` async function upload(files) { ` | đóng gói files và thông tin version/operation thành multipart FormData. Export cho phép file khác import nó. |
| L80 | ` await metadata((note, body) => { ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong metadata. |
| L81 | ` const form = new FormData(); ` | Chuẩn bị multipart payload gồm files, base_version và operation_id; browser tự tạo boundary, không tự hardcode Content-Type. |
| L82 | ` form.append('base_version', body.base_version); ` | Chuẩn bị multipart payload gồm files, base_version và operation_id; browser tự tạo boundary, không tự hardcode Content-Type. |
| L83 | ` form.append('operation_id', body.operation_id); ` | Chuẩn bị multipart payload gồm files, base_version và operation_id; browser tự tạo boundary, không tự hardcode Content-Type. |
| L84 | ` files.forEach(file => form.append('files', file)); ` | Chuẩn bị multipart payload gồm files, base_version và operation_id; browser tự tạo boundary, không tự hardcode Content-Type. |
| L85 | ` return api.upload(note.id, form); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong metadata. |
| L86 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong metadata. |
| L87 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong upload. |
| L89 | ` return <> ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong NoteEditor. |
| L90 | ` <NoteDialog title={initialNote ? 'Ghi chú' : 'Ghi chú mới'} onCancel={close} busy={busy} wide> ` | Nối thao tác đóng/hủy dialog với hàm cha; pending/busy có thể chặn đóng khi tác vụ đang chạy. |
| L91 | ` <div className="d-flex justify-content-between flex-wrap gap-2 mb-3"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L92 | ` <span role="status" aria-live="polite" className={['error', 'conflict', 'invalid'].includes(state.status) ? 'text-danger' : 'text-body-secondary'}>{STATUS[state.status]}</span> ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L93 | ` {state.note && <NoteStatusIcons note={state.note} />} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L94 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L95 | ` {(error \|\| state.message) && <p role="alert" className="alert alert-danger">{error \|\| state.message}</p>} ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L96 | ` {readOnly && <p className="alert alert-info">Bạn có quyền chỉ đọc.</p>} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L97 | ` <label htmlFor="note-title" className="form-label">Tiêu đề <span aria-hidden="true">*</span></label> ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L98 | ` <input id="note-title" className="form-control mb-3" autoFocus value={state.title} maxLength={200} required readOnly={readOnly} disabled={busy} onChange={event => session.current.change('title', event.target.value)} /> ` | Khai báo control có value/checked từ state và event onChange để cập nhật state; không sửa DOM trực tiếp. |
| L99 | ` <label htmlFor="note-content" className="form-label">Nội dung <span aria-hidden="true">*</span></label> ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L100 | ` <textarea id="note-content" className="form-control note-content" rows={8} value={state.content} maxLength={20000} required readOnly={readOnly} disabled={busy} onChange={event => session.current.change('content', event.target.value)} /> ` | Khai báo control có value/checked từ state và event onChange để cập nhật state; không sửa DOM trực tiếp. |
| L101 | ` <small className="text-body-secondary">{[...state.content].length.toLocaleString('vi-VN')} / 20.000 ký tự · Tự lưu sau khi ngừng gõ.</small> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L102 | ` {state.status === 'error' && !readOnly && <button className="btn btn-outline-danger d-block mt-2" onClick={() => session.current.save()} disabled={busy \|\| !validDraft(state)}>Thử lưu lại</button>} ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L103 | ` {state.remote && <section className="alert alert-warning mt-3" aria-label="Giải quyết xung đột"> ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L104 | ` <p>Server có phiên bản {state.remote.version}. Bản bạn đang nhập vẫn được giữ ở trên.</p> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L105 | ` <details><summary>Xem bản server</summary><strong>{state.remote.title}</strong><p className="note-preview-full">{state.remote.content}</p></details> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L106 | ` <div className="d-flex flex-wrap gap-2 mt-2"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L107 | ` <button className="btn btn-outline-secondary" onClick={() => session.current.resolve('server')}>Dùng bản server</button> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L108 | ` <button className="btn btn-warning" onClick={() => session.current.resolve('mine')}>Áp dụng bản của tôi</button> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L109 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L110 | ` </section>} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L111 | ` {state.note?.access.can_manage && <fieldset className="mt-3" disabled={busy \|\| Boolean(state.remote)}> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L112 | ` <legend className="h6">Nhãn <span className="fw-normal text-body-secondary">(tùy chọn)</span></legend> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L113 | ` {!labels.length && <p className="small text-body-secondary">Tạo nhãn ở trang danh sách để sử dụng.</p>} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L114 | ` <div className="d-flex flex-wrap gap-2">{labels.map(label => <label key={label.id} className="note-label-option"> ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong labels.map(). |
| L115 | ` <input type="checkbox" checked={state.note.labels.some(item => item.id === label.id)} onChange={event => changeLabel(label.id, event.target.checked)} /> {label.name} ` | Khai báo control có value/checked từ state và event onChange để cập nhật state; không sửa DOM trực tiếp. |
| L116 | ` </label>)}</div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L117 | ` </fieldset>} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L118 | ` <AttachmentPanel api={api} note={state.note} readOnly={readOnly} busy={busy \|\| Boolean(state.remote)} onUpload={upload} onDelete={file => setConfirm({ kind: 'file', file })} onError={setError} /> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L119 | ` <div className="d-flex justify-content-end mt-3"><button className="btn btn-outline-secondary" onClick={close} disabled={busy}>Đóng</button></div> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L120 | ` </NoteDialog> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L121 | ` {confirm && <ConfirmNoteDialog ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L122 | ` title={confirm.kind === 'discard' ? 'Bản đang nhập chưa được lưu' : 'Xóa tệp đính kèm?'} ` | Gán giá trị biểu thức bên phải vào title. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong NoteEditor. |
| L123 | `` message={confirm.kind === 'discard' ? 'Đóng và bỏ các thay đổi chưa lưu? Bạn có thể hủy để tiếp tục sửa hoặc thử lại.' : `Xóa “${confirm.file.original_name}”?`} `` | Gán giá trị biểu thức bên phải vào message. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong NoteEditor. |
| L124 | ` confirmText={confirm.kind === 'discard' ? 'Bỏ thay đổi và đóng' : 'Xóa tệp'} busy={busy} ` | Gán giá trị biểu thức bên phải vào confirmText. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong NoteEditor. |
| L125 | ` onCancel={() => setConfirm(null)} onConfirm={async () => { ` | Nối thao tác đóng/hủy dialog với hàm cha; pending/busy có thể chặn đóng khi tác vụ đang chạy. |
| L126 | ` if (confirm.kind === 'discard') return onClose(); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L127 | ` const file = confirm.file; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L128 | ` setConfirm(null); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. |
| L129 | ` await metadata((note, body) => api.removeFile(note.id, file.id, body)); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong metadata. |
| L130 | ` }} />} ` | Đóng object/callback, lời gọi hàm hoặc component JSX đang mở ở trên; ghép từng dấu với cấu trúc tương ứng, không thêm thao tác dữ liệu. |
| L131 | ` </>; ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L132 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong NoteEditor. |

## frontend/src/features/notes/autosave.js

Mã nguồn có 144 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` export function validDraft(draft) { ` | kiểm tra title/content khác whitespace và đúng giới hạn độ dài. Export cho phép file khác import nó. |
| L2 | ` return Boolean(draft.title.trim() && draft.content.trim() && [...draft.title].length <= 200 && [...draft.content].length <= 20000); ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong validDraft. |
| L3 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong validDraft. |
| L5 | ` export class AutosaveSession { ` | Khai báo hàm/component/lớp để dùng trong các dòng phía dưới. Export cho phép file khác import nó. |
| L6 | ` constructor({ note, api, onChange, onSaved, onAccessLost, delay = 700 }) { ` | khởi tạo state machine autosave, draft, generation và UUID tạo note. |
| L7 | ` Object.assign(this, { api, onChange, onSaved, onAccessLost, delay }); ` | Gọi Object.assign với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong constructor. |
| L8 | ` this.note = note \|\| null; ` | Theo dõi note/ID/version hiện hành từ server làm cơ sở cho request tiếp theo. |
| L9 | ` this.draft = { title: note?.title \|\| '', content: note?.content \|\| '' }; ` | Đọc hoặc thay draft trong RAM của editor; dữ liệu chỉ vào DB khi request được backend chấp nhận. |
| L10 | ` this.generation = 0; ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L11 | ` this.savedGeneration = 0; ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L12 | ` this.status = note ? 'saved' : 'empty'; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L13 | ` this.message = ''; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L14 | ` this.createId = crypto.randomUUID(); ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong constructor. |
| L15 | ` this.disposed = false; ` | Gán giá trị biểu thức bên phải vào this.disposed. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong constructor. |
| L16 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong constructor. |
| L18 | ` snapshot() { ` | trả bản trạng thái để React hiển thị mà không gửi dữ liệu lên server. |
| L19 | ` return { ...this.draft, note: this.note, dirty: this.generation !== this.savedGeneration, ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L20 | ` status: this.status, message: this.message, remote: this.remote \|\| null }; ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L21 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong snapshot. |
| L23 | ` emit() { if (!this.disposed) this.onChange?.(this.snapshot()); } ` | thông báo trạng thái mới cho React nếu editor chưa bị hủy. |
| L25 | ` change(field, value) { ` | cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. |
| L26 | ` if (this.disposed \|\| this.draft[field] === value) return; ` | Đọc hoặc thay draft trong RAM của editor; dữ liệu chỉ vào DB khi request được backend chấp nhận. |
| L27 | ` this.draft = { ...this.draft, [field]: value }; ` | Đọc hoặc thay draft trong RAM của editor; dữ liệu chỉ vào DB khi request được backend chấp nhận. |
| L28 | ` this.generation += 1; ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L29 | ` if (!this.remote) this.status = validDraft(this.draft) ? 'dirty' : 'invalid'; ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L30 | ` this.message = ''; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L31 | ` clearTimeout(this.timer); ` | Tạo/hủy timer. Debounce thay timer cũ khi gõ; các timer cleanup/download có mục đích ghi trong hàm bao quanh. Trong change. |
| L32 | ` if (validDraft(this.draft) && !this.remote && this.status !== 'error') this.schedule(); ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L33 | ` this.emit(); ` | Gọi this.emit với các đối số trên dòng: thông báo trạng thái mới cho React nếu editor chưa bị hủy. Trong change. |
| L34 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong change. |
| L36 | ` schedule() { ` | hẹn autosave sau khoảng nghỉ; debounce thay timer cũ. |
| L37 | ` clearTimeout(this.timer); ` | Tạo/hủy timer. Debounce thay timer cũ khi gõ; các timer cleanup/download có mục đích ghi trong hàm bao quanh. Trong schedule. |
| L38 | ` this.timer = setTimeout(() => { this.save(); }, this.delay); ` | Tạo/hủy timer. Debounce thay timer cũ khi gõ; các timer cleanup/download có mục đích ghi trong hàm bao quanh. Trong setTimeout. |
| L39 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong schedule. |
| L41 | ` async save() { ` | gửi tối đa một request, giữ body/operation cũ khi retry và xử lý ACK/conflict. |
| L42 | ` clearTimeout(this.timer); ` | Tạo/hủy timer. Debounce thay timer cũ khi gõ; các timer cleanup/download có mục đích ghi trong hàm bao quanh. Trong save. |
| L43 | ` if (this.disposed \|\| this.remote \|\| !validDraft(this.draft) \|\| this.generation === this.savedGeneration) return false; ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L44 | ` if (this.inFlight) return this.inFlight; ` | Theo dõi Promise của request đang chạy để không tạo nhiều request lưu đồng thời; các lời gọi tiếp theo dùng lại Promise này. |
| L45 | ` // A retry keeps exactly the same operation ID AND body until it is acknowledged. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L46 | ` const operation = this.pending \|\| { ` | Quản lý snapshot request chưa nhận ACK: giữ nguyên ID/body khi lỗi mạng; chỉ bỏ sau ACK hoặc lỗi từ chối chắc chắn. |
| L47 | ` id: this.note?.id, ` | Theo dõi note/ID/version hiện hành từ server làm cơ sở cho request tiếp theo. |
| L48 | ` generation: this.generation, ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L49 | ` body: { ...this.draft, operation_id: this.note ? crypto.randomUUID() : this.createId, ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong save. |
| L50 | ` ...(this.note ? { base_version: this.note.version } : {}) }, ` | Theo dõi note/ID/version hiện hành từ server làm cơ sở cho request tiếp theo. |
| L51 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong save. |
| L52 | ` this.pending = operation; ` | Quản lý snapshot request chưa nhận ACK: giữ nguyên ID/body khi lỗi mạng; chỉ bỏ sau ACK hoặc lỗi từ chối chắc chắn. |
| L53 | ` this.status = 'saving'; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L54 | ` this.message = ''; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L55 | ` this.emit(); ` | Gọi this.emit với các đối số trên dòng: thông báo trạng thái mới cho React nếu editor chưa bị hủy. Trong save. |
| L56 | ` this.inFlight = (async () => { ` | Theo dõi Promise của request đang chạy để không tạo nhiều request lưu đồng thời; các lời gọi tiếp theo dùng lại Promise này. |
| L57 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. |
| L58 | ` const result = operation.id ? await this.api.update(operation.id, operation.body) : await this.api.create(operation.body); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. |
| L59 | ` if (this.disposed) return false; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L60 | ` const current = result.note; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L61 | ` this.note = current; ` | Theo dõi note/ID/version hiện hành từ server làm cơ sở cho request tiếp theo. |
| L62 | ` this.savedGeneration = operation.generation; ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L63 | ` this.pending = null; ` | Quản lý snapshot request chưa nhận ACK: giữ nguyên ID/body khi lỗi mạng; chỉ bỏ sau ACK hoặc lỗi từ chối chắc chắn. |
| L64 | ` // A replay can acknowledge an old save while returning a newer server version. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L65 | ` if (result.mutation?.replayed && current.version > result.mutation.applied_version) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L66 | ` this.remote = current; ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L67 | ` this.status = 'conflict'; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L68 | ` } else if (!this.remote) { ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L69 | ` this.status = this.generation === this.savedGeneration ? 'saved' : validDraft(this.draft) ? 'dirty' : 'invalid'; ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L70 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L71 | ` this.onSaved?.(current); ` | Gọi callback onSaved nếu có, truyền note đã được server xác nhận để trang cha refresh danh sách. |
| L72 | ` return current; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. |
| L73 | ` } catch (error) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. |
| L74 | ` if (this.disposed) return false; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L75 | ` this.message = error.message; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L76 | ` if (error.code === 'VERSION_CONFLICT' && operation.id) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L77 | ` try { this.remote = await this.api.get(operation.id); this.status = 'conflict'; } ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L78 | ` catch (fetchError) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. |
| L79 | ` this.status = 'error'; this.message = fetchError.message; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L80 | ` if ([401, 403, 404, 423].includes(fetchError.status)) this.onAccessLost?.(fetchError); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L81 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L82 | ` } else { ` | Kết thúc nhánh if trước và bắt đầu nhánh còn lại khi điều kiện đó sai. |
| L83 | ` this.status = 'error'; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L84 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L85 | ` if ([400, 422].includes(error.status)) this.pending = null; ` | Quản lý snapshot request chưa nhận ACK: giữ nguyên ID/body khi lỗi mạng; chỉ bỏ sau ACK hoặc lỗi từ chối chắc chắn. |
| L86 | ` if ([401, 403, 404, 423].includes(error.status)) this.onAccessLost?.(error); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L87 | ` return false; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. |
| L88 | ` } finally { ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L89 | ` this.inFlight = null; ` | Theo dõi Promise của request đang chạy để không tạo nhiều request lưu đồng thời; các lời gọi tiếp theo dùng lại Promise này. |
| L90 | ` if (!this.disposed) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L91 | ` this.emit(); ` | Gọi this.emit với các đối số trên dòng: thông báo trạng thái mới cho React nếu editor chưa bị hủy. |
| L92 | ` if (!this.remote && this.status === 'dirty') this.schedule(); ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L93 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L94 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L95 | ` })(); ` | Đóng cấu trúc mảng/object/JSX hoặc kết thúc câu lệnh đang mở; xem khối bao quanh để ghép cặp dấu. |
| L96 | ` return this.inFlight; ` | Theo dõi Promise của request đang chạy để không tạo nhiều request lưu đồng thời; các lời gọi tiếp theo dùng lại Promise này. |
| L97 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong save. |
| L99 | ` async flush() { ` | chờ lưu tất cả generation hợp lệ trước khi đóng hoặc sửa metadata. |
| L100 | ` clearTimeout(this.timer); ` | Tạo/hủy timer. Debounce thay timer cũ khi gõ; các timer cleanup/download có mục đích ghi trong hàm bao quanh. Trong flush. |
| L101 | ` while (!this.disposed && this.generation !== this.savedGeneration) { ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L102 | ` if (!validDraft(this.draft) \|\| this.remote) return false; ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L103 | ` const result = await this.save(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong flush. |
| L104 | ` if (!result \|\| this.status === 'conflict') return false; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L105 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong flush. |
| L106 | ` return this.note \|\| (!this.draft.title && !this.draft.content); ` | Đọc hoặc thay draft trong RAM của editor; dữ liệu chỉ vào DB khi request được backend chấp nhận. |
| L107 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong flush. |
| L109 | ` accept(note) { ` | nhận snapshot server đã được chấp nhận và đánh draft hiện tại sạch. |
| L110 | ` this.note = note; ` | Theo dõi note/ID/version hiện hành từ server làm cơ sở cho request tiếp theo. |
| L111 | ` this.draft = { title: note.title, content: note.content }; ` | Đọc hoặc thay draft trong RAM của editor; dữ liệu chỉ vào DB khi request được backend chấp nhận. |
| L112 | ` this.savedGeneration = this.generation; ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L113 | ` this.pending = null; ` | Quản lý snapshot request chưa nhận ACK: giữ nguyên ID/body khi lỗi mạng; chỉ bỏ sau ACK hoặc lỗi từ chối chắc chắn. |
| L114 | ` this.remote = null; ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L115 | ` this.status = 'saved'; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L116 | ` this.message = ''; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L117 | ` this.emit(); ` | Gọi this.emit với các đối số trên dòng: thông báo trạng thái mới cho React nếu editor chưa bị hủy. Trong accept. |
| L118 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong accept. |
| L120 | ` receiveRemote(note, operationId) { ` | áp dụng bản remote khi clean; khi dirty giữ local và báo conflict. |
| L121 | ` if (operationId && operationId === this.pending?.body.operation_id) return; ` | Quản lý snapshot request chưa nhận ACK: giữ nguyên ID/body khi lỗi mạng; chỉ bỏ sau ACK hoặc lỗi từ chối chắc chắn. |
| L122 | ` if (!this.note \|\| note.version <= this.note.version) return; ` | Theo dõi note/ID/version hiện hành từ server làm cơ sở cho request tiếp theo. |
| L123 | ` if (this.generation !== this.savedGeneration \|\| this.inFlight) { ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L124 | ` clearTimeout(this.timer); ` | Tạo/hủy timer. Debounce thay timer cũ khi gõ; các timer cleanup/download có mục đích ghi trong hàm bao quanh. Trong receiveRemote. |
| L125 | ` this.remote = note; ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L126 | ` this.status = 'conflict'; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L127 | ` this.emit(); ` | Gọi this.emit với các đối số trên dòng: thông báo trạng thái mới cho React nếu editor chưa bị hủy. Trong receiveRemote. |
| L128 | ` } else this.accept(note); ` | Khi editor không còn sửa dở, nhận snapshot server và cập nhật giao diện mà không tạo request autosave mới. |
| L129 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong receiveRemote. |
| L131 | ` resolve(choice) { ` | chọn bản server hoặc chủ động gửi lại bản local trên version mới. |
| L132 | ` if (!this.remote \|\| this.inFlight) return; ` | Theo dõi Promise của request đang chạy để không tạo nhiều request lưu đồng thời; các lời gọi tiếp theo dùng lại Promise này. |
| L133 | ` if (choice === 'server') return this.accept(this.remote); ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L134 | ` this.note = this.remote; ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L135 | ` this.remote = null; ` | Giữ snapshot server dùng giải quyết conflict; không tự thay nội dung local khi user còn đang sửa. |
| L136 | ` this.pending = null; ` | Quản lý snapshot request chưa nhận ACK: giữ nguyên ID/body khi lỗi mạng; chỉ bỏ sau ACK hoặc lỗi từ chối chắc chắn. |
| L137 | ` this.generation += 1; ` | Theo dõi lần sửa local và lần sửa đã được ACK; chênh nhau nghĩa là còn draft chưa lưu, kể cả request cũ vừa thành công. |
| L138 | ` this.status = 'dirty'; ` | Cập nhật trạng thái/thông báo của autosave; trạng thái saved chỉ dành cho generation đã được ACK. |
| L139 | ` this.emit(); ` | Gọi this.emit với các đối số trên dòng: thông báo trạng thái mới cho React nếu editor chưa bị hủy. Trong resolve. |
| L140 | ` this.schedule(); ` | Gọi this.schedule với các đối số trên dòng: hẹn autosave sau khoảng nghỉ; debounce thay timer cũ. Trong resolve. |
| L141 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong resolve. |
| L143 | ` dispose() { this.disposed = true; clearTimeout(this.timer); } ` | hủy timer và ngăn cập nhật state sau khi editor unmount. |
| L144 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |

## frontend/src/features/notes/AttachmentPanel.jsx

Mã nguồn có 66 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import { useEffect, useRef, useState } from 'react'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` const LIMIT = 10 * 1024 * 1024; ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. |
| L4 | ` const ACCEPT = '.jpg,.jpeg,.png,.webp,.mp4,.webm,.pdf,.txt'; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L6 | ` function MediaPreview({ api, noteId, file, onError }) { ` | tải blob qua API có auth, tạo URL tạm và thu hồi URL khi unmount. Export cho phép file khác import nó. |
| L7 | ` const [url, setUrl] = useState(''); ` | Tạo state url (blob URL tạm để preview media có auth) và hàm cập nhật setUrl; cập nhật qua setter khiến React render lại. |
| L8 | ` useEffect(() => { ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L9 | ` const abort = new AbortController(); ` | Quản lý hủy request cũ và ngăn response cũ cập nhật UI khi filter đổi hoặc component đã đóng. |
| L10 | ` let objectUrl; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong useEffect. |
| L11 | ` api.file(noteId, file.id, abort.signal).then(blob => { ` | Quản lý hủy request cũ và ngăn response cũ cập nhật UI khi filter đổi hoặc component đã đóng. |
| L12 | ` if (abort.signal.aborted) return; ` | Quản lý hủy request cũ và ngăn response cũ cập nhật UI khi filter đổi hoặc component đã đóng. |
| L13 | ` objectUrl = URL.createObjectURL(blob); ` | Tạo hoặc thu hồi địa chỉ blob tạm trong RAM để preview/download file private; không đưa file vào localStorage/IndexedDB. |
| L14 | ` setUrl(objectUrl); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong undefined.then(). |
| L15 | ` }).catch(error => { if (!abort.signal.aborted) onError(error.message); }); ` | Quản lý hủy request cũ và ngăn response cũ cập nhật UI khi filter đổi hoặc component đã đóng. |
| L16 | ` return () => { abort.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); }; ` | Trả hàm cleanup cho effect: React gọi khi dependency đổi hoặc component unmount, giúp tránh timer/listener/request bị bỏ quên. |
| L17 | ` }, [api, noteId, file.id]); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L18 | ` if (!url) return <span className="small text-body-secondary">Đang tải bản xem trước…</span>; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong MediaPreview. |
| L19 | ` return file.media_kind === 'image' ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong MediaPreview. |
| L20 | ` ? <img src={url} alt={file.original_name} className="note-media" loading="lazy" /> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L21 | ` : <video src={url} controls preload="metadata" className="note-media" aria-label={file.original_name} />; ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L22 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong MediaPreview. |
| L24 | ` export default function AttachmentPanel({ api, note, readOnly, busy, onUpload, onDelete, onError }) { ` | hiển thị tệp, kiểm giới hạn client và chuyển upload/delete lên editor. Export cho phép file khác import nó. |
| L25 | ` const input = useRef(null); ` | Giữ tham chiếu ổn định qua render mà thay đổi current không tự render; dùng cho DOM, controller hoặc callback mới nhất. |
| L26 | ` async function select(event) { ` | kiểm số lượng, kích thước, đuôi tệp trước khi gửi batch. Export cho phép file khác import nó. |
| L27 | ` const files = [...event.target.files]; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong select. |
| L28 | ` event.target.value = ''; ` | Gán giá trị biểu thức bên phải vào event.target.value. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong select. |
| L29 | ` if (!files.length) return; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong select. |
| L30 | ` if (files.length > 5 \|\| (note?.attachments.length \|\| 0) + files.length > 10) return onError('Tối đa 5 tệp mỗi lần và 10 tệp mỗi ghi chú.'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong select. |
| L31 | ` if (files.some(file => file.size > LIMIT \|\| file.size === 0)) return onError('Mỗi tệp phải lớn hơn 0 byte và không quá 10 MiB.'); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong files.some(). |
| L32 | ` if (files.some(file => !/\.(jpe?g\|png\|webp\|mp4\|webm\|pdf\|txt)$/i.test(file.name))) return onError('Định dạng tệp chưa được hỗ trợ.'); ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L33 | ` await onUpload(files); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong select. |
| L34 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong select. |
| L35 | ` async function download(file) { ` | tải blob có kiểm quyền rồi kích hoạt download với tên gốc. Export cho phép file khác import nó. |
| L36 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong download. |
| L37 | ` const blob = await api.file(note.id, file.id); ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong download. |
| L38 | ` const url = URL.createObjectURL(blob); ` | Tạo hoặc thu hồi địa chỉ blob tạm trong RAM để preview/download file private; không đưa file vào localStorage/IndexedDB. |
| L39 | ` const link = document.createElement('a'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong download. |
| L40 | ` link.href = url; ` | Gán giá trị biểu thức bên phải vào link.href. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong download. |
| L41 | ` link.download = file.original_name; ` | Gán giá trị biểu thức bên phải vào link.download. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong download. |
| L42 | ` link.click(); ` | Gọi link.click với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong download. |
| L43 | ` setTimeout(() => URL.revokeObjectURL(url), 1000); ` | Tạo/hủy timer. Debounce thay timer cũ khi gõ; các timer cleanup/download có mục đích ghi trong hàm bao quanh. Trong setTimeout. |
| L44 | ` } catch (error) { onError(error.message); } ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong download. |
| L45 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong download. |
| L46 | ` return <section className="mt-3" aria-labelledby="attachment-heading"> ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L47 | ` <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-2"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L48 | ` <h3 id="attachment-heading" className="h6 mb-0">Tệp đính kèm</h3> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L49 | ` {!readOnly && <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy \|\| !note?.id} onClick={() => input.current.click()}>Thêm ảnh / video / tệp</button>} ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L50 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L51 | ` <input ref={input} type="file" multiple accept={ACCEPT} className="visually-hidden" tabIndex={-1} onChange={select} aria-label="Chọn tệp đính kèm" disabled={busy \|\| readOnly \|\| !note?.id} /> ` | Khai báo control có value/checked từ state và event onChange để cập nhật state; không sửa DOM trực tiếp. |
| L52 | ` {!note?.id && <p className="small text-body-secondary">Nhập đủ tiêu đề và nội dung; sau khi ghi chú tự lưu, bạn có thể đính kèm tệp.</p>} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L53 | ` <p className="small text-body-secondary">JPEG, PNG, WebP, MP4, WebM, PDF, TXT · 10 MiB/tệp · tối đa 10 tệp.</p> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L54 | ` <div className="note-attachments"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L55 | ` {(note?.attachments \|\| []).map(file => <article key={file.id} className="note-attachment"> ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong undefined.map(). |
| L56 | ` {file.media_kind !== 'file' && <MediaPreview api={api} noteId={note.id} file={file} onError={onError} />} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L57 | ` <strong className="small note-filename">{file.original_name}</strong> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L58 | ` <small className="text-body-secondary">{Math.max(1, Math.round(file.file_size / 1024))} KiB</small> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L59 | ` <div className="d-flex flex-wrap gap-2 mt-2"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L60 | ` <button className="btn btn-sm btn-outline-primary" onClick={() => download(file)}>Tải xuống</button> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L61 | ` {!readOnly && <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => onDelete(file)}>Xóa tệp</button>} ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L62 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L63 | ` </article>)} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L64 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L65 | ` </section>; ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L66 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong AttachmentPanel. |

## frontend/src/features/notes/notes.css

Mã nguồn có 25 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` .notes-page { min-width: 0; } ` | Đặt kiểu cho .notes-page: min-width: 0; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L2 | ` .notes-page .btn, .note-dialog .btn { min-height: 44px; } ` | Đặt kiểu cho .notes-page .btn, .note-dialog .btn: min-height: 44px; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L3 | ` .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); gap: 16px; } ` | CSS Grid tự chia cột theo chiều rộng; min() giữ một cột khi màn hình hẹp. |
| L4 | ` .notes-list { display: flex; flex-direction: column; gap: 12px; } ` | Xếp thẻ thành danh sách dọc. |
| L5 | ` .note-card { min-width: 0; border: 1px solid var(--bs-border-color); border-radius: 14px; background: var(--note-color); box-shadow: 0 2px 7px #00000008; overflow: hidden; } ` | Đặt kiểu cho .note-card: min-width: 0; border: 1px solid var(--bs-border-color); border-radius: 14px; background: var(--note-color); box-shadow: 0 2px 7px #00000008; overflow: hidden; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L6 | ` .note-card-open { display: block; width: 100%; border: 0; background: transparent; color: var(--bs-body-color); padding: 18px; text-align: left; font-size: var(--note-font-size); } ` | Đặt kiểu cho .note-card-open: display: block; width: 100%; border: 0; background: transparent; color: var(--bs-body-color); padding: 18px; text-align: left; font-size: var(--note-font-size); Các giá trị var() lấy từ theme hoặc prop preferences. |
| L7 | ` .note-title, .note-filename { overflow-wrap: anywhere; } ` | Đặt kiểu cho .note-title, .note-filename: overflow-wrap: anywhere; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L8 | ` .note-title { white-space: pre-wrap; } ` | Đặt kiểu cho .note-title: white-space: pre-wrap; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L9 | ` .note-status-icons { flex-shrink: 0; color: var(--bs-secondary-color); } ` | Đặt kiểu cho .note-status-icons: flex-shrink: 0; color: var(--bs-secondary-color); Các giá trị var() lấy từ theme hoặc prop preferences. |
| L10 | ` .note-preview { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-wrap; overflow-wrap: anywhere; margin-top: 12px; color: var(--bs-secondary-color); } ` | Giới hạn preview số dòng, giữ xuống dòng và bẻ từ dài. |
| L11 | ` .note-preview-full { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 200px; overflow: auto; } ` | Đặt kiểu cho .note-preview-full: white-space: pre-wrap; overflow-wrap: anywhere; max-height: 200px; overflow: auto; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L12 | ` .note-card-footer { padding: 0 14px 14px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; } ` | Đặt kiểu cho .note-card-footer: padding: 0 14px 14px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L13 | ` .note-card-list .note-preview { -webkit-line-clamp: 2; } ` | Đặt kiểu cho .note-card-list .note-preview: -webkit-line-clamp: 2; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L14 | ` .note-label-option { border: 1px solid var(--bs-border-color); border-radius: 8px; display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 6px 12px; cursor: pointer; overflow-wrap: anywhere; } ` | Đặt kiểu cho .note-label-option: border: 1px solid var(--bs-border-color); border-radius: 8px; display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 6px 12px; cursor: pointer; overflow-wrap: anywhere; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L15 | ` .note-label-option input { accent-color: var(--bs-primary); flex-shrink: 0; } ` | Đặt kiểu cho .note-label-option input: accent-color: var(--bs-primary); flex-shrink: 0; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L16 | ` .notes-empty { padding: 50px 20px; text-align: center; color: var(--bs-secondary-color); border: 1px dashed var(--bs-border-color); border-radius: 14px; } ` | Đặt kiểu cho .notes-empty: padding: 50px 20px; text-align: center; color: var(--bs-secondary-color); border: 1px dashed var(--bs-border-color); border-radius: 14px; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L17 | ` .note-dialog { color: var(--bs-body-color); background: var(--bs-body-bg); width: min(480px, calc(100vw - 24px)); max-height: calc(100dvh - 32px); overflow-y: auto; border: 1px solid var(--bs-border-color); border-radius: 16px; padding: 24px; box-shadow: 0 20px 70px #0004; } ` | Định kích thước modal theo viewport, cho cuộn nội dung và giữ màu theo theme. |
| L18 | ` .note-dialog-wide { width: min(850px, calc(100vw - 24px)); } ` | Đặt kiểu cho .note-dialog-wide: width: min(850px, calc(100vw - 24px)); Các giá trị var() lấy từ theme hoặc prop preferences. |
| L19 | ` .note-dialog::backdrop { background: #0d172b99; } ` | Làm tối nền bên ngoài modal native. |
| L20 | ` .note-content { resize: vertical; min-height: 170px; font-size: var(--note-font-size, 16px); } ` | Cho textarea đổi chiều cao và kế thừa cỡ chữ note. |
| L21 | ` .note-attachments { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 190px), 1fr)); gap: 12px; } ` | Đặt kiểu cho .note-attachments: display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 190px), 1fr)); gap: 12px; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L22 | ` .note-attachment { display: flex; flex-direction: column; border: 1px solid var(--bs-border-color); padding: 12px; border-radius: 10px; min-width: 0; } ` | Đặt kiểu cho .note-attachment: display: flex; flex-direction: column; border: 1px solid var(--bs-border-color); padding: 12px; border-radius: 10px; min-width: 0; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L23 | ` .note-media { width: 100%; height: 150px; object-fit: contain; border-radius: 6px; margin-bottom: 8px; background: var(--bs-tertiary-bg); } ` | Giới hạn ảnh/video trong thẻ mà không kéo méo tỷ lệ. |
| L24 | ` .notes-page button:focus-visible, .note-dialog button:focus-visible, .note-label-option:focus-within { outline: 3px solid #0d6efd; outline-offset: 3px; } ` | Đặt kiểu cho .notes-page button:focus-visible, .note-dialog button:focus-visible, .note-label-option:focus-within: outline: 3px solid #0d6efd; outline-offset: 3px; Các giá trị var() lấy từ theme hoặc prop preferences. |
| L25 | ` @media (max-width: 575px) { .note-dialog { padding: 16px; } .notes-empty { padding: 30px 14px; } } ` | Quy tắc responsive: ở màn hình nhỏ, giảm padding dialog/empty state để không tràn ngang. |

## frontend/src/features/notes/dev.jsx

Mã nguồn có 39 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import React, { useState } from 'react'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L2 | ` import { createRoot } from 'react-dom/client'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` import { BrowserRouter } from 'react-router-dom'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L4 | ` import 'bootstrap/dist/css/bootstrap.min.css'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L5 | ` import 'bootstrap-icons/font/bootstrap-icons.css'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L6 | ` import { makeNotesApi } from './notes.api'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L7 | ` import { NotesSearchProvider, useNotesSearch } from './NotesSearchContext'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L8 | ` import NoteList from './NoteList'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L10 | ` function Playground() { ` | chọn user seed và thử giao diện qua API thật mà không sửa login chính. Export cho phép file khác import nó. |
| L11 | ` const [session, setSession] = useState(null); ` | Tạo state session (user và API client của phiên playground) và hàm cập nhật setSession; cập nhật qua setter khiến React render lại. |
| L12 | ` const [error, setError] = useState(''); ` | Tạo state error (thông báo lỗi thao tác) và hàm cập nhật setError; cập nhật qua setter khiến React render lại. |
| L13 | ` const [busy, setBusy] = useState(false); ` | Tạo state busy (cờ tác vụ đang chạy để khóa input/nút) và hàm cập nhật setBusy; cập nhật qua setter khiến React render lại. |
| L14 | ` const { query, setQuery } = useNotesSearch(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong Playground. |
| L15 | ` async function choose(userId) { ` | lấy token chẩn đoán local, giữ RAM và tạo API client tương ứng. Export cho phép file khác import nó. |
| L16 | ` setBusy(true); setError(''); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong choose. |
| L17 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong choose. |
| L18 | ` const response = await fetch('/api/dev/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong choose. |
| L19 | ` const data = await response.json(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong choose. |
| L20 | ` if (!response.ok) throw new Error(data.error?.message \|\| 'Không thể mở phiên thử.'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong choose. |
| L21 | ` setSession({ user: data.user, api: makeNotesApi(data.token) }); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong choose. |
| L22 | `` } catch (failure) { setError(`${failure.message} Kiểm tra MySQL và chạy backend bằng npm run notes:dev.`); } `` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong choose. |
| L23 | ` finally { setBusy(false); } ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L24 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong choose. |
| L25 | ` return <main className="container-fluid p-3 p-md-4"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L26 | ` <div className="alert alert-warning"><strong>LOCAL PLAYGROUND — không phải đăng nhập thật.</strong> Chỉ để thử TV2 bằng tài khoản seed. Không đưa server này lên hosting. Trang này không nằm trong bundle production.</div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L27 | ` {error && <div role="alert" className="alert alert-danger">{error}</div>} ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L28 | ` {!session ? <section><h1 className="h4">Chạy thử phần quản lý note</h1><p>Chọn user seed; token chỉ giữ trong RAM, không thay phiên đăng nhập của app chính.</p> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L29 | `` <div className="d-flex flex-wrap gap-2">{[1, 2, 3].map(id => <button key={id} className="btn btn-primary" disabled={busy} onClick={() => choose(id)}>{busy ? 'Đang mở…' : `User ${id}`}</button>)}</div> `` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong undefined.map(). |
| L30 | ` </section> : <> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L31 | ` <header className="d-flex flex-wrap justify-content-between gap-3 mb-3"><span>Đang thử: <strong>{session.user.email}</strong></span><button className="btn btn-outline-secondary" onClick={() => setSession(null)}>Kết thúc phiên thử</button></header> ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L32 | ` <div className="mb-3 d-none d-sm-block"><label htmlFor="dev-search" className="form-label">Tìm tiêu đề hoặc nội dung</label><input id="dev-search" className="form-control" type="search" value={query} maxLength={200} onChange={event => setQuery(event.target.value)} /></div> ` | Khai báo control có value/checked từ state và event onChange để cập nhật state; không sửa DOM trực tiếp. |
| L33 | ` <NoteList key={session.user.id} api={session.api} /> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L34 | ` </>} ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L35 | ` </main>; ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L36 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong Playground. |
| L38 | ` if (!import.meta.env.DEV) throw new Error('Playground is development-only.'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L39 | ` createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><NotesSearchProvider><Playground /></NotesSearchProvider></BrowserRouter></React.StrictMode>); ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |

## frontend/notes-dev.html

Mã nguồn có 5 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` <!doctype html> ` | Khai báo HTML5 để trình duyệt dùng chế độ chuẩn khi đọc trang playground. |
| L2 | ` <html lang="vi"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L3 | ` <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>TV2 — Local playground</title></head> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L4 | ` <body><div id="root"></div><script type="module" src="/src/features/notes/dev.jsx"></script></body> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L5 | ` </html> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |

## backend/src/modules/notes/validation.js

Mã nguồn có 78 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const crypto = require('node:crypto'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` class NoteError extends Error { ` | định nghĩa lỗi nghiệp vụ có status/code/message an toàn cho client. Export cho phép file khác import nó. |
| L4 | ` constructor(status, code, message, details) { ` | khởi tạo state machine autosave, draft, generation và UUID tạo note. |
| L5 | ` super(message); ` | Gọi super với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong constructor. |
| L6 | ` Object.assign(this, { status, code, details }); ` | Gọi Object.assign với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong constructor. |
| L7 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong constructor. |
| L8 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L10 | ` function positiveId(value) { ` | chỉ cho phép ID số nguyên dương an toàn, không nhận SQL string. Export cho phép file khác import nó. |
| L11 | ` const id = Number(value); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong positiveId. |
| L12 | ` if (!Number.isSafeInteger(id) \|\| id < 1) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong positiveId. |
| L13 | ` throw new NoteError(400, 'INVALID_ID', 'ID phải là số nguyên dương.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong positiveId. |
| L14 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong positiveId. |
| L15 | ` return id; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong positiveId. |
| L16 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong positiveId. |
| L18 | ` function text(value, name, max) { ` | kiểm tra chuỗi không rỗng và số ký tự tối đa. Export cho phép file khác import nó. |
| L19 | ` if (typeof value !== 'string' \|\| !value.trim() \|\| [...value].length > max) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong text. |
| L20 | `` throw new NoteError(422, 'VALIDATION_ERROR', `${name} bắt buộc và tối đa ${max} ký tự.`); `` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong text. |
| L21 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong text. |
| L22 | ` return value; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong text. |
| L23 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong text. |
| L25 | ` function noteText(body) { ` | validate và chuẩn hóa title/content, không lấy owner từ body. Export cho phép file khác import nó. |
| L26 | ` return { title: text(body.title, 'Tiêu đề', 200).trim(), content: text(body.content, 'Nội dung', 20000) }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong noteText. |
| L27 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong noteText. |
| L29 | ` function operationId(value) { ` | kiểm tra UUID v4 rồi chuẩn hóa về chữ thường. Export cho phép file khác import nó. |
| L30 | ` if (typeof value !== 'string' \|\| !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L31 | ` throw new NoteError(422, 'INVALID_OPERATION', 'operation_id phải là UUID v4.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong operationId. |
| L32 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong operationId. |
| L33 | ` return value.toLowerCase(); ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong operationId. |
| L34 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong operationId. |
| L36 | ` function labelIds(value) { ` | kiểm tra mảng IDs, chặn quá20 và loại ID lặp. Export cho phép file khác import nó. |
| L37 | ` if (!Array.isArray(value) \|\| value.length > 20) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong labelIds. |
| L38 | ` throw new NoteError(422, 'INVALID_LABELS', 'Chọn tối đa 20 nhãn.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong labelIds. |
| L39 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong labelIds. |
| L40 | ` return [...new Set(value.map(positiveId))]; ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong labelIds. |
| L41 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong labelIds. |
| L43 | ` function escapeLike(value) { ` | escape wildcard để phần trăm/gạch dưới do user nhập được tìm như ký tự thường. Export cho phép file khác import nó. |
| L44 | ` return value.replace(/[!%_]/g, '!$&'); ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong escapeLike. |
| L45 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong escapeLike. |
| L47 | ` function canonical(value) { ` | sắp thứ tự khóa object để request tương đương có cùng digest. Export cho phép file khác import nó. |
| L48 | ` if (Array.isArray(value)) return value.map(canonical); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong canonical. |
| L49 | ` if (value && typeof value === 'object') { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong canonical. |
| L50 | ` return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])); ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong undefined.map(). |
| L51 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong canonical. |
| L52 | ` return value; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong canonical. |
| L53 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong canonical. |
| L55 | ` function requestHash(req, secret, payload = req.body) { ` | HMAC method/path/body để phát hiện reuse operation với nội dung khác. Export cho phép file khác import nó. |
| L56 | ` const input = JSON.stringify(canonical({ method: req.method, path: req.originalUrl.split('?')[0], body: payload })); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong requestHash. |
| L57 | ` return crypto.createHmac('sha256', secret).update(input).digest('hex'); ` | Tạo hoặc kiểm digest request để nhận retry đúng body và chặn reuse operation cho dữ liệu khác; secret chỉ ở backend. Trong requestHash. |
| L58 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong requestHash. |
| L60 | ` function serializeNote(row, labels = [], detail = false) { ` | tạo DTO an toàn; list note khóa không có content, hash hoặc labels nhạy cảm. Export cho phép file khác import nó. |
| L61 | ` const locked = Boolean(row.is_locked \|\| row.password_hash); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong serializeNote. |
| L62 | ` const owner = row.actor_id === row.user_id; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong serializeNote. |
| L63 | ` const role = owner ? 'owner' : row.permission === 'edit' ? 'editor' : 'reader'; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong serializeNote. |
| L64 | ` const result = { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong serializeNote. |
| L65 | ` id: row.id, user_id: row.user_id, title: row.title, ` | Thuộc tính id: định danh đối tượng. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong serializeNote. |
| L66 | ` is_locked: locked, is_shared: Boolean(row.is_shared), ` | Thuộc tính is_locked: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong serializeNote. |
| L67 | ` is_pinned: Boolean(row.pinned_at), pinned_at: row.pinned_at, ` | Thuộc tính is_pinned: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong serializeNote. |
| L68 | ` version: row.version, content_version: row.content_version, ` | Thuộc tính version: phiên bản toàn note. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong serializeNote. |
| L69 | ` created_at: row.created_at, updated_at: row.updated_at, ` | Thuộc tính created_at: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong serializeNote. |
| L70 | ` content_preview: locked ? null : (row.content \|\| '').slice(0, 160), ` | Thuộc tính content_preview: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong serializeNote. |
| L71 | ` labels: owner && !locked ? labels : [], ` | Thuộc tính labels: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong serializeNote. |
| L72 | ` access: { role, can_edit: role !== 'reader', can_manage: owner }, ` | Thuộc tính access: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong serializeNote. |
| L73 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong serializeNote. |
| L74 | ` if (detail) result.content = row.content; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong serializeNote. |
| L75 | ` return result; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong serializeNote. |
| L76 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong serializeNote. |
| L78 | ` module.exports = { NoteError, positiveId, text, noteText, operationId, labelIds, escapeLike, requestHash, serializeNote }; ` | Công khai các hàm cần dùng sang module khác; phần không export vẫn là chi tiết nội bộ của file. |

## backend/src/modules/notes/access.js

Mã nguồn có 64 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const jwt = require('jsonwebtoken'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const { NoteError, positiveId } = require('./validation'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` function jwtSecret(req) { ` | lấy secret backend và từ chối cấu hình mẫu/secret quá ngắn. Export cho phép file khác import nó. |
| L5 | ` const secret = req.app.locals.notesJwtSecret \|\| process.env.JWT_SECRET; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong jwtSecret. |
| L6 | ` if (!secret \|\| secret.length < 32 \|\| secret.startsWith('super_secret_jwt_key')) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong jwtSecret. |
| L7 | ` throw new NoteError(503, 'AUTH_NOT_CONFIGURED', 'Máy chủ chưa được cấu hình xác thực an toàn.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong jwtSecret. |
| L8 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong jwtSecret. |
| L9 | ` return secret; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong jwtSecret. |
| L10 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong jwtSecret. |
| L12 | ` async function requireNoteAuth(req, res, next) { ` | xác thực user bằng middleware TV1 hoặc Bearer JWT adapter. Export cho phép file khác import nó. |
| L13 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong requireNoteAuth. |
| L14 | ` // A trusted TV1 middleware may supply req.auth.userId instead of this JWT adapter. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L15 | ` const supplied = req.auth?.userId; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong requireNoteAuth. |
| L16 | ` if (supplied) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong requireNoteAuth. |
| L17 | ` req.noteUserId = positiveId(supplied); ` | Ghi thuộc tính nội bộ req.noteUserId để middleware/handler phía sau dùng. Không lấy thuộc tính xác thực này từ body không tin cậy. |
| L18 | ` return next(); ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong requireNoteAuth. |
| L19 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong requireNoteAuth. |
| L20 | ` const token = /^Bearer (\S+)$/.exec(req.headers.authorization \|\| '')?.[1]; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong requireNoteAuth. |
| L21 | ` if (!token) throw new NoteError(401, 'AUTH_REQUIRED', 'Vui lòng đăng nhập.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong requireNoteAuth. |
| L22 | ` let claims; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong requireNoteAuth. |
| L23 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong requireNoteAuth. |
| L24 | ` claims = jwt.verify(token, jwtSecret(req), { algorithms: ['HS256'] }); ` | Gán giá trị biểu thức bên phải vào claims. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong requireNoteAuth. |
| L25 | ` } catch (error) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong requireNoteAuth. |
| L26 | ` if (error instanceof NoteError) throw error; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong requireNoteAuth. |
| L27 | ` throw new NoteError(401, 'AUTH_REQUIRED', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong requireNoteAuth. |
| L28 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong requireNoteAuth. |
| L29 | ` const id = positiveId(claims.id ?? claims.user_id ?? claims.sub); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong requireNoteAuth. |
| L30 | ` const [users] = await req.app.locals.notesPool.execute('SELECT id FROM users WHERE id = ?', [id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong requireNoteAuth. |
| L31 | ` if (!users.length) throw new NoteError(401, 'AUTH_REQUIRED', 'Tài khoản không còn tồn tại.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong requireNoteAuth. |
| L32 | ` req.noteUserId = id; ` | Ghi thuộc tính nội bộ req.noteUserId để middleware/handler phía sau dùng. Không lấy thuộc tính xác thực này từ body không tin cậy. |
| L33 | ` next(); ` | Gọi next với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong requireNoteAuth. |
| L34 | ` } catch (error) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong requireNoteAuth. |
| L35 | ` next(error); ` | Gọi next với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong requireNoteAuth. |
| L36 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong requireNoteAuth. |
| L37 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong requireNoteAuth. |
| L39 | ` async function getAccess(db, req, id, action = 'read', lock = false) { ` | kiểm owner/share/action và password grant hiện hành trước khi trả note. Export cho phép file khác import nó. |
| L40 | ` const [rows] = await db.execute( ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong getAccess. |
| L41 | `` `SELECT n.*, s.permission, `` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong getAccess. |
| L42 | ` EXISTS(SELECT 1 FROM note_shares x WHERE x.note_id = n.id) AS is_shared ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong getAccess. |
| L43 | ` FROM notes n LEFT JOIN note_shares s ON s.note_id = n.id AND s.shared_with_user_id = ? ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong getAccess. |
| L44 | `` WHERE n.id = ? AND (n.user_id = ? OR s.id IS NOT NULL) ${lock ? 'FOR UPDATE' : ''}`, `` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong getAccess. |
| L45 | ` [req.noteUserId, id, req.noteUserId], ` | Danh sách đối số hoặc spread: ghép các giá trị đã chuẩn hóa vào mảng/object mới. Với SQL, thứ tự phải khớp từng placeholder ?. Trong getAccess. |
| L46 | ` ); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong getAccess. |
| L47 | ` const note = rows[0]; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong getAccess. |
| L48 | ` if (!note) throw new NoteError(404, 'NOT_FOUND', 'Không tìm thấy ghi chú.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong getAccess. |
| L49 | ` note.actor_id = req.noteUserId; ` | Gán giá trị biểu thức bên phải vào note.actor_id. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong getAccess. |
| L50 | ` const owner = note.user_id === req.noteUserId; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong getAccess. |
| L51 | ` const manages = ['delete', 'pin', 'labels'].includes(action); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong getAccess. |
| L52 | ` if ((manages && !owner) \|\| (action !== 'read' && !owner && note.permission !== 'edit')) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong getAccess. |
| L53 | ` throw new NoteError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong getAccess. |
| L54 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong getAccess. |
| L55 | ` if (note.is_locked \|\| note.password_hash) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong getAccess. |
| L56 | ` // Fail closed until TV3 provides its server-side password-grant verifier. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L57 | ` const authorize = req.app.locals.noteSecurity?.authorizeLockedNote; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong getAccess. |
| L58 | ` const allowed = authorize && await authorize({ req, db, noteId: id, action, userId: req.noteUserId }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong getAccess. |
| L59 | ` if (!allowed) throw new NoteError(423, 'NOTE_LOCKED', 'Ghi chú đang khóa. Vui lòng mở khóa trước khi tiếp tục.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong getAccess. |
| L60 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong getAccess. |
| L61 | ` return note; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong getAccess. |
| L62 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong getAccess. |
| L64 | ` module.exports = { requireNoteAuth, getAccess, jwtSecret }; ` | Công khai các hàm cần dùng sang module khác; phần không export vẫn là chi tiết nội bộ của file. |

## backend/src/modules/notes/repository.js

Mã nguồn có 89 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const { NoteError, serializeNote } = require('./validation'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const { getAccess } = require('./access'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` async function transaction(pool, work) { ` | mượn một connection, begin/commit/rollback và luôn release. Export cho phép file khác import nó. |
| L5 | ` const db = await pool.getConnection(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L6 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong transaction. |
| L7 | ` await db.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED'); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong transaction. |
| L8 | ` await db.beginTransaction(); ` | Bắt đầu transaction; các query liên quan phải dùng cùng connection db. |
| L9 | ` const result = await work(db); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L10 | ` await db.commit(); ` | Commit khi toàn bộ công việc thành công; sau đây mới được publish thông báo thay đổi. |
| L11 | ` return result; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong transaction. |
| L12 | ` } catch (error) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong transaction. |
| L13 | ` await db.rollback(); ` | Hoàn tác thay đổi DB khi có lỗi; sau đó lỗi được chuyển lên handler. |
| L14 | ` throw error; ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong transaction. |
| L15 | ` } finally { ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L16 | ` db.release(); ` | Trả connection về pool hoặc đóng kết nối test/setup để không rò rỉ tài nguyên. |
| L17 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong transaction. |
| L18 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong transaction. |
| L20 | ` async function readReceipt(db, userId, operation, hash) { ` | tìm thao tác đã xử lý và so sánh digest để nhận biết retry hợp lệ. Export cho phép file khác import nó. |
| L21 | ` const [rows] = await db.execute('SELECT * FROM note_mutations WHERE user_id = ? AND operation_id = ?', [userId, operation]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong readReceipt. |
| L22 | ` const receipt = rows[0]; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong readReceipt. |
| L23 | ` if (receipt && receipt.request_hash !== hash) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong readReceipt. |
| L24 | ` throw new NoteError(409, 'OPERATION_REUSED', 'Mã thao tác đã dùng cho một yêu cầu khác.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong readReceipt. |
| L25 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong readReceipt. |
| L26 | ` if (receipt && typeof receipt.result_json === 'string') receipt.result_json = JSON.parse(receipt.result_json); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong readReceipt. |
| L27 | ` return receipt; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong readReceipt. |
| L28 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong readReceipt. |
| L30 | ` async function writeReceipt(db, userId, operation, hash, noteId, version, result = {}) { ` | ghi nhận thao tác thành công cùng transaction với thay đổi note. Export cho phép file khác import nó. |
| L31 | ` await db.execute( ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong writeReceipt. |
| L32 | ` 'INSERT INTO note_mutations (user_id, operation_id, request_hash, note_id, applied_version, result_json) VALUES (?, ?, ?, ?, ?, ?)', ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. Trong writeReceipt. |
| L33 | ` [userId, operation, hash, noteId, version, JSON.stringify(result)], ` | Danh sách đối số hoặc spread: ghép các giá trị đã chuẩn hóa vào mảng/object mới. Với SQL, thứ tự phải khớp từng placeholder ?. Trong writeReceipt. |
| L34 | ` ); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong writeReceipt. |
| L35 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong writeReceipt. |
| L37 | ` async function ownedLabels(db, userId, ids) { ` | bảo đảm tất cả label IDs thuộc actor; một ID sai thì từ chối toàn bộ. Export cho phép file khác import nó. |
| L38 | ` if (!ids.length) return; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong ownedLabels. |
| L39 | ` const marks = ids.map(() => '?').join(','); ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong ids.map(). |
| L40 | `` const [rows] = await db.execute(`SELECT id FROM labels WHERE user_id = ? AND id IN (${marks})`, [userId, ...ids]); `` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong ownedLabels. |
| L41 | ` if (rows.length !== ids.length) throw new NoteError(422, 'INVALID_LABELS', 'Một hoặc nhiều nhãn không thuộc tài khoản của bạn.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong ownedLabels. |
| L42 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong ownedLabels. |
| L44 | ` async function labelsFor(db, noteIds, ownerId) { ` | lấy tên label hiện hành qua bảng liên kết, không copy tên vào note. Export cho phép file khác import nó. |
| L45 | ` if (!noteIds.length) return []; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong labelsFor. |
| L46 | ` const marks = noteIds.map(() => '?').join(','); ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong noteIds.map(). |
| L47 | ` const [rows] = await db.execute( ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong labelsFor. |
| L48 | `` `SELECT nl.note_id, l.id, l.name FROM note_labels nl JOIN labels l ON l.id = nl.label_id `` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong labelsFor. |
| L49 | `` WHERE l.user_id = ? AND nl.note_id IN (${marks}) ORDER BY l.name, l.id`, `` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong labelsFor. |
| L50 | ` [ownerId, ...noteIds], ` | Danh sách đối số hoặc spread: ghép các giá trị đã chuẩn hóa vào mảng/object mới. Với SQL, thứ tự phải khớp từng placeholder ?. Trong labelsFor. |
| L51 | ` ); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong labelsFor. |
| L52 | ` return rows; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong labelsFor. |
| L53 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong labelsFor. |
| L55 | ` function attachmentDto(row) { ` | trả metadata và URL API, không lộ đường dẫn storage trên server. Export cho phép file khác import nó. |
| L56 | ` return { ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong attachmentDto. |
| L57 | ` id: row.id, note_id: row.note_id, original_name: row.original_name, ` | Thuộc tính id: định danh đối tượng. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong attachmentDto. |
| L58 | ` file_type: row.file_type, file_size: row.file_size, ` | Thuộc tính file_type: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong attachmentDto. |
| L59 | ` media_kind: row.file_type.startsWith('image/') ? 'image' : row.file_type.startsWith('video/') ? 'video' : 'file', ` | Thuộc tính media_kind: kiểu preview từ MIME. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong attachmentDto. |
| L60 | `` content_url: `/api/notes/${row.note_id}/attachments/${row.id}/content`, `` | Thuộc tính content_url: URL API private. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong attachmentDto. |
| L61 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong attachmentDto. |
| L62 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong attachmentDto. |
| L64 | ` async function detail(db, req, noteId) { ` | kiểm quyền rồi ghép text, labels và attachments cho một note. Export cho phép file khác import nó. |
| L65 | ` const row = await getAccess(db, req, noteId); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong detail. |
| L66 | ` const labels = await labelsFor(db, [noteId], req.noteUserId); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong detail. |
| L67 | ` const [files] = await db.execute('SELECT * FROM attachments WHERE note_id = ? ORDER BY id', [noteId]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong detail. |
| L68 | ` const result = serializeNote(row, labels.map(({ id, name }) => ({ id, name })), true); ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong labels.map(). |
| L69 | ` result.attachments = files.map(attachmentDto); ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong detail. |
| L70 | ` return result; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong detail. |
| L71 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong detail. |
| L73 | ` function assertVersion(note, baseVersion) { ` | chặn base_version thiếu/sai hoặc cũ hơn note hiện hành. Export cho phép file khác import nó. |
| L74 | ` if (!Number.isSafeInteger(Number(baseVersion)) \|\| Number(baseVersion) < 1) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong assertVersion. |
| L75 | ` throw new NoteError(422, 'INVALID_VERSION', 'base_version bắt buộc là số nguyên dương.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong assertVersion. |
| L76 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong assertVersion. |
| L77 | ` if (note.version !== Number(baseVersion)) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong assertVersion. |
| L78 | ` throw new NoteError(409, 'VERSION_CONFLICT', 'Ghi chú đã thay đổi. Hãy kiểm tra hai bản trước khi tiếp tục.', { current_version: note.version }); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong assertVersion. |
| L79 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong assertVersion. |
| L80 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong assertVersion. |
| L82 | ` function publish(req, noteId, version, operationId, kind) { ` | gọi điểm nối sự kiện sau commit; lỗi socket không biến save đã thành công thành thất bại. Export cho phép file khác import nó. |
| L83 | ` // Socket/offline modules subscribe here; failures cannot undo an already committed save. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L84 | ` Promise.resolve().then(() => req.app.locals.noteEvents?.publishNoteChange?.({ ` | Gọi Promise.resolve với các đối số trên dòng: chọn bản server hoặc chủ động gửi lại bản local trên version mới. Trong undefined.then(). |
| L85 | ` noteId, version, operationId, kind, actorId: req.noteUserId, ` | Object dùng shorthand cho noteId/version/operationId/kind; actorId lấy từ user đã xác thực để gửi sự kiện sau commit. |
| L86 | ` })).catch(() => console.error('NOTE_EVENT_DELIVERY_FAILED')); ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong undefined.catch(). |
| L87 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong publish. |
| L89 | ` module.exports = { transaction, readReceipt, writeReceipt, ownedLabels, labelsFor, detail, assertVersion, publish, attachmentDto }; ` | Công khai các hàm cần dùng sang module khác; phần không export vẫn là chi tiết nội bộ của file. |

## backend/src/modules/notes/routes.js

Mã nguồn có 153 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const express = require('express'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const { requireNoteAuth, getAccess, jwtSecret } = require('./access'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` const { NoteError, positiveId, noteText, operationId, labelIds, escapeLike, requestHash, serializeNote } = require('./validation'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` const { transaction, readReceipt, writeReceipt, ownedLabels, labelsFor, detail, assertVersion, publish } = require('./repository'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L5 | ` const { installAttachments, removeStoredFiles } = require('./attachments'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L7 | ` function pool(req) { return req.app.locals.notesPool; } ` | Khai báo hàm/component/lớp để dùng trong các dòng phía dưới. Export cho phép file khác import nó. |
| L9 | ` async function mutate(req, action, kind, work) { ` | dùng chung transaction/ACL/receipt/version cho các thao tác trên note. Export cho phép file khác import nó. |
| L10 | ` const id = positiveId(req.params.id); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong mutate. |
| L11 | ` const operation = operationId(req.body.operation_id); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong mutate. |
| L12 | ` const hash = requestHash(req, jwtSecret(req)); ` | Tạo hoặc kiểm digest request để nhận retry đúng body và chặn reuse operation cho dữ liệu khác; secret chỉ ở backend. Trong mutate. |
| L13 | ` const result = await transaction(pool(req), async db => { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L14 | ` const previous = await readReceipt(db, req.noteUserId, operation, hash); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L15 | ` if (previous) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong transaction. |
| L16 | ` if (previous.result_json.deleted) return { id, deleted: true, replayed: true, version: previous.applied_version }; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong transaction. |
| L17 | ` await getAccess(db, req, id, action); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong transaction. |
| L18 | ` return { id, replayed: true, version: previous.applied_version }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong transaction. |
| L19 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong transaction. |
| L20 | ` const note = await getAccess(db, req, id, action, true); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L21 | ` // Recheck after acquiring the note lock: a parallel retry may have just committed. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L22 | ` const concurrent = await readReceipt(db, req.noteUserId, operation, hash); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L23 | ` if (concurrent) return { id, replayed: true, version: concurrent.applied_version }; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong transaction. |
| L24 | ` assertVersion(note, req.body.base_version); ` | Gọi assertVersion với các đối số trên dòng: chặn base_version thiếu/sai hoặc cũ hơn note hiện hành. Trong transaction. |
| L25 | ` const extra = await work(db, note); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L26 | ` const version = note.version + 1; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L27 | ` if (!extra?.deleted) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong transaction. |
| L28 | ` await db.execute('UPDATE notes SET version = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [version, id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong transaction. |
| L29 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong transaction. |
| L30 | ` await writeReceipt(db, req.noteUserId, operation, hash, id, version, { deleted: Boolean(extra?.deleted) }); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong transaction. |
| L31 | ` return { id, version, ...extra }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong transaction. |
| L32 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong transaction. |
| L33 | ` if (!result.replayed) publish(req, id, result.version, operation, kind); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong mutate. |
| L34 | ` if (result.deleted) return result; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong mutate. |
| L35 | ` return { note: await detail(pool(req), req, id), mutation: { operation_id: operation, applied_version: result.version, replayed: Boolean(result.replayed) } }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong mutate. |
| L36 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong mutate. |
| L38 | ` function createNotesRouter() { ` | khai báo các endpoint core note và cài authentication trước handler. Export cho phép file khác import nó. |
| L39 | ` const router = express.Router(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong createNotesRouter. |
| L40 | ` router.use(requireNoteAuth); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L41 | ` router.use((req, res, next) => { req.body \|\|= {}; next(); }); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L43 | ` router.get('/', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L44 | ` const page = positiveId(req.query.page ?? 1); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.get(/). |
| L45 | ` const limit = Math.min(positiveId(req.query.limit ?? 20), 100); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.get(/). |
| L46 | ` const q = String(req.query.q ?? '').trim(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.get(/). |
| L47 | ` if (q.length > 200) throw new NoteError(422, 'INVALID_SEARCH', 'Từ khóa tối đa 200 ký tự.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong router.get(/). |
| L48 | ` const ids = req.query.label_ids ? labelIds(String(req.query.label_ids).split(',')) : []; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.get(/). |
| L49 | ` await ownedLabels(pool(req), req.noteUserId, ids); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong router.get(/). |
| L50 | ` const conditions = ['n.user_id = ?']; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.get(/). |
| L51 | ` const values = [req.noteUserId]; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.get(/). |
| L52 | ` if (q) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong router.get(/). |
| L53 | ` conditions.push("(n.title LIKE ? ESCAPE '!' OR ((n.is_locked = 0 AND n.password_hash IS NULL) AND n.content LIKE ? ESCAPE '!'))"); ` | Gọi conditions.push với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong router.get(/). |
| L54 | `` const search = `%${escapeLike(q)}%`; `` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.get(/). |
| L55 | ` values.push(search, search); ` | Gọi values.push với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong router.get(/). |
| L56 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.get(/). |
| L57 | ` if (ids.length) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong router.get(/). |
| L58 | `` conditions.push(`EXISTS(SELECT 1 FROM note_labels nl WHERE nl.note_id = n.id AND nl.label_id IN (${ids.map(() => '?').join(',')}))`); `` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong ids.map(). |
| L59 | ` values.push(...ids); ` | Gọi values.push với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong router.get(/). |
| L60 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.get(/). |
| L61 | ` const where = conditions.join(' AND '); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.get(/). |
| L62 | `` const [[count]] = await pool(req).execute(`SELECT COUNT(*) AS total FROM notes n WHERE ${where}`, values); `` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong router.get(/). |
| L63 | ` // Integers below are validated, not raw query-string interpolation. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L64 | ` const [rows] = await pool(req).execute( ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.get(/). |
| L65 | `` `SELECT n.*, EXISTS(SELECT 1 FROM note_shares s WHERE s.note_id = n.id) AS is_shared `` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong router.get(/). |
| L66 | ` FROM notes n WHERE ${where} ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong router.get(/). |
| L67 | ` ORDER BY (n.pinned_at IS NOT NULL) DESC, n.pinned_at DESC, n.updated_at DESC, n.id DESC ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong router.get(/). |
| L68 | `` LIMIT ${limit} OFFSET ${(page - 1) * limit}`, values, `` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong router.get(/). |
| L69 | ` ); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.get(/). |
| L70 | ` const labels = await labelsFor(pool(req), rows.filter(n => !n.is_locked && !n.password_hash).map(n => n.id), req.noteUserId); ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong rows.filter(). |
| L71 | ` const items = rows.map(row => serializeNote({ ...row, actor_id: req.noteUserId }, labels.filter(l => l.note_id === row.id).map(({ id, name }) => ({ id, name })))); ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong rows.map(). |
| L72 | ` res.json({ data: { items, meta: { page, limit, total: count.total, has_more: page * limit < count.total } } }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.get(/). |
| L73 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.get(/). |
| L75 | ` router.post('/', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L76 | ` const input = noteText(req.body); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/). |
| L77 | ` const operation = operationId(req.body.operation_id); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/). |
| L78 | ` const hash = requestHash(req, jwtSecret(req)); ` | Tạo hoặc kiểm digest request để nhận retry đúng body và chặn reuse operation cho dữ liệu khác; secret chỉ ở backend. Trong router.post(/). |
| L79 | ` let result; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/). |
| L80 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong router.post(/). |
| L81 | ` result = await transaction(pool(req), async db => { ` | Gán giá trị biểu thức bên phải vào result. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong transaction. |
| L82 | ` const receipt = await readReceipt(db, req.noteUserId, operation, hash); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L83 | ` if (receipt) return { id: receipt.note_id, replayed: true, version: receipt.applied_version }; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong transaction. |
| L84 | ` const [insert] = await db.execute('INSERT INTO notes (user_id, title, content, client_id) VALUES (?, ?, ?, ?)', [req.noteUserId, input.title, input.content, operation]); ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. Trong transaction. |
| L85 | ` await writeReceipt(db, req.noteUserId, operation, hash, insert.insertId, 1); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong transaction. |
| L86 | ` return { id: insert.insertId, version: 1 }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong transaction. |
| L87 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong transaction. |
| L88 | ` } catch (error) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong router.post(/). |
| L89 | ` if (error.code !== 'ER_DUP_ENTRY') throw error; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong router.post(/). |
| L90 | ` const receipt = await readReceipt(pool(req), req.noteUserId, operation, hash); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/). |
| L91 | ` if (!receipt) throw new NoteError(409, 'OPERATION_REUSED', 'Không thể tạo lại thao tác này.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong router.post(/). |
| L92 | ` result = { id: receipt.note_id, replayed: true, version: receipt.applied_version }; ` | Gán giá trị biểu thức bên phải vào result. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong router.post(/). |
| L93 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.post(/). |
| L94 | ` res.status(result.replayed ? 200 : 201).json({ data: { ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.post(/). |
| L95 | ` note: await detail(pool(req), req, result.id), ` | Thuộc tính note: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong router.post(/). |
| L96 | ` mutation: { operation_id: operation, applied_version: result.version, replayed: Boolean(result.replayed) }, ` | Thuộc tính mutation: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong router.post(/). |
| L97 | ` } }); ` | Đóng object/callback, lời gọi hàm hoặc component JSX đang mở ở trên; ghép từng dấu với cấu trúc tương ứng, không thêm thao tác dữ liệu. Trong router.post(/). |
| L98 | ` if (!result.replayed) publish(req, result.id, 1, operation, 'created'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong router.post(/). |
| L99 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.post(/). |
| L101 | ` router.get('/:id', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L102 | ` res.json({ data: { note: await detail(pool(req), req, positiveId(req.params.id)) } }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.get(/:id). |
| L103 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.get(/:id). |
| L105 | ` router.patch('/:id', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L106 | ` const input = noteText(req.body); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.patch(/:id). |
| L107 | ` res.json({ data: await mutate(req, 'edit', 'content', async db => { ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong mutate. |
| L108 | ` await db.execute('UPDATE notes SET title = ?, content = ?, content_version = content_version + 1 WHERE id = ?', [input.title, input.content, positiveId(req.params.id)]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong mutate. |
| L109 | ` }) }); ` | Đóng object/callback, lời gọi hàm hoặc component JSX đang mở ở trên; ghép từng dấu với cấu trúc tương ứng, không thêm thao tác dữ liệu. Trong mutate. |
| L110 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.patch(/:id). |
| L112 | ` router.delete('/:id', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L113 | ` const result = await mutate(req, 'delete', 'deleted', async (db, note) => { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong mutate. |
| L114 | ` const [files] = await db.execute('SELECT file_path FROM attachments WHERE note_id = ?', [note.id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong mutate. |
| L115 | ` await db.execute('DELETE FROM notes WHERE id = ?', [note.id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong mutate. |
| L116 | ` return { deleted: true, files }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong mutate. |
| L117 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong mutate. |
| L118 | ` await removeStoredFiles(result.files \|\| []); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong router.delete(/:id). |
| L119 | ` res.status(204).end(); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.delete(/:id). |
| L120 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.delete(/:id). |
| L122 | ` router.put('/:id/pin', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L123 | ` if (typeof req.body.pinned !== 'boolean') throw new NoteError(422, 'INVALID_PIN', 'pinned phải là boolean.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong router.put(/:id/pin). |
| L124 | ` res.json({ data: await mutate(req, 'pin', 'pin', async (db, note) => { ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong mutate. |
| L125 | ` await db.execute('UPDATE notes SET is_pinned = ?, pinned_at = CASE WHEN ? THEN COALESCE(pinned_at, UTC_TIMESTAMP(6)) ELSE NULL END WHERE id = ?', [req.body.pinned, req.body.pinned, note.id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong mutate. |
| L126 | ` }) }); ` | Đóng object/callback, lời gọi hàm hoặc component JSX đang mở ở trên; ghép từng dấu với cấu trúc tương ứng, không thêm thao tác dữ liệu. Trong mutate. |
| L127 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.put(/:id/pin). |
| L129 | ` router.put('/:id/labels', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L130 | ` const ids = labelIds(req.body.label_ids); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.put(/:id/labels). |
| L131 | ` res.json({ data: await mutate(req, 'labels', 'labels', async (db, note) => { ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong mutate. |
| L132 | ` await ownedLabels(db, req.noteUserId, ids); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong mutate. |
| L133 | ` await db.execute('DELETE FROM note_labels WHERE note_id = ?', [note.id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong mutate. |
| L134 | ` for (const id of ids) await db.execute('INSERT INTO note_labels (note_id, label_id) VALUES (?, ?)', [note.id, id]); ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. Trong mutate. |
| L135 | ` }) }); ` | Đóng object/callback, lời gọi hàm hoặc component JSX đang mở ở trên; ghép từng dấu với cấu trúc tương ứng, không thêm thao tác dữ liệu. Trong mutate. |
| L136 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.put(/:id/labels). |
| L138 | ` installAttachments(router, mutate); ` | Gọi installAttachments với các đối số trên dòng: cài upload/download/delete private và kiểm lại quyền khi finalize. Trong createNotesRouter. |
| L139 | ` return router; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong createNotesRouter. |
| L140 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong createNotesRouter. |
| L142 | ` function notesErrorHandler(error, req, res, next) { ` | chuẩn hóa lỗi HTTP và giấu SQL/stack khỏi response. Export cho phép file khác import nó. |
| L143 | ` if (res.headersSent) return next(error); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong notesErrorHandler. |
| L144 | ` const uploadError = error.code?.startsWith('LIMIT_'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong notesErrorHandler. |
| L145 | ` const duplicate = error.code === 'ER_DUP_ENTRY'; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong notesErrorHandler. |
| L146 | ` const status = error.status \|\| (uploadError ? 413 : duplicate ? 409 : 500); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong notesErrorHandler. |
| L147 | ` const code = uploadError ? 'UPLOAD_LIMIT' : duplicate ? 'DUPLICATE' : error.code \|\| 'INTERNAL_ERROR'; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong notesErrorHandler. |
| L148 | ` const message = error.status ? error.message : uploadError ? 'File quá lớn hoặc vượt số lượng cho phép.' : duplicate ? 'Dữ liệu đã tồn tại.' : 'Không thể xử lý yêu cầu. Vui lòng thử lại.'; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong notesErrorHandler. |
| L149 | ` if (status >= 500) console.error('NOTES_REQUEST_FAILED', { code: error.code \|\| error.name }); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong notesErrorHandler. |
| L150 | ` res.status(status).json({ error: { code, message, ...(error.details ? { details: error.details } : {}) } }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong notesErrorHandler. |
| L151 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong notesErrorHandler. |
| L153 | ` module.exports = { createNotesRouter, notesErrorHandler }; ` | Công khai các hàm cần dùng sang module khác; phần không export vẫn là chi tiết nội bộ của file. |

## backend/src/modules/labels/routes.js

Mã nguồn có 32 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const express = require('express'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const { requireNoteAuth } = require('../notes/access'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` const { positiveId, text, NoteError } = require('../notes/validation'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L5 | ` function createLabelsRouter() { ` | khai báo CRUD nhãn riêng user và chuẩn hóa lỗi qua middleware chung. Export cho phép file khác import nó. |
| L6 | ` const router = express.Router(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong createLabelsRouter. |
| L7 | ` router.use(requireNoteAuth); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L8 | ` router.get('/', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L9 | ` const [items] = await req.app.locals.notesPool.execute('SELECT id, name FROM labels WHERE user_id = ? ORDER BY name, id', [req.noteUserId]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong router.get(/). |
| L10 | ` res.json({ data: { items } }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.get(/). |
| L11 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.get(/). |
| L12 | ` router.post('/', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L13 | ` const name = text(req.body.name, 'Tên nhãn', 50).trim(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/). |
| L14 | ` const [result] = await req.app.locals.notesPool.execute('INSERT INTO labels (user_id, name) VALUES (?, ?)', [req.noteUserId, name]); ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. Trong router.post(/). |
| L15 | ` res.status(201).json({ data: { label: { id: result.insertId, name } } }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.post(/). |
| L16 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.post(/). |
| L17 | ` router.patch('/:id', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L18 | ` const id = positiveId(req.params.id); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.patch(/:id). |
| L19 | ` const name = text(req.body.name, 'Tên nhãn', 50).trim(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.patch(/:id). |
| L20 | ` const [result] = await req.app.locals.notesPool.execute('UPDATE labels SET name = ? WHERE id = ? AND user_id = ?', [name, id, req.noteUserId]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong router.patch(/:id). |
| L21 | ` if (!result.affectedRows) throw new NoteError(404, 'NOT_FOUND', 'Không tìm thấy nhãn.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong router.patch(/:id). |
| L22 | ` res.json({ data: { label: { id, name } } }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.patch(/:id). |
| L23 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.patch(/:id). |
| L24 | ` router.delete('/:id', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L25 | ` const [result] = await req.app.locals.notesPool.execute('DELETE FROM labels WHERE id = ? AND user_id = ?', [positiveId(req.params.id), req.noteUserId]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong router.delete(/:id). |
| L26 | ` if (!result.affectedRows) throw new NoteError(404, 'NOT_FOUND', 'Không tìm thấy nhãn.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong router.delete(/:id). |
| L27 | ` res.status(204).end(); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.delete(/:id). |
| L28 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.delete(/:id). |
| L29 | ` return router; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong createLabelsRouter. |
| L30 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong createLabelsRouter. |
| L32 | ` module.exports = { createLabelsRouter }; ` | Công khai các hàm cần dùng sang module khác; phần không export vẫn là chi tiết nội bộ của file. |

## backend/src/modules/notes/attachments.js

Mã nguồn có 161 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const fs = require('node:fs'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const fsp = require('node:fs/promises'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` const path = require('node:path'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` const crypto = require('node:crypto'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L5 | ` const multer = require('multer'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L6 | ` const { NoteError, positiveId, operationId, requestHash } = require('./validation'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L7 | ` const { getAccess, jwtSecret } = require('./access'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L8 | ` const { transaction, readReceipt, writeReceipt, assertVersion, detail, publish } = require('./repository'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L10 | ` const ROOT = path.resolve(process.env.UPLOAD_DIR \|\| path.join(__dirname, '../../../uploads')); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L11 | ` const TEMP = path.join(ROOT, '.incoming'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L12 | ` const MAX_BYTES = 10 * 1024 * 1024; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L13 | ` const TYPES = { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L14 | ` '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', ` | Ánh xạ đuôi file được phép tới MIME chính thức; backend còn kiểm chữ ký bytes, không chỉ tin đuôi hoặc MIME client gửi. |
| L15 | ` '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf', '.txt': 'text/plain', ` | Ánh xạ đuôi file được phép tới MIME chính thức; backend còn kiểm chữ ký bytes, không chỉ tin đuôi hoặc MIME client gửi. |
| L16 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L18 | ` function storedPath(key) { ` | chỉ chấp nhận storage key do server sinh, chặn path traversal. Export cho phép file khác import nó. |
| L19 | ` // Never use a client-provided path. Old unsafe paths fail closed as well. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L20 | ` if (typeof key !== 'string' \|\| !/^notes\/[0-9a-f-]{36}\.(jpg\|jpeg\|png\|webp\|mp4\|webm\|pdf\|txt)$/.test(key)) { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L21 | ` throw new NoteError(404, 'FILE_NOT_FOUND', 'Không tìm thấy tệp.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong storedPath. |
| L22 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong storedPath. |
| L23 | ` return path.join(ROOT, key); ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong storedPath. |
| L24 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong storedPath. |
| L26 | ` async function removeStoredFiles(files) { ` | xóa bytes của file sau mutation; ghi nhận lỗi cleanup thay vì lộ đường dẫn. Export cho phép file khác import nó. |
| L27 | ` for (const file of files) { ` | Lặp qua tập phần tử trên dòng; mỗi lượt xử lý một ID/file/test case, không phải tự động chạy song song. Trong removeStoredFiles. |
| L28 | ` try { await fsp.unlink(storedPath(file.file_path)); } ` | Thao tác với file server đã được kiểm tra/định danh; việc xóa/rename cần cleanup nếu transaction thất bại. Trong removeStoredFiles. |
| L29 | ` catch (error) { if (error.code !== 'ENOENT') console.error('ATTACHMENT_CLEANUP_FAILED'); } ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong removeStoredFiles. |
| L30 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong removeStoredFiles. |
| L31 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong removeStoredFiles. |
| L33 | ` function matchesType(bytes, mime) { ` | đối chiếu chữ ký bytes với MIME/đuôi file allowlist. Export cho phép file khác import nó. |
| L34 | ` if (mime === 'image/jpeg') return bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong matchesType. |
| L35 | ` if (mime === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong matchesType. |
| L36 | ` if (mime === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong matchesType. |
| L37 | ` if (mime === 'video/mp4') return bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp'; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong matchesType. |
| L38 | ` if (mime === 'video/webm') return bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong matchesType. |
| L39 | ` if (mime === 'application/pdf') return bytes.toString('ascii', 0, 5) === '%PDF-'; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong matchesType. |
| L40 | ` if (mime === 'text/plain') { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong matchesType. |
| L41 | ` try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); return !bytes.includes(0); } ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong matchesType. |
| L42 | ` catch { return false; } ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong matchesType. |
| L43 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong matchesType. |
| L44 | ` return false; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong matchesType. |
| L45 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong matchesType. |
| L47 | ` function rangeFor(header, size) { ` | phân tích một byte range để video có thể tua; range sai trả false. Export cho phép file khác import nó. |
| L48 | ` if (!header) return null; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong rangeFor. |
| L49 | ` const match = /^bytes=(\d*)-(\d*)$/.exec(header); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong rangeFor. |
| L50 | ` if (!match \|\| (!match[1] && !match[2])) return false; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong rangeFor. |
| L51 | ` let start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2])); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong rangeFor. |
| L52 | ` let end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong rangeFor. |
| L53 | ` if (!Number.isSafeInteger(start) \|\| !Number.isSafeInteger(end) \|\| start < 0 \|\| start > end \|\| start >= size) return false; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong rangeFor. |
| L54 | ` return { start, end }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong rangeFor. |
| L55 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong rangeFor. |
| L57 | ` function installAttachments(router, mutate) { ` | cài upload/download/delete private và kiểm lại quyền khi finalize. Export cho phép file khác import nó. |
| L58 | ` const upload = multer({ ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong installAttachments. |
| L59 | ` storage: multer.diskStorage({ ` | Thuộc tính storage: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong installAttachments. |
| L60 | ` destination(req, file, callback) { fsp.mkdir(TEMP, { recursive: true }).then(() => callback(null, TEMP), callback); }, ` | Gọi destination với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong destination. |
| L61 | ` filename(req, file, callback) { callback(null, crypto.randomUUID()); }, ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong filename. |
| L62 | ` }), ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong installAttachments. |
| L63 | ` limits: { fileSize: MAX_BYTES, files: 5, fields: 2, fieldSize: 200 }, ` | Thuộc tính limits: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong installAttachments. |
| L64 | ` }).array('files', 5); ` | Cấu hình Multer nhận trường multipart files dưới dạng mảng, tối đa năm file trong một request. |
| L66 | ` router.post('/:id/attachments', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L67 | ` const id = positiveId(req.params.id); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/:id/attachments). |
| L68 | ` await getAccess(req.app.locals.notesPool, req, id, 'upload'); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong router.post(/:id/attachments). |
| L69 | ` await new Promise((resolve, reject) => upload(req, res, error => error ? reject(error) : resolve())); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. |
| L70 | ` const temporary = req.files \|\| []; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/:id/attachments). |
| L71 | ` const moved = []; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/:id/attachments). |
| L72 | ` let committed = false; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/:id/attachments). |
| L73 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong router.post(/:id/attachments). |
| L74 | ` if (!temporary.length) throw new NoteError(422, 'NO_FILES', 'Chọn ít nhất một tệp.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong router.post(/:id/attachments). |
| L75 | ` const manifest = []; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/:id/attachments). |
| L76 | ` for (const file of temporary) { ` | Lặp qua tập phần tử trên dòng; mỗi lượt xử lý một ID/file/test case, không phải tự động chạy song song. Trong router.post(/:id/attachments). |
| L77 | ` const ext = path.extname(file.originalname).toLowerCase(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/:id/attachments). |
| L78 | ` const mime = TYPES[ext]; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/:id/attachments). |
| L79 | ` const bytes = await fsp.readFile(file.path); ` | Thao tác với file server đã được kiểm tra/định danh; việc xóa/rename cần cleanup nếu transaction thất bại. Trong router.post(/:id/attachments). |
| L80 | ` if (!bytes.length \|\| !mime \|\| file.mimetype !== mime \|\| !matchesType(bytes, mime)) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong router.post(/:id/attachments). |
| L81 | ` throw new NoteError(415, 'INVALID_FILE_TYPE', 'Chỉ nhận JPEG, PNG, WebP, MP4, WebM, PDF và TXT đúng định dạng.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong router.post(/:id/attachments). |
| L82 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.post(/:id/attachments). |
| L83 | ` const name = path.basename(file.originalname).replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/:id/attachments). |
| L84 | ` manifest.push({ file, ext, mime, name, digest: crypto.createHash('sha256').update(bytes).digest('hex') }); ` | Gọi manifest.push với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong router.post(/:id/attachments). |
| L85 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.post(/:id/attachments). |
| L86 | ` const operation = operationId(req.body.operation_id); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.post(/:id/attachments). |
| L87 | ` const hash = requestHash(req, jwtSecret(req), { ` | Tạo hoặc kiểm digest request để nhận retry đúng body và chặn reuse operation cho dữ liệu khác; secret chỉ ở backend. Trong router.post(/:id/attachments). |
| L88 | ` ...req.body, files: manifest.map(x => ({ name: x.name, mime: x.mime, digest: x.digest })), ` | Biến đổi từng phần tử thành kết quả mới; trong JSX thường tạo danh sách component có key ổn định. Trong manifest.map(). |
| L89 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.post(/:id/attachments). |
| L90 | ` const result = await transaction(req.app.locals.notesPool, async db => { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L91 | ` const note = await getAccess(db, req, id, 'upload', true); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L92 | ` const previous = await readReceipt(db, req.noteUserId, operation, hash); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L93 | ` if (previous) return { version: previous.applied_version, replayed: true }; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong transaction. |
| L94 | ` assertVersion(note, req.body.base_version); ` | Gọi assertVersion với các đối số trên dòng: chặn base_version thiếu/sai hoặc cũ hơn note hiện hành. Trong transaction. |
| L95 | ` const [[count]] = await db.execute('SELECT COUNT(*) AS total FROM attachments WHERE note_id = ?', [id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong transaction. |
| L96 | ` if (count.total + manifest.length > 10) throw new NoteError(413, 'ATTACHMENT_LIMIT', 'Mỗi ghi chú tối đa 10 tệp.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong transaction. |
| L97 | ` await fsp.mkdir(path.join(ROOT, 'notes'), { recursive: true }); ` | Thao tác với file server đã được kiểm tra/định danh; việc xóa/rename cần cleanup nếu transaction thất bại. Trong transaction. |
| L98 | ` for (const item of manifest) { ` | Lặp qua tập phần tử trên dòng; mỗi lượt xử lý một ID/file/test case, không phải tự động chạy song song. Trong transaction. |
| L99 | `` const key = `notes/${crypto.randomUUID()}${item.ext}`; `` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong transaction. |
| L100 | ` await fsp.rename(item.file.path, storedPath(key)); ` | Thao tác với file server đã được kiểm tra/định danh; việc xóa/rename cần cleanup nếu transaction thất bại. Trong transaction. |
| L101 | ` moved.push({ file_path: key }); ` | Gọi moved.push với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong transaction. |
| L102 | ` await db.execute('INSERT INTO attachments (note_id, original_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)', [id, item.name, key, item.mime, item.file.size]); ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. Trong transaction. |
| L103 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong transaction. |
| L104 | ` const version = note.version + 1; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong transaction. |
| L105 | ` await db.execute('UPDATE notes SET version = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [version, id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong transaction. |
| L106 | ` await writeReceipt(db, req.noteUserId, operation, hash, id, version); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong transaction. |
| L107 | ` return { version }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong transaction. |
| L108 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong transaction. |
| L109 | ` committed = true; ` | Gán giá trị biểu thức bên phải vào committed. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong router.post(/:id/attachments). |
| L110 | ` if (!result.replayed) publish(req, id, result.version, operation, 'attachments'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong router.post(/:id/attachments). |
| L111 | ` res.status(result.replayed ? 200 : 201).json({ data: { ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.post(/:id/attachments). |
| L112 | ` note: await detail(req.app.locals.notesPool, req, id), ` | Thuộc tính note: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong router.post(/:id/attachments). |
| L113 | ` mutation: { operation_id: operation, applied_version: result.version, replayed: Boolean(result.replayed) }, ` | Thuộc tính mutation: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong router.post(/:id/attachments). |
| L114 | ` } }); ` | Đóng object/callback, lời gọi hàm hoặc component JSX đang mở ở trên; ghép từng dấu với cấu trúc tương ứng, không thêm thao tác dữ liệu. Trong router.post(/:id/attachments). |
| L115 | ` } finally { ` | Khối luôn chạy sau thành công hoặc lỗi, thường để tắt loading, release connection hoặc dọn file. |
| L116 | ` await Promise.all(temporary.map(file => fsp.unlink(file.path).catch(() => {}))); ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong temporary.map(). |
| L117 | ` if (!committed) await removeStoredFiles(moved); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong router.post(/:id/attachments). |
| L118 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.post(/:id/attachments). |
| L119 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.post(/:id/attachments). |
| L121 | ` router.delete('/:id/attachments/:fileId', async (req, res) => { ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L122 | ` let removed; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong router.delete(/:id/attachments/:fileId). |
| L123 | ` const result = await mutate(req, 'upload', 'attachments', async (db, note) => { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong mutate. |
| L124 | ` const [rows] = await db.execute('SELECT * FROM attachments WHERE id = ? AND note_id = ?', [positiveId(req.params.fileId), note.id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong mutate. |
| L125 | ` if (!rows.length) throw new NoteError(404, 'FILE_NOT_FOUND', 'Không tìm thấy tệp.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong mutate. |
| L126 | ` removed = rows[0]; ` | Gán giá trị biểu thức bên phải vào removed. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong mutate. |
| L127 | ` await db.execute('DELETE FROM attachments WHERE id = ? AND note_id = ?', [removed.id, note.id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong mutate. |
| L128 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong mutate. |
| L129 | ` if (removed) await removeStoredFiles([removed]); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong router.delete(/:id/attachments/:fileId). |
| L130 | ` res.json({ data: result }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong router.delete(/:id/attachments/:fileId). |
| L131 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong router.delete(/:id/attachments/:fileId). |
| L133 | ` async function sendFile(req, res, next) { ` | kiểm note và file cùng quyền, xử lý Range/HEAD và stream bytes no-store. Export cho phép file khác import nó. |
| L134 | ` const id = positiveId(req.params.id); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong sendFile. |
| L135 | ` await getAccess(req.app.locals.notesPool, req, id); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong sendFile. |
| L136 | ` const [rows] = await req.app.locals.notesPool.execute('SELECT * FROM attachments WHERE id = ? AND note_id = ?', [positiveId(req.params.fileId), id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong sendFile. |
| L137 | ` const file = rows[0]; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong sendFile. |
| L138 | ` if (!file) throw new NoteError(404, 'FILE_NOT_FOUND', 'Không tìm thấy tệp.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong sendFile. |
| L139 | ` let stat; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong sendFile. |
| L140 | ` try { stat = await fsp.stat(storedPath(file.file_path)); } ` | Thao tác với file server đã được kiểm tra/định danh; việc xóa/rename cần cleanup nếu transaction thất bại. Trong sendFile. |
| L141 | ` catch { throw new NoteError(404, 'FILE_NOT_FOUND', 'Tệp không còn trên máy chủ.'); } ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong sendFile. |
| L142 | ` const range = rangeFor(req.headers.range, stat.size); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong sendFile. |
| L143 | ` res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong sendFile. |
| L144 | `` if (range === false) return res.status(416).set('Content-Range', `bytes */${stat.size}`).end(); `` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong sendFile. |
| L145 | ` res.attachment(file.original_name).type(file.file_type); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong sendFile. |
| L146 | ` if (file.file_type.startsWith('image/') \|\| file.file_type.startsWith('video/')) res.set('Content-Disposition', 'inline'); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong sendFile. |
| L147 | ` const start = range?.start ?? 0; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong sendFile. |
| L148 | ` const end = range?.end ?? stat.size - 1; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong sendFile. |
| L149 | `` if (range) res.status(206).set('Content-Range', `bytes ${start}-${end}/${stat.size}`); `` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong sendFile. |
| L150 | ` res.set('Content-Length', String(Math.max(0, end - start + 1))); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong sendFile. |
| L151 | ` if (req.method === 'HEAD' \|\| stat.size === 0) return res.end(); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong sendFile. |
| L152 | ` const stream = fs.createReadStream(storedPath(file.file_path), { start, end }); ` | Thao tác với file server đã được kiểm tra/định danh; việc xóa/rename cần cleanup nếu transaction thất bại. Trong sendFile. |
| L153 | ` stream.on('error', error => res.headersSent ? res.destroy() : next(error)); ` | Gọi stream.on với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong stream.on(error). |
| L154 | ` res.on('close', () => stream.destroy()); ` | Gọi res.on với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong res.on(close). |
| L155 | ` stream.pipe(res); ` | Gọi stream.pipe với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong sendFile. |
| L156 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong sendFile. |
| L157 | ` router.get('/:id/attachments/:fileId/content', sendFile); ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L158 | ` router.head('/:id/attachments/:fileId/content', sendFile); ` | Đăng ký endpoint với method/path ghi trên dòng; router đã có middleware xác thực. Handler async được Express5 chuyển lỗi tới error middleware. |
| L159 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong installAttachments. |
| L161 | ` module.exports = { installAttachments, removeStoredFiles, storedPath, matchesType, rangeFor, MAX_BYTES, TYPES }; ` | Công khai các hàm cần dùng sang module khác; phần không export vẫn là chi tiết nội bộ của file. |

## backend/src/modules/notes/install.js

Mã nguồn có 15 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const { createNotesRouter, notesErrorHandler } = require('./routes'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const { createLabelsRouter } = require('../labels/routes'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` function installNotes(app, pool) { ` | mount notes/labels và error middleware vào Express app hiện có. Export cho phép file khác import nó. |
| L5 | ` app.locals.notesPool = pool; ` | Gán giá trị biểu thức bên phải vào app.locals.notesPool. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong installNotes. |
| L6 | ` app.use(['/api/notes', '/api/labels'], (req, res, next) => { ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L7 | ` res.set('Cache-Control', 'private, no-store'); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong app.use(). |
| L8 | ` next(); ` | Gọi next với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong app.use(). |
| L9 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong app.use(). |
| L10 | ` app.use('/api/notes', createNotesRouter()); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L11 | ` app.use('/api/labels', createLabelsRouter()); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L12 | ` app.use(notesErrorHandler); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L13 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong installNotes. |
| L15 | ` module.exports = { installNotes }; ` | Công khai các hàm cần dùng sang module khác; phần không export vẫn là chi tiết nội bộ của file. |

## database/migrations/001_member2_notes.sql

Mã nguồn có 30 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` -- Run ONCE after the existing schema.sql. Back up data first. IDs stay integers. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L2 | ` -- Legacy seed used NOW() in the connection's time zone. Preserve its instant in UTC. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L3 | ` -- If existing pinned_at values are ALREADY UTC, SET time_zone = '+00:00' before this file. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L4 | ` SET @notes_legacy_offset = TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), NOW()); ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L5 | ` ALTER TABLE notes ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L6 | ` MODIFY COLUMN pinned_at DATETIME(6) DEFAULT NULL, ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L7 | ` MODIFY COLUMN updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L8 | ` ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1, ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L9 | ` ADD COLUMN content_version INT UNSIGNED NOT NULL DEFAULT 1, ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L10 | ` ADD COLUMN client_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL, ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L11 | ` ADD UNIQUE KEY uq_notes_user_client (user_id, client_id), ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L12 | ` ADD KEY idx_notes_owner_order (user_id, pinned_at, updated_at, id); ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L14 | ` UPDATE notes SET pinned_at = TIMESTAMPADD(SECOND, -@notes_legacy_offset, pinned_at), updated_at = updated_at ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L15 | ` WHERE pinned_at IS NOT NULL AND @notes_legacy_offset <> 0; ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. |
| L17 | ` CREATE TABLE note_mutations ( ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L18 | ` user_id INT NOT NULL, ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L19 | ` operation_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L20 | ` request_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L21 | ` note_id INT NOT NULL, ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L22 | ` applied_version INT UNSIGNED NOT NULL, ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L23 | ` result_json JSON NOT NULL, ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L24 | ` created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L25 | ` PRIMARY KEY (user_id, operation_id), ` | Ràng buộc database: khóa/quan hệ hoặc storage engine; bảo vệ tính duy nhất và liên kết ở mức DB, ngoài validation JavaScript. |
| L26 | ` KEY idx_note_mutations_note (note_id), ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L27 | ` CONSTRAINT fk_note_mutations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ` | Ràng buộc database: khóa/quan hệ hoặc storage engine; bảo vệ tính duy nhất và liên kết ở mức DB, ngoài validation JavaScript. |
| L28 | ` ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; ` | Ràng buộc database: khóa/quan hệ hoặc storage engine; bảo vệ tính duy nhất và liên kết ở mức DB, ngoài validation JavaScript. |
| L30 | ` -- note_id deliberately has no FK: a delete receipt must survive deletion for retry. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |

## backend/src/modules/notes/setup-db.js

Mã nguồn có 27 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` require('dotenv').config(); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const fs = require('node:fs/promises'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` const path = require('node:path'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` const mysql = require('mysql2/promise'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L6 | ` async function setup() { ` | tạo schema local và áp dụng migration có kiểm tra, seed chỉ khi được yêu cầu. Export cho phép file khác import nó. |
| L7 | ` if (process.env.NODE_ENV === 'production') throw new Error('Run reviewed migrations manually in production.'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong setup. |
| L8 | ` const name = process.env.DB_NAME \|\| 'note_app_db'; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong setup. |
| L9 | ` const connection = await mysql.createConnection({ ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong setup. |
| L10 | ` host: process.env.DB_HOST \|\| 'localhost', port: Number(process.env.DB_PORT \|\| 3306), ` | Thuộc tính host: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong setup. |
| L11 | ` user: process.env.DB_USER \|\| 'root', password: process.env.DB_PASSWORD \|\| '', multipleStatements: true, ` | Thuộc tính user: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong setup. |
| L12 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong setup. |
| L13 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong setup. |
| L14 | ` const folder = path.resolve(__dirname, '../../../../database'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong setup. |
| L15 | `` const read = async file => (await fs.readFile(path.join(folder, file), 'utf8')).replaceAll('`note_app_db`', mysql.escapeId(name)); `` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong read. |
| L16 | ` await connection.query(await read('schema.sql')); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong setup. |
| L17 | ` const [columns] = await connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notes' AND COLUMN_NAME IN ('version','content_version','client_id')", [name]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong setup. |
| L18 | ` const [tables] = await connection.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'note_mutations'", [name]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong setup. |
| L19 | ` if (!columns.length && !tables.length) await connection.query(await read('migrations/001_member2_notes.sql')); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong setup. |
| L20 | ` else if (columns.length !== 3 \|\| tables.length !== 1) throw new Error('Migration bị áp dụng dở dang; hãy kiểm tra và phục hồi backup, không chạy chồng.'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong setup. |
| L21 | ` await connection.query("SET time_zone = '+00:00'"); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong setup. |
| L22 | ` if (process.argv.includes('--seed')) await connection.query(await read('seed.sql')); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong setup. |
| L23 | ` console.log('Notes schema ready. Seed only runs when --seed is supplied.'); ` | Gọi console.log với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong setup. |
| L24 | ` } finally { await connection.end(); } ` | Trả connection về pool hoặc đóng kết nối test/setup để không rò rỉ tài nguyên. |
| L25 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong setup. |
| L27 | ` setup().catch(error => { console.error(error.message); process.exitCode = 1; }); ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong undefined.catch(). |

## backend/src/modules/notes/dev-server.js

Mã nguồn có 28 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` // Diagnostic server only: never imported by app.js or started by npm start. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L2 | ` require('dotenv').config(); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` const crypto = require('node:crypto'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` const express = require('express'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L5 | ` const jwt = require('jsonwebtoken'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L6 | ` const { pool } = require('../../config/db'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L7 | ` const { installNotes } = require('./install'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L9 | ` if (process.env.NODE_ENV === 'production') throw new Error('Notes playground is disabled in production.'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L10 | ` const app = express(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L11 | ` app.locals.notesJwtSecret = crypto.randomBytes(48).toString('hex'); ` | Gán giá trị biểu thức bên phải vào app.locals.notesJwtSecret. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. |
| L12 | ` app.use(express.json()); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L13 | ` app.post('/api/dev/session', async (req, res) => { ` | Gọi app.post với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong app.post(/api/dev/session). |
| L14 | ` const origin = req.headers.origin; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong app.post(/api/dev/session). |
| L15 | ` if (origin && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong app.post(/api/dev/session). |
| L16 | ` return res.status(403).json({ error: { message: 'Local playground only.' } }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong app.post(/api/dev/session). |
| L17 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong app.post(/api/dev/session). |
| L18 | ` const id = Number(req.body.user_id); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong app.post(/api/dev/session). |
| L19 | ` if (![1, 2, 3].includes(id)) return res.status(400).json({ error: { message: 'Chỉ nhận tài khoản seed 1, 2, 3.' } }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong app.post(/api/dev/session). |
| L20 | ` const [rows] = await pool.execute('SELECT id, email, display_name FROM users WHERE id = ?', [id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong app.post(/api/dev/session). |
| L21 | ` if (!rows.length) return res.status(404).json({ error: { message: 'Chưa có tài khoản mẫu. Chạy notes:setup -- --seed trên DB local.' } }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong app.post(/api/dev/session). |
| L22 | ` const token = jwt.sign({ id }, app.locals.notesJwtSecret, { algorithm: 'HS256', expiresIn: '1h' }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong app.post(/api/dev/session). |
| L23 | ` res.json({ token, user: rows[0] }); ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong app.post(/api/dev/session). |
| L24 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong app.post(/api/dev/session). |
| L25 | ` installNotes(app, pool); ` | Gọi installNotes với các đối số trên dòng: mount notes/labels và error middleware vào Express app hiện có. |
| L26 | ` app.listen(Number(process.env.NOTES_DEMO_PORT \|\| process.env.PORT \|\| 5000), '127.0.0.1', () => { ` | Gọi app.listen với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong app.listen(). |
| L27 | ` console.log('Local-only notes playground ready. Open /notes-dev.html on the Vite frontend.'); ` | Gọi console.log với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong app.listen(). |
| L28 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong app.listen(). |

## backend/src/app.js

Mã nguồn có 36 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const express = require('express'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const cors = require('cors'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` const dotenv = require('dotenv'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` const { pool, testConnection } = require('./config/db'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L5 | ` const { installNotes } = require('./modules/notes/install'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L7 | ` dotenv.config(); ` | Gọi dotenv.config với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. |
| L9 | ` const app = express(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L10 | ` const PORT = process.env.PORT \|\| 5000; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L12 | ` // Essential middlewares ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L13 | ` app.use(cors()); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L14 | ` app.use(express.json()); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L15 | ` app.use(express.urlencoded({ extended: true })); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L17 | ` // Attachments must pass note ownership/share/lock checks; never expose uploads statically. ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L18 | ` installNotes(app, pool); ` | Gọi installNotes với các đối số trên dòng: mount notes/labels và error middleware vào Express app hiện có. |
| L20 | ` // Health check endpoint ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L21 | ` app.get('/api/health', (req, res) => { ` | Gọi app.get với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong app.get(/api/health). |
| L22 | ` res.status(200).json({ ` | Đặt status/header/body HTTP theo dòng. JSON thành công bọc trong data; private file/API dùng no-store để hạn chế cache. Trong app.get(/api/health). |
| L23 | ` status: 'success', ` | Thuộc tính status: trạng thái UI hoặc HTTP. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong app.get(/api/health). |
| L24 | ` message: 'Note Management API is healthy and running', ` | Thuộc tính message: thông báo dễ hiểu. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong app.get(/api/health). |
| L25 | ` timestamp: new Date().toISOString() ` | Thuộc tính timestamp: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. Trong app.get(/api/health). |
| L26 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong app.get(/api/health). |
| L27 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong app.get(/api/health). |
| L29 | ` // Start listening and verify DB connection ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L30 | ` app.listen(PORT, async () => { ` | Gọi app.listen với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong app.listen(). |
| L31 | `` console.log(`Server is running on port ${PORT}`); `` | Gọi console.log với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong app.listen(). |
| L32 | `` console.log(`API Base URL: http://localhost:${PORT}/api`); `` | Gọi console.log với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong app.listen(). |
| L33 | ` await testConnection(); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong app.listen(). |
| L34 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong app.listen(). |
| L36 | ` module.exports = app; ` | Công khai các hàm cần dùng sang module khác; phần không export vẫn là chi tiết nội bộ của file. |

## backend/src/config/db.js

Mã nguồn có 37 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const mysql = require('mysql2/promise'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const dotenv = require('dotenv'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` dotenv.config(); ` | Gọi dotenv.config với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. |
| L6 | ` // Create connection pool ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L7 | ` const pool = mysql.createPool({ ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L8 | ` host: process.env.DB_HOST \|\| 'localhost', ` | Thuộc tính host: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L9 | ` port: parseInt(process.env.DB_PORT, 10) \|\| 3306, ` | Thuộc tính port: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L10 | ` user: process.env.DB_USER \|\| 'root', ` | Thuộc tính user: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L11 | ` password: process.env.DB_PASSWORD \|\| '', ` | Thuộc tính password: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L12 | ` database: process.env.DB_NAME \|\| 'note_app_db', ` | Thuộc tính database: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L13 | ` waitForConnections: true, ` | Thuộc tính waitForConnections: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L14 | ` connectionLimit: 10, ` | Thuộc tính connectionLimit: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L15 | ` queueLimit: 0, ` | Thuộc tính queueLimit: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L16 | ` timezone: 'Z' ` | Thuộc tính timezone: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L17 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L19 | ` pool.pool.on('connection', connection => connection.query("SET time_zone = '+00:00'")); ` | Gọi pool.pool.on với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong undefined.on(connection). |
| L21 | ` // Helper function to test DB connectivity on startup ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L22 | ` async function testConnection() { ` | Khai báo hàm/component/lớp để dùng trong các dòng phía dưới. Export cho phép file khác import nó. |
| L23 | ` try { ` | Bắt đầu khối có xử lý lỗi; khi lệnh bên trong throw/reject, chuyển tới catch tương ứng thay vì bỏ qua lỗi. Trong testConnection. |
| L24 | ` const connection = await pool.getConnection(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong testConnection. |
| L25 | ` console.log('Connected successfully to MySQL database:', process.env.DB_NAME \|\| 'note_app_db'); ` | Gọi console.log với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong testConnection. |
| L26 | ` connection.release(); ` | Gọi connection.release với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong testConnection. |
| L27 | ` return true; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong testConnection. |
| L28 | ` } catch (error) { ` | Nhánh xử lý lỗi: giữ dữ liệu cần retry, báo lỗi rõ hoặc rollback/cleanup; không giả trả thành công. Trong testConnection. |
| L29 | ` console.error('Failed to connect to MySQL database:', error.message); ` | Gọi console.error với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong testConnection. |
| L30 | ` return false; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong testConnection. |
| L31 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong testConnection. |
| L32 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong testConnection. |
| L34 | ` module.exports = { ` | Công khai các hàm cần dùng sang module khác; phần không export vẫn là chi tiết nội bộ của file. |
| L35 | ` pool, ` | Export theo cú pháp object shorthand: tên thuộc tính và tên biến/hàm giống nhau. Module khác import để query DB hoặc kiểm kết nối. |
| L36 | ` testConnection ` | Export theo cú pháp object shorthand: tên thuộc tính và tên biến/hàm giống nhau. Module khác import để query DB hoặc kiểm kết nối. |
| L37 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |

## backend/package.json

Mã nguồn có 34 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` { ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L2 | ` "name": "note-app-backend", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L3 | ` "version": "1.0.0", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L4 | ` "description": "Backend REST API for Note Management Application - TDTU Final Project", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L5 | ` "main": "src/app.js", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L6 | ` "scripts": { ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L7 | ` "start": "node src/app.js", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L8 | ` "dev": "nodemon src/app.js", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L9 | ` "notes:dev": "node src/modules/notes/dev-server.js", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L10 | ` "notes:setup": "node src/modules/notes/setup-db.js", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L11 | ` "test": "node --test src/modules/notes/tests/*.test.cjs" ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L12 | ` }, ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L13 | ` "repository": { ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L14 | ` "type": "git", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L15 | ` "url": "git+https://github.com/Kuma984/note-management-app.git" ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L16 | ` }, ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L17 | ` "keywords": [], ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L18 | ` "author": "", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L19 | ` "license": "ISC", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L20 | ` "type": "commonjs", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L21 | ` "dependencies": { ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L22 | ` "bcryptjs": "^3.0.3", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L23 | ` "cors": "^2.8.6", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L24 | ` "dotenv": "^18.0.10", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L25 | ` "express": "^5.3.0", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L26 | ` "jsonwebtoken": "^9.0.3", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L27 | ` "multer": "^2.5.0", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L28 | ` "mysql2": "^3.24.6", ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L29 | ` "nodemailer": "^10.6.1" ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L30 | ` }, ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L31 | ` "devDependencies": { ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L32 | ` "nodemon": "^3.1.14" ` | Thuộc tính cấu hình package: scripts là lệnh npm; dependencies là thư viện chạy; devDependencies là công cụ phát triển. Giá trị trên dòng không phải hàm React. |
| L33 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L34 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |

## frontend/src/services/api.js

Mã nguồn có 17 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import axios from 'axios'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` // Relative URL to satisfy course requirement ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L4 | ` const api = axios.create({ ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L5 | ` baseURL: '/api' ` | Thuộc tính baseURL: giá trị cấu hình/dữ liệu được đặt tên để bên sử dụng đọc lại. Giá trị cụ thể là biểu thức bên phải dấu hai chấm. |
| L6 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. |
| L8 | ` // Attach JWT token to requests if available ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L9 | ` api.interceptors.request.use((config) => { ` | Gọi interface API tương ứng trên dòng; await/then xử lý Promise, và lỗi được giữ lại cho catch hoặc UI. Trong undefined.use(). |
| L10 | ` const token = localStorage.getItem('token'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong undefined.use(). |
| L11 | ` if (token && !config.headers.Authorization) { ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong undefined.use(). |
| L12 | `` config.headers.Authorization = `Bearer ${token}`; `` | Gán giá trị biểu thức bên phải vào config.headers.Authorization. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong undefined.use(). |
| L13 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong undefined.use(). |
| L14 | ` return config; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong undefined.use(). |
| L15 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong undefined.use(). |
| L17 | ` export default api; ` | Khai báo hàm/component/lớp để dùng trong các dòng phía dưới. Export cho phép file khác import nó. |

## frontend/src/components/MainLayout.jsx

Mã nguồn có 30 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import React from 'react'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L2 | ` import { Outlet } from 'react-router-dom'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` import Navbar from './Navbar'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L4 | ` import Sidebar from './Sidebar'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L5 | ` import { NotesSearchProvider } from '../features/notes/NotesSearchContext'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L7 | ` export default function MainLayout() { ` | Khai báo hàm/component/lớp để dùng trong các dòng phía dưới. Export cho phép file khác import nó. |
| L8 | ` const user = JSON.parse(localStorage.getItem('user') \|\| 'null'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong MainLayout. |
| L10 | ` return ( ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong MainLayout. |
| L11 | ` <NotesSearchProvider><div className="d-flex flex-column min-vh-100"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L12 | ` <Navbar /> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L14 | ` {/* Prominent banner for unverified account (as required in project rubric) */} ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L15 | ` {user && user.is_verified === false && ( ` | Render có điều kiện bằng &&: chỉ khi điều kiện phía trái đúng thì JSX phía phải xuất hiện. Điều này chỉ điều khiển UI, không thay kiểm quyền backend. |
| L16 | ` <div className="alert alert-warning text-center rounded-0 mb-0 py-2" role="alert"> ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L17 | ` <i className="bi bi-exclamation-triangle-fill me-2"></i> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L18 | ` Your account is unverified. Please check your email to complete activation. ` | Nội dung cảnh báo tài khoản chưa xác minh của layout scaffold; hiển thị khi isVerified sai, không tự thực hiện xác minh email. |
| L19 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L20 | ` )} ` | Đóng cấu trúc mảng/object/JSX hoặc kết thúc câu lệnh đang mở; xem khối bao quanh để ghép cặp dấu. Trong MainLayout. |
| L22 | ` <div className="d-flex flex-grow-1"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L23 | ` <Sidebar /> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L24 | ` <main className="flex-grow-1 p-3 p-md-4 bg-body" style={{ minWidth: 0 }}> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L25 | ` <Outlet /> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L26 | ` </main> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L27 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L28 | ` </div></NotesSearchProvider> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L29 | ` ); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong MainLayout. |
| L30 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong MainLayout. |

## frontend/src/components/Navbar.jsx

Mã nguồn có 88 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` import React, { useState, useEffect } from 'react'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L2 | ` import { Link, useNavigate } from 'react-router-dom'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L3 | ` import { useNotesSearch } from '../features/notes/NotesSearchContext'; ` | Nhập component/hook/API hoặc CSS từ module khác để sử dụng trong file này. Import không phải lời gọi API. |
| L5 | ` export default function Navbar() { ` | Khai báo hàm/component/lớp để dùng trong các dòng phía dưới. Export cho phép file khác import nó. |
| L6 | ` const navigate = useNavigate(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong Navbar. |
| L7 | ` const { query, setQuery } = useNotesSearch(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong Navbar. |
| L8 | ` const [theme, setTheme] = useState(localStorage.getItem('theme') \|\| 'light'); ` | Tạo state theme (giá trị giao diện cần ghi nhớ) và hàm cập nhật setTheme; cập nhật qua setter khiến React render lại. |
| L9 | ` const user = JSON.parse(localStorage.getItem('user') \|\| 'null'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong Navbar. |
| L11 | ` // Toggle light/dark theme using Bootstrap 5.3 data-bs-theme ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L12 | ` useEffect(() => { ` | Đăng ký effect sau render. Các dòng trong effect thực hiện request/listener/modal; dependency cuối khối quyết định lúc chạy lại. |
| L13 | ` document.documentElement.setAttribute('data-bs-theme', theme); ` | Gọi document.documentElement.setAttribute với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong useEffect. |
| L14 | ` localStorage.setItem('theme', theme); ` | Gọi localStorage.setItem với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong useEffect. |
| L15 | ` }, [theme]); ` | Kết thúc callback và truyền dependency array. React chạy lại effect hoặc tạo lại callback khi một giá trị trong mảng đổi; mảng rỗng chỉ mount/cleanup. |
| L17 | ` const toggleTheme = () => { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong toggleTheme. |
| L18 | ` setTheme(prev => (prev === 'light' ? 'dark' : 'light')); ` | Gọi setter React để cập nhật dữ liệu giao diện; giá trị mới hoặc hàm nhận giá trị cũ quyết định lần render tiếp theo. Trong setTheme. |
| L19 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong toggleTheme. |
| L21 | ` const handleLogout = () => { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong handleLogout. |
| L22 | ` localStorage.removeItem('token'); ` | Gọi localStorage.removeItem với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong handleLogout. |
| L23 | ` localStorage.removeItem('user'); ` | Gọi localStorage.removeItem với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong handleLogout. |
| L24 | ` navigate('/login'); ` | Gọi navigate với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong handleLogout. |
| L25 | ` }; ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong handleLogout. |
| L27 | ` return ( ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong Navbar. |
| L28 | ` <nav className="navbar navbar-expand bg-body-tertiary border-bottom px-3 sticky-top"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L29 | ` <div className="container-fluid"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L30 | ` {/* Brand */} ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L31 | ` <Link className="navbar-brand fw-bold text-primary" to="/"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L32 | ` <i className="bi bi-journal-text me-2"></i>NoteApp ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L33 | ` </Link> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L35 | ` <div className="d-none d-sm-block mx-auto" style={{ width: 'min(380px, 40vw)' }}> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L36 | ` <div className="input-group input-group-sm"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L37 | ` <span className="input-group-text bg-body border-end-0"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L38 | ` <i className="bi bi-search text-secondary"></i> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L39 | ` </span> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L40 | ` <input ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L41 | ` type="text" ` | Gán giá trị biểu thức bên phải vào type. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong Navbar. |
| L42 | ` aria-label="Tìm tiêu đề hoặc nội dung ghi chú" ` | Markup có thông tin accessibility: tên control, live status, nhãn nhóm hoặc thông báo lỗi; đọc các props trên dòng để biết hành vi cụ thể. |
| L43 | ` value={query} ` | Gán giá trị biểu thức bên phải vào value. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong Navbar. |
| L44 | ` maxLength={200} ` | Gán giá trị biểu thức bên phải vào maxLength. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong Navbar. |
| L45 | ` onChange={event => setQuery(event.target.value)} ` | Khai báo control có value/checked từ state và event onChange để cập nhật state; không sửa DOM trực tiếp. |
| L46 | ` className="form-control border-start-0" ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L47 | ` placeholder="Search notes by keyword..." ` | Gán giá trị biểu thức bên phải vào placeholder. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong Navbar. |
| L48 | ` /> ` | Đóng object/callback, lời gọi hàm hoặc component JSX đang mở ở trên; ghép từng dấu với cấu trúc tương ứng, không thêm thao tác dữ liệu. Trong Navbar. |
| L49 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L50 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L52 | ` {/* Actions */} ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L53 | ` <div className="d-flex align-items-center gap-2"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L54 | ` {/* Dark / Light Toggle */} ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L55 | ` <button ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L56 | ` type="button" ` | Gán giá trị biểu thức bên phải vào type. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong Navbar. |
| L57 | ` className="btn btn-outline-secondary btn-sm" ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L58 | ` onClick={toggleTheme} ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L59 | ` title="Toggle theme" ` | Gán giá trị biểu thức bên phải vào title. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong Navbar. |
| L60 | ` > ` | Kết thúc phần khai báo thẻ JSX mở ở các dòng trên; nội dung con của thẻ bắt đầu ở dòng tiếp theo. |
| L61 | `` <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill'}`}></i> `` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L62 | ` </button> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L64 | ` {/* User section */} ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L65 | ` {user ? ( ` | Bắt đầu biểu thức JSX ba ngôi: có user thì render menu tài khoản; nhánh sau dấu hai chấm là nút đăng nhập. |
| L66 | ` <div className="dropdown"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L67 | ` <button ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L68 | ` className="btn btn-sm btn-outline-primary dropdown-toggle d-flex align-items-center gap-1" ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L69 | ` type="button" ` | Gán giá trị biểu thức bên phải vào type. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong Navbar. |
| L70 | ` data-bs-toggle="dropdown" ` | Thuộc tính Bootstrap dùng để bật hành vi dropdown cho menu tài khoản; cần Bootstrap JS đã import trong main. |
| L71 | ` onClick={handleLogout} ` | Khai báo phần giao diện và gắn hàm xử lý khi bấm; disabled/role/aria trên dòng bảo vệ UX và accessibility, backend vẫn kiểm quyền. |
| L72 | ` title="Click to logout" ` | Gán giá trị biểu thức bên phải vào title. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong Navbar. |
| L73 | ` > ` | Kết thúc phần khai báo thẻ JSX mở ở các dòng trên; nội dung con của thẻ bắt đầu ở dòng tiếp theo. |
| L74 | ` <i className="bi bi-person-circle"></i> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L75 | ` <span className="d-none d-md-inline">{user.display_name \|\| user.email}</span> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L76 | ` <span className="badge text-bg-danger ms-1">Logout</span> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L77 | ` </button> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L78 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L79 | ` ) : ( ` | Đóng nhánh đúng và mở nhánh sai của toán tử ba ngôi; ở đây là giao diện khi chưa có user. |
| L80 | ` <Link to="/login" className="btn btn-primary btn-sm"> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L81 | ` Sign In ` | Chữ hiển thị bên trong liên kết đăng nhập của navbar scaffold. |
| L82 | ` </Link> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L83 | ` )} ` | Đóng cấu trúc mảng/object/JSX hoặc kết thúc câu lệnh đang mở; xem khối bao quanh để ghép cặp dấu. Trong Navbar. |
| L84 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L85 | ` </div> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L86 | ` </nav> ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L87 | ` ); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong Navbar. |
| L88 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong Navbar. |

## database/seed.sql

Mã nguồn có 50 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L2 | ` -- Seed Data for Note Management Application ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L3 | ` -- Default password for test accounts: Password123@ ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L4 | ` -- Bcrypt hash below corresponds to: Password123@ (salt rounds 10) ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L6 | `` USE `note_app_db`; `` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L8 | ` -- Insert verified test user ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L9 | `` INSERT INTO `users` (`id`, `email`, `password_hash`, `display_name`, `avatar_url`, `is_verified`, `created_at`) `` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L10 | ` VALUES ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L11 | ` (1, 'student1@tdtu.edu.vn', '$2b$10$w8sebs52t6NwarnF6wiqIe0QEyf105ICYIVpF0zZIJX2UVLHIixWi', 'Nguyen Van A', NULL, TRUE, NOW()), ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L12 | ` (2, 'student2@tdtu.edu.vn', '$2b$10$w8sebs52t6NwarnF6wiqIe0QEyf105ICYIVpF0zZIJX2UVLHIixWi', 'Tran Thi B', NULL, TRUE, NOW()), ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L13 | ` (3, 'unverified@tdtu.edu.vn', '$2b$10$w8sebs52t6NwarnF6wiqIe0QEyf105ICYIVpF0zZIJX2UVLHIixWi', 'Le Van C', NULL, FALSE, NOW()) ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L14 | `` ON DUPLICATE KEY UPDATE `email` = VALUES(`email`); `` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L16 | ` -- Insert preferences for user 1 ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L17 | `` INSERT INTO `user_preferences` (`user_id`, `font_size`, `note_color`, `theme`) `` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L18 | ` VALUES (1, 'medium', '#ffffff', 'light') ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L19 | `` ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`); `` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L21 | ` -- Insert sample labels for user 1 ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L22 | `` INSERT INTO `labels` (`id`, `user_id`, `name`) `` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L23 | ` VALUES ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L24 | ` (1, 1, 'Study'), ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L25 | ` (2, 1, 'Project'), ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L26 | ` (3, 1, 'Personal') ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L27 | `` ON DUPLICATE KEY UPDATE `name` = VALUES(`name`); `` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L29 | ` -- Insert sample notes for user 1 ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L30 | ` -- Note 1: Standard note ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L31 | `` INSERT INTO `notes` (`id`, `user_id`, `title`, `content`, `is_pinned`, `pinned_at`, `password_hash`, `is_locked`, `created_at`, `updated_at`) `` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L32 | ` VALUES ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L33 | ` (1, 1, 'Web Programming Final Project Requirements', 'Must comply strictly with red-highlighted requirements: Relative URLs, 4 consecutive weeks on GitHub, and unified add/edit interface.', TRUE, NOW(), NULL, FALSE, NOW(), NOW()), ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L34 | ` (2, 1, 'Daily Meeting Notes', 'Team synced on MySQL database schema and authentication architecture.', FALSE, NULL, NULL, FALSE, NOW(), NOW()), ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L35 | ` (3, 1, 'Personal Secret Note', 'This is a protected note containing private credentials.', FALSE, NULL, '$2b$10$w8sebs52t6NwarnF6wiqIe0QEyf105ICYIVpF0zZIJX2UVLHIixWi', TRUE, NOW(), NOW()) ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L36 | `` ON DUPLICATE KEY UPDATE `title` = VALUES(`title`); `` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L38 | ` -- Attach labels to notes ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L39 | `` INSERT INTO `note_labels` (`note_id`, `label_id`) `` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L40 | ` VALUES ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L41 | ` (1, 1), ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L42 | ` (1, 2), ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L43 | ` (2, 2) ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L44 | `` ON DUPLICATE KEY UPDATE `note_id` = VALUES(`note_id`); `` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L46 | ` -- Share note 1 with user 2 (Edit permission) ` | Chú thích của tác giả; không thực hiện thao tác dữ liệu. Đọc nội dung để biết ràng buộc của khối kế tiếp. |
| L47 | `` INSERT INTO `note_shares` (`id`, `note_id`, `shared_with_user_id`, `permission`, `shared_at`) `` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. |
| L48 | ` VALUES ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L49 | ` (1, 1, 2, 'edit', NOW()) ` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |
| L50 | `` ON DUPLICATE KEY UPDATE `permission` = VALUES(`permission`); `` | Tiếp tục câu lệnh SQL đang mở: tên cột, kiểu dữ liệu, giá trị mẫu hoặc tham số chuyển giờ như ghi trên dòng. Đọc cùng các dòng trước tới dấu chấm phẩy. |

## backend/src/modules/notes/tests/validation.test.cjs

Mã nguồn có 56 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const { test } = require('node:test'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const assert = require('node:assert/strict'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` const { noteText, labelIds, operationId, serializeNote, escapeLike, requestHash } = require('../validation'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` const { matchesType, rangeFor, storedPath } = require('../attachments'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L6 | ` test('blank notes and oversized titles are rejected', () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L7 | ` for (const body of [{ title: ' ', content: 'hello' }, { title: 'hello', content: '\n' }, { title: 'x'.repeat(201), content: 'hello' }]) { ` | Lặp qua tập phần tử trên dòng; mỗi lượt xử lý một ID/file/test case, không phải tự động chạy song song. Trong test. |
| L8 | ` assert.throws(() => noteText(body), { code: 'VALIDATION_ERROR' }); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L9 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L10 | ` assert.equal(noteText({ title: ' title ', content: ' text ' }).content, ' text '); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L11 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L13 | ` test('labels must be bounded positive IDs and operations must be UUID v4', () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L14 | ` assert.deepEqual(labelIds([1, '2', 1]), [1, 2]); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L15 | ` assert.throws(() => labelIds([0])); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L16 | ` assert.throws(() => labelIds(Array(21).fill(1))); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L17 | ` assert.throws(() => operationId('forged')); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L18 | ` assert.equal(operationId('5b44160e-4937-4136-bdc2-47c4c6f57491'), '5b44160e-4937-4136-bdc2-47c4c6f57491'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L19 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L21 | ` test('locked list serialization never leaks content, hash or labels', () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L22 | ` const result = serializeNote({ id: 1, user_id: 1, actor_id: 1, is_locked: 1, password_hash: 'secret-hash', content: 'secret-content', title: 'Visible title' }, [{ id: 1, name: 'secret-label' }]); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L23 | ` assert.equal(result.content_preview, null); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L24 | ` assert.deepEqual(result.labels, []); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L25 | ` assert.ok(!JSON.stringify(result).includes('secret')); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L26 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L28 | ` test('a share reader cannot become an editor through serialized flags', () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L29 | ` const row = { user_id: 1, actor_id: 2, permission: 'read', content: 'safe', pinned_at: null }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L30 | ` const result = serializeNote(row, [{ id: 1, name: 'owner private label' }]); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L31 | ` assert.equal(result.access.can_edit, false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L32 | ` assert.equal(result.access.can_manage, false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L33 | ` assert.deepEqual(result.labels, []); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L34 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L36 | ` test('LIKE escape and canonical request digest preserve intent', () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L37 | ` assert.equal(escapeLike('50%_!'), '50!%!_!!'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L38 | ` const req = { method: 'PATCH', originalUrl: '/api/notes/1', body: { a: 1, b: 2 } }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L39 | ` assert.equal(requestHash(req, 'secret'), requestHash({ ...req, body: { b: 2, a: 1 } }, 'secret')); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L40 | ` assert.notEqual(requestHash(req, 'secret'), requestHash({ ...req, body: { a: 2, b: 2 } }, 'secret')); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L41 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L43 | ` test('fake file extensions cannot replace signature validation', () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L44 | ` assert.equal(matchesType(Buffer.from('<script>alert(1)</script>'), 'image/png'), false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L45 | ` assert.equal(matchesType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png'), true); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L46 | ` assert.equal(matchesType(Buffer.from([0xff, 0xfe, 0]), 'text/plain'), false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L47 | ` assert.throws(() => storedPath('../../secret.env')); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L48 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L50 | ` test('video byte ranges include suffix ranges and reject malformed ranges', () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L51 | ` assert.deepEqual(rangeFor('bytes=0-9', 100), { start: 0, end: 9 }); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L52 | ` assert.deepEqual(rangeFor('bytes=-10', 100), { start: 90, end: 99 }); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L53 | ` assert.deepEqual(rangeFor('bytes=90-', 100), { start: 90, end: 99 }); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L54 | ` assert.equal(rangeFor('bytes=100-200', 100), false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L55 | ` assert.equal(rangeFor('bytes=0-1,3-4', 100), false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L56 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |

## backend/src/modules/notes/tests/autosave.test.cjs

Mã nguồn có 112 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const { test } = require('node:test'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const assert = require('node:assert/strict'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` const path = require('node:path'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` const { pathToFileURL } = require('node:url'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L6 | ` const load = () => import(pathToFileURL(path.resolve(__dirname, '../../../../../frontend/src/features/notes/autosave.js'))); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong load. |
| L7 | ` const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong deferred. |
| L8 | ` const baseNote = { id: 1, title: 'Old', content: 'Text', version: 1, access: { role: 'owner' } }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L10 | ` test('typing during a slow create does not create twice or mark the newer draft saved', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L11 | ` const { AutosaveSession } = await load(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L12 | ` const wait = deferred(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L13 | ` let creates = 0; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L14 | ` let updates = 0; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L15 | ` const api = { create: () => { creates++; return wait.promise; }, update: async (id, body) => { updates++; return { note: { ...baseNote, ...body, id, version: 2 } }; } }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong create. |
| L16 | ` const session = new AutosaveSession({ api, delay: 60000 }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L17 | ` session.change('title', 'First'); session.change('content', 'Text'); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L18 | ` const saving = session.save(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L19 | ` session.change('title', 'Latest'); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L20 | ` const sameSave = session.save(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L21 | ` wait.resolve({ note: { ...baseNote, title: 'First', content: 'Text' } }); ` | Gọi wait.resolve với các đối số trên dòng: chọn bản server hoặc chủ động gửi lại bản local trên version mới. Trong test. |
| L22 | ` await Promise.all([saving, sameSave]); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong test. |
| L23 | ` assert.equal(creates, 1); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L24 | ` assert.equal(updates, 0); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L25 | ` assert.equal(session.snapshot().dirty, true); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L26 | ` assert.equal(session.snapshot().title, 'Latest'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L27 | ` await session.flush(); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong test. |
| L28 | ` assert.equal(updates, 1); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L29 | ` assert.equal(session.snapshot().dirty, false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L30 | ` session.dispose(); ` | Gọi session.dispose với các đối số trên dòng: hủy timer và ngăn cập nhật state sau khi editor unmount. Trong test. |
| L31 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L33 | ` test('lost create ACK retries the exact same operation and body', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L34 | ` const { AutosaveSession } = await load(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L35 | ` const calls = []; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L36 | ` const api = { create: async body => { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong create. |
| L37 | ` calls.push({ ...body }); ` | Gọi calls.push với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong create. |
| L38 | ` if (calls.length === 1) throw new Error('network lost after commit'); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong create. |
| L39 | ` return { note: { ...baseNote, title: body.title, content: body.content }, mutation: { replayed: true, applied_version: 1 } }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong create. |
| L40 | ` } }; ` | Đóng object/callback, lời gọi hàm hoặc component JSX đang mở ở trên; ghép từng dấu với cấu trúc tương ứng, không thêm thao tác dữ liệu. Trong create. |
| L41 | ` const session = new AutosaveSession({ api, delay: 60000 }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L42 | ` session.change('title', 'First'); session.change('content', 'Text'); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L43 | ` await session.save(); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong test. |
| L44 | ` assert.equal(session.status, 'error'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L45 | ` session.change('title', 'New draft'); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L46 | ` await session.save(); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong test. |
| L47 | ` assert.deepEqual(calls[0], calls[1]); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L48 | ` assert.equal(session.snapshot().title, 'New draft'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L49 | ` assert.equal(session.snapshot().dirty, true); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L50 | ` session.dispose(); ` | Gọi session.dispose với các đối số trên dòng: hủy timer và ngăn cập nhật state sau khi editor unmount. Trong test. |
| L51 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L53 | ` test('remote clean updates never trigger a save; dirty updates require an explicit decision', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L54 | ` const { AutosaveSession } = await load(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L55 | ` let writes = 0; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L56 | ` const session = new AutosaveSession({ note: baseNote, api: { update: () => { writes++; } }, delay: 60000 }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong update. |
| L57 | ` session.receiveRemote({ ...baseNote, title: 'Remote', version: 2 }); ` | Gọi session.receiveRemote với các đối số trên dòng: áp dụng bản remote khi clean; khi dirty giữ local và báo conflict. Trong test. |
| L58 | ` assert.equal(session.snapshot().title, 'Remote'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L59 | ` assert.equal(session.snapshot().dirty, false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L60 | ` session.change('title', 'Local draft'); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L61 | ` session.receiveRemote({ ...baseNote, title: 'Another remote', version: 3 }); ` | Gọi session.receiveRemote với các đối số trên dòng: áp dụng bản remote khi clean; khi dirty giữ local và báo conflict. Trong test. |
| L62 | ` assert.equal(session.status, 'conflict'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L63 | ` assert.equal(session.snapshot().title, 'Local draft'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L64 | ` assert.equal(await session.flush(), false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L65 | ` session.resolve('server'); ` | Gọi session.resolve với các đối số trên dòng: chọn bản server hoặc chủ động gửi lại bản local trên version mới. Trong test. |
| L66 | ` assert.equal(session.snapshot().title, 'Another remote'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L67 | ` assert.equal(writes, 0); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L68 | ` session.dispose(); ` | Gọi session.dispose với các đối số trên dòng: hủy timer và ngăn cập nhật state sau khi editor unmount. Trong test. |
| L69 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L71 | ` test('a blank draft never creates a row and invalid edits cannot overwrite a saved note', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L72 | ` const { AutosaveSession } = await load(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L73 | ` let writes = 0; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L74 | ` const api = { create: () => { writes++; }, update: () => { writes++; } }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong create. |
| L75 | ` const session = new AutosaveSession({ api, delay: 60000 }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L76 | ` session.change('title', 'Title only'); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L77 | ` assert.equal(await session.flush(), false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L78 | ` assert.equal(writes, 0); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L79 | ` session.dispose(); ` | Gọi session.dispose với các đối số trên dòng: hủy timer và ngăn cập nhật state sau khi editor unmount. Trong test. |
| L80 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L82 | ` test('an old ACK cannot hide an invalid newer draft', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L83 | ` const { AutosaveSession } = await load(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L84 | ` const wait = deferred(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L85 | ` const session = new AutosaveSession({ note: baseNote, api: { update: () => wait.promise }, delay: 60000 }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong update. |
| L86 | ` session.change('title', 'Valid title'); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L87 | ` const saving = session.save(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L88 | ` session.change('title', ''); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L89 | ` wait.resolve({ note: { ...baseNote, title: 'Valid title', version: 2 } }); ` | Gọi wait.resolve với các đối số trên dòng: chọn bản server hoặc chủ động gửi lại bản local trên version mới. Trong test. |
| L90 | ` await saving; ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong test. |
| L91 | ` assert.equal(session.status, 'invalid'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L92 | ` assert.equal(session.snapshot().title, ''); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L93 | ` assert.equal(await session.flush(), false); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L94 | ` session.dispose(); ` | Gọi session.dispose với các đối số trên dòng: hủy timer và ngăn cập nhật state sau khi editor unmount. Trong test. |
| L95 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |
| L97 | ` test('a definitive validation failure allows the corrected draft to be submitted', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L98 | ` const { AutosaveSession } = await load(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L99 | ` const bodies = []; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L100 | ` const api = { update: async (id, body) => { ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong update. |
| L101 | ` bodies.push(body); ` | Gọi bodies.push với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong update. |
| L102 | ` if (bodies.length === 1) throw Object.assign(new Error('Validation failed'), { status: 422 }); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong update. |
| L103 | ` return { note: { ...baseNote, ...body, version: 2 } }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong update. |
| L104 | ` } }; ` | Đóng object/callback, lời gọi hàm hoặc component JSX đang mở ở trên; ghép từng dấu với cấu trúc tương ứng, không thêm thao tác dữ liệu. Trong update. |
| L105 | ` const session = new AutosaveSession({ note: baseNote, api, delay: 60000 }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong test. |
| L106 | ` session.change('title', 'Rejected'); await session.save(); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L107 | ` session.change('title', 'Corrected'); await session.save(); ` | Gọi session.change với các đối số trên dòng: cập nhật draft và generation, hủy timer cũ rồi hẹn tự lưu. Trong test. |
| L108 | ` assert.equal(bodies[1].title, 'Corrected'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L109 | ` assert.notEqual(bodies[0].operation_id, bodies[1].operation_id); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L110 | ` assert.equal(session.status, 'saved'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L111 | ` session.dispose(); ` | Gọi session.dispose với các đối số trên dòng: hủy timer và ngăn cập nhật state sau khi editor unmount. Trong test. |
| L112 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong test. |

## backend/src/modules/notes/tests/integration.test.cjs

Mã nguồn có 172 dòng. Bảng dưới giữ nguyên số dòng file.

| Dòng | Code | Giải thích |
|---|---|---|
| L1 | ` const { test, before, after } = require('node:test'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L2 | ` const assert = require('node:assert/strict'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L3 | ` const fs = require('node:fs/promises'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L4 | ` const path = require('node:path'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L5 | ` const os = require('node:os'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L6 | ` const crypto = require('node:crypto'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L7 | ` const express = require('express'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L8 | ` const jwt = require('jsonwebtoken'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L9 | ` const mysql = require('mysql2/promise'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L11 | ` const enabled = Boolean(process.env.NOTES_TEST_DB_CONFIG); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L12 | ` const secret = crypto.randomBytes(48).toString('hex'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L13 | ` let pool, server, origin, config, storage; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L14 | ` let id, version; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. |
| L16 | ` before(async () => { ` | Gọi before với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong before. |
| L17 | ` if (!enabled) return; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong before. |
| L18 | ` config = JSON.parse(await fs.readFile(process.env.NOTES_TEST_DB_CONFIG, 'utf8')); ` | Gán giá trị biểu thức bên phải vào config. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong before. |
| L19 | ` if (!/^note_tv2_test[a-z0-9_]*$/.test(config.database) \|\| config.disposable !== true) { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L20 | ` throw new Error('Only disposable note_tv2_test* databases are allowed.'); ` | Dừng luồng với lỗi có ý nghĩa; các điều kiện ngay trước quyết định khi nào từ chối. Không tiếp tục ghi DB sau throw. Trong before. |
| L21 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong before. |
| L22 | ` const { disposable, ...connectionConfig } = config; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong before. |
| L23 | ` const connection = await mysql.createConnection({ ...connectionConfig, database: undefined, multipleStatements: true }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong before. |
| L24 | ` const folder = path.resolve(__dirname, '../../../../../database'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong before. |
| L25 | ` for (const file of ['schema.sql', 'seed.sql', 'migrations/001_member2_notes.sql']) { ` | Lặp qua tập phần tử trên dòng; mỗi lượt xử lý một ID/file/test case, không phải tự động chạy song song. Trong before. |
| L26 | `` const sql = (await fs.readFile(path.join(folder, file), 'utf8')).replaceAll('`note_app_db`', mysql.escapeId(config.database)); `` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong before. |
| L27 | ` await connection.query(sql); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong before. |
| L28 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong before. |
| L29 | ` await connection.end(); ` | Trả connection về pool hoặc đóng kết nối test/setup để không rò rỉ tài nguyên. |
| L30 | ` pool = mysql.createPool({ ...connectionConfig, timezone: 'Z', connectionLimit: 5 }); ` | Gán giá trị biểu thức bên phải vào pool. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong before. |
| L31 | ` pool.pool.on('connection', current => current.query("SET time_zone = '+00:00'")); ` | Gọi pool.pool.on với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong undefined.on(connection). |
| L32 | ` storage = await fs.mkdtemp(path.join(os.tmpdir(), 'note-tv2-files-')); ` | Gán giá trị biểu thức bên phải vào storage. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong before. |
| L33 | ` process.env.UPLOAD_DIR = storage; ` | Gán giá trị biểu thức bên phải vào process.env.UPLOAD_DIR. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong before. |
| L34 | ` const { installNotes } = require('../install'); ` | Nạp module CommonJS vào backend hoặc test; đường dẫn node: là thư viện có sẵn của Node.js. |
| L35 | ` const app = express(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong before. |
| L36 | ` app.use(express.json()); ` | Cài middleware theo thứ tự. Request phải đi qua bước này trước các route được mount sau nó. |
| L37 | ` app.locals.notesJwtSecret = secret; ` | Gán giá trị biểu thức bên phải vào app.locals.notesJwtSecret. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong before. |
| L38 | ` installNotes(app, pool); ` | Gọi installNotes với các đối số trên dòng: mount notes/labels và error middleware vào Express app hiện có. Trong before. |
| L39 | ` server = app.listen(0, '127.0.0.1'); ` | Gán giá trị biểu thức bên phải vào server. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong before. |
| L40 | ` await new Promise(resolve => server.once('listening', resolve)); ` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. |
| L41 | `` origin = `http://127.0.0.1:${server.address().port}`; `` | Gán giá trị biểu thức bên phải vào origin. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong before. |
| L42 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong before. |
| L44 | ` after(async () => { ` | Gọi after với các đối số trên dòng: thực hiện bước của hàm bao quanh; đối chiếu định nghĩa hàm nếu chưa rõ đầu vào/đầu ra. Trong after. |
| L45 | ` if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. |
| L46 | `` if (pool) { await pool.query(`DROP DATABASE ${mysql.escapeId(config.database)}`); await pool.end(); } `` | Trả connection về pool hoặc đóng kết nối test/setup để không rò rỉ tài nguyên. |
| L47 | ` if (storage) await fs.rm(storage, { recursive: true, force: true }); ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong after. |
| L48 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong after. |
| L50 | ` async function request(method, url, body, user = 1, extraHeaders = {}) { ` | gửi HTTP trong bài integration test và đọc JSON hoặc bytes. Export cho phép file khác import nó. |
| L51 | ` const headers = { ...extraHeaders }; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong request. |
| L52 | `` if (user) headers.Authorization = `Bearer ${jwt.sign({ id: user }, secret, { expiresIn: '5m', algorithm: 'HS256' })}`; `` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong request. |
| L53 | ` if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'; ` | Rẽ nhánh theo điều kiện trên dòng; kiểm tra từng vế &&/\|\| trước khi đọc hành động return/throw/cập nhật. Trong request. |
| L54 | ` const response = await fetch(origin + url, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong request. |
| L55 | ` const contentType = response.headers.get('content-type') \|\| ''; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong request. |
| L56 | ` const data = contentType.includes('application/json') ? await response.json() : await response.arrayBuffer(); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong request. |
| L57 | ` return { status: response.status, data, headers: response.headers }; ` | Trả kết quả của hàm hoặc kết thúc sớm; kiểm tra biểu thức phía sau để biết là dữ liệu, Promise, boolean hay JSX. Trong request. |
| L58 | ` } ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong request. |
| L60 | ` function dbTest(name, run) { test(name, { skip: !enabled }, run); } ` | đăng ký test có database; skip nếu chưa cấp config test riêng. Export cho phép file khác import nó. |
| L62 | ` dbTest('DB/API: anonymous access rejected; locked list/search/detail do not leak content', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L63 | ` assert.equal((await request('GET', '/api/notes', null, null)).status, 401); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L64 | ` const all = await request('GET', '/api/notes'); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L65 | ` assert.equal(all.status, 200); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L66 | ` const locked = all.data.data.items.find(note => note.id === 3); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong undefined.find(). |
| L67 | ` assert.equal(locked.content_preview, null); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L68 | ` assert.ok(!('password_hash' in locked)); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L69 | ` assert.equal((await request('GET', '/api/notes/3')).status, 423); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L70 | ` assert.equal((await request('GET', '/api/notes?q=private%20credentials')).data.data.items.length, 0); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L71 | ` assert.equal((await request('GET', '/api/notes/2', null, 2)).status, 404); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L72 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong dbTest. |
| L74 | ` dbTest('DB/API: create is idempotent, empty input rejected, same key/different body rejected', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L75 | ` assert.equal((await request('POST', '/api/notes', { title: '', content: 'x', operation_id: crypto.randomUUID() })).status, 422); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L76 | ` const body = { title: 'Core test', content: 'OnlyContentKeyword', operation_id: crypto.randomUUID() }; ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L77 | ` const first = await request('POST', '/api/notes', body); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L78 | ` assert.equal(first.status, 201, JSON.stringify(first.data)); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L79 | ` id = first.data.data.note.id; ` | Gán giá trị biểu thức bên phải vào id. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong dbTest. |
| L80 | ` version = first.data.data.note.version; ` | Gán giá trị biểu thức bên phải vào version. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong dbTest. |
| L81 | ` const again = await request('POST', '/api/notes', body); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L82 | ` assert.equal(again.status, 200); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L83 | ` assert.equal(again.data.data.note.id, id); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L84 | ` assert.equal((await request('POST', '/api/notes', { ...body, title: 'Different' })).status, 409); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L85 | ` assert.equal((await request('GET', '/api/notes?q=OnlyContentKeyword')).data.data.items.length, 1); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L86 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong dbTest. |
| L88 | ` dbTest('DB/API: parallel writes serialize; stale versions conflict and retries do not write again', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L89 | ` const a = { title: 'First writer', content: 'Text A', base_version: version, operation_id: crypto.randomUUID() }; ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L90 | ` const b = { title: 'Second writer', content: 'Text B', base_version: version, operation_id: crypto.randomUUID() }; ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L91 | `` const results = await Promise.all([request('PATCH', `/api/notes/${id}`, a), request('PATCH', `/api/notes/${id}`, b)]); `` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L92 | ` assert.deepEqual(results.map(result => result.status).sort(), [200, 409], JSON.stringify(results)); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L93 | ` const winner = results[0].status === 200 ? a : b; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L94 | `` const retry = await request('PATCH', `/api/notes/${id}`, winner); `` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L95 | ` assert.equal(retry.status, 200); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L96 | ` assert.equal(retry.data.data.mutation.replayed, true); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L97 | ` version = retry.data.data.note.version; ` | Gán giá trị biểu thức bên phải vào version. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong dbTest. |
| L98 | ` assert.equal(version, 2); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L99 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong dbTest. |
| L101 | ` dbTest('DB/API: pin time is stable through edits and last-pinned note sorts first', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L102 | `` const pin = await request('PUT', `/api/notes/${id}/pin`, { pinned: true, base_version: version, operation_id: crypto.randomUUID() }); `` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L103 | ` assert.equal(pin.status, 200); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L104 | ` assert.equal(pin.data.data.note.is_pinned, true, JSON.stringify(pin.data)); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L105 | ` version = pin.data.data.note.version; ` | Gán giá trị biểu thức bên phải vào version. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong dbTest. |
| L106 | ` const pinnedAt = pin.data.data.note.pinned_at; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L107 | `` const edited = await request('PATCH', `/api/notes/${id}`, { title: 'Pinned edited', content: 'Body', base_version: version, operation_id: crypto.randomUUID() }); `` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L108 | ` assert.equal(edited.data.data.note.pinned_at, pinnedAt); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L109 | ` version = edited.data.data.note.version; ` | Gán giá trị biểu thức bên phải vào version. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong dbTest. |
| L110 | ` const list = (await request('GET', '/api/notes')).data.data.items; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L111 | ` assert.equal(list[0].id, id, JSON.stringify(list.map(note => ({ id: note.id, pinned_at: note.pinned_at })))); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L112 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong dbTest. |
| L114 | ` dbTest('DB/API: label OR filter has no duplicates; rename propagates; delete preserves notes', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L115 | ` const a = (await request('POST', '/api/labels', { name: 'Test label A' })).data.data.label; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L116 | ` const b = (await request('POST', '/api/labels', { name: 'Test label B' })).data.data.label; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L117 | ` const foreign = (await request('POST', '/api/labels', { name: 'Foreign label' }, 2)).data.data.label; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L118 | `` assert.equal((await request('PUT', `/api/notes/${id}/labels`, { label_ids: [foreign.id], base_version: version, operation_id: crypto.randomUUID() })).status, 422); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L119 | `` const attached = await request('PUT', `/api/notes/${id}/labels`, { label_ids: [a.id, b.id], base_version: version, operation_id: crypto.randomUUID() }); `` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L120 | ` version = attached.data.data.note.version; ` | Gán giá trị biểu thức bên phải vào version. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong dbTest. |
| L121 | `` const filtered = await request('GET', `/api/notes?label_ids=${a.id},${b.id}`); `` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L122 | ` assert.equal(filtered.data.data.items.length, 1); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L123 | ` assert.equal(filtered.data.data.meta.total, 1); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L124 | `` await request('PATCH', `/api/labels/${a.id}`, { name: 'Renamed' }); `` | Chờ tác vụ bất đồng bộ hoàn thành trước bước kế; nếu reject thì chuyển catch, không chạy như kết quả thành công. Trong dbTest. |
| L125 | `` assert.equal((await request('GET', `/api/notes/${id}`)).data.data.note.labels.find(label => label.id === a.id).name, 'Renamed'); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L126 | `` assert.equal((await request('DELETE', `/api/labels/${a.id}`)).status, 204); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L127 | `` assert.equal((await request('GET', `/api/notes/${id}`)).status, 200); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L128 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong dbTest. |
| L130 | ` dbTest('DB/API: read-only share cannot write; edit cannot delete; revocation applies immediately', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L131 | ` await pool.execute('INSERT INTO note_shares (note_id, shared_with_user_id, permission) VALUES (?, 2, ?)', [id, 'read']); ` | Phần ghi hoặc thiết kế dữ liệu SQL: đọc tên bảng/cột và điều kiện trên dòng. Thay đổi note phải nằm trong transaction/ACL/version; migration chạy một lần. Trong dbTest. |
| L132 | `` assert.equal((await request('GET', `/api/notes/${id}`, null, 2)).status, 200); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L133 | `` assert.equal((await request('PATCH', `/api/notes/${id}`, { title: 'Hack', content: 'x', base_version: version, operation_id: crypto.randomUUID() }, 2)).status, 403); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L134 | ` await pool.execute("UPDATE note_shares SET permission = 'edit' WHERE note_id = ? AND shared_with_user_id = 2", [id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong dbTest. |
| L135 | `` assert.equal((await request('DELETE', `/api/notes/${id}`, { base_version: version, operation_id: crypto.randomUUID() }, 2)).status, 403); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L136 | ` await pool.execute('DELETE FROM note_shares WHERE note_id = ? AND shared_with_user_id = 2', [id]); ` | Phần truy vấn đọc/lọc dữ liệu: đối chiếu owner/share/label và thứ tự trên chính dòng SQL. Dấu ? nhận giá trị tham số, không nối input vào SQL. Trong dbTest. |
| L137 | `` assert.equal((await request('GET', `/api/notes/${id}`, null, 2)).status, 404); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L138 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong dbTest. |
| L140 | ` dbTest('DB/API: attachment types, private access, Range, replay and deletion', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L141 | ` const fake = new FormData(); ` | Chuẩn bị multipart payload gồm files, base_version và operation_id; browser tự tạo boundary, không tự hardcode Content-Type. |
| L142 | ` fake.append('operation_id', crypto.randomUUID()); fake.append('base_version', version); ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L143 | ` fake.append('files', new Blob(['<html>not a png</html>'], { type: 'image/png' }), 'fake.png'); ` | JSX mô tả giao diện/component; className dùng CSS/Bootstrap, dấu {...} chèn giá trị hoặc điều kiện JavaScript. Component con nhận dữ liệu qua props. |
| L144 | `` assert.equal((await request('POST', `/api/notes/${id}/attachments`, fake)).status, 415); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L145 | ` const form = new FormData(); ` | Chuẩn bị multipart payload gồm files, base_version và operation_id; browser tự tạo boundary, không tự hardcode Content-Type. |
| L146 | ` form.append('operation_id', crypto.randomUUID()); form.append('base_version', version); ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L147 | ` form.append('files', new Blob(['hello private file'], { type: 'text/plain' }), 'sample.txt'); ` | Chuẩn bị multipart payload gồm files, base_version và operation_id; browser tự tạo boundary, không tự hardcode Content-Type. |
| L148 | `` const uploaded = await request('POST', `/api/notes/${id}/attachments`, form); `` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L149 | ` assert.equal(uploaded.status, 201, JSON.stringify(uploaded.data)); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L150 | ` version = uploaded.data.data.note.version; ` | Gán giá trị biểu thức bên phải vào version. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong dbTest. |
| L151 | ` const file = uploaded.data.data.note.attachments[0]; ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L152 | `` const replay = await request('POST', `/api/notes/${id}/attachments`, form); `` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L153 | ` assert.equal(replay.status, 200); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L154 | ` assert.equal(replay.data.data.note.attachments.length, 1); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L155 | ` const download = await request('GET', file.content_url, null, 1, { Range: 'bytes=0-4' }); ` | Khai báo biến cục bộ hoặc lấy thuộc tính bằng destructuring; giá trị được tính từ biểu thức phía sau dấu =. Trong dbTest. |
| L156 | ` assert.equal(download.status, 206); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L157 | ` assert.equal(Buffer.from(download.data).toString(), 'hello'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L158 | ` assert.equal(download.headers.get('cache-control'), 'private, no-store'); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L159 | ` assert.equal((await request('GET', file.content_url, null, 2)).status, 404); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L160 | ` assert.equal((await request('HEAD', file.content_url, null, 1, { Range: 'bytes=999-' })).status, 416); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L161 | `` const removed = await request('DELETE', `/api/notes/${id}/attachments/${file.id}`, { base_version: version, operation_id: crypto.randomUUID() }); `` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L162 | ` assert.equal(removed.status, 200); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L163 | ` version = removed.data.data.note.version; ` | Gán giá trị biểu thức bên phải vào version. Đây là cập nhật biến/tham chiếu, không tự gửi HTTP hoặc commit DB. Trong dbTest. |
| L164 | ` assert.equal((await request('GET', file.content_url)).status, 404); ` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L165 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong dbTest. |
| L167 | ` dbTest('DB/API: deletion is owner-only and a lost ACK can be replayed after the row is gone', async () => { ` | Đăng ký bài test với tên mô tả tình huống; callback chứa dữ liệu vào, thao tác và kết quả kỳ vọng. |
| L168 | ` const body = { base_version: version, operation_id: crypto.randomUUID() }; ` | Sinh UUID v4 cho thao tác/filename/key editor; không phải password và không thay ID note dạng số trong DB. Trong dbTest. |
| L169 | `` assert.equal((await request('DELETE', `/api/notes/${id}`, body)).status, 204); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L170 | `` assert.equal((await request('DELETE', `/api/notes/${id}`, body)).status, 204); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L171 | `` assert.equal((await request('GET', `/api/notes/${id}`)).status, 404); `` | Kiểm tra kết quả thực tế bằng điều kiện assert trên dòng; sai điều kiện làm test thất bại, không được tuyên bố pass. |
| L172 | ` }); ` | Đóng khối hàm, object, mảng hoặc lời gọi đang mở; không tạo thêm thao tác nghiệp vụ. Trong dbTest. |

Tổng cộng: **33 file, 1880 dòng có nội dung được đối chiếu**. Đây là giải thích source, không thay cho việc tự chạy test và giải thích lại bằng lời của bạn.
