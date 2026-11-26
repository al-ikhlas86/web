import type { Metadata } from 'next';
import SubpageShell from '@/components/SubpageShell';
import Rich from '@/components/Rich';
import HubungiAdmin from '@/components/HubungiAdmin';
import { getSiteTerpadu } from '@/lib/katalog';
import { kontakDari, namaJenjang } from '@/lib/katalog-tipe';
import { SITE_URL } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const jenjang = namaJenjang(await getSiteTerpadu());
  return {
    title: `Pendaftaran Siswa Baru ${jenjang} Al Ikhlas`,
    description: `Informasi dan alur pendaftaran online siswa baru ${jenjang} Al Ikhlas di Jakasetia, Bekasi Selatan: pilih gelombang, bayar, isi formulir, dan pantau status.`,
    alternates: { canonical: '/pendaftaran/' },
    openGraph: { title: 'Pendaftaran Siswa Baru Al Ikhlas 86', description: `Alur pendaftaran online ${jenjang} Al Ikhlas.`, url: `${SITE_URL}/pendaftaran/`, type: 'website' },
  };
}

export default async function HalamanPendaftaran() {
  const c = await getSiteTerpadu();
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
          <HubungiAdmin pilihan={kontakDari(c).map((k) => ({ label: k.nama, nomor: k.whatsapp }))} telepon={telepon} />
        </div>
        <h2 className="daftar-judul">{t.pendaftaranHalaman.judulAlur}</h2>
        <ol className="daftar-langkah">
          {t.pendaftaranHalaman.langkah.map((l) => <li key={l.judul}><strong>{l.judul}</strong><span>{l.isi}</span></li>)}
        </ol>
        <h2 className="daftar-judul">{t.pendaftaranHalaman.judulJenjang}</h2>
        <ul className="daftar-jenjang">
          {c.education.map((e) => <li key={e.id}><strong>{e.title}</strong><span>{e.subtitle}</span></li>)}
        </ul>
        <p className="daftar-catatan">{t.pendaftaran.catatan}</p>
      </section>
    </SubpageShell>
  );
}
