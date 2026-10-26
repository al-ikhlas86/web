// Info Terbaru dari Berita Acara (webview/mobile) lewat umpan publik baca-saja milik backend.
// Berjalan di browser pengunjung; gagal/offline = diam (halaman memakai konten bawaan). Semua isi diperlakukan sebagai TEKS.
import type { Article } from '@/lib/site-content';

export type LiveArticle = Article & { katalogLabel: string; foto: string[]; tautan: string[] };

const API = (process.env.NEXT_PUBLIC_API_BERITA ?? 'https://app.yayasanalikhlas86.sch.id/mobile-api').replace(/\/$/, '');

type Mentah = {
  id: number; judul: string; kategori: string | null; ringkasan: string; isi: string; tanggal: string | null;
  katalog: { kode: string; nama: string } | null; cover: string | null; foto: string[]; tautan: string[];
};

const hanyaHttp = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\//i.test(u);
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
      image: hanyaHttp(b.cover) ? b.cover : '',
      excerpt: teks(b.ringkasan, 300) || teks(b.judul, 300),
      body: teks(b.isi, 6000),
      katalogLabel: label,
      foto: (Array.isArray(b.foto) ? b.foto : []).filter(hanyaHttp).slice(0, 12),
      tautan: (Array.isArray(b.tautan) ? b.tautan : []).filter(hanyaHttp).slice(0, 6),
    }];
  });
}

export async function ambilBeritaLive(limit = 12): Promise<LiveArticle[]> {
  const kontrol = new AbortController();
  const timer = setTimeout(() => kontrol.abort(), 8000);
  try {
    const res = await fetch(`${API}/api/public/berita?limit=${limit}`, { signal: kontrol.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    return petakanBerita(await res.json());
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
