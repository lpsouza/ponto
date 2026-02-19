
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Read .env manually to avoid dependencies
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Find DATABASE_URL line
const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));

if (!dbUrlLine) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
}

// Extract value (everything after the first =)
let dbUrl = dbUrlLine.substring(dbUrlLine.indexOf('=') + 1).trim();

// Remove quotes if present
if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
    dbUrl = dbUrl.slice(1, -1);
}

const args = [
    'supabase',
    'migration',
    'repair',
    '--status',
    'applied',
    '20240219000000',
    '--db-url',
    dbUrl
];

try {
    console.log('Executing: npx', args.join(' '));
    console.log('Setting PGSSLMODE=disable in environment\n');

    // Clone environment and add PGSSLMODE
    const env = { ...process.env, PGSSLMODE: 'disable' };

    const result = spawnSync('npx', args, {
        stdio: 'inherit',
        shell: false,
        env: env // Explicitly pass environment
    });

    if (result.error) {
        console.error('Error executing command:', result.error);
        process.exit(1);
    }

    process.exit(result.status ?? 0);
} catch (error) {
    console.error('Failed to run migration repair:', error);
    process.exit(1);
}
