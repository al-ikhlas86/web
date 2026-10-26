import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

// Anggota tim untuk halaman /profil: dibaca dari snapshot yang dibuat saat build (scripts/snapshot-tim.mjs -> public/tim/snapshot.json).
export type Kelompok = 'kepala_sekolah' | 'wali_kelas' | 'pendamping' | 'guru_mapel' | 'staf';
export type AnggotaTim = { nama: string; katalog: { kode: string; nama: string } | null; kelompok: Kelompok; status: string[]; mapel: string[]; deskripsi: string; foto: string };

const KELOMPOK = new Set<string>(['kepala_sekolah', 'wali_kelas', 'pendamping', 'guru_mapel', 'staf']);
const teks = (v: unknown, maks: number) => (typeof v === 'string' ? v.slice(0, maks).trim() : '');
const daftarTeks = (v: unknown, n: number, maks: number) => (Array.isArray(v) ? v.map((x) => teks(x, maks)).filter(Boolean).slice(0, n) : []);

export function daftarTim(): AnggotaTim[] {
  let mentah: unknown;
  try {
    mentah = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'tim', 'snapshot.json'), 'utf8'));
  } catch {
    return [];
  }
  const daftar = (mentah as { data?: { tim?: unknown[] } } | null)?.data?.tim;
  if (!Array.isArray(daftar)) return [];
  const hasil: AnggotaTim[] = [];
  for (const o of daftar as Record<string, unknown>[]) {
    const nama = teks(o?.nama, 100);
    const status = daftarTeks(o?.status, 8, 80);
    if (!nama || !status.length || typeof o.kelompok !== 'string' || !KELOMPOK.has(o.kelompok)) continue;
    const k = o.katalog as { kode?: unknown; nama?: unknown } | null;
    hasil.push({
      nama, status, kelompok: o.kelompok as Kelompok, mapel: daftarTeks(o.mapel, 8, 80), deskripsi: teks(o.deskripsi, 600),
      katalog: k && teks(k.kode, 20) ? { kode: teks(k.kode, 20), nama: teks(k.nama, 60) || teks(k.kode, 20) } : null,
      foto: typeof o.foto === 'string' && /^\/tim\/img\/[\w.\-]+$/.test(o.foto) ? o.foto : '',
    });
  }
  return hasil;
}
