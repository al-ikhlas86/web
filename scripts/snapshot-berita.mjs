// Snapshot berita untuk landing page: dijalankan SAAT BUILD (GitHub Actions) sebelum `next build`.
// Mengunduh umpan publik Berita Acara + fotonya ke public/berita/ supaya landing tetap menampilkan berita
// walau VPS mati. Hasil build saja (public/berita/ diabaikan git), tidak dikomit ke repo.
//
// Urutan: (1) coba API; (2) bila gagal, pakai ulang snapshot dari situs yang sedang tayang; (3) bila itu pun gagal,
// snapshot kosong (landing tetap jalan, hanya tanpa berita cadangan). Skrip TIDAK PERNAH membuat build gagal.
import fs from 'node:fs/promises';
import path from 'node:path';

const API = (process.env.NEXT_PUBLIC_API_BERITA ?? 'https://app.yayasanalikhlas86.sch.id/mobile-api').replace(/\/$/, '');
const SITUS = (process.env.SNAPSHOT_SITUS ?? 'https://yayasanalikhlas86.sch.id').replace(/\/$/, '');
const KELUAR = process.env.SNAPSHOT_KELUAR ?? 'public/berita';
const MAKS_BERITA = 12;
const MAKS_FOTO_PER_BERITA = 4;
const MAKS_BYTE = 2 * 1024 * 1024;
const HOST_API = new URL(API).host;

const hanyaGambar = (type) => /^image\/(webp|png|jpe?g|gif)$/.test(type ?? '');
const ekstDari = (type) => ({ 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/gif': 'gif' })[type] ?? 'webp';

async function ambil(url, { json = false, batasByte = 1_000_000 } = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { Accept: json ? 'application/json' : 'image/*' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > batasByte) throw new Error('terlalu besar');
  return json ? { data: JSON.parse(buf.toString('utf8')), type: null } : { data: buf, type: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase() };
}

function bersih(b) {
  return b && typeof b.id === 'number' && typeof b.judul === 'string' && b.judul.trim() ? b : null;
}

async function simpanGambar(url, nama) {
  try {
    const u = new URL(url);
    if (u.host !== HOST_API || !/^\/mobile-api\/uploads\/berita-acara\/[\w.\-]+$/.test(u.pathname)) return null; // hanya berkas berita dari server kita
    const { data, type } = await ambil(url, { batasByte: MAKS_BYTE });
    if (!hanyaGambar(type)) return null;
    const berkas = `${nama}.${ekstDari(type)}`;
    await fs.writeFile(path.join(KELUAR, 'img', berkas), data);
    return `/berita/img/${berkas}`;
  } catch {
    return null;
  }
}

async function dariApi() {
  const { data } = await ambil(`${API}/api/public/berita?limit=${MAKS_BERITA}`, { json: true });
  const daftar = data?.data?.berita;
  if (!Array.isArray(daftar)) throw new Error('bentuk data tidak dikenal');
  const berita = [];
  for (const mentah of daftar.slice(0, MAKS_BERITA)) {
    const b = bersih(mentah);
    if (!b) continue;
    const foto = [];
    for (const [i, url] of (Array.isArray(b.foto) ? b.foto : []).slice(0, MAKS_FOTO_PER_BERITA).entries()) {
      const lokal = await simpanGambar(url, `${b.id}-${i}`);
      if (lokal) foto.push(lokal);
    }
    berita.push({ ...b, cover: foto[0] ?? null, foto });
  }
  return { success: true, data: { berita, katalog: Array.isArray(data.data.katalog) ? data.data.katalog : [], diperbarui: data.data.diperbarui ?? new Date().toISOString() } };
}

async function dariSitusLama() {
  const { data } = await ambil(`${SITUS}/berita/snapshot.json`, { json: true, batasByte: 2_000_000 });
  const daftar = data?.data?.berita;
  if (!Array.isArray(daftar)) throw new Error('snapshot lama tidak valid');
  for (const b of daftar) {
    for (const lokal of b.foto ?? []) {
      if (!/^\/berita\/img\/[\w.\-]+$/.test(lokal)) continue;
      try {
        const { data: buf } = await ambil(`${SITUS}${lokal}`, { batasByte: MAKS_BYTE });
        await fs.writeFile(path.join(KELUAR, 'img', path.basename(lokal)), buf);
      } catch { /* foto hilang: kartu tampil tanpa foto itu */ }
    }
  }
  return data;
}

await fs.rm(KELUAR, { recursive: true, force: true });
await fs.mkdir(path.join(KELUAR, 'img'), { recursive: true });
let hasil = null;
let sumber = 'kosong';
try {
  hasil = await dariApi();
  sumber = 'api';
} catch (e) {
  console.warn(`[snapshot-berita] API gagal (${e.message}); mencoba snapshot dari situs yang sedang tayang.`);
  try {
    hasil = await dariSitusLama();
    sumber = 'situs-lama';
  } catch (e2) {
    console.warn(`[snapshot-berita] snapshot lama juga tidak ada (${e2.message}); snapshot dikosongkan.`);
  }
}
hasil ??= { success: true, data: { berita: [], katalog: [], diperbarui: new Date().toISOString() } };
await fs.writeFile(path.join(KELUAR, 'snapshot.json'), JSON.stringify(hasil));
console.log(`[snapshot-berita] sumber=${sumber}, berita=${hasil.data.berita.length}`);
