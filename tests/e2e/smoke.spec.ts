import { test, expect } from '@playwright/test';

test('homepage loads with English title', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('h1')).toContainText('RIS');
});

test('homepage loads with Arabic title', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toContainText('نظام معلومات الباحثين');
});

test('directory page renders', async ({ page }) => {
  await page.goto('/en/researchers');
  await expect(page.locator('h1')).toContainText('Researchers');
});

test('sign-in page renders', async ({ page }) => {
  await page.goto('/en/sign-in');
  await expect(page.getByText('Continue with Google')).toBeVisible();
});

test('manage-profile redirects to sign-in', async ({ page }) => {
  await page.goto('/en/manage-profile');
  await expect(page).toHaveURL(/\/en\/sign-in/);
});

test('robots.txt responds', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBe(true);
  expect(await res.text()).toContain('Sitemap');
});
