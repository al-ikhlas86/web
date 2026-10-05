const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const content = require('../content/site.json');

// Test the server loader without a live CMS, keeping its environment and fetch isolated.
function loadContentModule(env = {}, fetch = async () => { throw new Error('Unexpected fetch'); }) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('lib/site-content.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports: module.exports,
    require: (name) => name === 'server-only' ? {} : name === '@/content/site.json' ? content : require(name),
    process: { env }, fetch, AbortSignal,
    console: { error() {} },
  });
  return module.exports;
}

test('local content works with no CMS configured', async () => {
  const result = await loadContentModule().getSiteContent();
  assert.equal(result.heroImage, '/images/al-ikhlas-hero.webp');
  assert.equal(result.gallery.filter((item) => item.image).length, 0);
  assert.equal(result.articles.length, 0);
});

test('remote photos and articles load while auth stays on the server', async () => {
  const remote = structuredClone(content);
  remote.gallery[0].image = 'https://images.example.org/learning.webp';
  remote.articles.push({ id: 'real-article', title: 'Berita sekolah', category: 'Kegiatan', date: '2026-10-05', image: '', excerpt: 'Informasi dari sekolah.', body: 'Isi dari sekolah.' });
  let request;
  const loader = loadContentModule({ SITE_CONTENT_URL: 'https://cms.example.org/site.json', SITE_CONTENT_TOKEN: 'test-token' }, async (url, options) => {
    request = { url, options };
    return { ok: true, text: async () => JSON.stringify(remote) };
  });
  const result = await loader.getSiteContent();
  assert.equal(result.gallery[0].image, remote.gallery[0].image);
  assert.equal(result.articles[0].title, 'Berita sekolah');
  assert.equal(request.options.headers.Authorization, 'Bearer test-token');
  assert.equal(request.options.next.revalidate, 60);
  assert.equal(JSON.stringify(result).includes('test-token'), false);
});

test('network errors, HTTP errors, malformed JSON, invalid structures, and oversized responses fall back', async () => {
  for (const fetch of [
    async () => { throw new Error('timeout'); },
    async () => ({ ok: false, status: 503 }),
    async () => ({ ok: true, text: async () => '{broken' }),
    async () => ({ ok: true, text: async () => JSON.stringify({ heroImage: '/images/example.webp' }) }),
    async () => ({ ok: true, text: async () => ' '.repeat(512001) }),
  ]) {
    const result = await loadContentModule({ SITE_CONTENT_URL: 'https://cms.example.org/site.json' }, fetch).getSiteContent();
    assert.equal(result.heroImage, content.heroImage);
    assert.equal(result.contact.phone, content.contact.phone);
  }
});

test('invalid URLs and impossible article dates are rejected', async () => {
  const { siteContentSchema } = loadContentModule();
  for (const url of ['javascript:alert(1)', '//untrusted.example/photo.png', '/images/../secret', 'http://images.example/photo.png']) {
    assert.equal(siteContentSchema.safeParse({ ...content, aboutImage: url }).success, false);
  }
  const badDate = { ...content, articles: [{ id: 'bad-date', title: 'Title', category: 'Kegiatan', date: '2026-02-31', image: '', excerpt: 'Excerpt', body: 'Body' }] };
  assert.equal(siteContentSchema.safeParse(badDate).success, false);
  const result = await loadContentModule({ SITE_CONTENT_URL: 'http://cms.example.org/site.json' }).getSiteContent();
  assert.equal(result.heroImage, content.heroImage);
});
