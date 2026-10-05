import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('desktop navigation, banners, profile, education, programs, and registration work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Tempat tumbuh/ })).toBeVisible();
  await expect(page.locator('.hero-photo img')).toHaveJSProperty('complete', true);
  const navigation = page.getByRole('navigation', { name: 'Navigasi utama' });
  for (const link of await navigation.locator('a[href^="#"]').all()) {
    const target = (await link.getAttribute('href'))!;
    await link.click();
    await expect(page.locator(target)).toBeAttached();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
  }
  await page.goto('/');
  await page.getByRole('button', { name: 'Banner berikutnya' }).click();
  await expect(page.getByRole('heading', { name: /Awali perjalanan/ })).toBeVisible();
  await page.getByRole('button', { name: 'Banner sebelumnya' }).click();
  await expect(page.getByRole('heading', { name: /Tempat tumbuh/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tampilkan banner 2' }).click();
  await page.getByRole('button', { name: 'Tampilkan banner 1' }).click();
  await page.getByRole('button', { name: 'Lihat Profil Yayasan' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  for (const button of await page.locator('.education-body button, .program-card').all()) {
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Tanyakan ke Sekolah' }).click();
    await expect(page.getByRole('dialog')).toContainText('Informasi Pendaftaran');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await page.getByRole('button', { name: 'Tutup dialog' }).click();
  }
  for (const button of await page.locator('.hero-actions button, .welcome-strip button, .registration-actions button, .school-banner button, .footer-cta button, .footer-contact button').all()) {
    await button.click();
    await expect(page.getByRole('dialog')).toContainText('Informasi Pendaftaran');
    await expect(page.getByRole('dialog').locator('a[href^="tel:"]')).toHaveAttribute('href', 'tel:02182428054');
    await expect(page.getByRole('dialog').locator('a[href^="mailto:"]').last()).toHaveAttribute('href', /sditalikhlas8686@gmail.com/);
    await page.keyboard.press('Escape');
  }
  await page.getByRole('link', { name: 'Kembali ke atas' }).click();
  await expect(page).toHaveURL(/#beranda$/);
  expect(errors).toEqual([]);
});

test('empty gallery filters and article search give useful feedback', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.gallery-grid .photo-slot')).toHaveCount(12);
  const filters = page.locator('.gallery-filters');
  for (const [name, count] of [['Pembelajaran', 4], ['Kegiatan', 5], ['Fasilitas', 3], ['Semua', 12]] as const) {
    await filters.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.gallery-grid .photo-slot')).toHaveCount(count);
    await expect(filters.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await page.getByRole('searchbox', { name: 'Cari artikel' }).fill('pendaftaran');
  await expect(page.getByRole('heading', { name: 'Artikel belum ditemukan' })).toBeVisible();
  await page.getByRole('button', { name: 'Hapus pencarian' }).click();
  await expect(page.locator('.news-placeholder')).toHaveCount(3);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
});

test('responsive layouts and accessibility have no overflow or serious violations', async ({ page }) => {
  for (const width of [320, 360, 390, 414, 600, 768, 834, 1023, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: `output/qa/home-${width}.png`, fullPage: true });
    }
  }
});

test('mobile menu and dialog support keyboard interaction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Buka menu' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole('navigation').getByRole('link', { name: 'Galeri', exact: true }).click();
  await expect(page.getByRole('navigation')).not.toBeVisible();
  await page.getByRole('button', { name: 'Info TKIT Al Ikhlas', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('TKIT Al Ikhlas');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Info TKIT Al Ikhlas', exact: true })).toBeFocused();
});

test('mobile controls remain reachable while scrolling and resizing', async ({ page }) => {
  for (const width of [320, 390, 768, 1023]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const sizes = await page.locator('.mobile-toggle, .hero-actions > *, .hero-slider-controls > button, .slide-dots button, .gallery-filters button').evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }));
    expect(sizes.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true);
    await expect(page.getByRole('searchbox', { name: 'Cari artikel' })).toHaveCSS('font-size', '16px');
    await page.locator('#artikel').scrollIntoViewIfNeeded();
    const toggle = page.getByRole('button', { name: 'Buka menu' });
    await expect(toggle).toBeInViewport();
    await toggle.click();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
    await expect(nav.getByRole('link', { name: 'Virtual Tour', exact: true })).toBeInViewport();
    await nav.getByRole('link', { name: 'Galeri', exact: true }).click();
    await expect(nav).not.toBeVisible();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await expect.poll(async () => (await page.locator('#galeri').boundingBox())!.y).toBeGreaterThanOrEqual(72);
    await toggle.click();
    await page.getByRole('button', { name: 'Tutup menu navigasi', exact: true }).click({ position: { x: width / 2, y: 750 } });
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.setViewportSize({ width: 1200, height: 844 });
    await expect(page.locator('.mobile-menu-backdrop')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  }
});

test('mobile virtual tour keeps titles, checkpoints, and unavailable feedback apart', async ({ page }) => {
  for (const [width, height] of [[320, 568], [390, 844], [667, 375], [844, 390], [768, 1024]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/virtual-tour');
    await expect(page.getByRole('heading', { name: 'Gerbang Utama', exact: true })).toBeVisible({ timeout: 30000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const title = (await page.locator('.tour-area-panel').boundingBox())!;
    const rail = (await page.locator('.tour-card-rail').boundingBox())!;
    expect(title.y + title.height).toBeLessThan(rail.y);
    expect(rail.y + rail.height).toBeLessThanOrEqual(height);
    await page.getByRole('button', { name: 'Pergi ke Lorong Kelas', exact: true }).click();
    await expect(page.locator('.tour-unavailable')).toBeVisible();
    await expect(page.locator('.tour-unavailable').getByRole('heading', { name: 'Lorong Kelas', exact: true })).toBeVisible();
    await expect(page.locator('.tour-area-panel')).toHaveCSS('opacity', '1');
    const feedback = (await page.locator('.tour-unavailable > div').boundingBox())!;
    expect(feedback.y + feedback.height).toBeLessThan(rail.y);
    const updatedTitle = (await page.locator('.tour-area-panel').boundingBox())!;
    expect(feedback.y >= updatedTitle.y + updatedTitle.height || feedback.x >= updatedTitle.x + updatedTitle.width).toBe(true);
    await page.screenshot({ path: `output/qa/mobile-tour-${width}.png` });
    await page.getByRole('link', { name: 'Beranda', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Tempat tumbuh/ })).toBeVisible();
  }
});

test('preserved virtual tour loads frames and handles unavailable checkpoints', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Virtual Tour', exact: true }).click();
  await expect(page).toHaveURL(/\/virtual-tour$/, { timeout: 20000 });
  await expect(page.getByRole('heading', { name: 'Gerbang Utama', exact: true })).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: 'output/qa/virtual-tour.png' });
  const response = await page.request.get('/api/tour-frames');
  expect((await response.json()).frames).toMatchObject({ cp1: 1, cp2: 16, cp3: 11 });
  await page.getByRole('button').filter({ hasText: 'Ruang Tata Usaha' }).click();
  await expect(page.getByRole('heading', { name: 'Ruang Tata Usaha', exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button').filter({ hasText: 'Halaman Sekolah' }).click();
  await expect(page.getByRole('heading', { name: 'Halaman Sekolah', exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button').filter({ hasText: 'Lorong Kelas' }).click();
  await expect(page.getByRole('heading', { name: 'Lorong Kelas', exact: true })).toBeVisible();
  await page.screenshot({ path: 'output/qa/virtual-tour-unavailable.png' });
  await page.getByRole('link', { name: 'Beranda', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Tempat tumbuh/ })).toBeVisible();
});
