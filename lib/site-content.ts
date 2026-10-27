import 'server-only';
import { z } from 'zod';
import localContent from '@/content/site.json';

const imageSource = z.string().max(2048).refine(
  (value) => value === '' || (/^\/(?!\/)/.test(value) && !value.includes('..')) || /^https:\/\//.test(value),
  'Gunakan path lokal /images/... atau URL HTTPS.',
);
const httpsLink = z.string().url().startsWith('https://').max(2048);
const text = z.string().min(1).max(500);
const katalog = z.string().regex(/^(|[A-Z0-9-]{1,20})$/); // '' = milik yayasan; selain itu kode katalog (SD, TK) pemilik kartu
const detailItem = z.object({ id: text, title: text, description: text, detail: z.string().min(1).max(5000), katalog });
const baris = z.string().min(1).max(300);
const paragraf = z.string().min(1).max(1500);
// Semua teks yang tampil di landing. Baris baru = pindah baris, **kata** = sorotan (lihat components/Rich.tsx).
export const teksSchema = z.object({
  hero: z.object({
    eyebrow: baris,
    slides: z.array(z.object({ judul: baris, paragraf })).min(1).max(4),
    levels: z.array(baris).max(4),
    captionJudul: baris, captionLokasi: baris,
  }),
  tentang: z.object({ judul: baris, subjudul: baris, paragraf: z.array(paragraf).min(1).max(4), ribbonJudul: baris, ribbonTeks: baris }),
  profil: z.object({ pembuka: paragraf, arah: paragraf }),
  nilai: z.array(z.object({ judul: baris, deskripsi: paragraf })).length(4),
  jenjang: z.object({ judul: baris, deskripsi: paragraf }),
  keunggulan: z.object({ judul: baris, butir: z.array(baris).min(1).max(10) }),
  program: z.object({ judul: baris, deskripsi: paragraf }),
  pendaftaran: z.object({ judul: baris, deskripsi: paragraf, catatan: paragraf }),
  galeri: z.object({ judul: baris, deskripsi: paragraf }),
  banner: z.object({ judul: baris, slogan: baris }),
  berita: z.object({ judul: baris, deskripsi: paragraf }),
  footer: z.object({ judul: baris, slogan: baris }),
  faq: z.object({ judul: baris, deskripsi: paragraf }).default({ judul: 'Pertanyaan yang Sering Diajukan', deskripsi: 'Jawaban singkat untuk hal yang paling sering ditanyakan.' }),
});

export const siteContentSchema = z.object({
  heroImage: imageSource.refine(Boolean), aboutImage: imageSource, benefitsImage: imageSource,
  registrationImages: z.array(imageSource).length(4),
  education: z.array(detailItem.extend({ shortTitle: text, subtitle: text, image: imageSource })).min(1).max(6),
  programs: z.array(detailItem.extend({ subtitle: text })).max(12),
  gallery: z.array(z.object({ id: text, label: text, category: z.enum(['Pembelajaran', 'Kegiatan', 'Fasilitas']), image: imageSource, katalog })).max(48),
  articles: z.array(z.object({ id: text, title: text, category: text, date: z.iso.date(), image: imageSource, excerpt: text, body: z.string().max(20000) })).max(50),
  contact: z.object({
    address: text, phone: z.string().regex(/^\+?[0-9 ()-]{6,25}$/), email: z.string().email(), emailTkit: z.string().email(),
    whatsapp: z.string().regex(/^[0-9]{8,16}$/).or(z.literal('')),
    registrationUrl: httpsLink.or(z.literal('')), mapUrl: httpsLink,
    lokasiSingkat: baris, namaKontak: baris,
  }),
  socials: z.array(z.object({ label: text, url: httpsLink })).max(6),
  faq: z.array(z.object({ q: text, a: z.string().min(1).max(1000) })).max(12).default([]),
  pengurus: z.array(z.object({ id: text, nama: text, jabatan: text, deskripsi: z.string().max(600), foto: imageSource })).max(20).default([]),
  teks: teksSchema,
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type Education = SiteContent['education'][number];
export type Program = SiteContent['programs'][number];
export type Teks = SiteContent['teks'];
export type Faq = SiteContent['faq'][number];
export type Pengurus = SiteContent['pengurus'][number];
export type Article = SiteContent['articles'][number];

export async function getSiteContent(): Promise<SiteContent> {
  const fallback = siteContentSchema.parse(localContent);
  const remoteUrl = process.env.SITE_CONTENT_URL;
  if (!remoteUrl) return fallback;
  try {
    const response = await fetch(httpsLink.parse(remoteUrl), {
      next: { revalidate: 60 }, signal: AbortSignal.timeout(5000),
      headers: process.env.SITE_CONTENT_TOKEN ? { Authorization: `Bearer ${process.env.SITE_CONTENT_TOKEN}` } : {},
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.text();
    if (raw.length > 512_000) throw new Error('Konten terlalu besar');
    return siteContentSchema.parse(JSON.parse(raw));
  } catch (error) {
    console.error('[site-content] Sumber jarak jauh gagal; memakai konten lokal.', error instanceof Error ? error.message : 'Invalid content');
    return fallback;
  }
}
