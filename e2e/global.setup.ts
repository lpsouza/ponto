import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth', 'user.json');

/**
 * Global setup: authenticates with Supabase by injecting a session
 * into localStorage. This allows all tests to run as an authenticated user
 * without going through Google OAuth.
 *
 * Requires the following environment variables:
 *   - E2E_SUPABASE_ACCESS_TOKEN: A valid Supabase access token (JWT)
 *   - E2E_SUPABASE_REFRESH_TOKEN: A valid Supabase refresh token
 *   - E2E_USER_ID: The user's UUID from auth.users
 *   - E2E_USER_EMAIL: The user's email
 *   - E2E_USER_NAME: The user's full name
 *
 * To generate these tokens, log in manually once and extract them from:
 *   localStorage -> sb-<project-ref>-auth-token
 */
setup('authenticate', async ({ page }) => {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://supabase.souza.casa/';

    // Extract project ref from the Supabase URL
    const urlObj = new URL(SUPABASE_URL);
    const projectRef = urlObj.hostname.split('.')[0];
    const storageKey = `sb-${projectRef}-auth-token`;

    const accessToken = process.env.E2E_SUPABASE_ACCESS_TOKEN;
    const refreshToken = process.env.E2E_SUPABASE_REFRESH_TOKEN;
    const userId = process.env.E2E_USER_ID;
    const userEmail = process.env.E2E_USER_EMAIL || 'e2e@test.com';
    const userName = process.env.E2E_USER_NAME || 'E2E Test User';

    if (!accessToken || !refreshToken || !userId) {
        // Check if we already have a valid auth state from manual login
        if (fs.existsSync(authFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
                if (data.origins && data.origins.length > 0) {
                    console.log(`✅ Using existing auth state from ${authFile}`);
                    return;
                }
                console.warn(`⚠️  Existing auth file at ${authFile} is empty or invalid. Ignoring.`);
            } catch (e) {
                console.warn(`⚠️  Error reading auth file: ${e}. Ignoring.`);
            }
        }

        console.warn(
            '⚠️  E2E auth tokens not provided and no existing auth file found.\n' +
            '   Creating mock session (unauthenticated).\n' +
            '   To run full tests:\n' +
            '   1. Run "npm run test:e2e:auth" to login manually ONCE.\n' +
            '   OR\n' +
            '   2. Set E2E_SUPABASE_ACCESS_TOKEN, E2E_SUPABASE_REFRESH_TOKEN, E2E_USER_ID env vars.'
        );

        // Create a minimal mock session for testing the UI flow
        // This allows tests to verify UI behavior even without a real backend
        await page.goto('/');

        // Save empty storage state (tests will need to handle unauthenticated state)
        const authDir = path.dirname(authFile);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }
        await page.context().storageState({ path: authFile });
        return;
    }

    // Navigate to the app first to set the correct origin for localStorage
    await page.goto('/');

    // Build the Supabase session payload
    const sessionData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
            id: userId,
            email: userEmail,
            user_metadata: {
                full_name: userName,
                name: userName,
                avatar_url: '',
            },
            aud: 'authenticated',
            role: 'authenticated',
            app_metadata: {
                provider: 'google',
            },
        },
    };

    // Inject the session into localStorage
    await page.evaluate(
        ({ key, value }) => {
            localStorage.setItem(key, JSON.stringify(value));
        },
        { key: storageKey, value: sessionData }
    );

    // Navigate to dashboard to verify the session was picked up
    await page.goto('/dashboard');

    // Wait for the page to load with the session
    await page.waitForTimeout(1000);

    // Save the authenticated state
    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }
    await page.context().storageState({ path: authFile });
});
