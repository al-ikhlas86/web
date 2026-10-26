'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { withBase } from '@/lib/base-path';

export type KartuArtikel = { slug: string; judul: string; ringkasan: string; tanggal: string; katalog: string; cover: string };
const PER_HALAMAN = 12;
const tgl = (t: string) => new Date(`${t}T00:00:00+07:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

// Daftar semua artikel dengan penyaring katalog + pencarian. Isi sudah ada di HTML saat build (dapat dibaca mesin pencari).
export default function DaftarArtikel({ items }: { items: KartuArtikel[] }) {
  const [katalog, setKatalog] = useState('Semua');
  const [cari, setCari] = useState('');
  const [tampil, setTampil] = useState(PER_HALAMAN);
  const labelKatalog = useMemo(() => ['Semua', ...Array.from(new Set(items.map((i) => i.katalog)))], [items]);
  const hasil = useMemo(() => {
    const k = cari.trim().toLocaleLowerCase('id');
    return items.filter((i) => (katalog === 'Semua' || i.katalog === katalog) && (!k || `${i.judul} ${i.ringkasan}`.toLocaleLowerCase('id').includes(k)));
  }, [items, katalog, cari]);

  if (items.length === 0) {
    return <div className="empty-state"><p>Belum ada artikel yang dipublikasikan. Nantikan kabar terbaru dari keluarga besar Al Ikhlas.</p></div>;
  }
  return (
    <>
      <div className="article-tools">
        {labelKatalog.length > 2 && (
          <div className="gallery-filters" aria-label="Kategori artikel">
            {labelKatalog.map((l) => <button key={l} aria-pressed={katalog === l} className={katalog === l ? 'active' : ''} onClick={() => { setKatalog(l); setTampil(PER_HALAMAN); }}>{l}</button>)}
          </div>
        )}
        <label className="search-field"><MagnifyingGlass size={18} aria-hidden="true" /><input type="search" value={cari} onChange={(e) => { setCari(e.target.value); setTampil(PER_HALAMAN); }} placeholder="Cari artikel..." aria-label="Cari artikel" /></label>
      </div>
      {hasil.length === 0 ? <div className="empty-state"><p>Artikel tidak ditemukan. Coba kata kunci lain.</p></div> : (
        <div className="news-grid article-grid">
          {hasil.slice(0, tampil).map((a) => (
            <Link key={a.slug} href={`/artikel/${a.slug}/`} className="news-card">
              <div className="photo-slot">{a.cover ? <img src={withBase(a.cover)} alt="" loading="lazy" decoding="async" /> : <div className="photo-empty"><span>{a.katalog}</span></div>}</div>
              <div className="news-card-body"><small>{tgl(a.tanggal)} · {a.katalog}</small><h3>{a.judul}</h3><p>{a.ringkasan}</p></div>
            </Link>
          ))}
        </div>
      )}
      {hasil.length > tampil && <div className="article-more"><button className="button button-teal button-small" onClick={() => setTampil(tampil + PER_HALAMAN)}>Tampilkan lebih banyak</button></div>}
    </>
  );
}
