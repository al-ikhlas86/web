import type { Metadata } from 'next';
import PratinjauHalaman from '@/components/PratinjauHalaman';
import { getSiteContent } from '@/lib/site-content';

// Pratinjau untuk editor Kelola Website (dimuat dalam iframe oleh webview). Bukan halaman publik: tidak diindeks mesin pencari dan tidak ada di sitemap.
export const metadata: Metadata = {
  title: 'Pratinjau',
  robots: { index: false, follow: false },
};

export default async function HalamanPratinjau() {
  const content = await getSiteContent();
  return <PratinjauHalaman awal={content} />;
}
