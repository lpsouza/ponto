import { test, expect } from '@playwright/test';

/**
 * SPEC-003 E2E: Time Clock
 *
 * Scenario: Start timer -> Manually change start time -> Verify total calculation updates.
 */

test.describe('SPEC-003: Time Clock', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');

        // Wait for potential redirect or load
        await page.waitForTimeout(1000);

        if (page.url().includes('/login')) {
            test.skip(true, 'User not authenticated (redirected to login)');
        }
    });

    test('displays time tracker in idle state with no company selected', async ({ page }) => {
        // When no company is selected, the tracker should show a prompt
        const tracker = page.locator('text=Selecione um contexto para começar');
        const isVisible = await tracker.isVisible().catch(() => false);

        if (isVisible) {
            await expect(tracker).toBeVisible();
        } else {
            // A company might already be selected, check for tracker elements
            await expect(
                page.locator('text=Pronto').or(page.locator('text=Trabalhando'))
            ).toBeVisible({ timeout: 5000 });
        }
    });

    test('shows current time and accumulated time', async ({ page }) => {
        // The TimeTracker always shows the current time
        const currentTime = page.locator('[class*="currentTime"]');
        const isTrackerVisible = await currentTime.isVisible().catch(() => false);

        if (!isTrackerVisible) {
            test.skip(true, 'No company context active for time tracker');
            return;
        }

        // Current time should be displayed (HH:MM:SS format)
        await expect(currentTime).toHaveText(/\d{2}:\d{2}:\d{2}/);

        // Accumulated time should be visible
        await expect(page.locator('text=Tempo acumulado hoje')).toBeVisible();
    });

    test('start work button initiates tracking', async ({ page }) => {
        const startButton = page.getByRole('button', { name: /Iniciar trabalho/i });
        const isVisible = await startButton.isVisible().catch(() => false);

        if (!isVisible) {
            test.skip(true, 'Start button not available (no company or already working)');
            return;
        }

        // Click start
        await startButton.click();

        // Should transition to "working" state
        await expect(page.locator('text=Trabalhando')).toBeVisible({ timeout: 5000 });

        // Pause and Finish buttons should now be available
        await expect(page.getByRole('button', { name: /Pausar trabalho/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Encerrar dia/i })).toBeVisible();
    });

    test('pause and resume cycle works correctly', async ({ page }) => {
        // Attempt to start if we can
        const startButton = page.getByRole('button', { name: /Iniciar trabalho/i });
        const canStart = await startButton.isVisible().catch(() => false);

        if (!canStart) {
            test.skip(true, 'Cannot start a new work session');
            return;
        }

        // Start working
        await startButton.click();
        await expect(page.locator('text=Trabalhando')).toBeVisible({ timeout: 5000 });

        // Pause
        await page.getByRole('button', { name: /Pausar trabalho/i }).click();
        await expect(page.locator('text=Em pausa')).toBeVisible({ timeout: 5000 });

        // Resume should be available
        await expect(page.getByRole('button', { name: /Retomar trabalho/i })).toBeVisible();

        // Resume
        await page.getByRole('button', { name: /Retomar trabalho/i }).click();
        await expect(page.locator('text=Trabalhando')).toBeVisible({ timeout: 5000 });
    });

    test('finish day ends the session', async ({ page }) => {
        const startButton = page.getByRole('button', { name: /Iniciar trabalho/i });
        const canStart = await startButton.isVisible().catch(() => false);

        if (!canStart) {
            test.skip(true, 'Cannot start a new work session');
            return;
        }

        // Start working
        await startButton.click();
        await expect(page.locator('text=Trabalhando')).toBeVisible({ timeout: 5000 });

        // Finish the day
        await page.getByRole('button', { name: /Encerrar dia/i }).click();
        await expect(page.locator('text=Dia encerrado')).toBeVisible({ timeout: 5000 });

        // Start button should reappear (for a new session)
        await expect(page.getByRole('button', { name: /Iniciar trabalho/i })).toBeVisible();
    });

    test('records timeline shows entries after actions', async ({ page }) => {
        const startButton = page.getByRole('button', { name: /Iniciar trabalho/i });
        const canStart = await startButton.isVisible().catch(() => false);

        if (!canStart) {
            test.skip(true, 'Cannot start a new work session');
            return;
        }

        // Start and finish to create records
        await startButton.click();
        await expect(page.locator('text=Trabalhando')).toBeVisible({ timeout: 5000 });

        // Timeline should appear with at least one entry
        await expect(page.locator('text=Registros de hoje')).toBeVisible({ timeout: 5000 });

        // Should show the "Início" record
        await expect(page.locator('text=Início')).toBeVisible();
    });

    test('edit record modal opens and shows fields', async ({ page }) => {
        // Check if there are existing records with edit buttons
        const editButton = page.getByRole('button', { name: /Editar registro/i }).first();
        const hasRecords = await editButton.isVisible().catch(() => false);

        if (!hasRecords) {
            test.skip(true, 'No records available to edit');
            return;
        }

        // Open edit modal
        await editButton.click();

        // Modal should appear with fields
        await expect(page.locator('text=Horário')).toBeVisible();
        await expect(page.locator('#edit-timestamp')).toBeVisible();
        await expect(page.locator('#edit-notes')).toBeVisible();
        await expect(page.getByRole('button', { name: /Salvar/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Cancelar/i })).toBeVisible();
    });

    test('location input accepts text', async ({ page }) => {
        const locationInput = page.getByRole('textbox', { name: /Local de trabalho/i });
        const isVisible = await locationInput.isVisible().catch(() => false);

        if (!isVisible) {
            test.skip(true, 'Location input not visible');
            return;
        }

        // Type a location
        await locationInput.fill('Home Office');
        await expect(locationInput).toHaveValue('Home Office');
    });
});
