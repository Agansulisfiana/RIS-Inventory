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
- Upload foto produk langsung dari laptop atau local device ke dalam form produk
- Mendukung preview gambar produk saat input/edit data

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

### 9. Backup & Restore Data
- Backup database manual dalam format JSON
- Restore data dari file backup JSON langsung di aplikasi
- Data backup bisa digunakan untuk memulihkan data jika terjadi kehilangan atau migrasi data

### 10. Reset Data Kosong / Real Data Setup
- Fitur reset “Hapus Semua Data” di bagian pengaturan
- Berguna untuk membersihkan database demo/sample agar aplikasi siap dipakai dengan data asli dari perusahaan
- Setelah reset, aplikasi berada dalam kondisi kosong dan siap dibuat data real dari awal

## Fitur terbaru yang ditambahkan

### Upload gambar produk lokal
Pada form tambah atau edit produk, pengguna dapat memilih gambar langsung dari file explorer laptop tanpa harus menyalin URL dari internet. File gambar akan diproses dan ditampilkan sebagai preview sebelum data disimpan.

### Restore backup JSON di aplikasi
Di menu pengaturan, terdapat tombol restore backup JSON. Pengguna cukup memilih file backup yang telah diunduh sebelumnya, lalu aplikasi akan memuat data dari file JSON ke localStorage aplikasi.

### Reset semua data aplikasi
Untuk kebutuhan memulai dari awal dengan data real, tersedia fitur pembersihan seluruh data di zona berbahaya di pengaturan. Fitur ini menghapus data inventaris, transaksi, log, backup, dan notifikasi sehingga sistem benar-benar kosong.

## Panduan operasional

### Menambah produk baru dengan foto
1. Buka menu produk atau inventory
2. Klik tombol tambah produk baru
3. Isi form produk
4. Klik tombol “Upload dari Laptop”
5. Pilih file gambar dari komputer
6. Simpan produk

### Backup database
1. Buka menu Pengaturan
2. Pilih area Backup Database Manual
3. Klik tombol “Download Backup”
4. File JSON akan terunduh ke perangkat

### Restore database
1. Buka menu Pengaturan
2. Pilih area Restore Backup JSON
3. Klik tombol “Restore Backup”
4. Pilih file JSON backup yang sebelumnya disimpan
5. Data akan dipulihkan ke aplikasi

### Reset aplikasi agar mulai dari nol
1. Buka menu Pengaturan
2. Scroll ke bagian “Zona Berbahaya”
3. Klik tombol “Hapus Semua Data”
4. Konfirmasi konfirmasi warning
5. Data aplikasi akan dibersihkan dan siap dibuat ulang dari awal

## Catatan penting

- Data aplikasi disimpan di browser menggunakan localStorage.
- Untuk penggunaan nyata, disarankan melakukan backup secara berkala untuk mencegah kehilangan data.
- Fitur reset bersifat destruktif, jadi harus dilakukan dengan kehati-hatian dan konfirmasi.

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
