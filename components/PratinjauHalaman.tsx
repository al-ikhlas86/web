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
// pulihkan otomatis begitu draf berikutnya valid.
class PenangkapGalat extends Component<{ children: ReactNode; onGalat: (g: boolean) => void }, { galat: boolean }> {
  state = { galat: false };
  static getDerivedStateFromError() { return { galat: true }; }
  componentDidCatch() { this.props.onGalat(true); }
  render() {
    if (this.state.galat) return <div style={{ padding: 24, fontFamily: 'system-ui', color: '#7a2e0e' }}>Pratinjau belum bisa ditampilkan: ada isian yang belum lengkap. Lengkapi isian di sebelah kiri, pratinjau akan pulih sendiri.</div>;
    return this.props.children;
  }
}

export default function PratinjauHalaman({ awal }: { awal: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(awal);
  const [versi, setVersi] = useState(0);
  const dasar = useRef(awal);

  useEffect(() => {
    const kePenangan = (e: MessageEvent) => {
      if (e.source !== window.parent || !ASAL_EDITOR.has(e.origin)) return;
      const d = e.data as Pesan | null;
      if (!adalahObjek(d)) return;
      if (d.type === 'kelola-preview') {
        setContent(gabung(dasar.current, d.content));
        setVersi((v) => v + 1);
      } else if (d.type === 'kelola-scroll' && typeof d.anchor === 'string' && /^[a-z-]{1,30}$/.test(d.anchor)) {
        document.getElementById(d.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('message', kePenangan);
    // Beri tahu editor bahwa halaman sudah siap menerima draf (isi pesan tidak rahasia, jadi targetOrigin '*').
    window.parent?.postMessage({ type: 'kelola-preview-siap' }, '*');
    return () => window.removeEventListener('message', kePenangan);
  }, []);

  const lapor = (galat: boolean) => window.parent?.postMessage({ type: 'kelola-preview-status', ok: !galat }, '*');

  return (
    <PenangkapGalat key={versi} onGalat={lapor}>
      <SchoolHomepage content={content} />
    </PenangkapGalat>
  );
}
