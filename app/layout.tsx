import type { Metadata } from 'next';
import { getSiteTerpadu } from '@/lib/katalog';
import { namaJenjang } from '@/lib/katalog-tipe';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { withBase } from '@/lib/base-path';
import GulirHalus from '@/components/GulirHalus';
import { SITE_URL } from '@/lib/seo';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteTerpadu();
  const jenjang = namaJenjang(c);
  const DESKRIPSI = `Kenali Yayasan Al Ikhlas 86, ${jenjang.replace(' & ', ' dan ')} Al Ikhlas di Jakasetia, Bekasi Selatan. Informasi pendidikan, kegiatan, pendaftaran, dan virtual tour sekolah.`;
  const JUDUL = `Yayasan Al Ikhlas 86 - ${jenjang} Al Ikhlas Bekasi Selatan`;
  return {
  metadataBase: new URL(SITE_URL),
  title: { default: JUDUL, template: '%s | Al Ikhlas 86' },
  description: DESKRIPSI,
  applicationName: 'Al Ikhlas 86',
  keywords: ['Al Ikhlas 86', 'Yayasan Al Ikhlas 86', ...c.education.map((e) => e.shortTitle), 'sekolah Islam terpadu Bekasi Selatan', 'Jakasetia'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'none', 'max-snippet': -1 } },
  openGraph: {
    type: 'website', locale: 'id_ID', siteName: 'Al Ikhlas 86', url: `${SITE_URL}/`, title: JUDUL, description: DESKRIPSI,
    images: [{ url: '/images/al-ikhlas-hero.webp', alt: 'Gedung SDIT Al Ikhlas Jakasetia' }],
  },
  twitter: { card: 'summary_large_image', title: 'Yayasan Al Ikhlas 86', description: DESKRIPSI, images: ['/images/al-ikhlas-hero.webp'] },
  // Google menampilkan favicon bila: ada /favicon.ico atau <link rel="icon"> persegi berukuran kelipatan 48 px, dapat dirayapi, dan di beranda.
  icons: {
    icon: [
      { url: withBase('/favicon.ico'), sizes: 'any' },
      { url: withBase('/favicon/favicon-48.png'), sizes: '48x48', type: 'image/png' },
      { url: withBase('/favicon/favicon-96.png'), sizes: '96x96', type: 'image/png' },
      { url: withBase('/favicon/favicon-192.png'), sizes: '192x192', type: 'image/png' },
    ],
    shortcut: withBase('/favicon.ico'),
    apple: [{ url: withBase('/favicon/apple-touch-icon.png'), sizes: '180x180', type: 'image/png' }],
  },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className={`${jakarta.className} antialiased`}><GulirHalus />{children}</body>
    </html>
  );
}
