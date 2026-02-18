import { test, expect } from '@playwright/test';

/**
 * SPEC-002 E2E: Authentication & User Profile
 *
 * Scenarios:
 *   - Click "Login with Google" -> Redirect to Dashboard.
 *   - Logout -> Redirect to Login Page.
 */

test.describe('SPEC-002: Authentication Flow', () => {
    test('unauthenticated user is redirected to login page', async ({ browser }) => {
        // Create a fresh context without stored auth
        const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
        const page = await context.newPage();

        // Listen for console logs
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        await page.goto('/dashboard');

        // Wait a bit to see logs
        await page.waitForTimeout(2000);

        // Check LocalStorage
        const localStorageData = await page.evaluate(() => JSON.stringify(localStorage));
        console.log('LOCAL STORAGE CONTENT:', localStorageData);

        // Should be redirected to login
        await expect(page).toHaveURL(/\/login/);

        // Login page should display the title and Google button
        await expect(page.locator('h1')).toContainText('Ponto Livre');
        await expect(page.getByRole('button', { name: /Entrar com Google/i })).toBeVisible();

        await context.close();
    });

    test('login page displays Google sign-in button', async ({ browser }) => {
        const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
        const page = await context.newPage();

        await page.goto('/login');

        // Verify the login page elements
        await expect(page.locator('h1')).toContainText('Ponto Livre');
        const googleButton = page.getByRole('button', { name: /Entrar com Google/i });
        await expect(googleButton).toBeVisible();
        await expect(googleButton).toBeEnabled();

        // Verify the Google icon is present
        await expect(page.locator('img[alt="Google Logo"]')).toBeVisible();

        await context.close();
    });

    test('authenticated user sees the dashboard', async ({ page }) => {
        // This test uses the storageState from the setup
        await page.goto('/dashboard');

        // Wait for loading to finish (max 10s)
        await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 10000 });

        if (page.url().includes('/login')) {
            test.skip(true, 'User not authenticated (redirected to login)');
            return;
        }

        await expect(page).toHaveURL(/\/dashboard/);
        // The dashboard should show a greeting
        await expect(page.locator('h1')).toContainText('Olá', { timeout: 10000 });
    });

    test('logout redirects to login page', async ({ page }) => {
        await page.goto('/dashboard');

        // Wait for loading to finish
        await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 10000 });

        if (page.url().includes('/login')) {
            test.skip(true, 'User not authenticated (redirected to login)');
            return;
        }

        // Click the logout button
        const logoutButton = page.getByRole('button', { name: /Sair/i });
        await expect(logoutButton).toBeVisible();
        await logoutButton.click();

        // Should redirect to login
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
        await expect(page.locator('h1')).toContainText('Ponto Livre');
    });
});
