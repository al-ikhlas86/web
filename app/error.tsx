'use client';

import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="page-state"><h1>Halaman belum dapat dimuat</h1><p>Silakan coba kembali untuk membuka informasi Al Ikhlas 86.</p><div><button className="button button-teal" onClick={reset}>Coba Lagi</button><Link className="button button-yellow" href="/">Kembali ke Beranda</Link></div></main>;
}
