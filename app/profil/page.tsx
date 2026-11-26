import type { Metadata } from 'next';
import SubpageShell from '@/components/SubpageShell';
import ProfilTim, { type KartuOrang } from '@/components/ProfilTim';
import { daftarTim } from '@/lib/tim';
import { getSiteTerpadu } from '@/lib/katalog';
import { namaJenjang } from '@/lib/katalog-tipe';
import { NAMA_YAYASAN, SITE_URL, jsonLdAman, mutlak } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const jenjang = namaJenjang(await getSiteTerpadu());
  return {
    title: 'Profil Yayasan: Pengurus, Guru & Pegawai',
    description: `Kenali pengurus Yayasan Al Ikhlas 86, kepala sekolah, wali kelas, guru, dan pegawai ${jenjang} Al Ikhlas di Jakasetia, Bekasi Selatan.`,
    alternates: { canonical: '/profil/' },
    openGraph: { title: 'Profil Yayasan Al Ikhlas 86', description: 'Pengurus, guru, dan pegawai Al Ikhlas 86.', url: `${SITE_URL}/profil/`, type: 'website' },
  };
}

export default async function HalamanProfil() {
  const content = await getSiteTerpadu();
  const tim = daftarTim();
  const orang: KartuOrang[] = [
    ...content.pengurus.map((p) => ({
      kunci: `pg-${p.id}`, nama: p.nama, status: [p.jabatan], mapel: [], deskripsi: p.deskripsi, foto: p.foto, katalogKode: '', katalogNama: 'Yayasan', kelompok: 'pengurus' as const,
    })),
    ...tim.map((t, i) => {
      const pengurus = t.katalog ? content.jenisKatalog[t.katalog.kode] === 'pengurus' : false;
      return {
        kunci: `tim-${i}`, nama: t.nama, status: t.status, mapel: t.mapel, deskripsi: t.deskripsi, foto: t.foto,
        katalogKode: pengurus ? '' : t.katalog?.kode ?? '', katalogNama: pengurus ? 'Yayasan' : t.katalog?.nama ?? 'Yayasan', kelompok: pengurus ? ('pengurus' as const) : t.kelompok,
      };
    }),
  ];
  const katalog = [...new Map(tim.filter((t) => t.katalog && content.jenisKatalog[t.katalog.kode] !== 'pengurus').map((t) => [t.katalog!.kode, t.katalog!])).values()]
    // Urutan tab/bagian mengikuti urutan katalog yang diatur Admin IT.
    .sort((a, b) => Object.keys(content.namaKatalog).indexOf(a.kode) - Object.keys(content.namaKatalog).indexOf(b.kode));
  // Data terstruktur hanya untuk pengurus dan kepala sekolah (jabatan publik); guru lain tetap terbaca dari HTML.
  const penting = orang.filter((o) => o.kelompok === 'pengurus' || o.kelompok === 'kepala_sekolah');
  const graf = {
    '@context': 'https://schema.org', '@type': 'ProfilePage', name: 'Profil Yayasan Al Ikhlas 86', url: `${SITE_URL}/profil/`, inLanguage: 'id-ID',
    isPartOf: { '@id': `${SITE_URL}/#situs` }, about: { '@id': `${SITE_URL}/#yayasan` },
    mainEntity: penting.map((o) => ({
      '@type': 'Person', name: o.nama, jobTitle: o.status[0], worksFor: { '@type': 'Organization', name: NAMA_YAYASAN, '@id': `${SITE_URL}/#yayasan` },
      ...(o.foto ? { image: mutlak(o.foto) } : {}),
    })),
  };
  return (
    <SubpageShell content={content}>
      <section className="container section sub-section">
        <div className="section-heading">
          <h1 className="sub-title">Profil Yayasan</h1>
          <p>Kenali pengurus, kepala sekolah, wali kelas, guru, dan pegawai keluarga besar Al Ikhlas 86. Nama dan jabatan tampil otomatis dari data sekolah; foto dan deskripsi ditambahkan sendiri oleh yang bersangkutan.</p>
        </div>
        <ProfilTim orang={orang} katalog={katalog} yayasanDulu={content.urutanProfil === 'pengurus'} />
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdAman(graf) }} />
    </SubpageShell>
  );
}
