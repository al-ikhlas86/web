'use client';

import { useEffect, useRef, useState } from 'react';

// Tombol "Hubungi administrasi": memilih unit (SD atau TK & PG) lalu membuka WhatsApp admin unit itu. Nomor diatur lewat Kelola Website.
type Pilihan = { label: string; nomor: string };
export default function HubungiAdmin({ pilihan, telepon }: { pilihan: Pilihan[]; telepon: string }) {
  const [buka, setBuka] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);
  const ada = pilihan.filter((p) => p.nomor);

  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false); };
    const luar = (e: MouseEvent) => { if (wadah.current && !wadah.current.contains(e.target as Node)) setBuka(false); };
    document.addEventListener('keydown', esc); document.addEventListener('mousedown', luar);
    return () => { document.removeEventListener('keydown', esc); document.removeEventListener('mousedown', luar); };
  }, [buka]);

  // Tanpa nomor WhatsApp sama sekali: kembali ke telepon sekolah.
  if (ada.length === 0) return <a className="button button-teal" href={telepon}>Hubungi administrasi</a>;
  return (
    <div className="hubungi-admin" ref={wadah}>
      <button type="button" className="button button-teal" aria-expanded={buka} aria-haspopup="true" onClick={() => setBuka(!buka)}>Hubungi administrasi</button>
      {buka && (
        <div className="hubungi-menu" role="group" aria-label="Pilih unit">
          <p>Pilih unit:</p>
          {ada.map((p) => (
            <a key={p.label} href={`https://wa.me/${p.nomor}?text=${encodeURIComponent(`Assalamu'alaikum, saya ingin menanyakan pendaftaran ${p.label}.`)}`} target="_blank" rel="noopener noreferrer" onClick={() => setBuka(false)}>
              <strong>{p.label}</strong><span>Chat WhatsApp +{p.nomor.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, '$1 $2-$3-$4')}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
