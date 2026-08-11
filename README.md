Nama  :Raja Zhafar Akbar Rangkuty
NIM  :20240140123

Project ini di kerja untuk membantu ibu Aries dalam membantu Toko Sembakonya
Ibu Aries ingin project ini membantu pelanggannya untuk memesan barang pesanan
serta ibu Aries ingin project ini dapat melakukan perubahan stock dan harga dengan sendiri.
Dengan tambahan juga ibu Aries meminta fitur AI yang dapat menjawab pertanyaan umumpelanggan 

Cara menjalankan project secara lokal:
1. Clone / Download Repository
2. Konfigurasi Environment Variables (`.env`)
3. Install Dependency (npm install)
4. Jalankan Server (npm start)

Daftar endpoint API beserta method:
<br>
1.POST /api/register
  Mendaftarkan akun pengguna/pelanggan baru.
<br>
2.POST /api/login
  Melakukan autentikasi pengguna dan membuat session login.
<br>
3.GET /api/products
  Mengambil seluruh daftar produk. Mendukung query parameter kategori dan search.
<br>
4.GET /api/products/:id
  Mengambil detail informasi satu produk berdasarkan ID.
<br>
5.POST /api/products (Protected)
  Menambahkan produk sembako baru ke database (Memerlukan session login).
<br>
6.PUT /api/products/:id (Protected)
  Memperbarui data, harga, atau stok produk berdasarkan ID (Memerlukan session login).
<br>
7.DELETE /api/products/:id (Protected)
  Menghapus data produk dari database berdasarkan ID (Memerlukan session login).
<br>
8.POST /api/chat
  Mengirimkan pertanyaan pelanggan ke backend Tanya AI dan menerima balasan otomatis seputar operasional toko.

tampilan(ui) dan deskripsinya": 
Halaman Beranda
<img width="1918" height="869" alt="image" src="https://github.com/user-attachments/assets/95aed8c0-3681-4dd7-a6c7-38d5705ef5d7" />
Menampilkan banner utama/hero section, keunggulan toko sembako, dan kartu produk unggulan terbaru.

Katalog Produk
<img width="1915" height="857" alt="image" src="https://github.com/user-attachments/assets/94bf2017-48fb-4ac6-b948-e66e7e884cbc" />
Menampilkan seluruh daftar produk sembako. Dilengkapi fitur pencarian produk secara langsung dan filter berdasarkan kategori.

Detail Produk
<img width="1915" height="863" alt="image" src="https://github.com/user-attachments/assets/c3d8d0e9-b1fe-414c-ada9-1f271d001703" />
Menampilkan informasi rinci mengenai produk terpilih, termasuk foto produk, deskripsi lengkap, sisa stok, harga, serta tombol tindakan/pemesanan.

Halaman Tanya AI
<img width="1896" height="862" alt="image" src="https://github.com/user-attachments/assets/63fd7050-bbca-48e8-bc59-03ca9637b56e" />
Antarmuka obrolan interaktif yang memungkinkan pelanggan mengajukan pertanyaan umum (seperti jam buka toko, gratis ongkir, stok, dan metode pembayaran).

Halaman Login
<img width="1887" height="861" alt="image" src="https://github.com/user-attachments/assets/4cb6fc7b-e48f-48e9-ac82-1285a409f410" />
Formulir masuk bagi pengguna untuk mengakses fitur manajemen dashboard.

Halaman Register 
<img width="1896" height="857" alt="image" src="https://github.com/user-attachments/assets/d6d48d45-ebb7-46e3-ba0b-aea5d65a5e6c" />
Formulir pendaftaran akun pengguna baru.

Dashboard Admin
<img width="1894" height="841" alt="image" src="https://github.com/user-attachments/assets/a3f5e1a5-92ae-4380-8d54-08990357e053" />
Antarmuka khusus pengguna terautentikasi untuk mengelola inventaris toko: menambah produk baru, mengedit harga & stok secara langsung, serta menghapus produk.

Halaman 404 Not Found
<img width="1914" height="864" alt="image" src="https://github.com/user-attachments/assets/b37e33f6-3e49-4973-9488-05026e8eca18" />
Halaman navigasi kesalahan jika pengguna mengakses rute URL yang tidak tersedia

