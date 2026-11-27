const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const content = require('../content/site.json');
// Objek dari konteks vm berbeda prototipe: bandingkan lewat JSON.
const eq = (a, b) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b);

// Website mengikuti katalog (2026-11-27): penggabungan site.json dengan daftar katalog dari backend + validasi snapshot.
function muat(berkas, stub = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(berkas, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports: module.exports, module, require: (n) => (n in stub ? stub[n] : n === 'server-only' ? {} : require(n)), process: { cwd: () => process.cwd() }, console });
  return module.exports;
}
const tipe = muat('lib/katalog-tipe.ts');
const { bacaSnapshotKatalog } = muat('lib/katalog.ts', { '@/lib/site-content': { getSiteContent: async () => content }, '@/lib/katalog-tipe': tipe });

const snap = (katalog, urutanProfil = 'pengurus') => ({ katalog, urutanProfil });
const K = (kode, nama, jenis = 'pendidikan', kontak = null) => ({ kode, nama, jenis, kontak });

test('tanpa snapshot: situs memakai site.json apa adanya (SD/TK seperti sebelumnya)', () => {
  const t = tipe.terapkanKatalog(content, null);
  assert.equal(t.dariKatalog, false);
  eq(t.education.map((e) => e.id), content.education.map((e) => e.id));
  eq(t.kontakKatalog.map((k) => k.kode), ['SD', 'TK']);
  assert.equal(t.kontakKatalog[0].whatsapp, content.contact.whatsapp);
  eq(tipe.terapkanKatalog(content, snap([])).kontakKatalog.map((k) => k.kode), ['SD', 'TK'], 'daftar kosong = dianggap tidak tersedia');
});

test('katalog baru (SMP) otomatis jadi kartu jenjang; kartu TK/SD memakai teks site.json; urutan mengikuti katalog; pengurus tidak jadi jenjang', () => {
  const t = tipe.terapkanKatalog(content, snap([
    K('TK', 'TK & Playground', 'pendidikan', { label: 'Admin TK', whatsapp: '62895335999919', email: 'tk@x.id' }),
    K('SD', 'Sekolah Dasar', 'pendidikan', { label: 'Admin SD', whatsapp: '628993290401', email: '' }),
    K('SMP', 'SMP Al Ikhlas', 'pendidikan', null),
    K('YYS', 'Yayasan', 'pengurus', { label: 'Sekretariat', whatsapp: '', email: 'yys@x.id' }),
  ]));
  assert.equal(t.dariKatalog, true);
  eq(t.education.map((e) => e.katalog), ['TK', 'SD', 'SMP']);
  assert.equal(t.education[0].title, content.education.find((e) => e.katalog === 'TK').title, 'teks kartu TK dari site.json');
  assert.equal(t.education[2].title, 'SMP Al Ikhlas'); assert.equal(t.education[2].id, 'katalog-smp'); assert.equal(t.education[2].image, '');
  eq(t.kontakKatalog.map((k) => k.kode), ['TK', 'SD', 'YYS'], 'hanya katalog yang punya kontak (SMP tanpa kontak tidak tampil)');
  assert.equal(t.kontakKatalog[2].email, 'yys@x.id');
  eq(t.jenisKatalog, { TK: 'pendidikan', SD: 'pendidikan', SMP: 'pendidikan', YYS: 'pengurus' });
  assert.equal(t.namaKatalog.SMP, 'SMP Al Ikhlas');
});

test('katalog yang disembunyikan/tidak ada: kartunya hilang dari jenjang; kartu umum yayasan tetap', () => {
  const dgUmum = { ...content, education: [...content.education, { ...content.education[0], id: 'umum', katalog: '', title: 'Program Umum' }] };
  const t = tipe.terapkanKatalog(dgUmum, snap([K('SD', 'Sekolah Dasar')]));
  eq(t.education.map((e) => e.id), [content.education.find((e) => e.katalog === 'SD').id, 'umum']);
});

test('maksimal 6 kartu jenjang walau katalog banyak', () => {
  const banyak = Array.from({ length: 9 }, (_, i) => K(`K${i}`, `Jenjang ${i}`));
  assert.equal(tipe.terapkanKatalog(content, snap(banyak)).education.length, 6);
});

test('email: tanpa duplikat, cadangan ke email umum; nama jenjang untuk SEO ikut kartu', () => {
  const t = tipe.terapkanKatalog(content, snap([K('SD', 'SD', 'pendidikan', { label: 'a', whatsapp: '', email: 'x@y.id' }), K('TK', 'TK', 'pendidikan', { label: 'b', whatsapp: '', email: 'x@y.id' })]));
  eq(tipe.daftarEmail(t), ['x@y.id']);
  eq(tipe.daftarEmail({ ...content, kontakKatalog: [] }), [content.contact.email]);
  assert.equal(tipe.namaJenjang(content), 'TKIT & SDIT');
  assert.equal(tipe.namaJenjang({ ...content, education: [] }), 'Al Ikhlas 86');
});

test('snapshot dari jaringan divalidasi ketat: kode/jenis/kontak buruk dibuang, duplikat digabung', () => {
  const s = bacaSnapshotKatalog({ data: { urutanProfil: 'pendidik', katalog: [
    { kode: 'SD', nama: 'Sekolah Dasar', jenis: 'pendidikan', kontak: { label: 'Admin SD', whatsapp: '628993290401', email: 'sd@x.id' } },
    { kode: 'sd-kecil', nama: 'Kode huruf kecil', jenis: 'pendidikan', kontak: null },
    { kode: 'TK', nama: 'TK', jenis: 'universitas', kontak: null },
    { kode: 'SD', nama: 'Duplikat', jenis: 'pendidikan', kontak: null },
    { kode: 'SMP', nama: 'SMP', jenis: 'pendidikan', kontak: { label: '<script>', whatsapp: '12', email: 'bukan email' } },
    { kode: 'SMA', nama: '', jenis: 'pendidikan', kontak: null },
    { kode: 'MI', nama: 'MI', jenis: 'pendidikan', kontak: { label: 'x', whatsapp: '1234567890', email: 'a@b.com, c@d.com' } },
  ] } });
  eq(s.katalog.map((k) => k.kode), ['SD', 'SMP', 'MI']);
  assert.equal(s.urutanProfil, 'pendidik');
  assert.equal(s.katalog[1].kontak, null, 'kontak tanpa WA/email sah menjadi null');
  eq(s.katalog[2].kontak, { label: 'x', whatsapp: '1234567890', email: '' }, 'email berisi koma ditolak, WA sah tetap');
  assert.equal(bacaSnapshotKatalog(null), null); assert.equal(bacaSnapshotKatalog({ data: {} }), null); assert.equal(bacaSnapshotKatalog('x'), null);
  assert.equal(bacaSnapshotKatalog({ data: { katalog: [], urutanProfil: 'acak' } }).urutanProfil, 'pengurus');
});

test('kontak katalog belum diisi Admin IT: TIDAK tampil (tanpa cadangan nomor lama); hanya yang sudah diisi', () => {
  const kontak = { label: 'Admin SD', whatsapp: '628111111111', email: '' };
  const t = tipe.terapkanKatalog(content, snap([K('SD', 'Sekolah Dasar', 'pendidikan', kontak), K('TK', 'TK & Playground'), K('SMP', 'SMP')]));
  eq(t.kontakKatalog.map((k) => k.kode), ['SD'], 'TK dan SMP belum diisi: tidak tampil');
  assert.equal(t.kontakKatalog[0].nama, 'Sekolah Dasar'); assert.equal(t.kontakKatalog[0].whatsapp, '628111111111');
  const tanpa = tipe.terapkanKatalog(content, snap([K('SD', 'Sekolah Dasar'), K('TK', 'TK & Playground')]));
  eq(tanpa.kontakKatalog, [], 'tak satu pun katalog punya kontak: kosong (halaman memakai telepon/email umum yayasan), bukan nomor lama site.json');
  eq(tipe.daftarEmail(tanpa), [content.contact.email], 'email umum yayasan tetap tersedia untuk mailto');
  eq(tipe.terapkanKatalog(content, null).kontakKatalog.map((k) => k.kode), ['SD', 'TK'], 'data katalog dari backend tidak tersedia sama sekali: cadangan site.json');
});
