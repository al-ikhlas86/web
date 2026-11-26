import type { Metadata } from 'next';
import SubpageShell from '@/components/SubpageShell';
import Rich from '@/components/Rich';
import { getSiteContent } from '@/lib/site-content';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Pendaftaran Siswa Baru TKIT & SDIT Al Ikhlas',
  description: 'Informasi dan alur pendaftaran online siswa baru TKIT dan SDIT Al Ikhlas di Jakasetia, Bekasi Selatan: pilih gelombang, bayar, isi formulir, dan pantau status.',
  alternates: { canonical: '/pendaftaran/' },
  openGraph: { title: 'Pendaftaran Siswa Baru Al Ikhlas 86', description: 'Alur pendaftaran online TKIT dan SDIT Al Ikhlas.', url: `${SITE_URL}/pendaftaran/`, type: 'website' },
};

const LANGKAH = [
  ['Pilih gelombang', 'Buka halaman pendaftaran dan pilih gelombang yang sedang dibuka untuk jenjang putra-putri Anda.'],
  ['Isi data awal', 'Tuliskan nama orang tua, nama calon siswa, email, dan nomor WhatsApp yang aktif.'],
  ['Bayar biaya pendaftaran', 'Tagihan muncul sesuai gelombang. Setelah pembayaran diterima, formulir lengkap terbuka.'],
  ['Isi formulir', 'Lengkapi data calon siswa dan orang tua. Belum sempat? Simpan Key formulir yang dikirim ke email, lalu lanjutkan kapan saja tanpa membayar lagi.'],
  ['Pantau status', 'Cek status pendaftaran, jadwal tes, dan pengumuman dengan nomor pendaftaran dan Key Anda.'],
];

export default async function HalamanPendaftaran() {
  const c = await getSiteContent();
  const t = c.teks;
  const telepon = `tel:${c.contact.phone.replace(/[^+0-9]/g, '')}`;
  const daftar = c.contact.registrationUrl || (c.contact.whatsapp ? `https://wa.me/${c.contact.whatsapp}` : telepon);
  const luar = daftar.startsWith('https:');
  return (
    <SubpageShell content={c}>
      <section className="container section sub-section">
        <div className="section-heading">
          <h1 className="sub-title"><Rich text={t.pendaftaran.judul} /></h1>
          <p>{t.pendaftaran.deskripsi}</p>
        </div>
        <div className="daftar-aksi">
          <a className="button button-yellow" href={daftar} {...(luar ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>Daftarkan siswa</a>
          <a className="button button-teal" href={telepon}>Hubungi administrasi</a>
        </div>
        <h2 className="daftar-judul">Alur pendaftaran online</h2>
        <ol className="daftar-langkah">
          {LANGKAH.map(([judul, isi]) => <li key={judul}><strong>{judul}</strong><span>{isi}</span></li>)}
        </ol>
        <h2 className="daftar-judul">Jenjang yang dibuka</h2>
        <ul className="daftar-jenjang">
          {c.education.map((e) => <li key={e.id}><strong>{e.title}</strong><span>{e.subtitle}</span></li>)}
        </ul>
        <p className="daftar-catatan">{t.pendaftaran.catatan}</p>
      </section>
    </SubpageShell>
  );
}
