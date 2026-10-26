'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { withBase } from '@/lib/base-path';

export type KartuOrang = {
  kunci: string; nama: string; status: string[]; mapel: string[]; deskripsi: string; foto: string;
  katalogKode: string; katalogNama: string; kelompok: 'pengurus' | 'kepala_sekolah' | 'wali_kelas' | 'pendamping' | 'guru_mapel' | 'staf';
};

const JUDUL_KELOMPOK: Record<KartuOrang['kelompok'], string> = {
  pengurus: 'Pengurus Yayasan', kepala_sekolah: 'Kepala Sekolah', wali_kelas: 'Wali Kelas', pendamping: 'Guru Pendamping', guru_mapel: 'Guru Mata Pelajaran', staf: 'Tenaga Kependidikan',
};
const URUTAN: KartuOrang['kelompok'][] = ['pengurus', 'kepala_sekolah', 'wali_kelas', 'pendamping', 'guru_mapel', 'staf'];
const inisial = (nama: string) => (nama.replace(/^(bapak|ibu|pak|bu|ust\.?|ustadz|ustadzah|dr\.?|drs\.?|hj\.?|h\.?)\s+/i, '').trim().charAt(0) || '?').toUpperCase();

// Halaman Profil Yayasan: pengurus (diisi manual lewat Kelola Website) + guru/pegawai yang memilih tampil dan sudah disetujui.
// Seluruh kartu sudah ada di HTML saat build (dapat dibaca mesin pencari); popup hanya tambahan tampilan.
export default function ProfilTim({ orang, katalog }: { orang: KartuOrang[]; katalog: { kode: string; nama: string }[] }) {
  const [tab, setTab] = useState('Semua');
  const [detail, setDetail] = useState<KartuOrang | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tutupRef = useRef<HTMLButtonElement>(null);
  const adaYayasan = orang.some((o) => o.katalogKode === '');
  const label = useMemo(() => ['Semua', ...(adaYayasan ? ['Yayasan'] : []), ...katalog.filter((k) => orang.some((o) => o.katalogKode === k.kode)).map((k) => k.nama)], [adaYayasan, katalog, orang]);

  const grup = useMemo(() => {
    const kunciGrup = [...(adaYayasan ? [''] : []), ...katalog.map((k) => k.kode)];
    return kunciGrup.map((kode) => {
      const nama = kode === '' ? 'Yayasan' : katalog.find((k) => k.kode === kode)?.nama ?? kode;
      const anggota = orang.filter((o) => o.katalogKode === kode);
      return { kode, nama, bagian: URUTAN.map((k) => ({ kelompok: k, daftar: anggota.filter((o) => o.kelompok === k) })).filter((b) => b.daftar.length > 0) };
    }).filter((g) => g.bagian.length > 0 && (tab === 'Semua' || g.nama === tab));
  }, [orang, katalog, adaYayasan, tab]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (detail && dialog && !dialog.open) {
      dialog.showModal();
      tutupRef.current?.focus();
      const sebelum = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = sebelum; };
    }
    if (!detail && dialog?.open) dialog.close();
    return undefined;
  }, [detail]);

  if (orang.length === 0) {
    return <div className="empty-state"><p>Profil pengurus dan tenaga pendidik akan segera ditambahkan. Nantikan kabar dari keluarga besar Al Ikhlas.</p></div>;
  }
  return (
    <>
      {label.length > 2 && (
        <div className="gallery-filters tim-filters" aria-label="Pilih bagian">
          {label.map((l) => <button key={l} aria-pressed={tab === l} className={tab === l ? 'active' : ''} onClick={() => setTab(l)}>{l}</button>)}
        </div>
      )}
      {grup.map((g) => (
        <section className="tim-group" key={g.kode || 'yayasan'} aria-label={g.nama}>
          <h2>{g.kode === '' ? 'Yayasan' : g.nama}</h2>
          {g.bagian.map((b) => (
            <div className="tim-bagian" key={b.kelompok}>
              <h3>{JUDUL_KELOMPOK[b.kelompok]}</h3>
              <div className="tim-grid">
                {b.daftar.map((o) => (
                  <button type="button" className="tim-card" key={o.kunci} onClick={() => setDetail(o)} aria-label={`Lihat profil ${o.nama}`}>
                    <span className="tim-foto">{o.foto ? <img src={withBase(o.foto)} alt="" loading="lazy" decoding="async" /> : <span className="tim-inisial" aria-hidden="true">{inisial(o.nama)}</span>}</span>
                    <span className="tim-info"><strong>{o.nama}</strong><small>{o.status[0]}</small>{o.deskripsi && <em>{o.deskripsi}</em>}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
      <dialog ref={dialogRef} className="site-dialog tim-dialog" aria-labelledby="tim-judul" onCancel={() => setDetail(null)} onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
        <div className="dialog-inner">
          <button ref={tutupRef} className="dialog-close" aria-label="Tutup" onClick={() => setDetail(null)}><X size={23} /></button>
          {detail && (
            <div className="tim-detail">
              <div className="tim-detail-foto">{detail.foto ? <img src={withBase(detail.foto)} alt={detail.nama} decoding="async" /> : <span className="tim-inisial" aria-hidden="true">{inisial(detail.nama)}</span>}</div>
              <div className="tim-detail-teks">
                <h2 id="tim-judul">{detail.nama}</h2>
                <ul className="tim-status">{detail.status.map((s) => <li key={s}>{s}</li>)}</ul>
                {detail.mapel.length > 0 && <p><b>Mata pelajaran:</b> {detail.mapel.join(', ')}</p>}
                {detail.deskripsi && <blockquote>{detail.deskripsi}</blockquote>}
                <small className="tim-asal">{detail.katalogKode === '' ? 'Yayasan Al Ikhlas 86' : detail.katalogNama}</small>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
