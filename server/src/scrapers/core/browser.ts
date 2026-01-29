import { chromium, ChromiumBrowser, BrowserContext } from 'playwright';
import { logger } from '../../utils/logger';

let browser: ChromiumBrowser | null = null;
let context: BrowserContext | null = null;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

export async function getBrowser(): Promise<{ browser: ChromiumBrowser; context: BrowserContext }> {
  if (browser && context) {
    return { browser, context };
  }

  logger.info('Inicializando navegador para scraping...');
  
  browser = await chromium.launch({
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

  logger.info('Navegador inicializado correctamente');
  return { browser, context };
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    context = null;
    logger.info('Navegador cerrado');
  }
}

export async function randomDelay(minMs = 1000, maxMs = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function scrollPage(page: any, scrollCount = 3): Promise<void> {
  for (let i = 0; i < scrollCount; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await randomDelay(500, 1000);
  }
}

export function getRandomProxy(): string | null {
  // Implementar rotación de proxies si es necesario
  return null;
}
