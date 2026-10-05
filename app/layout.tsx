import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { withBase } from '@/lib/base-path';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Al Ikhlas 86',
  description: 'Kenali Yayasan Al Ikhlas 86, TKIT dan SDIT Al Ikhlas di Jakasetia, Bekasi Selatan. Informasi pendidikan, kegiatan, pendaftaran, dan virtual tour sekolah.',
  icons: {
    icon: withBase('/favicon/favicon.png'),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className={`${jakarta.className} antialiased`}>{children}</body>
    </html>
  );
}
