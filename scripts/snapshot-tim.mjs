// Snapshot Profil Tim untuk landing page: dijalankan SAAT BUILD (GitHub Actions) sebelum `next build`.
// Mengunduh umpan publik Profil Tim (guru/pegawai yang memilih tampil DAN sudah disetujui) + fotonya ke public/tim/ supaya halaman
// /profil tetap lengkap walau VPS mati. Hasil build saja (public/tim/ diabaikan git), tidak dikomit ke repo.
//
// Urutan: (1) coba API; (2) bila gagal, pakai ulang snapshot dari situs yang sedang tayang; (3) bila itu pun gagal, snapshot kosong.
// Skrip TIDAK PERNAH membuat build gagal.
import fs from 'node:fs/promises';
import path from 'node:path';

const API = (process.env.NEXT_PUBLIC_API_BERITA ?? 'https://app.yayasanalikhlas86.sch.id/mobile-api').replace(/\/$/, '');
const SITUS = (process.env.SNAPSHOT_SITUS ?? 'https://yayasanalikhlas86.sch.id').replace(/\/$/, '');
const KELUAR = process.env.SNAPSHOT_KELUAR_TIM ?? 'public/tim';
const MAKS_ORANG = 150;
const MAKS_BYTE = 2 * 1024 * 1024;
const HOST_API = new URL(API).host;
const KELOMPOK = new Set(['kepala_sekolah', 'wali_kelas', 'pendamping', 'guru_mapel', 'staf']);

const hanyaGambar = (type) => /^image\/(webp|png|jpe?g)$/.test(type ?? '');
const ekstDari = (type) => ({ 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg' })[type] ?? 'webp';
const teks = (v, maks) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, maks) : '');
const daftarTeks = (v, n, maks) => (Array.isArray(v) ? v.map((x) => teks(x, maks)).filter(Boolean).slice(0, n) : []);

async function ambil(url, { json = false, batasByte = 1_000_000 } = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { Accept: json ? 'application/json' : 'image/*' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > batasByte) throw new Error('terlalu besar');
  return json ? { data: JSON.parse(buf.toString('utf8')), type: null } : { data: buf, type: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase() };
}

async function simpanGambar(url, nama) {
  try {
    const u = new URL(url);
    if (u.host !== HOST_API || !/^\/mobile-api\/uploads\/profil\/[\w.\-]+$/.test(u.pathname)) return null; // hanya foto profil dari server kita
    const { data, type } = await ambil(url, { batasByte: MAKS_BYTE });
    if (!hanyaGambar(type)) return null;
    const berkas = `${nama}.${ekstDari(type)}`;
    await fs.writeFile(path.join(KELUAR, 'img', berkas), data);
    return `/tim/img/${berkas}`;
  } catch {
    return null;
  }
}

function bersihOrang(o) {
  if (!o || typeof o !== 'object') return null;
  const nama = teks(o.nama, 100);
  const status = daftarTeks(o.status, 8, 80);
  if (!nama || !status.length || !KELOMPOK.has(o.kelompok)) return null;
  const katalog = o.katalog && typeof o.katalog === 'object' && teks(o.katalog.kode, 20) ? { kode: teks(o.katalog.kode, 20), nama: teks(o.katalog.nama, 60) || teks(o.katalog.kode, 20) } : null;
  return { nama, katalog, kelompok: o.kelompok, status, mapel: daftarTeks(o.mapel, 8, 80), deskripsi: teks(o.deskripsi, 600), fotoSumber: typeof o.foto === 'string' ? o.foto : '' };
}

async function dariApi() {
  const { data } = await ambil(`${API}/api/public/tim`, { json: true, batasByte: 2_000_000 });
  const daftar = data?.data?.tim;
  if (!Array.isArray(daftar)) throw new Error('bentuk data tidak dikenal');
  const tim = [];
  for (const mentah of daftar.slice(0, MAKS_ORANG)) {
    const o = bersihOrang(mentah);
    if (!o) continue;
    const foto = o.fotoSumber ? await simpanGambar(o.fotoSumber, `t${tim.length}`) : null;
    const { fotoSumber, ...aman } = o;
    tim.push({ ...aman, foto });
  }
  const katalog = [...new Map(tim.filter((t) => t.katalog).map((t) => [t.katalog.kode, t.katalog])).values()];
  return { success: true, data: { tim, katalog, diperbarui: teks(data.data.diperbarui, 40) || new Date().toISOString() } };
}

async function dariSitusLama() {
  const { data } = await ambil(`${SITUS}/tim/snapshot.json`, { json: true, batasByte: 2_000_000 });
  const daftar = data?.data?.tim;
  if (!Array.isArray(daftar)) throw new Error('snapshot lama tidak valid');
  for (const o of daftar) {
    if (typeof o?.foto !== 'string' || !/^\/tim\/img\/[\w.\-]+$/.test(o.foto)) continue;
    try {
      const { data: buf } = await ambil(`${SITUS}${o.foto}`, { batasByte: MAKS_BYTE });
      await fs.writeFile(path.join(KELUAR, 'img', path.basename(o.foto)), buf);
    } catch { /* foto hilang: kartu tampil tanpa foto itu */ }
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
  console.warn(`[snapshot-tim] API gagal (${e.message}); mencoba snapshot dari situs yang sedang tayang.`);
  try {
    hasil = await dariSitusLama();
    sumber = 'situs-lama';
  } catch (e2) {
    console.warn(`[snapshot-tim] snapshot lama juga tidak ada (${e2.message}); snapshot dikosongkan.`);
  }
}
hasil ??= { success: true, data: { tim: [], katalog: [], diperbarui: new Date().toISOString() } };
await fs.writeFile(path.join(KELUAR, 'snapshot.json'), JSON.stringify(hasil));
console.log(`[snapshot-tim] sumber=${sumber}, orang=${hasil.data.tim.length}`);
