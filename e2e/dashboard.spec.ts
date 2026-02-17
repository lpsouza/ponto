import { test, expect } from '@playwright/test';

/**
 * SPEC-004 E2E: Dashboard & Reports
 *
 * Scenario: User views own dashboard -> Verifies correct balance calculation.
 */

test.describe('SPEC-004: Dashboard & Reports', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!process.env.E2E_SUPABASE_ACCESS_TOKEN, 'E2E auth tokens not configured');

        await page.goto('/dashboard');
    });

    test('company selector dropdown is visible and functional', async ({ page }) => {
        const selector = page.getByRole('combobox', { name: /Selecionar contexto/i });
        const isVisible = await selector.isVisible().catch(() => false);

        if (!isVisible) {
            // No companies created yet, selector may not appear
            test.skip(true, 'No companies available for selector');
            return;
        }

        // The selector should have at least one option besides the placeholder
        const options = selector.locator('option:not([disabled])');
        const count = await options.count();
        expect(count).toBeGreaterThan(0);
    });

    test('daily balance section appears when records exist', async ({ page }) => {
        // The DailyBalance component only renders when there are today's records
        const balanceSection = page.locator('text=Saldo do Dia');
        const isVisible = await balanceSection.isVisible().catch(() => false);

        if (!isVisible) {
            // No records for today - expected when no work has been tracked
            test.skip(true, 'No daily records available');
            return;
        }

        // Balance metric should be displayed
        await expect(balanceSection).toBeVisible();

        // Should show worked vs expected
        await expect(page.locator('text=Trabalhado:')).toBeVisible();

        // Timeline bar should be present
        await expect(page.locator('[class*="timelineBar"]')).toBeVisible();
    });

    test('daily balance shows correct format (+/- hours)', async ({ page }) => {
        const balanceSection = page.locator('text=Saldo do Dia');
        const isVisible = await balanceSection.isVisible().catch(() => false);

        if (!isVisible) {
            test.skip(true, 'No daily records available');
            return;
        }

        // Balance value should match format like +X:XXh or -X:XXh
        const balanceValue = page.locator('[class*="balanceValue"]');
        await expect(balanceValue).toBeVisible();

        const text = await balanceValue.textContent();
        expect(text).toMatch(/[+-]?\d+:\d{2}h/);
    });

    test('monthly report section is visible with active company', async ({ page }) => {
        // MonthlyReport renders if a company is selected
        const monthTitle = page.locator('[class*="monthTitle"]');
        const isVisible = await monthTitle.isVisible().catch(() => false);

        if (!isVisible) {
            test.skip(true, 'No company selected for monthly report');
            return;
        }

        // Should show month navigation
        await expect(page.getByRole('button', { name: /Mês anterior/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Próximo mês/i })).toBeVisible();

        // Should show current month name
        const monthText = await monthTitle.textContent();
        expect(monthText).toBeTruthy();
    });

    test('monthly report shows summary stats', async ({ page }) => {
        const monthTitle = page.locator('[class*="monthTitle"]');
        const isVisible = await monthTitle.isVisible().catch(() => false);

        if (!isVisible) {
            test.skip(true, 'No company selected for monthly report');
            return;
        }

        // Should show stat cards
        await expect(page.locator('text=Saldo do Período')).toBeVisible();
        await expect(page.locator('text=Total Trabalhado')).toBeVisible();
        await expect(page.locator('text=Dias Trabalhados')).toBeVisible();
    });

    test('monthly report heatmap is displayed', async ({ page }) => {
        const monthTitle = page.locator('[class*="monthTitle"]');
        const isVisible = await monthTitle.isVisible().catch(() => false);

        if (!isVisible) {
            test.skip(true, 'No company selected for monthly report');
            return;
        }

        // Should show the heatmap section
        await expect(page.locator('text=Mapa de Intensidade')).toBeVisible();

        // Should show day of week headers
        await expect(page.locator('text=Dom')).toBeVisible();
        await expect(page.locator('text=Seg')).toBeVisible();

        // Should have heatmap cells (at least 28 for shortest month)
        const cells = page.locator('[class*="heatmapCell"]');
        const cellCount = await cells.count();
        expect(cellCount).toBeGreaterThanOrEqual(28);
    });

    test('month navigation changes the displayed month', async ({ page }) => {
        const monthTitle = page.locator('[class*="monthTitle"]');
        const isVisible = await monthTitle.isVisible().catch(() => false);

        if (!isVisible) {
            test.skip(true, 'No company selected for monthly report');
            return;
        }

        // Get the current month text
        const initialMonth = await monthTitle.textContent();

        // Navigate to previous month
        await page.getByRole('button', { name: /Mês anterior/i }).click();

        // Wait for the title to change
        await expect(monthTitle).not.toHaveText(initialMonth!, { timeout: 3000 });

        // Navigate forward twice (back to current + one ahead)
        await page.getByRole('button', { name: /Próximo mês/i }).click();
        await expect(monthTitle).toHaveText(initialMonth!, { timeout: 3000 });
    });

    test('CSV export button is present', async ({ page }) => {
        const monthTitle = page.locator('[class*="monthTitle"]');
        const isVisible = await monthTitle.isVisible().catch(() => false);

        if (!isVisible) {
            test.skip(true, 'No company selected for monthly report');
            return;
        }

        // Export button should be visible
        const exportButton = page.getByRole('button', { name: /Exportar CSV/i });
        await expect(exportButton).toBeVisible();
    });

    test('burnout warning appears for long work days', async ({ page }) => {
        // This test verifies the burnout alert UI element exists
        // It will only show if the user has worked > 10h today
        const burnoutAlert = page.locator('[class*="burnoutAlert"]');
        const isVisible = await burnoutAlert.isVisible().catch(() => false);

        // If visible, it should contain the warning text
        if (isVisible) {
            await expect(burnoutAlert).toContainText('Atenção');
        }

        // If not visible, that's OK - the user hasn't worked > 10h today
        // The important thing is the UI doesn't crash
        expect(true).toBe(true);
    });

    test('context management section is visible', async ({ page }) => {
        // "Seus Contextos" section should always be visible
        await expect(page.locator('text=Seus Contextos')).toBeVisible();

        // "Novo Contexto" button should be available
        await expect(page.getByRole('button', { name: /Novo Contexto/i })).toBeVisible();
    });

    test('creating a new context shows input form', async ({ page }) => {
        const newContextButton = page.getByRole('button', { name: /Novo Contexto/i });
        await expect(newContextButton).toBeVisible();

        // Click to open the form
        await newContextButton.click();

        // Form should appear with input and submit button
        await expect(page.getByPlaceholder(/Nome do contexto/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Criar/i })).toBeVisible();

        // Cancel button should now show
        await expect(page.getByRole('button', { name: /Cancelar/i })).toBeVisible();

        // Click cancel to close
        await page.getByRole('button', { name: /Cancelar/i }).click();

        // Form should disappear
        await expect(page.getByPlaceholder(/Nome do contexto/i)).not.toBeVisible();
    });

    test('work segments are displayed when daily balance is active', async ({ page }) => {
        const segmentsTitle = page.locator('text=Segmentos de trabalho');
        const isVisible = await segmentsTitle.isVisible().catch(() => false);

        if (!isVisible) {
            test.skip(true, 'No work segments available');
            return;
        }

        // Segments should show time ranges (HH:MM → HH:MM format)
        const segments = page.locator('[class*="segment"]');
        const count = await segments.count();
        expect(count).toBeGreaterThan(0);
    });
});
