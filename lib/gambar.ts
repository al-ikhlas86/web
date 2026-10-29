import manifest from '@/lib/gambar-manifest.json';
import { withBase } from '@/lib/base-path';

// srcset untuk foto lokal (dibuat skrip scripts/optimasi-gambar.mjs saat build). Foto tanpa varian (atau saat skrip belum jalan,
// mis. `npm run dev`) mengembalikan undefined, sehingga <img> memakai src aslinya seperti sebelumnya.
const PETA = manifest as Record<string, { w: number; v: number[] }>;

export function srcsetGambar(src: string): string | undefined {
  const m = PETA[src];
  if (!m || m.v.length === 0) return undefined;
  const dasar = src.replace(/\.[^.]+$/, '');
  return [...m.v.map((w) => `${withBase(`/_r${dasar}-${w}.webp`)} ${w}w`), `${withBase(src)} ${m.w}w`].join(', ');
}

// Foto berita dari server (https://app.../mobile-api/uploads/berita-acara/...) tersedia dalam ukuran 480/800 lewat ?w=. Hanya berkas dari
// server kita yang dipakai (pola ketat), selain itu undefined.
const POLA_BERITA = /^https:\/\/app\.yayasanalikhlas86\.sch\.id\/mobile-api\/uploads\/berita-acara\/[\w.\-]+$/;
export function srcsetBerita(src: string): string | undefined {
  if (!POLA_BERITA.test(src)) return undefined;
  return `${src}?w=480 480w, ${src}?w=800 800w, ${src} 1200w`;
}

export function srcsetUntuk(src: string): string | undefined {
  return srcsetGambar(src) ?? srcsetBerita(src);
}
