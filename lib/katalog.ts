import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { getSiteContent } from '@/lib/site-content';
import { terapkanKatalog, type KatalogSnapshot, type SiteTerpadu, type SnapshotKatalog } from '@/lib/katalog-tipe';

// Daftar katalog dari backend (SD, TK, kelak SMP/SMA/...), dibaca dari snapshot yang dibuat saat build (scripts/snapshot-katalog.mjs ->
// public/katalog/snapshot.json). Setiap nilai divalidasi ketat; yang tidak sah dibuang. Snapshot hilang/rusak = website memakai site.json.
const teks = (v: unknown, maks: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, '').trim().slice(0, maks) : '');

export function bacaSnapshotKatalog(mentah: unknown): SnapshotKatalog | null {
  const data = (mentah as { data?: { katalog?: unknown[]; urutanProfil?: unknown } } | null)?.data;
  if (!data || !Array.isArray(data.katalog)) return null;
  const katalog: KatalogSnapshot[] = [];
  for (const o of data.katalog as Record<string, unknown>[]) {
    const kode = teks(o?.kode, 20); const nama = teks(o?.nama, 100);
    if (!/^[A-Z0-9-]{1,20}$/.test(kode) || !nama || (o.jenis !== 'pendidikan' && o.jenis !== 'pengurus')) continue;
    const k = o.kontak as { label?: unknown; whatsapp?: unknown; email?: unknown } | null;
    const wa = teks(k?.whatsapp, 16); const email = teks(k?.email, 254);
    const kontak = k && (/^[0-9]{8,16}$/.test(wa) || /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email))
      ? { label: teks(k.label, 80) || `Admin ${kode}`, whatsapp: /^[0-9]{8,16}$/.test(wa) ? wa : '', email: /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email) ? email : '' } : null;
    if (!katalog.some((x) => x.kode === kode)) katalog.push({ kode, nama, jenis: o.jenis, kontak });
  }
  return { katalog: katalog.slice(0, 12), urutanProfil: data.urutanProfil === 'pendidik' ? 'pendidik' : 'pengurus' };
}

function snapshotLokal(): SnapshotKatalog | null {
  try { return bacaSnapshotKatalog(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'katalog', 'snapshot.json'), 'utf8'))); } catch { return null; }
}

/** Isi website yang sudah digabung dengan daftar katalog. Dipakai semua halaman server. */
export async function getSiteTerpadu(): Promise<SiteTerpadu> {
  return terapkanKatalog(await getSiteContent(), snapshotLokal());
}
