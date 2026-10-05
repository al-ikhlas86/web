# Al Ikhlas 86

Referensi pemilik: `references/Dashboard.webp`. Website yayasan sekolah untuk orang tua dan keluarga di Bekasi. Arah desain: putih, toska, kuning, tipografi ramah dan mudah dibaca, foto sekolah sebagai fokus utama.

ENERGY 2 / RHYTHM 3 / MOTION 1. DESIGN_VARIANCE 4 / MOTION_INTENSITY 2 / VISUAL_DENSITY 4.

Urutan mengikuti referensi: identitas dan kontak, navigasi toska, banner utama, strip informasi, profil yayasan, nilai pendidikan, jenjang, alasan memilih, program, pendaftaran, galeri, banner sekolah, artikel dengan sidebar, footer.

Warna toska menjaga kesamaan referensi. Kuning menandai tindakan pendaftaran dan bagian judul utama. Plus Jakarta Sans dipilih karena bentuk huruf ramah, sesuai konteks keluarga dan pendidikan Indonesia. Lingkaran profil, pita kuning, dan bingkai lengkung foto mengadaptasi motif referensi. Grid program seragam memudahkan perbandingan antar kegiatan, bukan membedakan kualitasnya. Ikon buku, kompas, robot, palet, bola, dan panci membantu mengidentifikasi bidang kegiatan. Panah kartu menunjukkan akses ke informasi; panah banner berpindah slide. Bayangan hanya untuk dialog dan umpan balik hover kartu. Tidak ada animasi dekoratif; transisi singkat menunjukkan hover dan perubahan keadaan.

Logo dan favicon berasal dari `public/favicon/favicon.png` dan tidak diganti. Foto utama adalah hasil perbaikan foto pemilik `references/Alikhlas.jfif`, bukan dokumentasi kondisi terkini. Foto lainnya adalah slot kosong yang ditandai secara jujur. Perjalanan virtual tour menggunakan komponen dan aset lama di `/virtual-tour`.

Aset tambahan yang dibuat setelah izin pemilik: `lantern.svg` dan `islamic-arch.svg`. Lentera dan lengkung berpola geometris mengadaptasi ornamen pendidikan Islam pada referensi Dashboard. Dipakai terbatas pada banner, tidak di belakang teks isi. Gradasi pada SVG menggambarkan permukaan logam emas; aset tidak dianimasikan dan tidak memuat data sekolah rekaan.

Referensi memiliki beberapa jenjang sekolah lain; Al Ikhlas menggunakan TKIT dan SDIT yang terkonfirmasi. Nama, kontak, periode pendaftaran, berita, dan foto sekolah lain tidak disalin.

Pada ponsel, kartu jenjang dan program memakai satu kolom agar teks isi 14 px tetap terbaca. Artikel memakai thumbnail di samping teks, galeri dua kolom dengan ukuran yang dapat menyusut hingga layar 320 px, dan footer disusun vertikal. Tombol utama setidaknya 48 px tinggi; kontrol banner, filter, dan menu setidaknya 44 px. Kolom pencarian 16 px menghindari pembesaran otomatis pada iOS.

Header ponsel tetap terlihat saat digulir. Menu dapat digulir pada layar pendek, menutup melalui pilihan, Escape, atau area di luar menu, dan melepaskan kunci scroll ketika layar berubah ke desktop. Virtual tour memakai pilihan lokasi horizontal hingga ukuran tablet. Judul, pesan area belum tersedia, dan kartu lokasi mempunyai ruang masing-masing dalam posisi portrait maupun landscape; safe-area dan tinggi viewport dinamis dipakai untuk kontrol tepi layar.
