'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { withBase } from '@/lib/base-path';
import { srcsetUntuk } from '@/lib/gambar';
import { cocokKatalog, type PilihanKatalog } from '@/lib/katalog-tipe';

export type KartuArtikel = { slug: string; judul: string; ringkasan: string; tanggal: string; katalog: string; katalogKode: string; cover: string };
const PER_HALAMAN = 12;
const tgl = (t: string) => new Date(`${t}T00:00:00+07:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

// Daftar semua artikel dengan penyaring katalog + pencarian. Isi sudah ada di HTML saat build (dapat dibaca mesin pencari).
export default function DaftarArtikel({ items, pilihan }: { items: KartuArtikel[]; pilihan: PilihanKatalog[] }) {
  const [katalog, setKatalog] = useState('Semua'); // 'Semua' atau kode katalog terdaftar
  const [cari, setCari] = useState('');
  const [tampil, setTampil] = useState(PER_HALAMAN);
  const hasil = useMemo(() => {
    const k = cari.trim().toLocaleLowerCase('id');
    return items.filter((i) => cocokKatalog(i.katalogKode, katalog) && (!k || `${i.judul} ${i.ringkasan}`.toLocaleLowerCase('id').includes(k)));
  }, [items, katalog, cari]);

  if (items.length === 0) {
    return <div className="empty-state"><p>Belum ada artikel yang dipublikasikan. Nantikan kabar terbaru dari keluarga besar Al Ikhlas.</p></div>;
  }
  return (
    <>
      <div className="article-tools">
        {pilihan.length > 1 && (
          <div className="gallery-filters" aria-label="Katalog artikel">
            {[{ kode: 'Semua', nama: 'Semua' }, ...pilihan].map((l) => <button key={l.kode} aria-pressed={katalog === l.kode} className={katalog === l.kode ? 'active' : ''} onClick={() => { setKatalog(l.kode); setTampil(PER_HALAMAN); }}>{l.nama}</button>)}
          </div>
        )}
        <label className="search-field"><MagnifyingGlass size={18} aria-hidden="true" /><input type="search" value={cari} onChange={(e) => { setCari(e.target.value); setTampil(PER_HALAMAN); }} placeholder="Cari artikel..." aria-label="Cari artikel" /></label>
      </div>
      {hasil.length === 0 ? <div className="empty-state"><p>{cari.trim() ? 'Artikel tidak ditemukan. Coba kata kunci lain.' : `Belum ada artikel untuk ${pilihan.find((p) => p.kode === katalog)?.nama ?? 'katalog ini'}.`}</p></div> : (
        <div className="news-grid article-grid">
          {hasil.slice(0, tampil).map((a) => (
            <Link key={a.slug} href={`/artikel/${a.slug}/`} className="news-card">
              <div className="photo-slot">{a.cover ? <img src={withBase(a.cover)} srcSet={srcsetUntuk(a.cover)} sizes="(max-width: 600px) 110px, (max-width: 1100px) 50vw, 360px" alt="" loading="lazy" decoding="async" /> : <div className="photo-empty"><span>{a.katalog}</span></div>}</div>
              <div className="news-card-body"><small>{tgl(a.tanggal)} · {a.katalog}</small><h3>{a.judul}</h3><p>{a.ringkasan}</p></div>
            </Link>
          ))}
        </div>
      )}
      {hasil.length > tampil && <div className="article-more"><button className="button button-teal button-small" onClick={() => setTampil(tampil + PER_HALAMAN)}>Tampilkan lebih banyak</button></div>}
    </>
  );
}
