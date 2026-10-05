# Website Al Ikhlas 86

Beranda baru mengikuti `references/Dashboard.webp`, dengan identitas Al Ikhlas 86. Virtual tour lama tersedia di `/virtual-tour` melalui navbar. Logo, favicon, seluruh frame tour, dan komponen perjalanan dipertahankan.

## Menjalankan

Gunakan `Jalanin Server.bat` atau jalankan:

```powershell
npm install
npm run dev
```

Buka http://localhost:3000. Build produksi: `npm run build`, lalu `npm start`. Build produksi menggunakan `.next-production`, terpisah dari `.next` milik server pengembangan.

## Mengisi foto dan konten

Semua foto dan data yang dapat diganti ada di `content/site.json`:

| Kolom | Penggunaan |
| --- | --- |
| `heroImage` | Foto gedung di banner utama |
| `aboutImage` | Foto lingkaran profil yayasan |
| `benefitsImage` | Foto pendidik di bagian alasan memilih |
| `education[].image` | Foto setiap jenjang |
| `registrationImages` | Empat foto kolase pendaftaran |
| `gallery[].image` | Dua belas slot foto galeri |
| `articles` | Artikel dengan foto, tanggal, ringkasan, dan isi |
| `contact` | Alamat, telepon, email, WhatsApp, peta, dan tautan pendaftaran |
| `socials` | Daftar `{ "label": "Instagram", "url": "https://..." }` |

Masukkan foto ke `public/images/`, kemudian isi misalnya `"image": "/images/kegiatan-belajar.webp"`. Bisa juga memakai URL HTTPS gambar langsung dari Cloudinary, Supabase Storage, atau penyimpanan lain. Nilai `""` berarti slot kosong. Tidak perlu mengubah komponen tampilan. Foto gagal dimuat menampilkan pesan pengganti.

Di pengembangan, perubahan file terlihat setelah memuat ulang. Untuk konten lokal pada produksi, lakukan build ulang. Editor unggah/CMS belum dihubungkan; foto selain banner sengaja tetap kosong sesuai permintaan.

## Mengatur dari jarak jauh

Sumber konten jarak jauh sudah didukung, tetapi belum terhubung ke akun atau layanan tertentu.

1. Salin seluruh isi `content/site.json` ke layanan yang menyediakan endpoint JSON HTTPS, misalnya berkas JSON di repositori milik Anda atau endpoint CMS. Struktur respons harus sama dengan file tersebut, tanpa pembungkus tambahan.
2. Salin `.env.example` menjadi `.env.local`. Isi `SITE_CONTENT_URL` dengan URL endpoint itu. Jika endpoint memerlukan autentikasi Bearer, isi `SITE_CONTENT_TOKEN` pada lingkungan server.
3. Jalankan ulang server. Untuk produksi, atur variabel yang sama sebelum build dan pada server.
4. Ubah URL gambar atau data di sumber jarak jauh. Halaman diperbarui melalui revalidasi Next.js setelah 60 detik pada kunjungan berikutnya. Ini bukan pembaruan langsung pada tab yang sudah terbuka; muat ulang halaman untuk melihat perubahan. Revalidasi memakai stale-while-revalidate sehingga kunjungan pertama setelah cache kedaluwarsa dapat masih menampilkan data sebelumnya.

Respons divalidasi dengan Zod. Jika sumber gagal, timeout, JSON rusak, atau bentuk data tidak sesuai, website memakai konten lokal. URL gambar dibatasi ke path lokal dan HTTPS, tautan eksternal ke HTTPS. Token hanya digunakan di server.

Contoh artikel untuk ditambahkan ke array `articles` (ganti dengan informasi sekolah yang benar):

```json
{
  "id": "judul-artikel",
  "title": "Judul dari sekolah",
  "category": "Kegiatan",
  "date": "2026-10-05",
  "image": "/images/foto-artikel.webp",
  "excerpt": "Ringkasan artikel dari sekolah.",
  "body": "Isi artikel dari sekolah.\n\nParagraf berikutnya."
}
```

WhatsApp dan URL formulir pendaftaran sengaja kosong karena belum dikonfirmasi. Tombol pendaftaran membuka informasi kontak nyata; setelah `contact.whatsapp` diisi dengan nomor berformat `62...`, tombol kontak beralih ke WhatsApp. Jika `contact.registrationUrl` terisi, tautan formulir tersebut mendapat prioritas.

## Foto utama

Aset ornamen buatan tersedia di `public/images/lantern.svg` dan `public/images/islamic-arch.svg`. Keduanya SVG transparan yang dipakai di banner untuk mengikuti referensi, tanpa mengganti logo atau mengisi foto kegiatan.

`public/images/al-ikhlas-hero.webp` adalah hasil perbaikan foto `references/Alikhlas.jfif` dengan imagegen bawaan, kemudian dikompresi menjadi WebP. Hasil resolusi penuh ada di `output/imagegen/al-ikhlas-restored.png`. Ini adalah rekonstruksi visual berdasarkan foto lama, bukan dokumentasi gedung terkini. Foto asli tetap tersedia. Prompt lengkap disimpan di `output/imagegen/PROMPT.md`.

## Validasi

```powershell
npm run typecheck
npm run test:content
npm run build
npm run test:e2e
```

Untuk pengujian pertama, pasang browser: `npx playwright install chromium`. Jalankan server terlebih dahulu. Gunakan `TEST_BASE_URL` untuk menguji server di port lain. Pengujian mencakup navigasi, dialog, banner, filter galeri, pencarian, akses keyboard, layout enam ukuran layar, audit aksesibilitas, dan checkpoint virtual tour.

## Sumber data dan adaptasi

- Susunan beranda: gambar referensi pemilik dan [Daarul Muttaqien Surabaya](https://www.daarulmuttaqiensurabaya.sch.id/). Konten institusi tersebut tidak disalin sebagai klaim Al Ikhlas.
- TKIT/SDIT dan naungan yayasan: [Verval Yayasan Kemendikdasmen](https://vervalyayasan.data.kemdikbud.go.id/index.php/Chome/profil?yayasan_id=6534B284-CFA0-11E5-BFCA-3FA31926E7F9).
- Alamat, nomor telepon, email, dan akreditasi SDIT: [Data Pendidikan Kemendikdasmen, NPSN 20223227](https://referensi.data.kemendikdasmen.go.id/tabs.php?npsn=20223227).
- Bidang kegiatan: [dokumen Open House SDIT Al Ikhlas 2022](https://anyflip.com/aukrj/vifw/basic). Detail dialog menyatakan sumber historis dan meminta pengunjung mengonfirmasi jadwal/ketersediaan terbaru; tidak ada biaya atau jadwal pendaftaran yang direka.

Salinan halaman utama dan CSS sebelum perubahan ada di `output/backups/`.
