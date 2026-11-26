import type { SiteContent } from '@/lib/site-content';
import { daftarEmail, kontakDari, type Terpadu } from '@/lib/katalog-tipe';
import SubpageHeader from '@/components/SubpageHeader';

const formatWa = (n: string) => `+${n.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, '$1 $2-$3-$4')}`;

// Kerangka halaman dalam (Artikel, Profil): header dan footer ringkas, tanpa JavaScript tambahan (server component).
// Kontak di footer mengikuti katalog yang terdaftar (tiap katalog: WhatsApp dan email kontaknya).
export default function SubpageShell({ content, children }: { content: SiteContent & Partial<Terpadu>; children: React.ReactNode }) {
  const telepon = `tel:${content.contact.phone.replace(/[^+0-9]/g, '')}`;
  const kontak = kontakDari(content);
  return (
    <>
      <a className="skip-link" href="#main-content">Langsung ke isi halaman</a>
      <SubpageHeader kontak={{ phone: content.contact.phone, emails: daftarEmail(content), mapUrl: content.contact.mapUrl }} />
      <main id="main-content" className="sub-main">{children}</main>
      <footer className="site-footer sub-footer">
        <div className="container sub-footer-inner">
          <div>
            <strong>{content.teks.footer.judul.replace(/\n/g, ' ')}</strong>
            <p>{content.contact.address}</p>
          </div>
          <div>
            <a href={telepon}>{content.contact.phone}</a>
            {kontak.length === 0 && <a href={`mailto:${content.contact.email}`}>{content.contact.email}</a>}
            {kontak.map((k) => (
              <span key={k.kode} className="sub-footer-kontak">
                {k.email && <a href={`mailto:${k.email}`}>{k.nama}: {k.email}</a>}
                {k.whatsapp && <a href={`https://wa.me/${k.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp {k.nama}: {formatWa(k.whatsapp)}</a>}
              </span>
            ))}
          </div>
        </div>
        <div className="container footer-bottom"><small>© 2026 Yayasan Al Ikhlas 86. Seluruh hak cipta dilindungi.</small></div>
      </footer>
    </>
  );
}
