# RIS Inventory

Aplikasi inventory dan warehouse management berbasis web yang sedang berjalan untuk kebutuhan operasional PT. RIS. Aplikasi ini dibangun dengan React + Vite dan fokus pada pengelolaan stok, transaksi gudang, unit demo, hingga laporan dan ekspor dokumen.

## Ringkasan aplikasi

Aplikasi ini sekarang berfungsi sebagai sistem manajemen gudang yang mencakup:

- dashboard overview dan ringkasan operasional
- katalog produk / master item inventory
- penjualan dan DO keluar
- penerimaan barang / goods receipt
- mutasi stok antar lokasi
- stock opname / audit stok
- manajemen unit demo dan peminjaman pelanggan
- service / maintenance ticket
- laporan inventaris dan ekspor PDF/Excel
- pengaturan sistem, user, dan role access
- mode wallboard publik untuk display TV
- barcode scanner untuk pencarian dan verifikasi item

## Fitur utama yang aktif

### 1. Dashboard & TV Wallboard
- Tampilan dashboard operasional dengan ringkasan inventory
- Versi public dashboard untuk ditampilkan di TV / monitor wallboard
- Mode publik dapat diakses dengan parameter URL seperti:
  - `?view=public-dashboard`
  - atau hash `#public-dashboard`

### 2. Product & Inventory Management
- Menambah, mengedit, dan melihat daftar produk
- Informasi item seperti SKU, serial number, brand, lokasi, dan stok per warehouse
- Detail item per unit lengkap dengan histori / status stok

### 3. Sales Orders & Goods Receipt
- Modul sales order untuk transaksi keluar barang
- Modul penerimaan barang dari supplier / receipt
- Proses transaksi otomatis memengaruhi stok dan data ledger

### 4. Stock Movement & Audit
- Pergerakan stok antar lokasi / warehouse
- Log transaksi stok lengkap dengan PIC dan catatan waktu
- Stock opname untuk proses audit dan koreksi stok fisik

### 5. Unit Demo Center
- Peminjaman unit demo ke pelanggan
- Checkout / pengeluaran unit demo
- Pengembalian unit demo (check-in)
- Pembuatan surat peminjaman unit demo dalam format PDF siap save/print
- Dokumen bisa dibuka kembali dari list demo yang aktif

### 6. Service & Maintenance
- Tracking tiket service untuk unit yang bermasalah
- Status perbaikan dan penanganan unit

### 7. Reports & Export
- Laporan inventaris dan transaksi
- Ekspor data ke PDF dan Excel
- Dokumen formal seperti surat peminjaman unit demo dibuat dalam format profesional dengan branding RIS

### 8. Users & Permission
- Login berdasarkan user
- Role-based access control untuk mengatur izin fitur
- Fitur sensitif dibatasi sesuai role user

## Teknologi utama

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Lucide React
- Recharts
- Motion
- jsPDF + jspdf-autotable
- XLSX
- html5-qrcode
- localStorage-based persistence untuk data aplikasi

## Struktur proyek utama

- `src/App.tsx` — entry aplikasi dan state utama
- `src/components/` — modul UI berdasarkan fungsi (dashboard, sales, demo, reports, settings, dll)
- `src/services/` — logic pengelolaan data, storage, dan export PDF
- `src/utils/` — helper seperti permission, barcode, print, dan utility bisnis
- `src/types.ts` — definisi tipe data utama
- `tests/` — uji regresi untuk fitur utama

## Cara menjalankan lokal

Persyaratan:
- Node.js terbaru

Langkah:

```bash
npm install
npm run dev
```

Setelah server aktif, buka URL yang muncul di terminal, biasanya:

```text
http://localhost:3000
```

## Build untuk production

```bash
npm run build
```

## Catatan aplikasi

- Data aplikasi saat ini disimpan di browser/localStorage sehingga cocok untuk demo dan penggunaan internal.
- Aplikasi telah dirancang untuk kebutuhan warehouse dan inventory PT. RIS, termasuk modul demo unit dan dokumen formal untuk peminjaman barang.
- Fitur ekspor PDF dan laporan sudah dibuat untuk kebutuhan print/save dokumen perusahaan.

## Lisensi

Aplikasi ini dibuat untuk kebutuhan internal operasional perusahaan dan tidak ditujukan untuk publikasi umum tanpa izin.
