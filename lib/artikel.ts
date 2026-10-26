import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { slugArtikel } from '@/lib/slug';

// Artikel untuk halaman /artikel dan /artikel/<alamat>: dibaca dari snapshot yang dibuat saat build
// (scripts/snapshot-berita.mjs -> public/berita/snapshot.json). Jadi halaman artikel tetap ada walau VPS mati.
export type Artikel = {
  id: number; slug: string; judul: string; kategori: string; ringkasan: string; isi: string; tanggal: string;
  katalog: string; cover: string; foto: string[]; tautan: string[];
};

const teks = (v: unknown, maks: number) => (typeof v === 'string' ? v.slice(0, maks) : '');
const lokal = (u: unknown): u is string => typeof u === 'string' && /^\/berita\/img\/[\w.\-]+$/.test(u);
const https = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\//i.test(u);

export function daftarArtikel(): Artikel[] {
  let mentah: unknown;
  try {
    mentah = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'berita', 'snapshot.json'), 'utf8'));
  } catch {
    return [];
  }
  const daftar = (mentah as { data?: { berita?: unknown[] } } | null)?.data?.berita;
  if (!Array.isArray(daftar)) return [];
  const hasil: Artikel[] = [];
  const dipakai = new Set<string>();
  for (const b of daftar as Record<string, unknown>[]) {
    if (!b || typeof b.id !== 'number' || !teks(b.judul, 300).trim()) continue;
    const judul = teks(b.judul, 300).trim();
    const slug = slugArtikel(b.id, judul);
    if (dipakai.has(slug)) continue;
    dipakai.add(slug);
    const tanggal = typeof b.tanggal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.tanggal) ? b.tanggal : '';
    if (!tanggal) continue;
    const foto = (Array.isArray(b.foto) ? b.foto : []).filter(lokal).slice(0, 12);
    const katalog = b.katalog && typeof b.katalog === 'object' ? teks((b.katalog as { nama?: unknown }).nama, 60) : '';
    hasil.push({
      id: b.id, slug, judul, kategori: teks(b.kategori, 60), ringkasan: teks(b.ringkasan, 300) || judul, isi: teks(b.isi, 6000), tanggal,
      katalog: katalog || 'Yayasan', cover: lokal(b.cover) ? b.cover : (foto[0] ?? ''), foto,
      tautan: (Array.isArray(b.tautan) ? b.tautan : []).filter(https).slice(0, 6),
    });
  }
  return hasil.sort((x, y) => (x.tanggal < y.tanggal ? 1 : x.tanggal > y.tanggal ? -1 : y.id - x.id));
}
