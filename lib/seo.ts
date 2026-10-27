import type { SiteContent } from '@/lib/site-content';

// Alamat resmi situs (dipakai canonical, sitemap, data terstruktur). Bisa ditimpa saat build bila domain pindah.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yayasanalikhlas86.sch.id').replace(/\/$/, '');
export const NAMA_YAYASAN = 'Yayasan Al Ikhlas 86';

export const mutlak = (p: string): string => (/^https?:\/\//i.test(p) ? p : `${SITE_URL}${p.startsWith('/') ? '' : '/'}${p}`);

// JSON-LD aman disisipkan ke <script>: karakter "<" dan pemisah baris Unicode di-escape.
export const jsonLdAman = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');

// Data terstruktur organisasi + sekolah + situs (+ FAQ bila ada), dibaca mesin pencari dan asisten AI.
export function grafOrganisasi(c: SiteContent): Record<string, unknown> {
  const alamat = { '@type': 'PostalAddress', streetAddress: c.contact.address, addressLocality: c.contact.lokasiSingkat, addressCountry: 'ID' };
  const idYayasan = `${SITE_URL}/#yayasan`;
  const sekolah = c.education.map((e) => ({
    '@type': 'School', '@id': `${SITE_URL}/#${e.id}`, name: e.title, alternateName: e.shortTitle, description: e.description,
    parentOrganization: { '@id': idYayasan }, address: alamat, telephone: c.contact.phone, email: /tk/i.test(`${e.id} ${e.shortTitle}`) ? c.contact.emailTkit : c.contact.email, ...(e.image ? { image: mutlak(e.image) } : {}),
  }));
  const graf: Record<string, unknown>[] = [
    {
      '@type': ['EducationalOrganization', 'Organization'], '@id': idYayasan, name: NAMA_YAYASAN, alternateName: ['Al Ikhlas 86', 'Al-Ikhlas 86'],
      url: `${SITE_URL}/`, logo: mutlak('/favicon/favicon.png'), image: mutlak(c.heroImage), description: c.teks.tentang.paragraf[0],
      address: alamat, telephone: c.contact.phone, email: [c.contact.email, c.contact.emailTkit], areaServed: c.contact.lokasiSingkat,
      ...(c.socials.length ? { sameAs: c.socials.map((s) => s.url) } : {}),
      subOrganization: c.education.map((e) => ({ '@id': `${SITE_URL}/#${e.id}` })),
    },
    ...sekolah,
    { '@type': 'WebSite', '@id': `${SITE_URL}/#situs`, url: `${SITE_URL}/`, name: 'Al Ikhlas 86', inLanguage: 'id-ID', publisher: { '@id': idYayasan } },
  ];
  if (c.faq.length) {
    graf.push({ '@type': 'FAQPage', '@id': `${SITE_URL}/#faq`, mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  }
  return { '@context': 'https://schema.org', '@graph': graf };
}
