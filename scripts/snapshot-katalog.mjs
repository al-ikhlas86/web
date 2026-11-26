// Snapshot daftar katalog untuk website: dijalankan SAAT BUILD (GitHub Actions) sebelum `next build`.
// Mengunduh umpan publik /api/public/web/katalog (katalog yang tampil + kontak person + jenis + urutan) ke public/katalog/snapshot.json.
// Urutan: (1) coba API; (2) bila gagal, pakai ulang snapshot dari situs yang sedang tayang; (3) bila itu pun gagal, tidak menulis apa pun
// (website memakai site.json). Skrip TIDAK PERNAH membuat build gagal. Hasil build saja, tidak dikomit.
import fs from 'node:fs/promises';
import path from 'node:path';

const API = (process.env.NEXT_PUBLIC_API_BERITA ?? 'https://app.yayasanalikhlas86.sch.id/mobile-api').replace(/\/$/, '');
const SITUS = (process.env.SNAPSHOT_SITUS ?? 'https://yayasanalikhlas86.sch.id').replace(/\/$/, '');
const KELUAR = process.env.SNAPSHOT_KELUAR_KATALOG ?? 'public/katalog';

async function ambilJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 200_000) throw new Error('terlalu besar');
  return JSON.parse(buf.toString('utf8'));
}
const sah = (j) => Array.isArray(j?.data?.katalog) && j.data.katalog.length > 0;

async function main() {
  let hasil = null;
  try { const j = await ambilJson(`${API}/api/public/web/katalog`); if (sah(j)) hasil = j; else console.warn('[snapshot-katalog] API membalas daftar kosong/tidak sah'); } catch (e) { console.warn('[snapshot-katalog] API gagal:', e.message); }
  if (!hasil) {
    try { const j = await ambilJson(`${SITUS}/katalog/snapshot.json`); if (sah(j)) { hasil = j; console.warn('[snapshot-katalog] memakai snapshot situs yang sedang tayang'); } } catch (e) { console.warn('[snapshot-katalog] snapshot situs tayang gagal:', e.message); }
  }
  if (!hasil) { console.warn('[snapshot-katalog] tidak ada data katalog; website memakai site.json'); return; }
  await fs.mkdir(KELUAR, { recursive: true });
  await fs.writeFile(path.join(KELUAR, 'snapshot.json'), JSON.stringify(hasil));
  console.log(`[snapshot-katalog] ${hasil.data.katalog.length} katalog disimpan`);
}
main().catch((e) => { console.warn('[snapshot-katalog] galat tak terduga:', e?.message); });
