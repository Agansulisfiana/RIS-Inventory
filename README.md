# RIS Gudang - Manajemen Stok & Inventaris Gudang

Aplikasi manajemen stok dan inventaris gudang komprehensif yang dibangun menggunakan **React** dan **Vite**, dengan antarmuka modern menggunakan **Tailwind CSS**. Aplikasi ini dirancang untuk memudahkan operasional gudang dari hulu ke hilir, mulai dari penerimaan barang, penjualan, peminjaman demo unit, hingga pelaporan.

## ✨ Fitur Utama

Aplikasi ini memiliki beberapa modul utama yang mendukung operasional gudang sehari-hari:

*   **📊 Dashboard Bisnis**: Ringkasan metrik inventaris, grafik aktivitas gudang, dan notifikasi stok kritis. Tersedia juga fitur **TV Wallboard Mode** untuk ditampilkan di monitor gudang.
*   **📦 Katalog & Stok Dijual**: Manajemen master produk, SKU, barcode, dan informasi stok barang secara real-time.
*   **🛒 Penjualan (DO Keluar)**: Pembuatan Sales Order dan pencetakan Surat Jalan / Delivery Order (DO) otomatis mengurangi stok.
*   **📥 Penerimaan Supplier (PO)**: Pencatatan tanda terima barang / Goods Receipt dari supplier yang secara otomatis menambah stok.
*   **🔄 Mutasi Stok & Log**: Pencatatan seluruh riwayat keluar-masuk barang (pergerakan barang) lengkap dengan nama PIC.
*   **📋 Stock Opname (Audit)**: Fitur untuk melakukan penyesuaian stok fisik dan sistem secara periodik, mendukung draft dan approval.
*   **🎬 Pusat Unit Demo (POC)**: Manajemen peminjaman dan pengembalian barang demo ke pelanggan/customer (Demo Out / Demo In).
*   **🔧 Service & Maintenance**: Modul untuk melacak tiket perbaikan barang atau unit yang rusak, lengkap dengan status pengerjaan.
*   **📄 Pusat Laporan & Ekspor**: Cetak dan ekspor laporan inventaris secara lengkap.
*   **👥 Kelola Pengguna**: Manajemen hak akses pengguna (Admin, Sales, Warehouse Staff, dll).
*   **📷 Barcode Scanner**: Dukungan pemindaian barcode terintegrasi menggunakan kamera perangkat untuk pencarian dan stock opname yang lebih cepat.

## 🛠️ Teknologi yang Digunakan

*   **Framework**: React 19 + Vite
*   **Styling**: Tailwind CSS v4
*   **Icons**: Lucide React
*   **Charts**: Recharts
*   **Animations**: Motion
*   **Utility & Ekspor**: jsPDF (untuk ekspor PDF), XLSX (untuk ekspor Excel)
*   **Barcode**: HTML5-QRCode
*   **AI Integration**: Google GenAI (berpotensi untuk fitur cerdas ke depan)

## 🚀 Cara Menjalankan (Run Locally)

**Prasyarat:** Pastikan Anda telah menginstal Node.js di sistem Anda.

1.  **Clone atau unduh** repositori ini ke komputer lokal Anda.
2.  Buka terminal/Command Prompt dan arahkan ke direktori proyek.
3.  **Install dependensi** dengan menjalankan perintah:
    ```bash
    npm install
    ```
4.  *(Opsional)* Jika ada fitur yang membutuhkan Gemini API, atur `GEMINI_API_KEY` di dalam file `.env.local`. Anda bisa menyalin dari `.env.example` jika tersedia.
5.  **Jalankan aplikasi** di mode development:
    ```bash
    npm run dev
    ```
6.  Buka browser dan akses alamat yang tertera di terminal (biasanya `http://localhost:3000`).

## 📁 Struktur Direktori Utama

*   `src/components/`: Kumpulan komponen UI terpisah berdasarkan modul (Dashboard, Products, Sales, dll).
*   `src/services/`: Logika layanan bisnis dan integrasi penyimpanan data (seperti `storageService`).
*   `src/types.ts`: Definisi tipe data TypeScript untuk aplikasi (InventoryItem, SalesOrder, dll).

## 📄 Lisensi

Hak cipta dilindungi. Penggunaan aplikasi ini ditujukan untuk kebutuhan internal perusahaan.
