# RIS Inventory & Demo Unit Management System

Aplikasi web Enterprise Warehouse & Asset Management yang dikembangkan untuk operasional **PT. Reycom Integrated Solusi (RIS)**. Sistem ini mengelola inventaris produk, nomor seri (Serial Number / S/N), pelacakan unit demo pelanggan, transaksi keluar/masuk barang, mutasi gudang, tiket servis, serta penerbitan dokumen resmi (Surat Jalan DO & Surat Peminjaman Demo).

---

## 📌 Ringkasan Sistem

Sistem ini terintegrasi penuh untuk menghubungkan bagian **Gudang (Warehouse)**, **Sales & Marketing**, **Service/Teknisi**, dan **Manajemen**, mencakup:

* **Dashboard & Wallboard TV**: Pemantauan inventaris real-time dan display monitor publik.
* **Master Produk & S/N**: Manajemen barang fisik dengan pelacakan nomor seri unik atau batch.
* **Transaksi Penjualan & DO**: Pengurangan stok otomatis, penerbitan Surat Jalan (Delivery Order).
* **Penerimaan Barang (Goods Receipt)**: Penerimaan barang supplier / PO masuk.
* **Demo Unit Center**: Peminjaman unit uji coba (POC) ke klien, cetak Surat Peminjaman PDF, dan check-in pengembalian.
* **Mutasi Stok (Stock Movement)**: Transfer antar gudang/rak resmi dengan filter rentang tanggal interaktif.
* **Stock Opname**: Audit stok fisik vs data sistem dengan rekonsiliasi otomatis.
* **Pusat Servis & Tiket Perbaikan**: Penanganan barang rusak / maintenance teknisi.
* **Laporan & Ekspor**: Rekap nilai aset, log pergerakan stok, ekspor ke Excel & PDF.
* **Barcode & QR Scanner**: Integrasi kamera perangkat untuk pemindaian dan pencetakan label stiker.
* **Role & Akses Pengguna**: Pembatasan wewenang berdasar peran kerja.
* **Pengaturan & Manajemen Data**: Backup JSON, Restore, pengaturan gudang/rak resmi, dan reset data.

---

## 🚀 Modul & Fitur Utama

### 1. Dashboard Eksekutif & Wallboard TV
* Ringkasan metrik utama: Total Aset, Unit Tersedia, Unit Sedang Demo, dan Stok Menipis.
* Grafik tren pergerakan stok dan distribusi kategori barang.
* **Mode Wallboard Publik (TV Display)**: Tampilan khusus monitor TV gudang tanpa menu navigasi admin, dapat diakses langsung melalui:
  * URL: `?view=public-dashboard`
  * atau Hash: `#public-dashboard`

### 2. Master Produk & Inventori (Products)
* Pencatatan lengkap: SKU, Barcode, Nama Produk, Kategori, Brand, Satuan, Harga Beli/Jual, dan Lokasi Rak.
* **Pelacakan Serial Number (S/N)**:
  * *Single Unique S/N*: 1 unit memiliki 1 serial number unik.
  * *Shared Batch / Non-SN*: Produk batch atau aksesori tanpa serial number individual.
* **Upload Foto Langsung**: Unggah gambar langsung dari komputer/laptop dengan pratinjau instan.
* **Generator & Cetak Barcode/QR Code**: Buat stiker label barcode produk siap cetak untuk ditempel pada unit fisik.

### 3. Sales Order & Cetak Surat Jalan (DO)
* Pembuatan invoice penjualan customer yang otomatis memotong stok gudang.
* Pencatatan nomor referensi, alamat tujuan pengiriman, dan nama PIC Sales.
* **Cetak Dokumen Surat Jalan (DO)**:
  * Menampilkan data pengirim, tujuan customer, daftar barang, serta rincian nomor seri (S/N).
  * Kolom tanda tangan resmi: Bagian Gudang, Kurir/Ekspedisi, dan Penerima Customer.

### 4. Penerimaan Barang (Goods Receipt / GR)
* Pencatatan barang masuk dari Supplier / Purchase Order (PO).
* Pilihan lokasi gudang/rak tujuan penerimaan.
* Otomatis menambah kuantitas stok produk dan mencatat log transaksi masuk.

### 5. Demo Unit Center (Peminjaman & POC Klien)
* Khusus mengelola unit display dan mesin percontohan (POC) yang dipinjamkan ke customer (misal: mesin pencetak kartu, scanner, terminal).
* **Peminjaman (Check-Out)**: Mencatat customer peminjam, PIC Sales, tanggal pinjam, dan estimasi tanggal kembali.
* **Surat Peminjaman Demo Resmi (PDF)**: Dokumen formal berstandar RIS lengkap dengan kop perusahaan, QR code validasi, dan lembar tanda tangan serah terima.
* **Monitoring & Notifikasi Overdue**: Peringatan visual jika unit terlambat dikembalikan dari jadwal.
* **Pengembalian (Check-In)**: Mengembalikan unit ke gudang, evaluasi kondisi fisik, atau konfirmasi pembelian jika unit diubah statusnya menjadi terjual.

### 6. Mutasi Stok Antar Lokasi (Stock Movement)
* Pencatatan perpindahan unit antar lokasi (gudang utama, gudang transit, rak, lab service).
* **Filter Tanggal Interaktif**:
  * Pilihan cepat: *Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir, Bulan Ini*.
  * Filter kalender kustom (*Dari Tanggal* s/d *Sampai Tanggal*).
* **Validasi Lokasi Terintegrasi**: Pilihan tujuan mengacu langsung pada master Gudang & Rak resmi di Pengaturan, dilengkapi opsi *+ Ketik Lokasi Baru* untuk kebutuhan fleksibel.
* Ekspor log pergerakan stok ke file CSV.

### 7. Stock Opname & Audit Fisik
* Jadwal dan pencatatan audit stok fisik berkala per gudang/rak.
* Perhitungan otomatis selisih (*variance*) antara stok fisik vs catatan sistem.
* Rekonsiliasi instan dengan catatan hasil audit staf gudang.

### 8. Service & Maintenance Center
* Penerbitan tiket servis untuk produk yang mengalami kendala teknis atau klaim garansi.
* Tracking teknisi penanggung jawab, diagnosis kerusakan, suku cadang, dan estimasi biaya perbaikan.
* Riwayat status unit: *Menunggu Diagnosa $\rightarrow$ Dalam Perbaikan $\rightarrow$ Selesai $\rightarrow$ Diambil Customer*.

### 9. Laporan & Analisis Data
* Laporan komprehensif: Nilai total inventaris (valuation), pergerakan barang keluar-masuk, dan utilisasi unit demo.
* Ekspor data ke format **Excel (.xlsx)** dan **PDF**.

### 10. Barcode & QR Code Scanner (Kamera Perangkat)
* Pemindai barcode berbasis web kamera (didukung oleh `html5-qrcode`).
* Pencarian unit cepat hanya dengan mengarahkan kamera ke label barcode/QR pada kardus atau bodi barang.

### 11. Pengaturan Sistem & Manajemen Database
* **Pengaturan Perusahaan**: Kop surat, nama instansi, alamat, email, telepon, dan logo.
* **Pengaturan Master Gudang & Rak**: Kelola daftar nama gudang dan rak penyimpanan resmi.
* **Master Kategori, Brand, & Satuan Unit**.
* **Backup Database Manual**: Ekspor seluruh database aplikasi ke file JSON terenkripsi.
* **Restore Database**: Pulihkan seluruh data dari file backup JSON dalam 1 klik.
* **Zona Berbahaya (Reset Database)**: Bersihkan data dummy/sample jika ingin memulai aplikasi dari kondisi kosong (*fresh real data setup*).

---

## 👥 Hak Akses & Peran Pengguna (RBAC)

Sistem memiliki pembagian peran (*Role-Based Access Control*):
1. **Super Admin**: Akses tak terbatas ke seluruh modul, pengaturan sistem, kelola user, dan zona reset database.
2. **Warehouse Manager**: Pengelolaan penuh inventori, persetujuan mutasi, audit opname, dan laporan.
3. **Staff Gudang**: Input penerimaan barang, mutasi stok, packing barang keluar, dan scan barcode.
4. **Sales Representative**: Pembuatan Sales Order, pengajuan peminjaman demo unit customer, dan tracking unit demo.
5. **Technician / Service**: Pengelolaan tiket servis, diagnostik unit, dan update status perbaikan.

---

## 🛠️ Spesifikasi Teknologi

* **Frontend**: React 19, TypeScript, Vite
* **Styling & Desain**: Tailwind CSS v4, Lucide React Icons, Motion
* **Visualisasi & Grafik**: Recharts
* **Dokumen & Cetak**: jsPDF, jspdf-autotable, window print engine
* **Barcode & QR**: JsBarcode, QRCode, html5-qrcode
* **Spreadsheet**: XLSX (SheetJS)
* **Penyimpanan Data**: LocalStorage engine dengan integrasi skema JSON

---

## 💻 Panduan Menjalankan Aplikasi

### Persyaratan Sistem:
* Node.js versi 18 atau lebih baru
* NPM atau PNPM

### Instalasi & Menjalankan Dev Server:

```bash
# 1. Install seluruh dependensi
npm install

# 2. Jalankan development server (port 3000)
npm run dev
```

Buka browser pada alamat:
```text
http://localhost:3000
```

### Build untuk Produksi:

```bash
# Build paket siap deploy
npm run build

# Menjalankan preview hasil build
npm run preview
```

---

## 🔒 Catatan Pemeliharaan Data

* Sistem menggunakan media penyimpanan browser yang persisten.
* Sangat disarankan bagi staf gudang / admin untuk mengunduh **Backup JSON** secara berkala (misal: setiap akhir pekan atau akhir bulan) melalui menu **Pengaturan $\rightarrow$ Backup Database** untuk cadangan data cadangan fisik.
