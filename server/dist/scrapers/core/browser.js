"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrowser = getBrowser;
exports.closeBrowser = closeBrowser;
exports.randomDelay = randomDelay;
exports.scrollPage = scrollPage;
exports.getRandomProxy = getRandomProxy;
const playwright_1 = require("playwright");
const logger_1 = require("../../utils/logger");
let browser = null;
let context = null;
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];
async function getBrowser() {
    if (browser && context) {
        return { browser, context };
    }
    logger_1.logger.info('Inicializando navegador para scraping...');
    browser = await playwright_1.chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080',
        ]
    });
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    context = await browser.newContext({
        userAgent,
        viewport: { width: 1920, height: 1080 },
        locale: 'es-ES',
        timezoneId: 'Europe/Madrid',
        extraHTTPHeaders: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }
    });
    logger_1.logger.info('Navegador inicializado correctamente');
    return { browser, context };
}
async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
        context = null;
        logger_1.logger.info('Navegador cerrado');
    }
}
async function randomDelay(minMs = 1000, maxMs = 3000) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
}
async function scrollPage(page, scrollCount = 3) {
    for (let i = 0; i < scrollCount; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await randomDelay(500, 1000);
    }
}
function getRandomProxy() {
    // Implementar rotación de proxies si es necesario
    return null;
}
//# sourceMappingURL=browser.js.map