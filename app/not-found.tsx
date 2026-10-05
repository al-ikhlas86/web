import Link from 'next/link';

export default function NotFound() {
  return <main className="page-state"><h1>Halaman tidak ditemukan</h1><p>Silakan kembali ke beranda untuk menemukan informasi sekolah.</p><Link className="button button-teal" href="/">Kembali ke Beranda</Link></main>;
}
