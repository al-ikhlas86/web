'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { BookOpen } from '@phosphor-icons/react/dist/csr/BookOpen';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { Compass } from '@phosphor-icons/react/dist/csr/Compass';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { GraduationCap } from '@phosphor-icons/react/dist/csr/GraduationCap';
import { House } from '@phosphor-icons/react/dist/csr/House';
import { Images } from '@phosphor-icons/react/dist/csr/Images';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { Phone } from '@phosphor-icons/react/dist/csr/Phone';
import { Plant } from '@phosphor-icons/react/dist/csr/Plant';
import { Robot } from '@phosphor-icons/react/dist/csr/Robot';
import { SoccerBall } from '@phosphor-icons/react/dist/csr/SoccerBall';
import { UsersThree } from '@phosphor-icons/react/dist/csr/UsersThree';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { Palette } from '@phosphor-icons/react/dist/csr/Palette';
import { CookingPot } from '@phosphor-icons/react/dist/csr/CookingPot';
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import type { Article, Education, Program, SiteContent } from '@/lib/site-content';
import { withBase } from '@/lib/base-path';
import { ambilBeritaLive, type LiveArticle } from '@/lib/berita-live';
import Rich from '@/components/Rich';

const navigation = [
  ['Beranda', '#beranda'], ['Tentang Kami', '#tentang'], ['Jenjang Pendidikan', '#pendidikan'],
  ['Program Unggulan', '#program'], ['Pendaftaran', '#pendaftaran'], ['Galeri', '#galeri'],
  ['Artikel', '#artikel'], ['Virtual Tour', '/virtual-tour'], ['Kontak', '#kontak'],
] as const;

const nilaiIcons = [BookOpen, Plant, GraduationCap, UsersThree];
const programIcons: Record<string, typeof BookOpen> = {
  tahfidz: BookOpen, pramuka: Compass, kreativitas: Palette,
  robotik: Robot, olahraga: SoccerBall, keterampilan: CookingPot,
};
const categories = ['Semua', 'Pembelajaran', 'Kegiatan', 'Fasilitas'] as const;

type Modal =
  | { type: 'profile' }
  | { type: 'education'; item: Education }
  | { type: 'program'; item: Program }
  | { type: 'article'; item: Article & Partial<Pick<LiveArticle, 'foto' | 'tautan'>> }
  | { type: 'photo'; index: number }
  | { type: 'registration'; level: string };

function PhotoSlot({ src, label, className = '', priority = false }: {
  src: string; label: string; className?: string; priority?: boolean;
}) {
  const [failedSource, setFailedSource] = useState('');
  return (
    <div className={`photo-slot ${className}`}>
      {src && failedSource !== src ? (
        <img src={withBase(src)} alt={label} loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSource(src)} />
      ) : (
        <div className="photo-empty">
          <Images size={30} weight="light" aria-hidden="true" />
          <span>{label}</span>
          <small>{src ? 'Foto belum dapat dimuat' : 'Foto akan ditambahkan'}</small>
        </div>
      )}
    </div>
  );
}

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a href="#beranda" className={`brand ${footer ? 'brand-footer' : ''}`} aria-label="Al Ikhlas 86, kembali ke beranda">
      <Image src={withBase("/favicon/favicon.png")} alt="Logo Yayasan Al Ikhlas 86" width={58} height={58} />
      <span><strong>AL IKHLAS <b>86</b></strong><small>Yayasan Pendidikan Islam</small></span>
    </a>
  );
}

export default function SchoolHomepage({ content }: { content: SiteContent }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [category, setCategory] = useState<(typeof categories)[number]>('Semua');
  const [search, setSearch] = useState('');
  const [beritaLive, setBeritaLive] = useState<LiveArticle[]>([]);
  const [filterBerita, setFilterBerita] = useState('Semua');
  useEffect(() => { let batal = false; ambilBeritaLive().then((b) => { if (!batal) setBeritaLive(b); }); return () => { batal = true; }; }, []);
  const [modal, setModal] = useState<Modal | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogOpen = modal !== null;
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const galleryPhotos = content.gallery.filter((item) => Boolean(item.image));
  const visibleGallery = content.gallery.filter((item) => category === 'Semua' || item.category === category);
  const semuaArtikel: (Article & Partial<Pick<LiveArticle, 'foto' | 'tautan'>>)[] = [...beritaLive, ...content.articles].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const labelBerita = ['Semua', ...Array.from(new Set(semuaArtikel.map((item) => item.category)))];
  const articles = semuaArtikel.filter((item) => (filterBerita === 'Semua' || item.category === filterBerita) && `${item.title} ${item.category} ${item.excerpt}`.toLocaleLowerCase('id').includes(search.trim().toLocaleLowerCase('id')));
  const t = content.teks;
  const slideAktif = t.hero.slides[Math.min(slide, t.hero.slides.length - 1)];
  const geserSlide = (arah: number) => setSlide((slide + arah + t.hero.slides.length) % t.hero.slides.length);
  const phoneHref = `tel:${content.contact.phone.replace(/[^+0-9]/g, '')}`;
  const registrationHref = content.contact.registrationUrl || (content.contact.whatsapp ? `https://wa.me/${content.contact.whatsapp}` : `mailto:${content.contact.email}?subject=Informasi%20Pendaftaran%20Al%20Ikhlas%2086`);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialogOpen && dialog && !dialog.open) {
      dialog.showModal();
      dialogCloseRef.current?.focus();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previousOverflow; };
    }
    if (!dialogOpen && dialog?.open) dialog.close();
  }, [dialogOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); mobileToggleRef.current?.focus(); }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  const openRegistration = (level = '') => setModal({ type: 'registration', level });
  const modalTitle = !modal ? '' : modal.type === 'profile' ? 'Tentang Yayasan Al Ikhlas 86'
    : modal.type === 'registration' ? `Informasi Pendaftaran${modal.level ? ` ${modal.level}` : ''}`
    : modal.type === 'photo' ? galleryPhotos[modal.index]?.label || 'Galeri Kegiatan'
    : modal.item.title;

  return (
    <>
      <a className="skip-link" href="#main-content">Langsung ke isi halaman</a>
      <header className="site-header" id="beranda">
        <div className="topbar container">
          <Brand />
          <a className="header-address" href={content.contact.mapUrl} target="_blank" rel="noopener noreferrer">
            <span className="small-icon"><MapPin size={19} aria-hidden="true" /></span>
            <span><strong>Kunjungi sekolah kami</strong><small>{content.contact.lokasiSingkat}</small></span>
          </a>
          <div className="header-contact"><span>Mari terhubung</span><a href={phoneHref} aria-label="Telepon sekolah"><Phone size={18} aria-hidden="true" /></a><a href={`mailto:${content.contact.email}`} aria-label="Email sekolah"><EnvelopeSimple size={18} aria-hidden="true" /></a><a href={content.contact.mapUrl} target="_blank" rel="noopener noreferrer" aria-label="Lokasi sekolah"><MapPin size={18} aria-hidden="true" /></a></div>
          <button ref={mobileToggleRef} className="mobile-toggle" aria-expanded={mobileOpen} aria-controls="main-navigation" aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={22} /> : <List size={22} />}<span>{mobileOpen ? 'Tutup' : 'Menu'}</span></button>
        </div>
      </header>
      {mobileOpen && <button className="mobile-menu-backdrop" tabIndex={-1} aria-label="Tutup menu navigasi" onClick={() => { setMobileOpen(false); mobileToggleRef.current?.focus(); }} />}
      <nav id="main-navigation" className={`main-navigation ${mobileOpen ? 'is-open' : ''}`} aria-label="Navigasi utama">
        <div className="container nav-links">{navigation.map(([label, href]) => <Link key={label} href={href} className={href === '#beranda' ? 'nav-home' : ''} onClick={() => setMobileOpen(false)}>{label === 'Virtual Tour' && <Compass size={15} aria-hidden="true" />}{label}</Link>)}</div>
      </nav>

      <main id="main-content">
        <section className="hero" aria-label="Selamat datang di Al Ikhlas 86">
          <div className="hero-decorations" aria-hidden="true">
            <img className="hero-lantern hero-lantern-left" src={withBase("/images/lantern.svg")} alt="" width={96} height={300} />
            <img className="hero-lantern hero-lantern-right" src={withBase("/images/lantern.svg")} alt="" width={96} height={300} />
            <img className="hero-ornament" src={withBase("/images/islamic-arch.svg")} alt="" width={380} height={620} />
          </div>
          <div className="container hero-layout">
            <div className="hero-copy" aria-live="polite">
              <span className="hero-eyebrow">{t.hero.eyebrow}</span>
              <h1><Rich text={slideAktif.judul} /></h1>
              <p>{slideAktif.paragraf}</p>
              <div className="hero-actions"><button className="button button-yellow" onClick={() => openRegistration()}>Informasi Pendaftaran <ArrowRight size={18} aria-hidden="true" /></button><Link className="hero-tour" href="/virtual-tour"><Compass size={20} aria-hidden="true" /> Jelajahi Sekolah</Link></div>
              <div className="hero-levels">{t.hero.levels.map((level) => <span key={level}>{level}</span>)}</div>
            </div>
            <div className="hero-visual">
              <div className="hero-arch-outline" aria-hidden="true" />
              <div className="hero-photo">
                {content.heroImage.startsWith('/images/') ? <Image src={withBase(content.heroImage)} alt="Gedung SDIT Al Ikhlas Jakasetia, versi foto yang diperbaiki dari foto sekolah" fill priority sizes="(max-width: 767px) 100vw, 55vw" /> : <PhotoSlot src={content.heroImage} label="Gedung SDIT Al Ikhlas" priority />}
              </div>
              <div className="hero-photo-caption"><span className="caption-logo"><Image src={withBase("/favicon/favicon.png")} alt="" width={36} height={36} /></span><span><strong>{t.hero.captionJudul}</strong><small>{t.hero.captionLokasi}</small></span></div>
            </div>
          </div>
          <div className="hero-slider-controls container"><button aria-label="Banner sebelumnya" onClick={() => geserSlide(-1)}><CaretLeft size={18} /></button><div className="slide-dots">{t.hero.slides.map((_, index) => <button key={index} aria-label={`Tampilkan banner ${index + 1}`} aria-pressed={slide === index} className={slide === index ? 'active' : ''} onClick={() => setSlide(index)} />)}</div><button aria-label="Banner berikutnya" onClick={() => geserSlide(1)}><CaretRight size={18} /></button></div>
        </section>

        <div className="welcome-strip"><div className="container"><span><House size={16} weight="fill" aria-hidden="true" /><span>Selamat datang di <strong>Al Ikhlas 86</strong></span></span><button onClick={() => openRegistration()}><GraduationCap size={18} aria-hidden="true" /> Informasi penerimaan siswa <ArrowRight size={15} aria-hidden="true" /></button></div></div>

        <section className="about-section container section" id="tentang">
          <div className="about-visual"><PhotoSlot src={content.aboutImage} label="Kegiatan belajar Al Ikhlas" className="about-photo" /><div className="about-ribbon"><strong>{t.tentang.ribbonJudul}</strong><span>{t.tentang.ribbonTeks}</span></div></div>
          <div className="about-copy"><h2>{t.tentang.judul}</h2><h3>{t.tentang.subjudul}</h3>{t.tentang.paragraf.map((teks) => <p key={teks}>{teks}</p>)}<button className="button button-yellow button-small" onClick={() => setModal({ type: 'profile' })}>Lihat Profil Yayasan</button></div>
        </section>

        <section className="principles-band" aria-label="Nilai pendidikan"><div className="container principles-grid">{t.nilai.map(({ judul, deskripsi }, index) => { const Icon = nilaiIcons[index]; return <div className="principle" key={index}><span className="principle-icon"><Icon size={25} weight="duotone" aria-hidden="true" /></span><h3>{judul}</h3><p>{deskripsi}</p></div>; })}</div></section>

        <section className="education-section section" id="pendidikan">
          <div className="education-background" aria-hidden="true" />
          <div className="container"><div className="education-heading"><h2>{t.jenjang.judul}</h2><p>{t.jenjang.deskripsi}</p></div>
            <div className="education-grid">{content.education.map((item) => <article className="education-card" key={item.id}><div className="education-cover"><div className="education-brand"><Image src={withBase("/favicon/favicon.png")} alt="" width={31} height={31} /><strong>{item.shortTitle}</strong><small>{item.subtitle}</small></div><PhotoSlot src={item.image} label={`Foto ${item.shortTitle}`} /></div><div className="education-body"><h3>{item.title}</h3><p>{item.description}</p><button className="button button-teal button-small" onClick={() => setModal({ type: 'education', item })}>Tentang {item.shortTitle}</button></div></article>)}</div>
          </div>
        </section>

        <section className="benefits-section container" aria-labelledby="benefits-title"><div className="benefits-copy"><h2 id="benefits-title"><Rich text={t.keunggulan.judul} /></h2><ul>{t.keunggulan.butir.map((text) => <li key={text}><CheckCircle size={18} weight="fill" aria-hidden="true" /><span>{text}</span></li>)}</ul></div><PhotoSlot src={content.benefitsImage} label="Foto pendidik Al Ikhlas" className="benefits-photo" /></section>

        <section className="program-section section container" id="program"><div className="section-heading"><h2>{t.program.judul}</h2><p>{t.program.deskripsi}</p></div><div className="program-grid">{content.programs.map((item) => { const Icon = programIcons[item.id] || BookOpen; return <button className="program-card" key={item.id} onClick={() => setModal({ type: 'program', item })}><div className="program-top"><span className="program-icon"><Icon size={30} weight="duotone" aria-hidden="true" /></span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span></div><div className="program-body"><p>{item.description}</p><span className="program-more">Detail kegiatan <ArrowRight size={16} aria-hidden="true" /></span></div></button>; })}</div></section>

        <section className="registration-section section" id="pendaftaran"><div className="container registration-layout"><div className="registration-collage">{content.registrationImages.map((src, index) => <PhotoSlot key={index} src={src} label={['Belajar bersama', 'Aktivitas siswa', 'Kegiatan sekolah', 'Lingkungan sekolah'][index]} />)}</div><div className="registration-copy"><h2><Rich text={t.pendaftaran.judul} /></h2><p>{t.pendaftaran.deskripsi}</p><div className="registration-actions">{content.education.map((item) => <button key={item.id} className="button button-teal button-small" onClick={() => openRegistration(item.shortTitle)}>Info {item.shortTitle}</button>)}</div><small>{t.pendaftaran.catatan}</small></div></div></section>

        <section className="gallery-section section container" id="galeri"><div className="section-heading centered"><h2>{t.galeri.judul}</h2><p>{t.galeri.deskripsi}</p></div><div className="gallery-filters" aria-label="Kategori galeri">{categories.map((item) => <button key={item} aria-pressed={category === item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="gallery-grid">{visibleGallery.map((item) => item.image ? <button className="gallery-photo-button" key={item.id} aria-label={`Lihat foto ${item.label}`} onClick={() => setModal({ type: 'photo', index: galleryPhotos.findIndex((photo) => photo.id === item.id) })}><PhotoSlot src={item.image} label={item.label} /></button> : <PhotoSlot key={item.id} src="" label={item.label} />)}</div>{visibleGallery.length === 0 && <div className="empty-state"><Images size={36} aria-hidden="true" /><p>Belum ada foto dalam kategori ini.</p></div>}<p className="gallery-note">{galleryPhotos.length === 0 ? 'Dokumentasi kegiatan sekolah akan segera ditambahkan.' : 'Klik foto untuk melihat dokumentasi lebih dekat.'}</p></section>

        <section className="school-banner"><div className="container school-banner-content"><Image src={withBase("/favicon/favicon.png")} alt="" width={94} height={94} loading="eager" /><div><strong><Rich text={t.banner.judul} /></strong><p><Rich text={t.banner.slogan} /></p></div><button className="button button-yellow" onClick={() => openRegistration()}>Kenali Pendaftaran <ArrowRight size={18} aria-hidden="true" /></button><div className="banner-arch" aria-hidden="true"><img src={withBase("/images/islamic-arch.svg")} alt="" width={380} height={620} /></div></div></section>

        <div className="welcome-strip article-strip"><div className="container"><span><House size={16} weight="fill" aria-hidden="true" /> Artikel & Informasi</span><button onClick={() => openRegistration()}>Informasi pendaftaran <ArrowRight size={15} aria-hidden="true" /></button></div></div>

        <section className="news-section section container" id="artikel"><div className="news-main"><div className="section-heading"><h2>{t.berita.judul}</h2><p>{t.berita.deskripsi}</p></div>{labelBerita.length > 2 && <div className="gallery-filters news-filters" aria-label="Kategori berita">{labelBerita.map((label) => <button key={label} aria-pressed={filterBerita === label} className={filterBerita === label ? 'active' : ''} onClick={() => setFilterBerita(label)}>{label}</button>)}</div>}{articles.length > 0 ? <div className="news-grid">{articles.slice(0, 6).map((item) => <button className="news-card" key={item.id} onClick={() => setModal({ type: 'article', item })}><PhotoSlot src={item.image} label={item.title} /><div className="news-card-body"><small>{new Date(`${item.date}T00:00:00+07:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}</small><h3>{item.title}</h3><p>{item.excerpt}</p><span>Baca artikel <ArrowRight size={14} aria-hidden="true" /></span></div></button>)}</div> : search.trim() ? <div className="empty-state"><MagnifyingGlass size={32} aria-hidden="true" /><h3>Artikel belum ditemukan</h3><p>Coba kata kunci lain atau kembali setelah kabar sekolah tersedia.</p><button className="button button-teal button-small" onClick={() => setSearch('')}>Hapus pencarian</button></div> : <div className="news-grid">{['Kabar Sekolah', 'Kegiatan Siswa', 'Inspirasi Keluarga'].map((title) => <article className="news-card news-placeholder" key={title}><PhotoSlot src="" label={title} /><div className="news-card-body"><small>Informasi akan ditambahkan</small><h3>{title}</h3><p>Nantikan cerita dan informasi terbaru dari keluarga besar Al Ikhlas.</p></div></article>)}</div>}</div><aside className="news-sidebar"><label className="search-field"><MagnifyingGlass size={18} aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari artikel..." aria-label="Cari artikel" /></label><div className="sidebar-box"><h3>Mari Terhubung</h3><div className="social-links">{content.socials.length > 0 ? content.socials.map((social) => <a key={social.url} href={social.url} target="_blank" rel="noopener noreferrer">{social.label}</a>) : <><a href={phoneHref} aria-label="Telepon sekolah"><Phone size={20} /></a><a href={`mailto:${content.contact.email}`} aria-label="Kirim email"><EnvelopeSimple size={20} /></a><a href={content.contact.mapUrl} target="_blank" rel="noopener noreferrer" aria-label="Lokasi sekolah"><MapPin size={20} /></a></>}</div></div><div className="sidebar-box shortcuts"><h3>Menu Pintasan</h3><a href="#pendaftaran">Informasi Pendaftaran</a><a href="#program">Program Unggulan</a><a href="#tentang">Tentang Yayasan</a><Link href="/virtual-tour">Virtual Tour Sekolah</Link><a href="#kontak">Kontak Sekolah</a></div></aside></section>
      </main>

      <footer className="site-footer" id="kontak"><div className="footer-cta"><div className="container"><div><span aria-hidden="true">#</span><h2><Rich text={t.footer.judul} /></h2></div><button onClick={() => openRegistration()}><span>Kenali sekolah lebih dekat</span><strong>Info Pendaftaran</strong></button></div></div><div className="container footer-main"><div className="footer-brand"><Brand footer /><p><Rich text={t.footer.slogan} /></p><div className="footer-socials"><a href={phoneHref} aria-label="Telepon Al Ikhlas"><Phone size={19} /></a><a href={`mailto:${content.contact.email}`} aria-label="Email Al Ikhlas"><EnvelopeSimple size={19} /></a><a href={content.contact.mapUrl} target="_blank" rel="noopener noreferrer" aria-label="Peta Al Ikhlas"><MapPin size={19} /></a></div></div><div className="footer-column"><h3>Navigasi</h3><a href="#tentang">Profil Yayasan</a><a href="#pendidikan">Jenjang Pendidikan</a><a href="#program">Program Unggulan</a><a href="#galeri">Galeri Kegiatan</a><Link href="/virtual-tour">Virtual Tour</Link></div><div className="footer-column footer-contact"><h3>Kontak Kami</h3><span>{content.contact.namaKontak}</span><a href={phoneHref}><Phone size={16} aria-hidden="true" />{content.contact.phone}</a><a href={`mailto:${content.contact.email}`}><EnvelopeSimple size={16} aria-hidden="true" />{content.contact.email}</a><button onClick={() => openRegistration()}>Informasi Pendaftaran</button></div><div className="footer-column"><h3>Alamat</h3><p>{content.contact.address}</p><a href={content.contact.mapUrl} target="_blank" rel="noopener noreferrer" className="map-link">Lihat di Google Maps <ArrowRight size={15} aria-hidden="true" /></a></div></div><div className="container footer-bottom"><small>© 2026 Yayasan Al Ikhlas 86. Seluruh hak cipta dilindungi.</small><a href="#beranda" aria-label="Kembali ke atas"><ArrowUp size={20} /></a></div></footer>

      <dialog ref={dialogRef} className={`site-dialog ${modal?.type === 'photo' ? 'photo-dialog' : ''}`} aria-labelledby="dialog-title" onCancel={() => setModal(null)} onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <div className="dialog-inner"><button ref={dialogCloseRef} className="dialog-close" aria-label="Tutup dialog" onClick={() => setModal(null)}><X size={23} /></button><h2 id="dialog-title">{modalTitle}</h2>
          {modal?.type === 'profile' && <><p>{t.profil.pembuka}</p><h3>Arah Pendidikan</h3><p>{t.profil.arah}</p><h3>Lokasi</h3><p>{content.contact.address}</p><a className="button button-teal" href={content.contact.mapUrl} target="_blank" rel="noopener noreferrer">Lihat Lokasi Sekolah</a></>}
          {(modal?.type === 'education' || modal?.type === 'program') && <><p>{modal.item.detail}</p><button className="button button-teal" onClick={() => openRegistration(modal.type === 'education' ? modal.item.shortTitle : '')}>Tanyakan ke Sekolah</button></>}
          {modal?.type === 'registration' && <><p>Untuk jadwal penerimaan, persyaratan, dan biaya pendidikan{modal.level ? ` ${modal.level}` : ''} terbaru, silakan hubungi administrasi sekolah.</p><div className="dialog-contact"><a href={phoneHref}><Phone size={21} aria-hidden="true" /><span><small>Telepon {content.contact.namaKontak}</small><strong>{content.contact.phone}</strong></span></a><a href={`mailto:${content.contact.email}?subject=${encodeURIComponent(`Informasi Pendaftaran ${modal.level || 'Al Ikhlas 86'}`)}`}><EnvelopeSimple size={21} aria-hidden="true" /><span><small>Email sekolah</small><strong>{content.contact.email}</strong></span></a><a href={content.contact.mapUrl} target="_blank" rel="noopener noreferrer"><MapPin size={21} aria-hidden="true" /><span><small>Kunjungi sekolah</small><strong>{content.contact.lokasiSingkat}</strong></span></a></div><a className="button button-teal" href={registrationHref} target={registrationHref.startsWith('https:') ? '_blank' : undefined} rel={registrationHref.startsWith('https:') ? 'noopener noreferrer' : undefined}>{content.contact.registrationUrl ? 'Buka Pendaftaran' : content.contact.whatsapp ? 'Hubungi via WhatsApp' : 'Tanyakan Pendaftaran via Email'}</a><p className="dialog-note">Untuk jenjang TKIT, administrasi SDIT dapat membantu mengarahkan Anda ke unit terkait.</p></>}
          {modal?.type === 'article' && <><PhotoSlot src={modal.item.image} label={modal.item.title} className="article-dialog-photo" /><p className="article-body">{modal.item.body}</p>{modal.item.foto && modal.item.foto.length > 1 && <div className="article-photos">{modal.item.foto.slice(1).map((src) => <img key={src} src={withBase(src)} alt="" loading="lazy" decoding="async" />)}</div>}{modal.item.tautan && modal.item.tautan.length > 0 && <p className="article-links">{modal.item.tautan.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{url}</a>)}</p>}</>}
          {modal?.type === 'photo' && galleryPhotos[modal.index] && <><PhotoSlot src={galleryPhotos[modal.index].image} label={galleryPhotos[modal.index].label} className="lightbox-photo" /><div className="lightbox-controls"><button className="button button-teal button-small" aria-label="Foto sebelumnya" onClick={() => setModal({ type: 'photo', index: (modal.index - 1 + galleryPhotos.length) % galleryPhotos.length })}><CaretLeft size={18} /> Sebelumnya</button><span>{modal.index + 1} / {galleryPhotos.length}</span><button className="button button-teal button-small" aria-label="Foto berikutnya" onClick={() => setModal({ type: 'photo', index: (modal.index + 1) % galleryPhotos.length })}>Berikutnya <CaretRight size={18} /></button></div></>}
        </div>
      </dialog>
    </>
  );
}
