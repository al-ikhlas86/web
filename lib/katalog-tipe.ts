import type { SiteContent } from '@/lib/site-content';

// Website mengikuti katalog (2026-11-27). Modul MURNI (tanpa fs) agar bisa dipakai komponen klien dan diuji: menggabungkan isi site.json dengan
// daftar katalog dari backend (kontak person, jenis, urutan). Bila daftar katalog tidak tersedia, website memakai site.json apa adanya.
export type JenisKatalog = 'pendidikan' | 'pengurus';
export type KatalogSnapshot = { kode: string; nama: string; jenis: JenisKatalog; kontak: { label: string; whatsapp: string; email: string } | null };
export type SnapshotKatalog = { katalog: KatalogSnapshot[]; urutanProfil: 'pengurus' | 'pendidik' };
export type KontakKatalog = { kode: string; nama: string; label: string; whatsapp: string; email: string };
export type Terpadu = {
  kontakKatalog: KontakKatalog[];
  urutanProfil: 'pengurus' | 'pendidik';
  jenisKatalog: Record<string, JenisKatalog>;
  namaKatalog: Record<string, string>;
  dariKatalog: boolean;
};
export type SiteTerpadu = SiteContent & Terpadu;

/** Kontak dari site.json (cadangan bila data katalog belum tersedia): SD dan TK seperti sebelumnya. */
export function kontakCadangan(c: SiteContent): KontakKatalog[] {
  return [
    { kode: 'SD', nama: 'SD', label: 'Admin SD', whatsapp: c.contact.whatsapp, email: c.contact.email },
    { kode: 'TK', nama: 'TK & PG', label: 'Admin TK & PG', whatsapp: c.contact.whatsappTk, email: c.contact.emailTkit },
  ].filter((k) => k.whatsapp || k.email);
}

/** Kontak yang dipakai tampilan: dari katalog bila ada, selain itu cadangan site.json. */
export const kontakDari = (c: SiteContent & Partial<Terpadu>): KontakKatalog[] => c.kontakKatalog ?? kontakCadangan(c);

/** Semua email kontak tanpa duplikat (untuk tautan mailto). Selalu ada minimal email umum yayasan. */
export function daftarEmail(c: SiteContent & Partial<Terpadu>): string[] {
  const dari = kontakDari(c).map((k) => k.email).filter(Boolean);
  return [...new Set(dari.length ? dari : [c.contact.email])];
}

type ItemPendidikan = SiteContent['education'][number];
function kartuBawaan(k: KatalogSnapshot): ItemPendidikan {
  const uraian = `Kenali jenjang ${k.nama} di lingkungan Yayasan Al Ikhlas 86. Hubungi administrasi untuk informasi pendaftaran, program, dan kegiatan belajar.`;
  return { id: `katalog-${k.kode.toLowerCase()}`, title: k.nama, shortTitle: k.nama, subtitle: 'Yayasan Al Ikhlas 86', description: uraian, detail: `${uraian} Informasi lengkap akan ditambahkan oleh administrasi sekolah.`, image: '', katalog: k.kode };
}

/**
 * Kontak per katalog: dari Admin IT bila sudah diisi; bila belum, katalog SD/TK memakai kontak di site.json (agar tombol WhatsApp/email tidak hilang
 * selama kontak katalog belum diisi); katalog baru tanpa kontak tidak menampilkan kontak. Bila tak satu pun ada, seluruhnya memakai cadangan site.json.
 */
function kontakGabungan(c: SiteContent, snap: SnapshotKatalog): KontakKatalog[] {
  const cadangan = kontakCadangan(c);
  const hasil = snap.katalog.flatMap((k): KontakKatalog[] => {
    if (k.kontak) return [{ kode: k.kode, nama: k.nama, label: k.kontak.label, whatsapp: k.kontak.whatsapp, email: k.kontak.email }];
    const lama = cadangan.find((x) => x.kode === k.kode);
    return lama ? [{ ...lama, nama: k.nama }] : [];
  });
  return hasil.length ? hasil : cadangan;
}

export function terapkanKatalog(c: SiteContent, snap: SnapshotKatalog | null): SiteTerpadu {
  if (!snap || snap.katalog.length === 0) {
    return { ...c, kontakKatalog: kontakCadangan(c), urutanProfil: 'pengurus', jenisKatalog: {}, namaKatalog: { SD: 'SD', TK: 'TK & PG' }, dariKatalog: false };
  }
  const pendidikan = snap.katalog.filter((k) => k.jenis === 'pendidikan');
  // Kartu jenjang: tiap katalog pendidikan memakai kartu site.json yang kodenya sama (teks/foto yang diedit lewat Kelola Website), atau kartu bawaan
  // untuk katalog baru. Kartu milik katalog yang tidak (lagi) tampil dibuang; kartu umum yayasan (katalog kosong) dipertahankan.
  const umum = c.education.filter((e) => e.katalog === '');
  const kartu = [...pendidikan.map((k) => c.education.find((e) => e.katalog === k.kode) ?? kartuBawaan(k)), ...umum].slice(0, 6);
  return {
    ...c,
    education: kartu.length ? kartu : c.education,
    kontakKatalog: kontakGabungan(c, snap),
    urutanProfil: snap.urutanProfil,
    jenisKatalog: Object.fromEntries(snap.katalog.map((k) => [k.kode, k.jenis])),
    namaKatalog: Object.fromEntries(snap.katalog.map((k) => [k.kode, k.nama])),
    dariKatalog: true,
  };
}

/** "TKIT & SDIT" dari kartu jenjang: dipakai judul/deskripsi SEO supaya ikut berubah bila jenjang bertambah. */
export function namaJenjang(c: SiteContent): string {
  const nama = c.education.map((e) => e.shortTitle.replace(/\s+Al\s+Ikhlas\s*$/i, '').trim()).filter(Boolean);
  return nama.length ? nama.join(' & ') : 'Al Ikhlas 86';
}
