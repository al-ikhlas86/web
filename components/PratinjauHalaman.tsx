'use client';

import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import SchoolHomepage from '@/components/SchoolHomepage';
import type { SiteContent } from '@/lib/site-content';

// Halaman pratinjau untuk editor "Kelola Website" (webview). Editor menampilkan halaman ini dalam iframe dan mengirim DRAF isi website
// lewat postMessage; tampilannya memakai komponen beranda yang SAMA dengan situs asli, jadi hasilnya persis seperti saat tayang.
// Hanya pesan dari asal (origin) editor yang diterima dan hanya dari jendela induk; isi dirender lewat React (tanpa HTML mentah).
const ASAL_EDITOR = new Set([
  'https://app.yayasanalikhlas86.sch.id',
  'https://alikhlas86.duckdns.org',
  'http://localhost:5173',
  'http://localhost:4173',
]);

type Pesan =
  | { type: 'kelola-preview'; content: unknown }
  | { type: 'kelola-scroll'; anchor: string };

const adalahObjek = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

// Gabungkan draf ke isi dasar: hanya bagian bertipe sama (objek/larik) yang diambil, sisanya tetap isi dasar. Menghindari layar rusak
// bila draf belum lengkap atau salah bentuk.
function gabung<T>(dasar: T, kiriman: unknown): T {
  if (Array.isArray(dasar)) return (Array.isArray(kiriman) ? kiriman : dasar) as T;
  if (adalahObjek(dasar)) {
    if (!adalahObjek(kiriman)) return dasar;
    const hasil: Record<string, unknown> = { ...dasar };
    for (const k of Object.keys(dasar)) hasil[k] = gabung((dasar as Record<string, unknown>)[k], kiriman[k]);
    return hasil as T;
  }
  return (typeof kiriman === typeof dasar ? kiriman : dasar) as T;
}

// Isian yang belum lengkap (mis. larik kosong yang dibutuhkan beranda) bisa membuat render gagal: tangkap, tampilkan catatan, dan
// pulihkan otomatis begitu draf berikutnya valid. TIDAK dipasang `key` baru tiap draf: halaman diperbarui di tempat supaya posisi gulir
// dan foto yang sudah dimuat tidak hilang (membongkar-ulang seluruh halaman membuat tinggi halaman runtuh sesaat lalu gulir kembali ke atas).
class PenangkapGalat extends Component<{ children: ReactNode; versi: number; onGalat: (g: boolean) => void }, { galat: boolean }> {
  state = { galat: false };
  static getDerivedStateFromError() { return { galat: true }; }
  componentDidCatch() { this.props.onGalat(true); }
  componentDidUpdate(prev: { versi: number }) {
    if (this.state.galat && prev.versi !== this.props.versi) this.setState({ galat: false });
  }
  render() {
    if (this.state.galat) return <div style={{ padding: 24, fontFamily: 'system-ui', color: '#7a2e0e' }}>Pratinjau belum bisa ditampilkan: ada isian yang belum lengkap. Lengkapi isian di sebelah kiri, pratinjau akan pulih sendiri.</div>;
    return this.props.children;
  }
}

// Elemen yang dituju: id beranda ada di header, padahal yang dimaksud adalah bagian sambutan di bawahnya.
function elemenBagian(id: string): HTMLElement | null {
  if (id === 'beranda') return document.querySelector<HTMLElement>('section.hero') ?? document.getElementById('beranda');
  return document.getElementById(id);
}

// Gulir ke bagian itu (bila belum terlihat atau diminta) dan sorot sebentar supaya jelas bagian mana yang sedang diubah.
function sorotBagian(id: string, paksaGulir: boolean) {
  const el = elemenBagian(id);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const terlihat = r.bottom > 120 && r.top < window.innerHeight - 120;
  if (paksaGulir || !terlihat) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.setAttribute('data-sorot', '1');
  window.setTimeout(() => el.removeAttribute('data-sorot'), 1800);
}

export default function PratinjauHalaman({ awal }: { awal: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(awal);
  const [versi, setVersi] = useState(0);
  const dasar = useRef(awal);
  const anchorAktif = useRef('');

  useEffect(() => {
    let tundaSorot = 0;
    const kePenangan = (e: MessageEvent) => {
      if (e.source !== window.parent || !ASAL_EDITOR.has(e.origin)) return;
      const d = e.data as Pesan | null;
      if (!adalahObjek(d)) return;
      if (d.type === 'kelola-preview') {
        setContent(gabung(dasar.current, d.content));
        setVersi((v) => v + 1);
        // Setelah draf diterapkan, pastikan bagian yang sedang diedit tetap terlihat dan sorot (tanpa memaksa gulir bila sudah terlihat).
        window.clearTimeout(tundaSorot);
        tundaSorot = window.setTimeout(() => { if (anchorAktif.current) sorotBagian(anchorAktif.current, false); }, 250);
      } else if (d.type === 'kelola-scroll' && typeof d.anchor === 'string' && /^[a-z-]{1,30}$/.test(d.anchor)) {
        anchorAktif.current = d.anchor;
        sorotBagian(d.anchor, true);
      }
    };
    window.addEventListener('message', kePenangan);
    // Beri tahu editor bahwa halaman sudah siap menerima draf (isi pesan tidak rahasia, jadi targetOrigin '*').
    window.parent?.postMessage({ type: 'kelola-preview-siap' }, '*');
    return () => { window.removeEventListener('message', kePenangan); window.clearTimeout(tundaSorot); };
  }, []);

  const lapor = (galat: boolean) => window.parent?.postMessage({ type: 'kelola-preview-status', ok: !galat }, '*');

  return (
    <>
      <style>{`
        html { scroll-padding-top: 76px; }
        [data-sorot="1"] { outline: 4px solid rgba(242, 183, 5, 0.95); outline-offset: -4px; animation: sorot-kelola 1.8s ease-out forwards; }
        @keyframes sorot-kelola { 0%, 55% { outline-color: rgba(242, 183, 5, 0.95); } 100% { outline-color: rgba(242, 183, 5, 0); } }
      `}</style>
      <PenangkapGalat versi={versi} onGalat={lapor}>
        <SchoolHomepage content={content} />
      </PenangkapGalat>
    </>
  );
}
