import type { MetadataRoute } from 'next';
import { daftarArtikel } from '@/lib/artikel';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const artikel = daftarArtikel();
  const terbaru = artikel[0] ? new Date(`${artikel[0].tanggal}T00:00:00+07:00`) : new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/artikel/`, lastModified: terbaru, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/profil/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/virtual-tour/`, changeFrequency: 'yearly', priority: 0.5 },
    ...artikel.map((a) => ({ url: `${SITE_URL}/artikel/${a.slug}/`, lastModified: new Date(`${a.tanggal}T00:00:00+07:00`), changeFrequency: 'yearly' as const, priority: 0.6 })),
  ];
}
