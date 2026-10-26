import { daftarArtikel } from '@/lib/artikel';
import { daftarTim } from '@/lib/tim';
import { getSiteContent } from '@/lib/site-content';
import { NAMA_YAYASAN, SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

// Ringkasan situs untuk asisten AI (usulan llms.txt): fakta inti dan tautan penting, dibuat otomatis dari isi website.
export async function GET() {
  const c = await getSiteContent();
  const artikel = daftarArtikel().slice(0, 20);
  const baris: string[] = [
    `# ${NAMA_YAYASAN}`,
    '',
    `> ${c.teks.tentang.paragraf[0]}`,
    '',
    '## Fakta utama',
    `- Nama: ${NAMA_YAYASAN} (Al Ikhlas 86)`,
    `- Jenjang: ${c.education.map((e) => e.title).join('; ')}`,
    `- Alamat: ${c.contact.address}`,
    `- Telepon: ${c.contact.phone}`,
    `- Email: ${c.contact.email}`,
    ...(c.contact.whatsapp ? [`- WhatsApp: https://wa.me/${c.contact.whatsapp}`] : []),
    `- Peta: ${c.contact.mapUrl}`,
    `- Situs resmi: ${SITE_URL}/`,
    ...c.socials.map((s) => `- ${s.label}: ${s.url}`),
    '',
    '## Jenjang pendidikan',
    ...c.education.map((e) => `- ${e.title} (${e.shortTitle}): ${e.description}`),
    '',
    '## Program unggulan',
    ...c.programs.map((p) => `- ${p.title}: ${p.description}`),
    '',
  ];
  if (c.faq.length) baris.push('## Pertanyaan umum', ...c.faq.flatMap((f) => [`- ${f.q} ${f.a}`]), '');
  const tim = daftarTim().filter((t) => t.kelompok === 'kepala_sekolah');
  if (c.pengurus.length || tim.length) baris.push('## Pengurus dan pimpinan', ...c.pengurus.map((p) => `- ${p.nama}: ${p.jabatan}`), ...tim.map((t) => `- ${t.nama}: ${t.status[0]}`), '');
  baris.push('## Halaman penting', `- [Beranda](${SITE_URL}/): profil yayasan, jenjang, program, galeri, pendaftaran, kontak`, `- [Profil Yayasan](${SITE_URL}/profil/): pengurus, guru, dan tenaga kependidikan`, `- [Semua artikel](${SITE_URL}/artikel/): kabar dan kegiatan sekolah`);
  if (artikel.length) baris.push('', '## Artikel terbaru', ...artikel.map((a) => `- [${a.judul}](${SITE_URL}/artikel/${a.slug}/) (${a.tanggal}): ${a.ringkasan}`));
  return new Response(`${baris.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
