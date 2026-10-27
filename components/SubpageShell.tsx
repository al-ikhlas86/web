import type { SiteContent } from '@/lib/site-content';
import SubpageHeader from '@/components/SubpageHeader';

// Kerangka halaman dalam (Artikel, Profil): header dan footer ringkas, tanpa JavaScript tambahan (server component).
export default function SubpageShell({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  const telepon = `tel:${content.contact.phone.replace(/[^+0-9]/g, '')}`;
  return (
    <>
      <a className="skip-link" href="#main-content">Langsung ke isi halaman</a>
      <SubpageHeader kontak={{ phone: content.contact.phone, email: content.contact.email, emailTkit: content.contact.emailTkit, mapUrl: content.contact.mapUrl }} />
      <main id="main-content" className="sub-main">{children}</main>
      <footer className="site-footer sub-footer">
        <div className="container sub-footer-inner">
          <div>
            <strong>{content.teks.footer.judul.replace(/\n/g, ' ')}</strong>
            <p>{content.contact.address}</p>
          </div>
          <div>
            <a href={telepon}>{content.contact.phone}</a>
            <a href={`mailto:${content.contact.email}`}>{content.contact.email}</a>
            <a href={`mailto:${content.contact.emailTkit}`}>{content.contact.emailTkit}</a>
          </div>
        </div>
        <div className="container footer-bottom"><small>© 2026 Yayasan Al Ikhlas 86. Seluruh hak cipta dilindungi.</small></div>
      </footer>
    </>
  );
}
