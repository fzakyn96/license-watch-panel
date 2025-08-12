# Sistem Monitoring Lisensi Aset

Aplikasi web untuk mengelola dan memonitor lisensi aset berbasis React dengan TypeScript.

## 🚀 Fitur Utama

- **Dashboard Monitoring**: Tampilan ringkasan status lisensi dengan kartu statistik
- **Manajemen Lisensi**: CRUD (Create, Read, Update, Delete) data lisensi
- **Notifikasi Email**: Sistem pemberitahuan otomatis untuk lisensi yang akan berakhir
- **Import & Export Data**: Import dan ekspor data lisensi dari atau ke format Excel
- **Autentikasi**: Sistem authentikasi dengan mode stand alone dan iframe
- **Responsive Design**: Tampilan yang optimal di desktop dan mobile
- **Dark/Light Mode**: Dukungan tema gelap dan terang

## 🏗️ Struktur Project

```
src/
├── components/           # Komponen UI yang dapat digunakan kembali
│   ├── ui/              # Komponen UI dasar (shadcn/ui)
│   ├── dashboard-header.tsx    # Header dashboard
│   ├── email-management.tsx    # Kelola penerima email
│   ├── license-table.tsx       # Tabel lisensi dashboard
│   ├── login-form.tsx          # Form login
│   └── status-cards.tsx        # Kartu status statistik
├── pages/               # Halaman-halaman aplikasi
│   ├── Dashboard.tsx    # Halaman dashboard utama
│   ├── Index.tsx        # Halaman beranda
│   ├── Login.tsx        # Halaman login
│   ├── AddLicense.tsx   # Halaman tambah lisensi
│   ├── EditLicense.tsx  # Halaman edit lisensi
│   ├── LicensePrices.tsx # Halaman harga lisensi
│   └── NotFound.tsx     # Halaman 404
├── lib/                 # Utilities dan konfigurasi
│   ├── auth.ts         # Fungsi autentikasi
│   ├── cookies.ts      # Manajemen cookies
│   └── utils.ts        # Utility functions
├── hooks/              # Custom React hooks
│   ├── use-mobile.tsx  # Hook untuk deteksi mobile
│   ├── use-query-params.tsx # Hook untuk query parameters
│   └── use-toast.ts    # Hook untuk toast notifications
├── App.tsx             # Komponen utama aplikasi
├── main.tsx           # Entry point aplikasi
└── index.css          # Styling global dan design tokens
```

## 🛠️ Teknologi yang Digunakan

- **Frontend Framework**: React 18 dengan TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Routing**: React Router DOM
- **State Management**: React Query (@tanstack/react-query)
- **Theme**: next-themes untuk dark/light mode
- **Icons**: Lucide React
- **Forms**: React Hook Form dengan Zod validation
- **Notifications**: Sonner untuk toast notifications
- **Charts**: Recharts untuk visualisasi data
- **Excel Export**: SheetJS (xlsx)

## 🚀 Menjalankan Mode Development

### Prasyarat
- Node.js (versi 16 atau lebih tinggi)
- npm atau yarn

### Langkah-langkah

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd <project-name>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Jalankan development server**
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

4. **Akses aplikasi**
   - Buka browser dan kunjungi `http://localhost:5173`
   - Server development akan berjalan dengan hot-reload otomatis

### Scripts yang Tersedia

- `npm run dev` - Menjalankan development server
- `npm run build` - Build aplikasi untuk production
- `npm run preview` - Preview build production secara lokal
- `npm run lint` - Menjalankan ESLint untuk code quality

## 🌐 Deploy ke Production

1. **Build aplikasi**
   ```bash
   npm run build
   ```

2. **Preview build**
   ```bash
   npm run preview
   ```

3. **Deploy ke hosting**
   - Upload folder `dist` ke web hosting pilihan Anda
   - Pastikan server mendukung Single Page Application (SPA)
   - Konfigurasi redirect semua routes ke `index.html`

## 📁 File Konfigurasi Penting

- `vite.config.ts` - Konfigurasi Vite build tool
- `tailwind.config.ts` - Konfigurasi Tailwind CSS
- `tsconfig.json` - Konfigurasi TypeScript
- `package.json` - Dependencies dan scripts
- `.env` - Environment variables (jangan commit ke Git)

## 🔧 Konfigurasi Environment

Buat file `.env` di root project dengan variabel yang diperlukan:

```env
# Tambahkan environment variables sesuai kebutuhan
# VITE_API_URL=https://api.example.com
```

## 📱 Responsive Design

Aplikasi dirancang untuk optimal di berbagai ukuran layar:
- **Desktop**: Layout full dengan sidebar dan content area
- **Tablet**: Layout responsif dengan adjustments
- **Mobile**: Layout stack dengan navigation yang mobile-friendly

## 🎨 Design System

Aplikasi menggunakan design system berbasis Tailwind CSS dengan:
- **Color Palette**: Semantic tokens di `index.css`
- **Typography**: Konsisten dengan design tokens
- **Components**: shadcn/ui components yang dapat dikustomisasi
- **Dark/Light Mode**: Dukungan penuh untuk kedua tema

## 📞 Support & Dokumentasi

- [React Documentation](https://reactjs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 📄 Lisensi

Project ini menggunakan lisensi sesuai dengan ketentuan yang berlaku.