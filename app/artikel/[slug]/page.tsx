import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SubpageShell from '@/components/SubpageShell';
import { daftarArtikel } from '@/lib/artikel';
import { getSiteContent } from '@/lib/site-content';
import { NAMA_YAYASAN, SITE_URL, jsonLdAman, mutlak } from '@/lib/seo';
import { withBase } from '@/lib/base-path';

// Satu halaman statis per artikel yang ada di snapshot saat build. Artikel yang belum masuk snapshot tetap tampil di beranda
// (Info Terbaru) dan menyusul punya halaman sendiri pada build berikutnya (maksimal 30 menit).
export const dynamicParams = false;

export function generateStaticParams() {
  const daftar = daftarArtikel();
  return daftar.length ? daftar.map((a) => ({ slug: a.slug })) : [{ slug: 'belum-ada' }];
}

const tgl = (t: string) => new Date(`${t}T00:00:00+07:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = daftarArtikel().find((x) => x.slug === slug);
  if (!a) return { title: 'Artikel tidak ditemukan', robots: { index: false } };
  const gambar = a.cover ? [{ url: mutlak(a.cover) }] : undefined;
  return {
    title: a.judul,
    description: a.ringkasan,
    alternates: { canonical: `/artikel/${a.slug}/` },
    openGraph: { type: 'article', title: a.judul, description: a.ringkasan, url: `${SITE_URL}/artikel/${a.slug}/`, publishedTime: `${a.tanggal}T00:00:00+07:00`, images: gambar },
    twitter: { card: a.cover ? 'summary_large_image' : 'summary', title: a.judul, description: a.ringkasan },
  };
}

export default async function HalamanArtikelTunggal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getSiteContent();
  const a = daftarArtikel().find((x) => x.slug === slug);
  if (!a) notFound();
  const paragraf = a.isi.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const graf = {
    '@context': 'https://schema.org', '@type': 'Article', headline: a.judul, description: a.ringkasan, inLanguage: 'id-ID',
    datePublished: `${a.tanggal}T00:00:00+07:00`, dateModified: `${a.tanggal}T00:00:00+07:00`, mainEntityOfPage: `${SITE_URL}/artikel/${a.slug}/`,
    ...(a.foto.length ? { image: a.foto.map(mutlak) } : {}), articleSection: a.katalog,
    author: { '@type': 'Organization', name: NAMA_YAYASAN, url: `${SITE_URL}/` },
    publisher: { '@type': 'Organization', name: NAMA_YAYASAN, logo: { '@type': 'ImageObject', url: mutlak('/favicon/favicon.png') } },
  };
  return (
    <SubpageShell content={content}>
      <article className="container section sub-section article-page">
        <Link href="/artikel/" className="article-back">← Semua artikel</Link>
        <header className="article-head">
          <small>{tgl(a.tanggal)} · {a.katalog}{a.kategori ? ` · ${a.kategori}` : ''}</small>
          <h1 className="sub-title">{a.judul}</h1>
        </header>
        {a.cover && <div className="article-cover"><img src={withBase(a.cover)} alt={a.judul} decoding="async" fetchPriority="high" /></div>}
        <div className="article-text">{paragraf.length ? paragraf.map((p, i) => <p key={i}>{p}</p>) : <p>{a.ringkasan}</p>}</div>
        {a.foto.length > 1 && <div className="article-gallery">{a.foto.slice(1).map((f) => <img key={f} src={withBase(f)} alt="" loading="lazy" decoding="async" />)}</div>}
        {a.tautan.length > 0 && <p className="article-links">{a.tautan.map((u) => <a key={u} href={u} target="_blank" rel="noopener noreferrer">{u}</a>)}</p>}
        <div className="article-foot"><Link className="button button-teal button-small" href="/artikel/">Lihat artikel lainnya</Link></div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdAman(graf) }} />
    </SubpageShell>
  );
}
