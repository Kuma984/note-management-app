# Note Management Application

> **Course:** 503073 – Web Programming & Applications (Semester I/2026–2027)  
> **Institution:** Ton Duc Thang University (TDTU)

---

##  Team Members & Task Allocation

| No. | Full Name | Student ID | Role | Assigned Modules & Scope |
| :---: | :--- | :---: | :--- | :--- |
| 1 | `Trịnh Đức Long` | `524K0021` | Team Leader | Infrastructure, Authentication, Account Management, UI Shell, Deployment & Responsive Design (Criteria 1–8, 29, 30, 32) |
| 2 | `Trần Hoàng Anh` | `524K0015` | Developer | Core Note Management, Unified Add/Edit Interface, Auto-save, Media Attachments, Labels, Live Search (Criteria 9–22) |
| 3 | `Huỳnh Ngọc Trâm` | `524K0030` | Developer | Note Password Protection, Real-time Collaboration (WebSocket), AI Summary & RAG Q&A, PWA & Offline Sync (Criteria 23–28, 31) |

---

## Tech Stack
* **Frontend:** React (Vite), Tailwind CSS / Bootstrap 5, `socket.io-client`, `Dexie.js` (IndexedDB for offline capabilities), `vite-plugin-pwa`.
* **Backend:** Node.js, Express, `mysql2`, `Socket.io` (Real-time collaboration), `bcrypt`, `jsonwebtoken`, `multer`, `nodemailer`.
* **Database:** MySQL.
* **AI Integration:** Google Gemini API / OpenAI API (Note summarization & Semantic RAG Q&A with citations).

---

## Project Directory Structure

```text
note-app/
├── backend/
│   ├── uploads/                    # User avatars and note attachments
│   └── src/
│       ├── config/                 # [Member 1] MySQL, mailer, and upload configs
│       ├── middlewares/            # [Member 1] JWT authentication & authorization
│       ├── modules/
│       │   ├── auth/               # [Member 1] Register, login, activation, password reset, profile, preferences
│       │   ├── notes/              # [Member 2] CRUD operations, auto-save, pinning, search, attachments
│       │   ├── labels/             # [Member 2] Label management and note tagging
│       │   ├── security-share/     # [Member 3] Note password protection, sharing, permissions
│       │   └── ai/                 # [Member 3] AI summary & semantic Q&A endpoints
│       ├── sockets/                # [Member 3] Socket.io real-time collaboration handler
│       └── app.js                  # [Member 1] Express server and Socket.io entry point
├── database/
│   └── schema.sql                  # [Member 1] MySQL database schema and initial data
└── frontend/
    ├── public/                     # [Member 3] Web manifest, service worker & PWA assets
    └── src/
        ├── services/               # [Member 1] Axios API client with relative endpoints ('/api')
        ├── db/                     # [Member 3] Dexie.js (IndexedDB) and offline sync engine
        ├── components/             # [Member 1] Navbar, Sidebar, ThemeToggle, Toast, ConfirmModal
        └── features/
            ├── auth/               # [Member 1] Login, registration, profile, preferences views
            ├── notes/              # [Member 2] Grid/List views, unified note editor, labels
            └── advanced/           # [Member 3] Password unlock dialog, share modal, AI Q&A drawer
```

---

## Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* MySQL Server (v8.0+)
* Git

### Installation & Local Run
*(Instructions will be updated as modules are developed)*
