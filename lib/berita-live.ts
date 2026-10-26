// Info Terbaru dari Berita Acara (webview/mobile) lewat umpan publik baca-saja milik backend.
// Berjalan di browser pengunjung; gagal/offline = diam (halaman memakai konten bawaan). Semua isi diperlakukan sebagai TEKS.
import type { Article } from '@/lib/site-content';
import { withBase } from '@/lib/base-path';

export type LiveArticle = Article & { katalogLabel: string; foto: string[]; tautan: string[] };

const API = (process.env.NEXT_PUBLIC_API_BERITA ?? 'https://app.yayasanalikhlas86.sch.id/mobile-api').replace(/\/$/, '');

type Mentah = {
  id: number; judul: string; kategori: string | null; ringkasan: string; isi: string; tanggal: string | null;
  katalog: { kode: string; nama: string } | null; cover: string | null; foto: string[]; tautan: string[];
};

const hanyaHttp = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\//i.test(u);
const hanyaGambar = (u: unknown): u is string => hanyaHttp(u) || (typeof u === 'string' && /^\/berita\/img\/[\w.\-]+$/.test(u));
const teks = (v: unknown, maks: number) => (typeof v === 'string' ? v.slice(0, maks) : '');

export function petakanBerita(data: unknown): LiveArticle[] {
  const daftar = (data as { data?: { berita?: Mentah[] } } | null)?.data?.berita;
  if (!Array.isArray(daftar)) return [];
  return daftar.flatMap((b): LiveArticle[] => {
    if (!b || typeof b.id !== 'number' || !teks(b.judul, 300)) return [];
    const tanggal = typeof b.tanggal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.tanggal) ? b.tanggal : new Date().toISOString().slice(0, 10);
    const label = b.katalog?.nama ? teks(b.katalog.nama, 60) : 'Yayasan';
    return [{
      id: `berita-${b.id}`,
      title: teks(b.judul, 300),
      category: label,
      date: tanggal,
      image: hanyaGambar(b.cover) ? b.cover : '', // PhotoSlot menambahkan base path sendiri
      excerpt: teks(b.ringkasan, 300) || teks(b.judul, 300),
      body: teks(b.isi, 6000),
      katalogLabel: label,
      foto: (Array.isArray(b.foto) ? b.foto : []).filter(hanyaGambar).slice(0, 12),
      tautan: (Array.isArray(b.tautan) ? b.tautan : []).filter(hanyaHttp).slice(0, 6),
    }];
  });
}

const KUNCI_CACHE = 'berita-cache-v1';
const CACHE_MAKS_UMUR_MS = 30 * 24 * 3600 * 1000;

async function ambilJson(url: string, batasMs: number): Promise<unknown | null> {
  const kontrol = new AbortController();
  const timer = setTimeout(() => kontrol.abort(), batasMs);
  try {
    const res = await fetch(url, { signal: kontrol.signal, headers: { Accept: 'application/json' } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function bacaCache(): LiveArticle[] {
  try {
    const mentah = window.localStorage.getItem(KUNCI_CACHE);
    if (!mentah) return [];
    const { at, data } = JSON.parse(mentah) as { at: number; data: unknown };
    return Date.now() - at < CACHE_MAKS_UMUR_MS ? petakanBerita(data) : [];
  } catch {
    return [];
  }
}

function simpanCache(data: unknown) {
  try { window.localStorage.setItem(KUNCI_CACHE, JSON.stringify({ at: Date.now(), data })); } catch { /* penyimpanan penuh/diblokir: abaikan */ }
}

// Rantai: (1) API hidup -> disimpan ke cache browser; (2) bila gagal: cache browser; (3) bila kosong: snapshot statis
// dari GitHub Pages (dibuat tiap 30 menit saat build, foto ikut). Tidak pernah melempar galat.
export async function ambilBeritaLive(limit = 12): Promise<LiveArticle[]> {
  const live = await ambilJson(`${API}/api/public/berita?limit=${limit}`, 8000);
  const dariApi = petakanBerita(live);
  if (live && dariApi.length > 0) { simpanCache(live); return dariApi; }
  if (live && (live as { success?: boolean }).success) { simpanCache(live); return []; } // API sehat tapi memang belum ada berita
  const cache = bacaCache();
  if (cache.length > 0) return cache;
  return petakanBerita(await ambilJson(withBase('/berita/snapshot.json'), 8000));
}
