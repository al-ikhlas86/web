import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { withBase } from '@/lib/base-path';
import { SITE_URL } from '@/lib/seo';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const DESKRIPSI = 'Kenali Yayasan Al Ikhlas 86, TKIT dan SDIT Al Ikhlas di Jakasetia, Bekasi Selatan. Informasi pendidikan, kegiatan, pendaftaran, dan virtual tour sekolah.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Yayasan Al Ikhlas 86 - TKIT & SDIT Al Ikhlas Bekasi Selatan', template: '%s | Al Ikhlas 86' },
  description: DESKRIPSI,
  applicationName: 'Al Ikhlas 86',
  keywords: ['Al Ikhlas 86', 'Yayasan Al Ikhlas 86', 'SDIT Al Ikhlas', 'TKIT Al Ikhlas', 'sekolah Islam terpadu Bekasi Selatan', 'Jakasetia'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: {
    type: 'website', locale: 'id_ID', siteName: 'Al Ikhlas 86', url: `${SITE_URL}/`, title: 'Yayasan Al Ikhlas 86 - TKIT & SDIT Al Ikhlas Bekasi Selatan', description: DESKRIPSI,
    images: [{ url: '/images/al-ikhlas-hero.webp', alt: 'Gedung SDIT Al Ikhlas Jakasetia' }],
  },
  twitter: { card: 'summary_large_image', title: 'Yayasan Al Ikhlas 86', description: DESKRIPSI, images: ['/images/al-ikhlas-hero.webp'] },
  icons: {
    icon: withBase('/favicon/favicon-192.png'),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className={`${jakarta.className} antialiased`}>{children}</body>
    </html>
  );
}
