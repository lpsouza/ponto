import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ponto Livre/);
});

test('shows project name', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Ponto Livre');
});
