const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to save the session
const AUTH_FILE = path.join(__dirname, '../e2e/.auth/user.json');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

(async () => {
    console.log('🚀 Configuração Manual de Autenticação (Estratégia: Copiar do Navegador)');
    console.log(`🌍 URL Base: ${BASE_URL}`);
    console.log('\nPor favor, siga estes passos:');
    console.log('1. Abra o seu navegador padrão e faça login na aplicação em ' + BASE_URL);
    console.log('2. Abra as Ferramentas de Desenvolvedor (F12 ou Ctrl+Shift+I)');
    console.log('3. Vá para a aba "Application" (ou "Armazenamento") -> "Local Storage" -> ' + BASE_URL);
    console.log('4. Encontre a chave que começa com "sb-" (ex: sb-access-token ou similar)');
    console.log('5. Copie o nome da chave e o valor correspondente.\n');

    try {
        const key = await askQuestion('📝 Cole o NOME da chave (Key): ');
        if (!key) throw new Error('A chave não pode estar vazia.');

        const value = await askQuestion('📝 Cole o VALOR da chave (Value): ');
        if (!value) throw new Error('O valor não pode estar vazio.');

        const storageState = {
            cookies: [],
            origins: [
                {
                    origin: BASE_URL,
                    localStorage: [
                        {
                            name: key.trim(),
                            value: value.trim()
                        }
                    ]
                }
            ]
        };

        // Ensure directory exists
        const dir = path.dirname(AUTH_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Save session state
        fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));

        console.log('\n---------------------------------------------------');
        console.log(`💾 Sessão salva em: ${AUTH_FILE}`);
        console.log('🎉 SUCESSO! A configuração de autenticação foi atualizada.');
        console.log('---------------------------------------------------');
        console.log('👉 Para rodar os testes: npm run test:e2e');

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
    } finally {
        rl.close();
    }
})();
