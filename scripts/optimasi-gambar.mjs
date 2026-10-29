// Membuat varian ukuran (480/800/1200 px, WebP) dari semua foto website SAAT BUILD, lalu menulis lib/gambar-manifest.json.
// Foto ASLI (HD, hasil unggah Kelola Website) tidak diubah: browser memilih varian terkecil yang masih tajam untuk layarnya lewat srcset,
// jadi HP kecil tidak lagi mengunduh foto 1600 px untuk kotak 300 px. Dijalankan di GitHub Actions sebelum `next build`; hasilnya
// (public/_r/) tidak dikomit. Skrip TIDAK PERNAH membuat build gagal: bila sharp tidak ada atau satu foto rusak, foto itu dilewati
// dan website memakai foto aslinya seperti biasa.
import fs from 'node:fs/promises';
import path from 'node:path';

const LEBAR = [480, 800, 1200];
const KUALITAS = 76;
const AKAR = 'public';
const FOLDER = ['uploads', 'images', 'berita/img', 'tim'];
const KELUAR = path.join(AKAR, '_r');
const MANIFEST = 'lib/gambar-manifest.json';
const DUKUNG = /\.(webp|png|jpe?g)$/i;

async function daftar(dir) {
  const hasil = [];
  let isi;
  try { isi = await fs.readdir(dir, { withFileTypes: true }); } catch { return hasil; }
  for (const e of isi) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) hasil.push(...(await daftar(p)));
    else if (DUKUNG.test(e.name)) hasil.push(p);
  }
  return hasil;
}

let sharp;
try { sharp = (await import('sharp')).default; } catch { console.warn('[optimasi-gambar] sharp tidak tersedia - dilewati.'); }

const manifest = {};
if (sharp) {
  let dibuat = 0, dilewati = 0, gagal = 0;
  for (const f of FOLDER) {
    for (const berkas of await daftar(path.join(AKAR, f))) {
      const rel = '/' + path.relative(AKAR, berkas).split(path.sep).join('/'); // mis. /uploads/xxx.webp
      try {
        const meta = await sharp(berkas).metadata();
        const w = meta.width ?? 0;
        if (!w) continue;
        const varian = LEBAR.filter((x) => x < w * 0.9); // varian hanya bila benar-benar lebih kecil dari aslinya
        manifest[rel] = { w, v: varian };
        const dasar = rel.replace(/\.[^.]+$/, '');
        for (const x of varian) {
          const tujuan = path.join(KELUAR, `${dasar}-${x}.webp`);
          try {
            const [sTujuan, sAsal] = await Promise.all([fs.stat(tujuan).catch(() => null), fs.stat(berkas)]);
            if (sTujuan && sTujuan.mtimeMs >= sAsal.mtimeMs) { dilewati += 1; continue; }
            await fs.mkdir(path.dirname(tujuan), { recursive: true });
            await sharp(berkas).rotate().resize({ width: x, withoutEnlargement: true }).webp({ quality: KUALITAS, effort: 4 }).toFile(tujuan);
            dibuat += 1;
          } catch (e) { gagal += 1; manifest[rel].v = manifest[rel].v.filter((y) => y !== x); console.warn(`[optimasi-gambar] gagal ${tujuan}: ${e.message}`); }
        }
      } catch (e) { gagal += 1; console.warn(`[optimasi-gambar] dilewati ${berkas}: ${e.message}`); }
    }
  }
  console.log(`[optimasi-gambar] ${Object.keys(manifest).length} foto diperiksa, ${dibuat} varian dibuat, ${dilewati} sudah ada, ${gagal} gagal.`);
}
await fs.writeFile(MANIFEST, JSON.stringify(manifest) + '\n');
