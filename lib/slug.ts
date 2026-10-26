// Alamat halaman artikel: "<id>-<judul-dalam-huruf-kecil>", mis. 12-lomba-mewarnai. Dipakai server (build) dan browser.
export function slugify(teks: string): string {
  return teks
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

export const slugArtikel = (id: number, judul: string): string => {
  const s = slugify(judul);
  return s ? `${id}-${s}` : String(id);
};
