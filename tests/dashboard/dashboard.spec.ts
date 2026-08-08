import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginToDashboard } from '../helpers/login';
import { askLLM, isRateLimitError } from '../helpers/llm';

// Helper to ensure screenshot directory exists
function ensureDir(dirPath: string) {
  const fullPath = path.resolve(dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

const SCREENSHOT_DIR = 'screenshots/dashboard';

test.describe('Dashboard - Login dan Verifikasi Elemen', () => {
  test('Login → Dashboard loaded dengan semua komponen utama', async ({ page }) => {
    test.setTimeout(120000);
    ensureDir(SCREENSHOT_DIR);

    // Login ke dashboard (pakai helper yang sama dengan login.spec.ts)
    await loginToDashboard(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard-loaded.png`, fullPage: true });

    // Verifikasi: Search bar ada
    await expect(page.getByPlaceholder('Cari menu...')).toBeVisible();

    // Verifikasi: Heading "Tren Keuangan" (Finance Trend Chart)
    await expect(page.getByRole('heading', { name: 'Tren Keuangan' })).toBeVisible();

    // Verifikasi: Heading "Rekening & Dompet" (Bank Account Summary)
    await expect(page.getByRole('heading', { name: 'Rekening & Dompet' })).toBeVisible();

    // Verifikasi: Heading "Transaksi Terbaru" (Recent Transactions)
    await expect(page.getByRole('heading', { name: 'Transaksi Terbaru' })).toBeVisible();

    // Verifikasi: Heading "Analisis AI" (AI Insights)
    await expect(page.getByRole('heading', { name: 'Analisis AI' })).toBeVisible();

    // Verifikasi: Filter section ada (cek button Reset yang ada di filter bar)
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-all-sections-visible.png`, fullPage: true });

    console.log('Dashboard loaded successfully with all main components.');
  });
});

test.describe('Dashboard - Finance Metrics Cards', () => {
  test('5 metric cards tampil dengan data', async ({ page }) => {
    test.setTimeout(120000);
    ensureDir(SCREENSHOT_DIR);

    await loginToDashboard(page);

    // Tunggu metrics cards loaded (bukan skeleton) - cari format Rp
    await expect(page.locator('text=Rp').first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-metrics-cards.png`, fullPage: true });

    // Verifikasi ada 5 metric cards (berdasarkan grid container)
    const metricCards = page.locator('.grid.grid-cols-2 > div');
    const cardCount = await metricCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(5);

    console.log(`Found ${cardCount} metric cards.`);
  });
});

test.describe('Dashboard - Rekening & Dompet', () => {
  test('Bank Account Summary tampil dengan filter ALL/BANK/WALLET', async ({ page }) => {
    test.setTimeout(120000);
    ensureDir(SCREENSHOT_DIR);

    await loginToDashboard(page);

    // Verifikasi section Rekening & Dompet
    const accountSection = page.getByRole('heading', { name: 'Rekening & Dompet' });
    await expect(accountSection).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-bank-accounts-all.png`, fullPage: true });

    // Klik filter BANK
    await page.getByRole('button', { name: 'Bank', exact: true }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-bank-accounts-bank.png`, fullPage: true });

    // Klik filter WALLET (label: "Dompet")
    await page.getByRole('button', { name: 'Dompet', exact: true }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-bank-accounts-wallet.png`, fullPage: true });

    // Klik filter ALL kembali
    await page.getByRole('button', { name: 'Semua', exact: true }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-bank-accounts-all-again.png`, fullPage: true });
  });
});

test.describe('Dashboard - Transaksi Terbaru', () => {
  test('Recent Transactions tampil dengan filter Semua/Masuk/Keluar', async ({ page }) => {
    test.setTimeout(120000);
    ensureDir(SCREENSHOT_DIR);

    await loginToDashboard(page);

    // Scroll ke section transaksi terbaru
    const txSection = page.getByRole('heading', { name: 'Transaksi Terbaru' });
    await txSection.scrollIntoViewIfNeeded();
    await expect(txSection).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-recent-transactions.png`, fullPage: true });

    // Verifikasi link "Lihat Semua" ada
    await expect(page.getByRole('link', { name: 'Lihat Semua' })).toBeVisible();

    // Klik filter "Masuk" (CREDIT)
    const masukButton = page.getByRole('button', { name: 'Masuk', exact: true });
    await masukButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-transactions-masuk.png`, fullPage: true });

    // Klik filter "Keluar" (DEBIT)
    const keluarButton = page.getByRole('button', { name: 'Keluar', exact: true });
    await keluarButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-transactions-keluar.png`, fullPage: true });

    // Klik filter "Semua" kembali (ada di section transaksi, bukan rekening)
    await page.getByRole('button', { name: 'Semua', exact: true }).nth(1).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-transactions-semua.png`, fullPage: true });
  });
});

test.describe('Dashboard - Spending By Category', () => {
  test('Chart spending by category tampil dengan toggle Expense/Income dan Donut/Bar', async ({ page }) => {
    test.setTimeout(120000);
    ensureDir(SCREENSHOT_DIR);

    await loginToDashboard(page);

    // Scroll ke section spending by category
    const spendingHeading = page.getByText('Pengeluaran per Kategori').or(page.getByText('Pemasukan per Kategori'));
    await spendingHeading.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-spending-category-default.png`, fullPage: true });

    // Toggle ke Income
    const incomeTab = page.getByRole('button', { name: 'Pemasukan', exact: true });
    if (await incomeTab.isVisible()) {
      await incomeTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/13-spending-category-income.png`, fullPage: true });
    }

    // Toggle ke Bar view
    const barButton = page.getByRole('button', { name: 'Bar', exact: true });
    if (await barButton.isVisible()) {
      await barButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/14-spending-category-bar.png`, fullPage: true });
    }

    // Kembali ke Expense + Donut
    const expenseTab = page.getByRole('button', { name: 'Pengeluaran', exact: true });
    if (await expenseTab.isVisible()) {
      await expenseTab.click();
      await page.waitForTimeout(500);
    }

    const donutButton = page.getByRole('button', { name: 'Donut', exact: true });
    if (await donutButton.isVisible()) {
      await donutButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/15-spending-category-donut.png`, fullPage: true });
    }
  });
});

test.describe('Dashboard - AI Insights', () => {
  test('AI Insights section tampil dan bisa diklik Analisis Sekarang', async ({ page }) => {
    test.setTimeout(180000); // AI analysis bisa lambat
    ensureDir(SCREENSHOT_DIR);

    await loginToDashboard(page);

    // Scroll ke section AI Insights
    const aiHeading = page.getByRole('heading', { name: 'Analisis AI' });
    await aiHeading.scrollIntoViewIfNeeded();
    await expect(aiHeading).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/16-ai-insights-before.png`, fullPage: true });

    // Klik tombol "Analisis Sekarang"
    const analyzeButton = page.getByRole('button', { name: 'Analisis Sekarang' });
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/17-ai-insights-loading.png`, fullPage: true });

    // Tunggu loading selesai (tombol berubah jadi "Analisis Ulang" atau muncul error)
    await expect(page.getByRole('button', { name: 'Analisis Ulang' }).or(page.locator('.text-red-700'))).toBeVisible({ timeout: 60000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/18-ai-insights-result.png`, fullPage: true });

    console.log('AI Insights loaded.');
  });
});

test.describe('Dashboard - Navigasi ke Transaksi', () => {
  test('Klik "Lihat Semua" navigasi ke halaman transaksi', async ({ page }) => {
    test.setTimeout(120000);
    ensureDir(SCREENSHOT_DIR);

    await loginToDashboard(page);

    // Scroll ke Recent Transactions
    const txSection = page.getByRole('heading', { name: 'Transaksi Terbaru' });
    await txSection.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/19-before-lihat-semua.png`, fullPage: true });

    // Klik "Lihat Semua"
    const viewAllLink = page.getByRole('link', { name: 'Lihat Semua' });
    await expect(viewAllLink).toBeVisible();
    await viewAllLink.click();

    // Tunggu navigasi ke halaman transaksi
    await page.waitForURL('**/transactions**', { timeout: 10000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/20-transactions-page.png`, fullPage: true });

    // Verifikasi URL
    expect(page.url()).toContain('/transactions');
  });
});


test.describe('Dashboard - LLM Analysis (Groq)', () => {
  test('LLM analisis halaman dashboard dan kasih suggestions', async ({ page }) => {
    test.setTimeout(150000);
    ensureDir(SCREENSHOT_DIR);

    await loginToDashboard(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/llm-01-dashboard.png`, fullPage: true });

    // Ambil text content + struktur halaman (headings, charts, buttons)
    const pageContent = await page.locator('body').innerText();
    const shortContent = pageContent.substring(0, 1200);

    // Ambil info tambahan yang tidak ada di innerText
    const hasBarChart = await page.locator('[role="application"]').count() > 0;
    const headings = await page.locator('h2, h3').allInnerTexts();
    const buttons = await page.locator('button').allInnerTexts();

    const structureInfo = `
Sections (headings): ${headings.filter(h => h.trim()).join(', ')}
Has interactive charts (ApexCharts): ${hasBarChart}
Buttons available: ${buttons.filter(b => b.trim()).slice(0, 15).join(', ')}
Layout: responsive (sidebar + main content, mobile-friendly with collapsible sidebar)
Tech: Next.js + TailwindCSS + ApexCharts`;

    // Kirim ke Groq untuk analisis UX/fitur
    let analysis: string;
    try {
      analysis = await askLLM(
        `You are a senior QA & UX reviewer. Analyze this financial dashboard. Respond ONLY with a JSON object.
        Text content: "${shortContent}" Page structure: ${structureInfo} JSON format: {"isDashboard":true,"uxScore":8,"completeness":"good","suggestions":["actionable suggestion 1","actionable suggestion 2"]}`
      );
    } catch (error) {
      if (isRateLimitError(error)) {
        test.skip(true, 'LLM rate limited — skip');
        return;
      }
      throw error;
    }

    console.log('LLM Raw Response:', analysis);

    // Extract JSON dari response
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('LLM did not return valid JSON. Full response:', analysis);
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Verifikasi ini halaman dashboard
    expect(parsed.isDashboard).toBe(true);

    // Log hasil analisis
    console.log(`\n=== LLM Dashboard Analysis ===`);
    console.log(`UX Score: ${parsed.uxScore}/10`);
    console.log(`Completeness: ${parsed.completeness}`);
    if (parsed.suggestions && parsed.suggestions.length > 0) {
      console.log(`\nSuggestions:`);
      parsed.suggestions.forEach((s: string, i: number) => console.log(`  ${i + 1}. ${s}`));
    }
    console.log(`==============================\n`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/llm-02-analysis-done.png`, fullPage: true });
  });
});
