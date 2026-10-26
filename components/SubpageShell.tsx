import Image from 'next/image';
import Link from 'next/link';
import type { SiteContent } from '@/lib/site-content';
import { withBase } from '@/lib/base-path';

// Kerangka halaman dalam (Artikel, Profil): header dan footer ringkas, tanpa JavaScript tambahan (server component).
export default function SubpageShell({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  const telepon = `tel:${content.contact.phone.replace(/[^+0-9]/g, '')}`;
  return (
    <>
      <a className="skip-link" href="#main-content">Langsung ke isi halaman</a>
      <header className="site-header">
        <div className="topbar container sub-topbar">
          <Link href="/" className="brand" aria-label="Al Ikhlas 86, kembali ke beranda">
            <Image src={withBase('/favicon/favicon.png')} alt="Logo Yayasan Al Ikhlas 86" width={58} height={58} />
            <span><strong>AL IKHLAS <b>86</b></strong><small>Yayasan Pendidikan Islam</small></span>
          </Link>
          <nav className="sub-nav" aria-label="Navigasi halaman">
            <Link href="/">Beranda</Link>
            <Link href="/profil/">Profil</Link>
            <Link href="/artikel/">Artikel</Link>
            <Link href="/#kontak">Kontak</Link>
          </nav>
        </div>
      </header>
      <main id="main-content" className="sub-main">{children}</main>
      <footer className="site-footer sub-footer">
        <div className="container sub-footer-inner">
          <div>
            <strong>{content.teks.footer.judul.replace(/\n/g, ' ')}</strong>
            <p>{content.contact.address}</p>
          </div>
          <div>
            <a href={telepon}>{content.contact.phone}</a>
            <a href={`mailto:${content.contact.email}`}>{content.contact.email}</a>
          </div>
        </div>
        <div className="container footer-bottom"><small>© 2026 Yayasan Al Ikhlas 86. Seluruh hak cipta dilindungi.</small></div>
      </footer>
    </>
  );
}
