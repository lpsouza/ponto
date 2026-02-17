const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Caminho para salvar a sessão
const AUTH_FILE = path.join(__dirname, '../e2e/.auth/user.json');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

(async () => {
    console.log('🚀 Iniciando navegador para autenticação manual...');
    console.log(`🌍 URL Alvo: ${BASE_URL}`);

    const browser = await chromium.launch({
        headless: false, // ABRE O NAVEGADOR VISÍVEL
        args: ['--start-maximized'] // Abre maximizado
    });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    console.log('⏳ Aguardando carregamento da página...');

    try {
        await page.goto(BASE_URL);
    } catch (e) {
        console.error(`❌ Não foi possível conectar a ${BASE_URL}.`);
        console.error('👉 Certifique-se de que o servidor de desenvolvimento está rodando ("npm run dev") em outro terminal.');
        await browser.close();
        process.exit(1);
    }

    console.log('👉 Por favor, faça login com sua conta Google na janela aberta.');
    console.log('👀 O script aguardará até você ser redirecionado para o "/dashboard".');

    try {
        // Aguardar redirecionamento para o dashboard (indica login bem sucedido)
        await page.waitForURL('**/dashboard', { timeout: 0 }); // 0 = tempo infinito

        console.log('✅ Login detectado com sucesso!');

        // Garantir diretório existe
        const dir = path.dirname(AUTH_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Salvar estado da sessão (cookies, localStorage, etc)
        await context.storageState({ path: AUTH_FILE });
        console.log(`💾 Sessão salva em: ${AUTH_FILE}`);
        console.log('🎉 Agora você pode rodar "npm run test:e2e" sem configurar variáveis de ambiente!');

    } catch (error) {
        console.error('❌ Erro durante o processo de login:', error);
    } finally {
        await browser.close();
    }
})();
