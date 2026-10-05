import Link from 'next/link';
import VirtualTourCanvas from '@/components/VirtualTourCanvas';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Virtual Tour | Al Ikhlas 86', description: 'Jelajahi perjalanan virtual tour Al Ikhlas 86.' };

export default function VirtualTourPage() {
  return (
    <main className="tour-page">
      <Link href="/" className="tour-home-link" aria-label="Beranda">← Beranda</Link>
      <VirtualTourCanvas />
    </main>
  );
}
