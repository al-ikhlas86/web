'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { Phone } from '@phosphor-icons/react/dist/csr/Phone';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { withBase } from '@/lib/base-path';

type Kontak = { phone: string; email: string; emailTkit: string; mapUrl: string };
const MENU: [string, string][] = [['Beranda', '/'], ['Profil', '/profil/'], ['Artikel', '/artikel/'], ['Kontak', '/#kontak']];

// Header halaman dalam: bentuk dan perilaku SAMA dengan header beranda (logo + tombol Menu di HP, panel menu hijau, bilah menu di desktop).
export default function SubpageHeader({ kontak }: { kontak: Kontak }) {
  const [buka, setBuka] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const path = (usePathname() ?? '').replace(/\/+$/, '') + '/';
  const telepon = `tel:${kontak.phone.replace(/[^+0-9]/g, '')}`;

  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setBuka(false); toggleRef.current?.focus(); } };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [buka]);

  return (
    <>
      <header className="site-header">
        <div className="topbar container">
          <Link href="/" className="brand" aria-label="Al Ikhlas 86, kembali ke beranda">
            <Image src={withBase('/favicon/favicon.png')} alt="Logo Yayasan Al Ikhlas 86" width={58} height={58} />
            <span><strong>AL IKHLAS <b>86</b></strong><small>Yayasan Pendidikan Islam</small></span>
          </Link>
          <div className="header-contact"><span>Mari terhubung</span><a href={telepon} aria-label="Telepon sekolah"><Phone size={18} aria-hidden="true" /></a><a href={`mailto:${kontak.email},${kontak.emailTkit}`} aria-label="Email sekolah (SDIT dan TKIT)"><EnvelopeSimple size={18} aria-hidden="true" /></a><a href={kontak.mapUrl} target="_blank" rel="noopener noreferrer" aria-label="Lokasi sekolah"><MapPin size={18} aria-hidden="true" /></a></div>
          <button ref={toggleRef} className="mobile-toggle" aria-expanded={buka} aria-controls="main-navigation" aria-label={buka ? 'Tutup menu' : 'Buka menu'} onClick={() => setBuka(!buka)}>{buka ? <X size={22} /> : <List size={22} />}<span>{buka ? 'Tutup' : 'Menu'}</span></button>
        </div>
      </header>
      {buka && <button className="mobile-menu-backdrop" tabIndex={-1} aria-label="Tutup menu navigasi" onClick={() => { setBuka(false); toggleRef.current?.focus(); }} />}
      <nav id="main-navigation" className={`main-navigation ${buka ? 'is-open' : ''}`} aria-label="Navigasi utama">
        <div className="container nav-links">{MENU.map(([label, href]) => <Link key={label} href={href} className={href === path ? 'nav-home' : ''} onClick={() => setBuka(false)}>{label}</Link>)}</div>
      </nav>
    </>
  );
}
