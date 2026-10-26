import type { Metadata } from 'next';
import SubpageShell from '@/components/SubpageShell';
import DaftarArtikel from '@/components/DaftarArtikel';
import { daftarArtikel } from '@/lib/artikel';
import { getSiteContent } from '@/lib/site-content';
import { SITE_URL, jsonLdAman, mutlak } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Semua Artikel',
  description: 'Kabar, kegiatan, prestasi, dan informasi terbaru dari Yayasan Al Ikhlas 86: TKIT dan SDIT Al Ikhlas di Jakasetia, Bekasi Selatan.',
  alternates: { canonical: '/artikel/' },
  openGraph: { title: 'Semua Artikel | Al Ikhlas 86', description: 'Kabar, kegiatan, dan informasi terbaru dari keluarga besar Al Ikhlas 86.', url: `${SITE_URL}/artikel/`, type: 'website' },
};

export default async function HalamanArtikel() {
  const [content, artikel] = [await getSiteContent(), daftarArtikel()];
  const kartu = artikel.map((a) => ({ slug: a.slug, judul: a.judul, ringkasan: a.ringkasan, tanggal: a.tanggal, katalog: a.katalog, cover: a.cover }));
  const graf = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Semua Artikel Al Ikhlas 86', url: `${SITE_URL}/artikel/`, inLanguage: 'id-ID',
    isPartOf: { '@id': `${SITE_URL}/#situs` },
    mainEntity: { '@type': 'ItemList', itemListElement: artikel.slice(0, 50).map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: mutlak(`/artikel/${a.slug}/`), name: a.judul })) },
  };
  return (
    <SubpageShell content={content}>
      <section className="container section sub-section">
        <div className="section-heading">
          <h1 className="sub-title">Semua Artikel</h1>
          <p>Kabar, kegiatan, dan informasi dari keluarga besar Al Ikhlas 86. Artikel diperbarui otomatis dari Berita Acara sekolah.</p>
        </div>
        <DaftarArtikel items={kartu} />
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdAman(graf) }} />
    </SubpageShell>
  );
}
