'use client';

import { useEffect } from 'react';

// Gulir halus HANYA saat pengguna menekan tautan menu ke bagian halaman (#tentang, #kontak, dst).
// `scroll-behavior: smooth` global sebelumnya ikut menganimasikan pemulihan posisi gulir saat tombol kembali ditekan, sehingga halaman
// terlihat melompat ke atas lalu meluncur cepat ke posisi semula. Sekarang CSS dasar `auto` (pemulihan langsung di posisi semula),
// dan kelas `gulir-halus` dipasang sebentar di <html> setiap ada klik pada tautan yang memuat #.
export default function GulirHalus() {
  useEffect(() => {
    let tunda = 0;
    const saatKlik = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href*="#"]');
      if (!a) return;
      const html = document.documentElement;
      html.classList.add('gulir-halus');
      window.clearTimeout(tunda);
      tunda = window.setTimeout(() => html.classList.remove('gulir-halus'), 1500);
    };
    document.addEventListener('click', saatKlik, true);
    return () => { document.removeEventListener('click', saatKlik, true); window.clearTimeout(tunda); };
  }, []);
  return null;
}
