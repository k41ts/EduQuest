# 🎓 EduQuest

**Platform persiapan UTBK berbasis web dengan sistem gamifikasi.**

EduQuest membantu siswa mempersiapkan UTBK (Ujian Tulis Berbasis Komputer) melalui latihan soal harian, simulasi ujian, dan sistem XP & level yang membuat belajar jadi lebih seru.

> 🌐 **Live Demo**: [Deployed on Vercel](https://eduquest.vercel.app)

---

## ✨ Fitur Utama

### 🎮 Sistem Gamifikasi
| Fitur | Detail |
|-------|--------|
| **XP & Level** | Dapatkan XP dari setiap jawaban benar (Easy: 10, Medium: 15, Hard: 20). Level naik setiap 500 XP. |
| **Streak** | Streak harian bertambah saat belajar berturut-turut. Reset jika bolos sehari. |
| **Badge** | 6 badge: Quest Pertama, 3 & 7 Hari Streak, Level 5, 500 XP, 1000 XP. |
| **Leaderboard** | Peringkat semua pengguna berdasarkan XP dengan podium Top 3. |

### 📝 Daily Quest
- 10 soal acak sesuai mata pelajaran yang dipilih
- Timer 90 detik per soal (auto-submit saat habis)
- Feedback langsung: benar/salah + penjelasan
- XP dihitung berdasarkan tingkat kesulitan soal

### 📋 Mock Test (Simulasi Ujian)
- 3 mode simulasi:
  - **UTBK Full Simulation** — 15 soal, 25 menit, semua mapel
  - **TPS Drill** — 5 soal, 10 menit, TPS only
  - **Matematika Drill** — 6 soal, 12 menit, Matematika only
- Navigasi soal bebas (bolak-balik)
- Timer countdown keseluruhan
- Panel navigator soal dengan indikator terjawab/belum

### 📊 Statistik & Analytics
- **KPI Dashboard**: Total XP, Level, Streak, Akurasi
- **7-day Activity Rhythm**: Grafik XP harian selama seminggu
- **Subject Performance Matrix**: Akurasi per mata pelajaran
- **Focus Queue**: Rekomendasi mapel yang perlu ditingkatkan
- **Session Mix**: Jumlah sesi Quest & Mock, skor terbaik

### 👤 Profil Pengguna
- Edit nama, lihat target jurusan
- Progress XP ke level berikutnya
- Koleksi badge (locked/unlocked)
- Ringkasan statistik personal

### 🛡️ Admin Panel
- **Dashboard**: Overview jumlah soal & status sistem
- **Manage Questions**: CRUD soal dengan filter subject & difficulty, inline edit
- **Generate Questions**: Form pembuatan soal baru
- **Statistics**: Top users by sessions & accuracy, distribusi soal per mapel

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19 · TypeScript · Vite |
| **Backend** | Firebase Authentication · Cloud Firestore |
| **Styling** | Inline styles · Plus Jakarta Sans (Google Fonts) |
| **Icons** | Lucide React |
| **Routing** | React Router DOM v7 |
| **Deployment** | Vercel |

---

## 📁 Struktur Project

```
EduQuest/
├── public/                  # Static assets
├── scripts/
│   └── seedAdmin.mjs        # Script seed akun admin (Firebase Admin SDK)
├── src/
│   ├── components/
│   │   ├── Layout.tsx        # Layout utama (Sidebar + Topbar)
│   │   ├── Sidebar.tsx       # Navigasi sidebar (user & admin links)
│   │   ├── Topbar.tsx        # Top bar
│   │   ├── AdminLayout.tsx   # Layout admin (collapsible sidebar)
│   │   ├── QuestionEditorFields.tsx  # Form editor soal (reusable)
│   │   └── adminUi.tsx       # Shared admin UI style constants
│   ├── contexts/
│   │   └── AuthContext.tsx    # Auth provider (Firebase + Firestore profile)
│   ├── data/
│   │   └── questions.json    # Seed data soal
│   ├── pages/
│   │   ├── Login.tsx          # Login + reset password
│   │   ├── Register.tsx       # Registrasi akun baru
│   │   ├── Onboarding.tsx     # Wizard: pilih jurusan & mapel
│   │   ├── Dashboard.tsx      # Dashboard utama
│   │   ├── Quest.tsx          # Daily Quest (10 soal)
│   │   ├── QuestResults.tsx   # Hasil quest + simpan XP/streak/badge
│   │   ├── Mock.tsx           # Pilihan mock test
│   │   ├── MockSession.tsx    # Sesi mock test (exam-like UI)
│   │   ├── MockResults.tsx    # Hasil mock test
│   │   ├── Leaderboard.tsx    # Peringkat global
│   │   ├── Stats.tsx          # Statistik personal
│   │   ├── Profile.tsx        # Profil & badge
│   │   ├── AdminDashboard.tsx # Admin: overview
│   │   ├── AdminQuestions.tsx # Admin: kelola soal
│   │   ├── AdminQuestionCreate.tsx # Admin: buat soal baru
│   │   └── AdminStats.tsx     # Admin: statistik pengguna
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces (UserProfile, Question)
│   ├── utils/
│   │   ├── questUtils.ts      # XP, level, streak, badge logic
│   │   ├── statsUtils.ts      # Update stats & activity tracking
│   │   ├── userSetup.ts       # Initial user document creation
│   │   └── seed.ts            # Seed fake users for testing
│   ├── firebase.ts            # Firebase config & initialization
│   └── App.tsx                # Routes & route protection
├── firestore.rules            # Firestore security rules
├── vercel.json                # Vercel SPA rewrite config
└── package.json
```

---

## 🔥 Firestore Collections

| Collection | Document ID | Deskripsi |
|------------|-------------|-----------|
| `users` | `{uid}` | Profil user: nama, email, level, XP, streak, subjects, badges, role |
| `questions` | auto | Bank soal: subject, difficulty, text, options, correctIndex, explanation |
| `sessions` | auto | Hasil Daily Quest: userId, score, subjectStats, xpEarned |
| `mockSessions` | auto | Hasil Mock Test: userId, testId, score, timeTaken |
| `userStats` | `{uid}` | Statistik agregat: akurasi per mapel, sesi total, focus areas |
| `userActivity` | `{uid}_{date}` | Aktivitas harian: XP, sesi, akurasi per hari |

---

## 📚 Mata Pelajaran

| Kode | Nama | Warna |
|------|------|-------|
| **TPS** | Tes Potensi Skolastik | 🟣 Purple (`#7F77DD`) |
| **Literasi** | Literasi Bahasa | 🟢 Green (`#1D9E75`) |
| **Matematika** | Penalaran Matematika | 🟡 Amber (`#EF9F27`) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- Firebase project dengan Authentication & Firestore enabled

### Installation

```bash
# Clone repository
git clone https://github.com/k41ts/EduQuest.git
cd EduQuest

# Install dependencies
npm install
```

### Environment Variables

Buat file `.env` di root project:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Run Development Server

```bash
npm run dev
```

### Seed Admin Account

```bash
npm run seed:admin
```

> Default admin: `admin@eduquest.com` / `Admin123!`

### Build for Production

```bash
npm run build
```

---

## 🔄 Alur Aplikasi

```
Register → Onboarding (pilih jurusan + mapel) → Dashboard
                                                    │
Login ──→ Admin? ──→ /admin (Admin Panel)           │
              │                                     │
              └──→ /dashboard ──┬── Daily Quest → Results (XP + Badge)
                                ├── Mock Test → Session → Results
                                ├── Leaderboard
                                ├── Statistik
                                └── Profil
```

---

## 📄 License

This project is private and not licensed for public use.
