import type { Metadata } from 'next';
import SubpageShell from '@/components/SubpageShell';
import { getSiteContent } from '@/lib/site-content';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - Yayasan Al Ikhlas 86',
  description: 'Kebijakan privasi layanan digital Yayasan Al Ikhlas 86: data apa yang dikumpulkan, untuk apa dipakai, dan bagaimana dilindungi.',
  alternates: { canonical: '/privasi/' },
  openGraph: { title: 'Kebijakan Privasi Al Ikhlas 86', description: 'Data yang dikumpulkan layanan digital Yayasan Al Ikhlas 86 dan cara melindunginya.', url: `${SITE_URL}/privasi/`, type: 'website' },
};

const TERAKHIR = '27 November 2026';

export default async function HalamanPrivasi() {
  const c = await getSiteContent();
  return (
    <SubpageShell content={c}>
      <section className="container section sub-section">
        <div className="section-heading">
          <h1 className="sub-title">Kebijakan Privasi</h1>
          <p>Berlaku untuk situs yayasanalikhlas86.sch.id dan layanan digital Yayasan Al Ikhlas 86 (pendaftaran siswa baru dan aplikasi layanan sekolah). Terakhir diperbarui {TERAKHIR}.</p>
        </div>

        <h2 className="daftar-judul">Data yang kami kumpulkan</h2>
        <ul className="daftar-jenjang">
          <li><strong>Pendaftaran siswa baru</strong><span>Nama orang tua/wali, nama calon siswa, alamat email, nomor WhatsApp, isian formulir pendaftaran, dan berkas yang Anda unggah (mis. akta kelahiran, kartu keluarga).</span></li>
          <li><strong>Aplikasi layanan sekolah</strong><span>Data akun dan data akademik/administrasi yang diperlukan sekolah untuk menjalankan layanan kepada siswa, orang tua, guru, dan pegawai.</span></li>
          <li><strong>Akun Google pengirim email</strong><span>Admin sekolah dapat menghubungkan satu akun Google agar sistem dapat mengirim email pemberitahuan. Izin yang diminta hanya &quot;mengirim email&quot;. Kami tidak membaca, menyimpan, atau mengakses isi kotak masuk maupun kontak akun tersebut.</span></li>
        </ul>

        <h2 className="daftar-judul">Untuk apa data dipakai</h2>
        <ul className="daftar-jenjang">
          <li><strong>Memproses pendaftaran dan layanan</strong><span>Memverifikasi pendaftaran, menghubungi orang tua, mengirim Key formulir, tanda pembayaran, jadwal, dan pengumuman penerimaan siswa baru.</span></li>
          <li><strong>Tidak dijual atau dibagikan</strong><span>Data tidak dijual dan tidak diberikan kepada pihak ketiga untuk kepentingan iklan atau pemasaran. Data hanya dapat dilihat petugas sekolah yang berwenang pada jenjang terkait.</span></li>
        </ul>

        <h2 className="daftar-judul">Perlindungan dan penyimpanan</h2>
        <ul className="daftar-jenjang">
          <li><strong>Keamanan</strong><span>Koneksi memakai HTTPS. Berkas pendaftar disimpan terpisah dan hanya dapat dibuka petugas berwenang. Kunci akses dan token disimpan terenkripsi.</span></li>
          <li><strong>Lama penyimpanan</strong><span>Data disimpan selama diperlukan untuk proses penerimaan dan administrasi sekolah, lalu dapat dihapus atas permintaan sesuai ketentuan yang berlaku.</span></li>
        </ul>

        <h2 className="daftar-judul">Hak Anda</h2>
        <p className="daftar-catatan">Anda dapat meminta untuk melihat, memperbaiki, atau menghapus data Anda dengan menghubungi administrasi sekolah melalui halaman Kontak. Izin akun Google yang diberikan dapat dicabut kapan saja di myaccount.google.com/permissions.</p>

        <h2 className="daftar-judul">Kontak</h2>
        <p className="daftar-catatan">Yayasan Al Ikhlas 86, Jakasetia, Bekasi Selatan. Pertanyaan tentang kebijakan ini dapat disampaikan melalui halaman <a href="/#kontak">Kontak</a> atau tombol &quot;Hubungi administrasi&quot; di halaman <a href="/pendaftaran/">Pendaftaran</a>.</p>
      </section>
    </SubpageShell>
  );
}
